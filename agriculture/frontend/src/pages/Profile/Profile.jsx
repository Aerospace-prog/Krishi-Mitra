import React, { useState, useEffect } from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, Plus, X, CheckCircle, RotateCcw, Eye } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [preferredCrops, setPreferredCrops] = useState(['Wheat', 'Rice', 'Sugarcane', 'Potatoes', 'Lentils']);
  const [newCrop, setNewCrop] = useState('');
  const [cropHistory, setCropHistory] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showHistoryDetails, setShowHistoryDetails] = useState(null);

  // Load crop history from localStorage
  useEffect(() => {
    loadCropHistory();
    
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

  const handleAddCrop = () => {
    if (newCrop.trim() && !preferredCrops.includes(newCrop.trim())) {
      setPreferredCrops([...preferredCrops, newCrop.trim()]);
      setNewCrop('');
    }
  };

  const handleRemoveCrop = (cropToRemove) => {
    setPreferredCrops(preferredCrops.filter(crop => crop !== cropToRemove));
  };
  const handleViewDetails = (historyEntry) => {
    setShowHistoryDetails(historyEntry);
  };

  const handleCloseDetails = () => {
    setShowHistoryDetails(null);
  };


  const handleSaveChanges = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log('Saving profile changes...');
  };

  const getRecentScans = () => {
    // Convert crop history to scan results format
    return cropHistory.slice(0, 4).map((entry, index) => ({
      id: entry.id,
      title: `${entry.topCrops?.[0] || 'Crop'} - Analysis`,
      date: new Date(entry.timestamp).toLocaleDateString(),
      image: '/api/placeholder/100/100', // Placeholder for disease images
      type: 'disease' // or 'analysis'
    }));
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <button onClick={() => navigate('/')} className="back-button">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="profile-title">Farmer Profile</h1>
      </div>

      <div className="profile-content">
        {/* Left Column */}
        <div className="profile-left">
          {/* Farmer Profile Summary */}
          <div className="profile-summary flex flex-col items-center">
            <div className="profile-avatar justify-center">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.firstName?.[0] || 'F'}
                </div>
              )}
            </div>
            <h2 className="farmer-name">{user?.fullName || 'Farmer'}</h2>
            <div className="user-id-display">
              <span className="user-id-label">User ID:</span>
              <span className="user-id-value">{user?.id || 'Anonymous'}</span>
            </div>
          </div>

           

           {/* Recent AI Recommendation Results */}
           <div className="recent-scans">
             <div className="section-header">
               <h3 className="section-title">Recent AI Recommendations</h3>
               <div className="user-indicator">
                 <span className="user-badge">👤 {user?.firstName || 'User'}</span>
                 <span className="data-count">{cropHistory.length} analyses</span>
               </div>
             </div>
             <div className="scans-list">
               {cropHistory.length > 0 ? (
                 cropHistory.slice(0, 5).map((entry, index) => (
                   <div key={entry.id} className="scan-item">
                     <div className="scan-image">
                       <div className="disease-placeholder">
                         {entry.topCrops?.[0] || 'Crop'}
                       </div>
                     </div>
                     <div className="scan-details">
                       <h4 className="scan-title">
                         {entry.topCrops?.[0] || 'Crop'} - AI Analysis
                       </h4>
                       <p className="scan-date">
                         {new Date(entry.timestamp).toLocaleDateString()} at {entry.analysisTime}
                       </p>
                       <div className="scan-meta">
                         <span className="confidence-badge">
                           {entry.confidence}% confidence
                         </span>
                         {!entry.synced && (
                           <span className="offline-badge">Offline</span>
                         )}
                         <span className="location-badge">
                           📍 {entry.locationInfo?.state || entry.locationName || 'Unknown Location'}
                         </span>
                       </div>
                       {entry.topCrops && entry.topCrops.length > 1 && (
                         <div className="alternative-crops">
                           <span className="text-xs text-gray-500">
                             Also recommended: {entry.topCrops.slice(1, 3).join(', ')}
                           </span>
                         </div>
                       )}
                       {entry.advice && (
                         <div className="ai-advice-preview">
                           <span className="text-xs text-gray-600 italic">
                             "{entry.advice.substring(0, 100)}..."
                           </span>
                         </div>
                       )}
                     </div>
                     <button 
                       onClick={() => handleViewDetails(entry)}
                       className="view-details-btn"
                     >
                       <Eye className="w-4 h-4" />
                       View Details
                     </button>
                   </div>
                 ))
               ) : (
                 <div className="no-scans">
                   <div className="no-scans-icon">🌱</div>
                   <p>No AI recommendations yet</p>
                   <p className="text-sm text-gray-500">Analyze your farm to see AI-powered crop suggestions</p>
                   <button 
                     onClick={() => navigate('/')}
                     className="analyze-farm-btn"
                   >
                     Go to Dashboard
                   </button>
                 </div>
               )}
             </div>
           </div>
           
        </div>

        {/* Right Column */}
        <div className="profile-right">
          {/* Personal Information */}
          <div className="personal-info">
            <h3 className="section-title">Personal Information</h3>
            <div className="info-form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={user?.fullName || ''} 
                  disabled={!isEditing}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={user?.primaryEmailAddress?.emailAddress || ''} 
                  disabled={!isEditing}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Preferred Language</label>
                <select 
                  disabled={!isEditing}
                  className="form-select"
                  defaultValue="hi"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>
              {isEditing ? (
                <button onClick={handleSaveChanges} className="save-changes-btn">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              ) : (
                <button onClick={() => setIsEditing(true)} className="edit-btn">
                  <Edit className="w-4 h-4" />
                  Edit Information
                </button>
              )}
            </div>
          </div>

          <div className="signout-section">
            <SignOutButton signOutOptions={{ redirectUrl: '/' }}>
              <button className="signout-btn">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>

      {/* AI Recommendation Details Modal - Matching CropRecommendation UI */}
      {showHistoryDetails && (
        <div className="crop-recommendation-overlay">
          <div className="crop-recommendation-modal">
            <div className="modal-header">
              <h2>🌾 Crop Recommendation</h2>
              <button className="close-button" onClick={handleCloseDetails}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="recommendation-section">
                <div className="recommended-crop">
                  <h3>Recommended Crop</h3>
                  <div className="crop-name">{showHistoryDetails.topCrops?.[0] || 'Cotton'}</div>
                </div>
                
                <div className="ai-advice">
                  <h3>AI Advice</h3>
                  <p>
                    {showHistoryDetails.advice || `Based on your location and environmental conditions, ${showHistoryDetails.topCrops?.[0] || 'Cotton'} is the most suitable crop for your farm. The AI analysis shows ${showHistoryDetails.confidence}% confidence in this recommendation, considering factors like ${showHistoryDetails.climate} climate, ${showHistoryDetails.season} season, and current weather conditions.`}
                  </p>
                </div>
              </div>

              <div className="data-section">
                <div className="location-info">
                  <h4>📍 Location</h4>
                  <p>{showHistoryDetails.locationInfo?.state || showHistoryDetails.locationName}</p>
                  {showHistoryDetails.locationInfo?.state && (
                    <p className="text-sm text-gray-500">Coordinates: {showHistoryDetails.location}</p>
                  )}
                </div>

                <div className="environmental-data">
                  <h4>🌡️ Environmental Data</h4>
                  <div className="data-grid">
                    <div className="data-item">
                      <span className="label">Climate:</span>
                      <span className="value">{showHistoryDetails.climate}</span>
                    </div>
                    <div className="data-item">
                      <span className="label">Season:</span>
                      <span className="value">{showHistoryDetails.season}</span>
                    </div>
                    <div className="data-item">
                      <span className="label">Weather:</span>
                      <span className="value">{showHistoryDetails.weatherCondition}</span>
                    </div>
                    <div className="data-item">
                      <span className="label">Confidence:</span>
                      <span className="value">{showHistoryDetails.confidence}%</span>
                    </div>
                    {showHistoryDetails.liveData && (
                      <>
                        <div className="data-item">
                          <span className="label">Temperature:</span>
                          <span className="value">{showHistoryDetails.liveData.temperature}°C</span>
                        </div>
                        <div className="data-item">
                          <span className="label">Humidity:</span>
                          <span className="value">{showHistoryDetails.liveData.humidity}%</span>
                        </div>
                        <div className="data-item">
                          <span className="label">Soil pH:</span>
                          <span className="value">{showHistoryDetails.liveData.ph}</span>
                        </div>
                        <div className="data-item">
                          <span className="label">Rainfall:</span>
                          <span className="value">{showHistoryDetails.liveData.rainfall_mm_monthly_avg}mm</span>
                        </div>
                      </>
                    )}
                    <div className="data-item">
                      <span className="label">Analysis Date:</span>
                      <span className="value">{new Date(showHistoryDetails.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="data-item">
                      <span className="label">Status:</span>
                      <span className="value">{showHistoryDetails.synced ? 'Synced' : 'Offline'}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Crop Recommendations */}
                {showHistoryDetails.topCrops && showHistoryDetails.topCrops.length > 1 && (
                  <div className="environmental-data">
                    <h4>🌱 Alternative Crops</h4>
                    <div className="data-grid">
                      {showHistoryDetails.topCrops.slice(1).map((crop, index) => (
                        <div key={index} className="data-item">
                          <span className="label">Option {index + 2}:</span>
                          <span className="value">{crop}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="action-button primary" onClick={handleCloseDetails}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
