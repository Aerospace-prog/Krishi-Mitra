import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import marketPriceService from '../../services/marketPriceService';
import './MarketPrices.css';

const MarketPrices = () => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [error, setError] = useState(null);


  // Simplified - no crop selection needed

  // Get user's current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Fetch market data when location changes
  useEffect(() => {
    if (!locationLoading) {
      fetchMarketData();
      // Set up auto-refresh every 30 minutes
      const interval = setInterval(() => {
        fetchMarketData();
      }, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [locationLoading]);

  const getCurrentLocation = async () => {
    console.log('📍 Getting user location...');
    setLocationLoading(true);

    try {
      if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported');
        setLocationLoading(false);
        return;
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;
      console.log('📍 Got coordinates:', { latitude, longitude });

      // Get state from coordinates using reverse geocoding
      const state = await getStateFromCoordinates(latitude, longitude);
      if (state) {
        console.log('🗺️ Detected state:', state);
        setUserLocation({ latitude, longitude, state });
      }
    } catch (error) {
      console.log('❌ Location error:', error.message);
      // Default to Maharashtra if location fails
    } finally {
      setLocationLoading(false);
    }
  };

  const getStateFromCoordinates = async (lat, lng) => {
    try {
      // Use a simple mapping based on coordinate ranges for Indian states
      const stateMapping = [
        { name: 'Maharashtra', latRange: [15.6, 22.0], lngRange: [72.6, 80.9] },
        { name: 'Karnataka', latRange: [11.5, 18.4], lngRange: [74.0, 78.6] },
        { name: 'Tamil Nadu', latRange: [8.0, 13.5], lngRange: [76.2, 80.3] },
        { name: 'Andhra Pradesh', latRange: [12.6, 19.9], lngRange: [76.8, 84.8] },
        { name: 'Gujarat', latRange: [20.1, 24.7], lngRange: [68.2, 74.5] },
        { name: 'Rajasthan', latRange: [23.0, 30.1], lngRange: [69.5, 78.2] },
        { name: 'Madhya Pradesh', latRange: [21.1, 26.9], lngRange: [74.0, 82.8] },
        { name: 'Uttar Pradesh', latRange: [23.8, 30.4], lngRange: [77.1, 84.6] },
        { name: 'West Bengal', latRange: [21.5, 27.2], lngRange: [85.8, 89.9] },
        { name: 'Bihar', latRange: [24.2, 27.5], lngRange: [83.3, 88.1] },
        { name: 'Punjab', latRange: [29.5, 32.5], lngRange: [73.9, 76.9] },
        { name: 'Haryana', latRange: [27.4, 30.9], lngRange: [74.5, 77.6] }
      ];

      for (const state of stateMapping) {
        if (lat >= state.latRange[0] && lat <= state.latRange[1] &&
            lng >= state.lngRange[0] && lng <= state.lngRange[1]) {
          return state.name;
        }
      }

      // If no exact match, try online geocoding as fallback
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await response.json();
        const stateName = data.principalSubdivision;
        
        // Map common variations to our state list
        const stateVariations = {
          'State of Maharashtra': 'Maharashtra',
          'State of Karnataka': 'Karnataka',
          'State of Tamil Nadu': 'Tamil Nadu',
          'State of Gujarat': 'Gujarat',
          'State of Rajasthan': 'Rajasthan',
          'State of Madhya Pradesh': 'Madhya Pradesh',
          'State of Uttar Pradesh': 'Uttar Pradesh',
          'State of West Bengal': 'West Bengal',
          'State of Bihar': 'Bihar',
          'State of Punjab': 'Punjab',
          'State of Haryana': 'Haryana',
          'State of Andhra Pradesh': 'Andhra Pradesh'
        };

        return stateVariations[stateName] || stateName;
      } catch (geocodeError) {
        console.log('❌ Geocoding failed:', geocodeError);
        return null;
      }
    } catch (error) {
      console.log('❌ State mapping error:', error);
      return null;
    }
  };

  const fetchMarketData = async () => {
    console.log('🔄 Fetching top 5 crops for current location');
    setLoading(true);
    setError(null);

    try {
      if (userLocation) {
        // Use the new backend service
        const result = await marketPriceService.getTopCropsForCurrentLocation(
          userLocation.latitude, 
          userLocation.longitude
        );
        console.log('📊 Top 5 crops data loaded:', result.crops?.length || 0, 'crops');
        
        if (result.success && result.crops) {
          // Convert to the format expected by the UI
          const formattedData = result.crops.map(crop => ({
            name: crop.name,
            price: crop.price,
            change: crop.change || 0,
            markets: crop.markets || 0,
            uniqueMarkets: crop.markets || 0,
            state: crop.state
          }));
          
          setMarketData(formattedData);
          setLastUpdated(new Date());
        } else {
          throw new Error('No crop data received from backend');
        }
      } else {
        // Fallback to general market data for Maharashtra
        const result = await marketPriceService.getTopCropsForState('Maharashtra');
        if (result.success && result.crops) {
          const formattedData = result.crops.map(crop => ({
            name: crop.name,
            price: crop.price,
            change: crop.change || 0,
            markets: crop.markets || 0,
            uniqueMarkets: crop.markets || 0,
            state: crop.state
          }));
          setMarketData(formattedData);
        } else {
          throw new Error('No fallback data available');
        }
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('❌ Error fetching market data:', err);
      setError(err.message);
      
      // Comprehensive fallback data - always 5 crops with realistic changes
      const fallbackData = [
        { name: 'Wheat', price: 2275, change: Math.round((Math.random() * 10 - 5) * 10) / 10, markets: 45, uniqueMarkets: 45, state: 'India' },
        { name: 'Rice', price: 3550, change: Math.round((Math.random() * 10 - 5) * 10) / 10, markets: 38, uniqueMarkets: 38, state: 'India' },
        { name: 'Maize', price: 1900, change: Math.round((Math.random() * 10 - 5) * 10) / 10, markets: 42, uniqueMarkets: 42, state: 'India' },
        { name: 'Soybean', price: 4820, change: Math.round((Math.random() * 10 - 5) * 10) / 10, markets: 35, uniqueMarkets: 35, state: 'India' },
        { name: 'Cotton', price: 7200, change: Math.round((Math.random() * 10 - 5) * 10) / 10, markets: 28, uniqueMarkets: 28, state: 'India' }
      ];
      
      console.log('📋 Using fallback data with', fallbackData.length, 'crops');
      setMarketData(fallbackData);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };
  

  // Removed crop selection handlers - not needed

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getPriceChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriceChangeIcon = (change) => {
    if (change > 0) return <ChevronUp className="w-4 h-4 mr-1" />;
    if (change < 0) return <ChevronDown className="w-4 h-4 mr-1" />;
    return null;
  };

  const getMarketInsights = () => {
    if (marketData.length === 0) return null;

    const bestPerforming = marketData.reduce((max, item) => 
      item.change > max.change ? item : max
    );
    
    const declining = marketData.reduce((min, item) => 
      item.change < min.change ? item : min
    );

    const stable = marketData.find(item => Math.abs(item.change) < 0.5);

    return { bestPerforming, declining, stable };
  };

  const insights = getMarketInsights();

  return (
    <div className="market-prices-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Live Market Prices</h2>
        </div>
        <div className="flex items-center space-x-4">
          {/* Refresh Button */}
          <button
            onClick={() => {
              console.log('🔄 Manual refresh clicked');
              fetchMarketData();
            }}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh Market Prices</span>
          </button>

          {/* Last Updated */}
          <div className="text-sm text-gray-500">
            {lastUpdated && `Updated: ${lastUpdated.toLocaleTimeString()}`}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error Loading Market Data</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <p className="text-xs text-red-500 mt-1">Showing fallback data below</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Top 5 Crops for Current Location */}
        {loading ? (
          <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">Crop</th>
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">Price (₹/quintal)</th>
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">Change (24h)</th>
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">Markets</th>
                  </tr>
                </thead>
                <tbody>
                  {marketData.length > 0 ? (
                    marketData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-gray-800">{item.name}</td>
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          {formatPrice(item.price)}
                        </td>
                        <td className="py-4 px-4">
                          <div className={`flex items-center font-medium ${getPriceChangeColor(item.change)}`}>
                            {getPriceChangeIcon(item.change)}
                            {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {item.markets || item.uniqueMarkets || 0} markets
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 px-4 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-2">
                          <AlertTriangle className="w-8 h-8 text-gray-400" />
                          <div className="text-lg font-medium">No Market Data Available</div>
                          <div className="text-sm">
                            Unable to fetch market data for your location. Please try refreshing.
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Market Insights Sidebar */}
        <div className="space-y-6">
          {insights && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Market Insights
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-600">Best Performing</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {insights.bestPerforming.name}
                    </div>
                    <div className="text-xs text-green-600">
                      +{insights.bestPerforming.change}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-600">Declining</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">
                      {insights.declining.name}
                    </div>
                    <div className="text-xs text-red-600">
                      {insights.declining.change}%
                    </div>
                  </div>
                </div>

                {insights.stable && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">Stable</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-600">
                        {insights.stable.name}
                      </div>
                      <div className="text-xs text-blue-600">
                        {insights.stable.change}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{marketData.length}</div>
                <div className="text-sm text-gray-600">Crops Tracked</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {marketData.length > 0 
                    ? formatPrice(Math.round(marketData.reduce((sum, item) => sum + item.price, 0) / marketData.length))
                    : '₹0'
                  }
                </div>
                <div className="text-sm text-gray-600">Avg. Price</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {marketData.reduce((sum, item) => sum + item.markets, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Markets</div>
              </div>
            </div>
          </div>

          {/* Data Source */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-600">
              <div className="font-medium mb-1">Data Source</div>
              <div>Ministry of Agriculture & Farmers Welfare</div>
              <div>via Agmarknet Portal</div>
              <div className="mt-2 text-gray-500">
                Prices are wholesale rates from regulated markets (mandis)
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MarketPrices;
