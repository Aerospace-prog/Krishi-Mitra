import React, { useState } from 'react';
import './Home.css';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import CropRecommendation from '../../components/CropRecommendation/CropRecommendation';
import LoadingModal from '../../components/LoadingModal/LoadingModal';
import ErrorModal from '../../components/ErrorModal/ErrorModal';
import { Search, Bell, ChevronUp, ChevronDown, BarChart3, Scan, Droplets, Wind, AlertTriangle, TrendingUp, MessageSquare, Facebook, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const Home = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [cropHistory, setCropHistory] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(true);
  const [marketAlertsEnabled, setMarketAlertsEnabled] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Backend API URL from Vite env or fallback to localhost
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  // Weather API key (you can get this from OpenWeatherMap)
  const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || 'your_weather_api_key_here';

  // Helper function to get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 6 && month <= 10) return 'Kharif';
    if (month >= 11 || month <= 2) return 'Rabi';
    return 'Zaid';
  };

  // Load crop history from localStorage on component mount
  React.useEffect(() => {
    loadCropHistory();
    getUserLocation();
    
    // Set up online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id]); // Reload when user changes

  // Get user-specific localStorage key
  const getUserStorageKey = () => {
    return `krishi-mitra-crop-history-${user?.id || 'anonymous'}`;
  };

  // Load crop history from localStorage
  const loadCropHistory = () => {
    try {
      const storageKey = getUserStorageKey();
      const savedHistory = localStorage.getItem(storageKey);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setCropHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading crop history from localStorage:', error);
    }
  };

  // Save crop history to localStorage
  const saveCropHistory = (history) => {
    try {
      const storageKey = getUserStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving crop history to localStorage:', error);
    }
  };

  // Get user location with improved error handling
  const getUserLocation = async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser.');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            // Enhanced error handling for different permission states
            let errorMessage = 'Unable to get your location.';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable. Please check your GPS settings.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = 'An unknown error occurred while retrieving location.';
                break;
            }
            
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // Increased timeout
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ latitude, longitude });
      setLocationError(null); // Clear any previous errors
      
      // Fetch weather data for the location
      fetchWeatherData(latitude, longitude);
    } catch (err) {
      console.error('Error getting location:', err);
      setLocationError(err.message || 'Unable to get your location. Using default location.');
      // Use default location (Delhi, India)
      setUserLocation({ latitude: 28.6139, longitude: 77.2090 });
      fetchWeatherData(28.6139, 77.2090);
    }
  };

  // Fetch weather data from backend API
  const fetchWeatherData = async (lat, lon) => {
    setWeatherLoading(true);
    setWeatherError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/weather`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWeatherData(result.data);
          setWeatherError(null);
        } else {
          throw new Error('Weather API returned unsuccessful response');
        }
      } else {
        throw new Error(`Weather API error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching weather from backend:', err);
      setWeatherError(err.message);
      // Fallback to static data
      setWeatherData({
        current: {
          temp_c: 32,
          humidity: 65,
          condition: 'Partly Cloudy',
          wind_kph: 15,
          feelslike_c: 35
        },
        location: {
          name: 'Rural Punjab',
          region: 'Punjab',
          country: 'India'
        },
        forecast: [
          { day: { maxtemp_c: 35, mintemp_c: 28, condition: 'Sunny' } },
          { day: { maxtemp_c: 33, mintemp_c: 27, condition: 'Partly Cloudy' } },
          { day: { maxtemp_c: 30, mintemp_c: 25, condition: 'Cloudy' } }
        ]
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  const getLocationAndAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setShowError(false);

    try {
      // Request location permission with better error handling
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser. Please use a modern browser with location services.');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            // Enhanced error handling for different permission states
            let errorMessage = 'Unable to get your location.';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please:\n1. Click the location icon in your browser\'s address bar\n2. Select "Allow" for location access\n3. Refresh the page and try again';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable. Please check your GPS settings and internet connection.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please check your internet connection and try again.';
                break;
              default:
                errorMessage = 'An unknown error occurred while retrieving location. Please try again.';
                break;
            }
            
            const locationError = new Error(errorMessage);
            locationError.code = error.code;
            reject(locationError);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // Increased timeout
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Call backend API
      const response = await fetch(`${API_BASE_URL}/recommend-by-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setRecommendation(data);
      
      // Save to crop history with more detailed data
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        locationName: userLocation ? `${userLocation.latitude.toFixed(2)}, ${userLocation.longitude.toFixed(2)}` : 'Unknown Location',
        recommendations: [data.crop_recommendation, ...(data.alternative_crops || []).map(alt => alt.crop)],
        status: 'completed',
        soilType: data.live_data_used?.soil_type || 'Unknown',
        climate: data.location_info?.state || 'Unknown',
        season: getCurrentSeason(),
        topCrops: [data.crop_recommendation, ...(data.alternative_crops || []).slice(0, 2).map(alt => alt.crop)],
        confidence: Math.round(data.confidence_score * 100), // Convert to percentage
        analysisTime: new Date().toLocaleTimeString(),
        weatherCondition: weatherData ? (weatherData.current?.condition || 'Unknown') : 'Unknown',
        isOnline: isOnline,
        synced: true,
        // Additional API data
        advice: data.advice,
        liveData: data.live_data_used,
        locationInfo: data.location_info,
        alternativeCrops: data.alternative_crops,
        apiVersion: data.api_version,
        apiTimestamp: data.timestamp
      };
      
      const newHistory = [historyEntry, ...cropHistory.slice(0, 9)]; // Keep last 10 entries
      setCropHistory(newHistory);
      saveCropHistory(newHistory); // Save to localStorage
    } catch (err) {
      console.error('Error analyzing farm:', err);
      let errorMessage = 'Unable to analyze your farm. Please try again.';
      
      // Handle location-specific errors
      if (err.code === 1) { // PERMISSION_DENIED
        errorMessage = err.message || 'Location permission denied. Please enable location access and try again.';
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        errorMessage = err.message || 'Location information is unavailable. Please check your GPS settings.';
      } else if (err.code === 3) { // TIMEOUT
        errorMessage = err.message || 'Location request timed out. Please try again.';
      } else if (err.message && err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (err.message && err.message.includes('Geolocation')) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeFarm = () => {
    getLocationAndAnalyze();
  };

  const handleCloseRecommendation = () => {
    setRecommendation(null);
  };

  const handleCloseError = () => {
    setShowError(false);
    setError(null);
  };

  const handleRetry = () => {
    setShowError(false);
    setError(null);
    getLocationAndAnalyze();
  };

  // Handle offline analysis
  const handleOfflineAnalysis = () => {
    if (!isOnline) {
      // Create a mock analysis for offline mode
      const mockEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        location: userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 'Unknown',
        locationName: userLocation ? `${userLocation.latitude.toFixed(2)}, ${userLocation.longitude.toFixed(2)}` : 'Unknown Location',
        recommendations: ['Cotton', 'Wheat', 'Rice'],
        status: 'completed',
        soilType: 'Unknown',
        climate: 'Tropical',
        season: 'Kharif',
        topCrops: ['Cotton', 'Wheat', 'Rice'],
        confidence: 75,
        analysisTime: new Date().toLocaleTimeString(),
        weatherCondition: weatherData ? (weatherData.current?.condition || 'Unknown') : 'Unknown',
        isOnline: false,
        synced: false
      };
      
      const newHistory = [mockEntry, ...cropHistory.slice(0, 9)];
      setCropHistory(newHistory);
      saveCropHistory(newHistory);
      
      // Show offline analysis result
      setRecommendation({
        recommendations: ['Cotton', 'Wheat', 'Rice'],
        message: 'Offline analysis completed. Results may not be as accurate as online analysis.'
      });
    }
  };


  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <img src="/logo.jpg" alt="Krishi Mitra Logo" className="w-8 h-8 object-cover rounded" />
              <span className="text-green-600 font-bold text-xl">Krishi Mitra</span>
            </div>
            <nav className="flex space-x-6">
              <a href="#" className="text-gray-700 hover:text-green-600">Home</a>
              <a href="#" className="text-gray-700 hover:text-green-600">Community</a>
              <a href="#" className="text-gray-700 hover:text-green-600">Chatbot</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">

            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Notifications</span>
            </div>
            <button 
              className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"
              onClick={() => navigate('/profile')}
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="avatar" className="w-8 h-8 rounded-full" />
              ) : (
                <span className="text-sm font-medium">{user?.firstName?.[0] || 'U'}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <main className="p-6">
          {/* Header Section */}
          <div className="mb-8">
            <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Good Morning, {user?.firstName || 'Farmer'}!</h1>
            <p className="text-gray-600">Here's your personalized dashboard overview.</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Weather Forecast */}
            <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Weather Forecast</h2>
                <div className="flex gap-2">
                  {weatherLoading && (
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded flex items-center">
                      <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full mr-1"></div>
                      Loading...
                    </div>
                  )}
                  {weatherError && (
                    <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                      Weather API Error
                    </div>
                  )}
                  {locationError && (
                    <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      {locationError}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-800 mb-2">
                    {weatherData?.current ? Math.round(weatherData.current.temp_c) : 32}°C
                  </div>
                  <p className="text-gray-600 mb-2 capitalize">
                    {weatherData?.current?.condition || 'Partly Cloudy'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {weatherData?.location ? `${weatherData.location.name}, ${weatherData.location.region}` : 'Rural Punjab, India'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Droplets className="w-4 h-4 mr-1" />
                      {weatherData?.current?.humidity || 65}% Humidity
                    </div>
                    <div className="flex items-center">
                      <Wind className="w-4 h-4 mr-1" />
                      {weatherData?.current ? Math.round(weatherData.current.wind_kph) : 15} km/h Wind
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs">Feels like {weatherData?.current ? Math.round(weatherData.current.feelslike_c) : 35}°C</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-center font-medium mb-4">Weekly Outlook</h3>
                  <div className="flex space-x-8">
                    {weatherData?.forecast ? (
                      weatherData.forecast.slice(0, 3).map((day, index) => {
                        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        const date = new Date(day.date);
                        const dayName = dayNames[date.getDay()];
                        return (
                          <div key={index} className="text-center">
                            <p className="text-sm text-gray-600 mb-2">{dayName}</p>
                            <p className="font-semibold">{Math.round(day.day.maxtemp_c)}°C</p>
                            <p className="text-sm text-gray-500">{Math.round(day.day.mintemp_c)}°C</p>
                            <p className="text-xs text-gray-400 mt-1">{day.day.condition}</p>
                          </div>
                        );
                      })
                    ) : (
                      <>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Mon</p>
                          <p className="font-semibold">35°C</p>
                          <p className="text-sm text-gray-500">28°C</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Tue</p>
                          <p className="font-semibold">33°C</p>
                          <p className="text-sm text-gray-500">27°C</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Wed</p>
                          <p className="font-semibold">30°C</p>
                          <p className="text-sm text-gray-500">25°C</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
          <button 
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 hover:cursor-pointer transition-all hover:scale-105"
                  onClick={isOnline ? handleAnalyzeFarm : handleOfflineAnalysis}
            disabled={isLoading}
          >
                  <BarChart3 className="w-5 h-5" />
                  <span>
                    {isLoading ? 'Analyzing...' : 
                     !isOnline ? 'Analyze Offline' : 'Analyze My Farm'}
                  </span>
                </button>
                <button 
                  onClick={() => navigate('/disease-scan')}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 hover:cursor-pointer transition-all hover:scale-105"
                >
                  <Scan className="w-5 h-5" />
                  <span>Scan for Disease</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-6">
            {/* Live Market Prices */}
            <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm market-prices-section">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Live Market Prices</h2>
                <div className="text-sm text-gray-500">Updated: {new Date().toLocaleTimeString()}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 text-gray-700 font-semibold">Crop</th>
                      <th className="text-left py-4 px-4 text-gray-700 font-semibold">Current Price (INR/quintal)</th>
                      <th className="text-left py-4 px-4 text-gray-700 font-semibold">Change (24h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-800">Wheat</td>
                      <td className="py-4 px-4 font-semibold text-gray-900">₹2,275</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-green-600 font-medium">
                          <ChevronUp className="w-4 h-4 mr-1" />
                          +1.2%
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-800">Rice (Basmati)</td>
                      <td className="py-4 px-4 font-semibold text-gray-900">₹3,550</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-green-600 font-medium">
                          <ChevronUp className="w-4 h-4 mr-1" />
                          +0.5%
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-800">Maize</td>
                      <td className="py-4 px-4 font-semibold text-gray-900">₹1,900</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-red-600 font-medium">
                          <ChevronDown className="w-4 h-4 mr-1" />
                          -0.8%
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-800">Soybean</td>
                      <td className="py-4 px-4 font-semibold text-gray-900">₹4,820</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-green-600 font-medium">
                          <ChevronUp className="w-4 h-4 mr-1" />
                          +2.1%
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-800">Cotton</td>
                      <td className="py-4 px-4 font-semibold text-gray-900">₹7,200</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-red-600 font-medium">
                          <ChevronDown className="w-4 h-4 mr-1" />
                          -0.3%
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-800">Potato</td>
                      <td className="py-4 px-4 font-semibold text-gray-900">₹1,850</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-gray-600 font-medium">0.0%</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Right Column - Additional Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-600">Best Performing</span>
                    <span className="text-sm font-semibold text-green-600">Soybean (+2.1%)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-600">Declining</span>
                    <span className="text-sm font-semibold text-red-600">Maize (-0.8%)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">Stable</span>
                    <span className="text-sm font-semibold text-blue-600">Potato (0.0%)</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">6</div>
                    <div className="text-sm text-gray-600">Crops Tracked</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₹3,365</div>
                    <div className="text-sm text-gray-600">Avg. Price</div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-t-2 border-green-200 footer-section">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img src="/logo.jpg" alt="Krishi Mitra Logo" className="w-10 h-10 object-cover rounded" />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Krishi Mitra</h3>
                  <p className="text-sm text-gray-600">Your AI-Powered Farming Companion</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4 max-w-md">
                Empowering farmers with AI-driven crop recommendations, real-time weather data, 
                and market insights to maximize agricultural productivity and sustainability.
              </p>
              <div className="flex items-center space-x-4 social-icons">
                <a href="#" className="text-gray-600 hover:text-blue-600 cursor-pointer transition-all">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://x.com/KrishiMitr84158" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-400 cursor-pointer transition-all">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://www.youtube.com/@krishimitra-y7q" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-600 cursor-pointer transition-all">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate('/home')} className="text-gray-600 hover:text-green-600 transition-colors text-left">Dashboard</button></li>
                <li><button onClick={() => navigate('/disease-scan')} className="text-gray-600 hover:text-green-600 transition-colors text-left">Disease Scan</button></li>
                <li><button onClick={() => navigate('/profile')} className="text-gray-600 hover:text-green-600 transition-colors text-left">Profile</button></li>
              </ul>
            </div>
            
            {/* Contact Us */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Contact Us</h4>
              <div className="space-y-2 text-sm">
                <div className="contact-item space-x-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:krishimitra2000@gmail.com" className="text-gray-600 hover:text-green-600 transition-colors">
                    krishimitra2000@gmail.com
                  </a>
                </div>
                <div className="contact-item space-x-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-gray-600">+91 98765 43210</span>
                </div>
                <div className="contact-item space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-gray-600">Bangalore, Karnataka</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-gray-500 mb-4 md:mb-0">
                © 2025 Krishi Mitra. All rights reserved. Built with ❤️ for Indian farmers.
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals - Preserved from original */}
      <LoadingModal isVisible={isLoading} />
      <ErrorModal 
        isVisible={showError} 
        error={error} 
        onClose={handleCloseError}
        onRetry={handleRetry}
      />
      <CropRecommendation 
        recommendation={recommendation} 
        onClose={handleCloseRecommendation} 
      />
    </div>
  );
};

export default Home;


