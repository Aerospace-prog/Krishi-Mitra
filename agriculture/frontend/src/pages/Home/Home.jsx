import React, { useState } from 'react';
import './Home.css';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import CropRecommendation from '../../components/CropRecommendation/CropRecommendation';
import YieldPrediction from '../../components/YieldPrediction/YieldPrediction';
import DiseaseDetection from '../../components/DiseaseDetection/DiseaseDetection';
import LoadingModal from '../../components/LoadingModal/LoadingModal';
import ErrorModal from '../../components/ErrorModal/ErrorModal';

const Home = () => {
  const { user } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [yieldPredictionOpen, setYieldPredictionOpen] = useState(false);
  const [diseaseDetectionOpen, setDiseaseDetectionOpen] = useState(false);
  const [manual, setManual] = useState({ N: '', temperature: '', humidity: '', ph: '', rainfall: '', state: '' });

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

  const submitManual = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setShowError(false);
    try {
      const payload = {
        N: parseFloat(manual.N),
        temperature: parseFloat(manual.temperature),
        humidity: parseFloat(manual.humidity),
        ph: parseFloat(manual.ph),
        rainfall: parseFloat(manual.rainfall),
        state: manual.state || null
      };
      const resp = await fetch(`${API_BASE_URL}/recommend-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${resp.status}`);
      }
      const data = await resp.json();
      setRecommendation(data);
      setManualOpen(false);
    } catch (err) {
      console.error('Manual submit failed:', err);
      setError(err.message || 'Failed to get recommendation');
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
          <button 
            className="cta"
            onClick={() => setManualOpen(true)}
            disabled={isLoading}
            style={{ marginLeft: '12px' }}
          >
            Enter Data Manually
          </button>
          <button 
            className="cta"
            onClick={() => setYieldPredictionOpen(true)}
            disabled={isLoading}
            style={{ marginLeft: '12px' }}
          >
            Predict Yield
          </button>
          <button 
            className="cta"
            onClick={() => setDiseaseDetectionOpen(true)}
            disabled={isLoading}
            style={{ marginLeft: '12px' }}
          >
            Detect Disease
          </button>
        </div>

        {manualOpen && (
          <form className="manual-form" onSubmit={submitManual}>
            <div className="row">
              <label>N (kg/ha)</label>
              <input required type="number" step="0.1" value={manual.N} onChange={e => setManual({ ...manual, N: e.target.value })} />
            </div>
            <div className="row">
              <label>Temperature (°C)</label>
              <input required type="number" step="0.1" value={manual.temperature} onChange={e => setManual({ ...manual, temperature: e.target.value })} />
            </div>
            <div className="row">
              <label>Humidity (%)</label>
              <input required type="number" step="0.1" value={manual.humidity} onChange={e => setManual({ ...manual, humidity: e.target.value })} />
            </div>
            <div className="row">
              <label>pH</label>
              <input required type="number" step="0.1" value={manual.ph} onChange={e => setManual({ ...manual, ph: e.target.value })} />
            </div>
            <div className="row">
              <label>Rainfall (mm/month)</label>
              <input required type="number" step="0.1" value={manual.rainfall} onChange={e => setManual({ ...manual, rainfall: e.target.value })} />
            </div>
            <div className="row">
              <label>State (optional)</label>
              <input type="text" value={manual.state} onChange={e => setManual({ ...manual, state: e.target.value })} />
            </div>
            <div className="actions">
              <button type="button" className="cta" onClick={() => setManualOpen(false)}>Cancel</button>
              <button type="submit" className="cta primary" disabled={isLoading}>Get Recommendation</button>
            </div>
          </form>
        )}
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
      {yieldPredictionOpen && (
        <YieldPrediction 
          onClose={() => setYieldPredictionOpen(false)} 
        />
      )}
      {diseaseDetectionOpen && (
        <div className="modal-overlay" onClick={() => setDiseaseDetectionOpen(false)}>
          <div className="modal-content disease-detection-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setDiseaseDetectionOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <DiseaseDetection />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;


