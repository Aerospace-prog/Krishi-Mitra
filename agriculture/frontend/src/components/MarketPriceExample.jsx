import React, { useState, useEffect } from 'react';
import agmarknetService from '../services/agmarknetService';

/**
 * Example component demonstrating how to use the enhanced Agmarknet service
 * with coordinate-based market price fetching
 */
const MarketPriceExample = () => {
  const [marketData, setMarketData] = useState(null);
  const [topCrops, setTopCrops] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [coordinates, setCoordinates] = useState({
    latitude: 12.962276805440567,
    longitude: 77.7191630387345
  });

  // Example: Fetch market prices by coordinates (like Bangalore)
  const fetchMarketPricesByCoordinates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching market prices for coordinates:', coordinates);
      
      // Method 1: Using specific coordinates
      const data = await agmarknetService.getMarketPricesByCoordinates(
        coordinates.latitude,
        coordinates.longitude,
        { limit: 50, format: 'json' }
      );
      
      console.log('📊 Market data received:', data);
      setMarketData(data);
      setLocation(data.location_info);
    } catch (err) {
      console.error('❌ Error fetching market data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Example: Fetch market prices using browser geolocation
  const fetchMarketPricesForCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🌍 Fetching market prices for current location...');
      
      const data = await agmarknetService.getMarketPricesForCurrentLocation({
        limit: 50,
        format: 'json'
      });
      
      console.log('📊 Market data received:', data);
      setMarketData(data);
      setLocation(data.location_info);
    } catch (err) {
      console.error('❌ Error fetching market data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Example: Get top 5 crops for current location
  const fetchTop5CropsForCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏆 Fetching top 5 crops for current location...');
      
      const data = await agmarknetService.getTop5CropsForBrowserLocation();
      
      console.log('📊 Top 5 crops received:', data);
      setTopCrops(data);
      setLocation({ 
        coordinates: data.location, 
        confidence: 'high', 
        source: 'geolocation' 
      });
    } catch (err) {
      console.error('❌ Error fetching top 5 crops:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Example: Get top 5 crops by coordinates
  const fetchTop5CropsByCoordinates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏆 Fetching top 5 crops for coordinates:', coordinates);
      
      const crops = await agmarknetService.getTop5CropsForCurrentLocation(
        coordinates.latitude,
        coordinates.longitude
      );
      
      const data = {
        crops,
        location: coordinates,
        timestamp: new Date().toISOString()
      };
      
      console.log('📊 Top 5 crops received:', data);
      setTopCrops(data);
      setLocation({ 
        coordinates, 
        confidence: 'medium', 
        source: 'coordinates' 
      });
    } catch (err) {
      console.error('❌ Error fetching top 5 crops:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Example: Search for specific commodities
  const searchCommodity = async (searchTerm) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Searching for commodity:', searchTerm);
      
      const data = await agmarknetService.searchCommodities(searchTerm);
      
      console.log('📊 Search results:', data);
      setMarketData(data);
      setTopCrops(null); // Clear top crops when showing search results
    } catch (err) {
      console.error('❌ Error searching commodity:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format market data for display
  const formatData = (data) => {
    if (!data) return null;
    return agmarknetService.formatMarketDataForDisplay(data);
  };

  const formattedData = formatData(marketData);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-green-800 mb-6">
        🌾 Market Price Service Demo
      </h2>

      {/* Location Info */}
      {location && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">📍 Location Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><strong>Coordinates:</strong> {location.coordinates?.lat?.toFixed(4)}, {location.coordinates?.lng?.toFixed(4)}</div>
            <div><strong>Confidence:</strong> {location.confidence}</div>
            <div><strong>Source:</strong> {location.source}</div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="mb-6 space-y-2 sm:space-y-0 sm:space-x-2 sm:flex flex-wrap">
        <button
          onClick={fetchTop5CropsForCurrentLocation}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-semibold"
        >
          🏆 Top 5 Crops (Current Location)
        </button>
        
        <button
          onClick={fetchTop5CropsByCoordinates}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          📍 Top 5 Crops (Coordinates)
        </button>
        
        <button
          onClick={() => searchCommodity('tomato')}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          🍅 Search Tomato
        </button>
        
        <button
          onClick={() => searchCommodity('onion')}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          🧅 Search Onion
        </button>
      </div>

      {/* Coordinate Input */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">🗺️ Custom Coordinates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={coordinates.latitude}
              onChange={(e) => setCoordinates(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="12.962276805440567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={coordinates.longitude}
              onChange={(e) => setCoordinates(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="77.7191630387345"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Fetching market data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Top 5 Crops Display */}
      {topCrops && !loading && (
        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
          <h3 className="text-xl font-bold text-green-800 mb-4">🏆 Top 5 Crops for Your Location</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCrops.crops.map((crop, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-lg text-gray-800">#{index + 1} {crop.name}</h4>
                  <span className="text-2xl">🌾</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modal Price:</span>
                    <span className="font-semibold text-green-600">₹{crop.price}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price Range:</span>
                    <span className="text-gray-800">₹{crop.minPrice} - ₹{crop.maxPrice}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Markets:</span>
                    <span className="text-blue-600">{crop.marketCount}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Records:</span>
                    <span className="text-purple-600">{crop.recordCount}</span>
                  </div>
                  
                  {crop.varieties.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <span className="text-xs text-gray-500">Varieties: {crop.varieties.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            📍 Location: {topCrops.location.latitude?.toFixed(4)}, {topCrops.location.longitude?.toFixed(4)} | 
            🕒 Updated: {new Date(topCrops.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {/* Market Data Display */}
      {formattedData && !loading && !topCrops && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-3">📊 Market Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formattedData.summary.totalRecords}</div>
                <div className="text-gray-600">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formattedData.summary.commodities}</div>
                <div className="text-gray-600">Commodities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formattedData.summary.markets}</div>
                <div className="text-gray-600">Markets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{formattedData.summary.states}</div>
                <div className="text-gray-600">States</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{formattedData.summary.districts}</div>
                <div className="text-gray-600">Districts</div>
              </div>
            </div>
          </div>

          {/* Commodities List */}
          {formattedData.commodities.length > 0 && (
            <div className="p-4 bg-white border rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🌾 Commodities & Prices</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Commodity</th>
                      <th className="text-center py-2">Records</th>
                      <th className="text-center py-2">Markets</th>
                      <th className="text-center py-2">Min Price (₹)</th>
                      <th className="text-center py-2">Max Price (₹)</th>
                      <th className="text-center py-2">Modal Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formattedData.commodities.slice(0, 10).map((commodity, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{commodity.name}</td>
                        <td className="text-center py-2">{commodity.recordCount}</td>
                        <td className="text-center py-2">{commodity.marketCount}</td>
                        <td className="text-center py-2 text-green-600">₹{commodity.avgMinPrice}</td>
                        <td className="text-center py-2 text-red-600">₹{commodity.avgMaxPrice}</td>
                        <td className="text-center py-2 text-blue-600 font-semibold">₹{commodity.avgModalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {formattedData.commodities.length > 10 && (
                <p className="text-center text-gray-500 mt-4">
                  Showing top 10 of {formattedData.commodities.length} commodities
                </p>
              )}
            </div>
          )}

          {/* Raw Data (for debugging) */}
          <details className="p-4 bg-gray-50 rounded-lg">
            <summary className="cursor-pointer font-semibold text-gray-800 mb-2">
              🔍 Raw API Response (Debug)
            </summary>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-64">
              {JSON.stringify(marketData, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default MarketPriceExample;
