import React, { useState } from 'react';
import './Home.css';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import CropRecommendation from '../../components/CropRecommendation/CropRecommendation';
import LoadingModal from '../../components/LoadingModal/LoadingModal';
import ErrorModal from '../../components/ErrorModal/ErrorModal';

const Home = () => {
  const { user } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

  // Backend API URL from Vite env or fallback to localhost
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const getLocationAndAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setShowError(false);

    try {
      // Request location permission
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser.');
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
    } catch (err) {
      console.error('Error analyzing farm:', err);
      let errorMessage = 'Unable to analyze your farm. Please try again.';
      
      if (err.code === err.PERMISSION_DENIED) {
        errorMessage = 'Location permission denied. Please enable location access and try again.';
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        errorMessage = 'Location information is unavailable. Please check your GPS settings.';
      } else if (err.code === err.TIMEOUT) {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
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

  return (
    <div className="home-root">
      <video className="home-video" autoPlay loop muted playsInline src="/Videos/farm-video.mp4" />
      <div className="home-overlay" />

      <header className="home-navbar">
        <div className="brand">Krishi Mitra</div>
        <nav className="nav-links" />
        <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)}>
          {user?.firstName ? `Hi, ${user.firstName}` : 'Profile'}
        </button>
      </header>

      {profileOpen && (
        <div className="profile-panel" role="dialog" aria-modal="true">
          <div className="profile-header">
            <div className="avatar">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="avatar" />
              ) : (
                <div className="avatar-fallback">{user?.firstName?.[0] || 'U'}</div>
              )}
            </div>
            <div className="identity">
              <div className="name">{user?.fullName || user?.username || 'User'}</div>
              <div className="email">{user?.primaryEmailAddress?.emailAddress || '—'}</div>
            </div>
          </div>
          <div className="profile-body">
            <div className="row"><span>User ID</span><span>{user?.id}</span></div>
            <div className="row"><span>Phone</span><span>{user?.primaryPhoneNumber?.phoneNumber || '—'}</span></div>
            <div className="row"><span>Joined</span><span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
          </div>
          <div className="profile-actions">
            <SignOutButton signOutOptions={{ redirectUrl: '/' }}>
              <button className="signout">Sign out</button>
            </SignOutButton>
          </div>
        </div>
      )}

      <main className="home-content">
        <h1 className="title">AI Crop Recommendation</h1>
        <p className="subtitle">Personalized crop choices for your soil and climate.</p>

        <div className="cta-single">
          <button 
            className="cta primary" 
            onClick={handleAnalyzeFarm}
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyse My Farm'}
          </button>
        </div>
      </main>

      {/* Modals */}
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


