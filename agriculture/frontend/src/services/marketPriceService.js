/**
 * Market Price Service
 * Handles all API calls to the backend for market price data
 */

class MarketPriceService {
  constructor() {
    // Backend API base URL
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    this.debugMode = import.meta.env.VITE_DEBUG === 'true';
    
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    
    if (this.debugMode) {
      console.log('🔧 Market Price Service Configuration:');
      console.log('  🌐 Backend URL:', this.baseUrl);
      console.log('  🐛 Debug Mode:', this.debugMode ? 'Enabled' : 'Disabled');
    }
  }


  /**
   * Get top 5 crops for a specific state
   * @param {string} state - State name
   * @returns {Promise<Object>} Market data for the state
   */
  async getTopCropsForState(state) {
    const cacheKey = `top_crops_${state}`;
    
    if (this.debugMode) {
      console.log('🔍 Fetching top crops for state:', state);
    }
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        if (this.debugMode) {
          console.log('📦 Using cached data for state:', state);
        }
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/market-prices/top-crops/${encodeURIComponent(state)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`No market data available for state: ${state}`);
        }
        throw new Error(`Backend API Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (this.debugMode) {
        console.log('📊 State data received:', {
          state: data.state,
          success: data.success,
          cropCount: data.count,
          timestamp: data.timestamp
        });
      }

      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Market Price Service Error:', error);
      throw new Error(`Failed to fetch market data for ${state}: ${error.message}`);
    }
  }

  /**
   * Get top 5 crops for current location
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object>} Market data for current location
   */
  async getTopCropsForCurrentLocation(latitude, longitude) {
    const cacheKey = `top_crops_location_${latitude}_${longitude}`;
    
    if (this.debugMode) {
      console.log('🔍 Fetching top crops for location:', { latitude, longitude });
    }
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        if (this.debugMode) {
          console.log('📦 Using cached data for location');
        }
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString()
      });

      const response = await fetch(`${this.baseUrl}/market-prices/current-location?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Could not determine state from coordinates');
        }
        throw new Error(`Backend API Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (this.debugMode) {
        console.log('📊 Location data received:', {
          location: data.location,
          success: data.success,
          cropCount: data.crops?.length || 0,
          timestamp: data.timestamp
        });
      }

      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Market Price Service Error:', error);
      throw new Error(`Failed to fetch market data for location: ${error.message}`);
    }
  }

  /**
   * Get top 5 crops for current browser location
   * @returns {Promise<Object>} Market data for browser location
   */
  async getTopCropsForBrowserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const result = await this.getTopCropsForCurrentLocation(latitude, longitude);
            resolve({
              ...result,
              coordinates: { latitude, longitude },
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    if (this.debugMode) {
      console.log('🗑️ Market price cache cleared');
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if backend is available
   * @returns {Promise<boolean>} Backend availability status
   */
  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'running';
      }
      return false;
    } catch (error) {
      if (this.debugMode) {
        console.log('❌ Backend health check failed:', error.message);
      }
      return false;
    }
  }
}

// Create and export a singleton instance
const marketPriceService = new MarketPriceService();
export default marketPriceService;
