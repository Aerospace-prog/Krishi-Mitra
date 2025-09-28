import React from 'react';
import './ErrorModal.css';

const ErrorModal = ({ isVisible, error, onClose, onRetry }) => {
  if (!isVisible) return null;

  // Check if this is a location permission error
  const isLocationError = error && error.includes('Location access denied');
  
  return (
    <div className="error-overlay">
      <div className="error-modal">
        <div className="error-icon">{isLocationError ? '📍' : '⚠️'}</div>
        <h3>{isLocationError ? 'Location Permission Required' : 'Oops! Something went wrong'}</h3>
        <div className="error-message">
          {error && error.split('\n').map((line, index) => (
            <p key={index} style={{ margin: '4px 0' }}>{line}</p>
          )) || <p>Unable to analyze your farm. Please try again.</p>}
        </div>
        
        {isLocationError && (
          <div className="location-help">
            <h4>How to enable location access:</h4>
            <ol>
              <li>Look for the location icon (📍) in your browser's address bar</li>
              <li>Click on it and select "Allow"</li>
              <li>If you don't see it, go to your browser settings</li>
              <li>Find "Site permissions" or "Privacy and security"</li>
              <li>Allow location access for this site</li>
              <li>Refresh the page and try again</li>
            </ol>
          </div>
        )}
        
        <div className="error-actions">
          <button className="error-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="error-button primary" onClick={onRetry}>
            {isLocationError ? 'Try Again' : 'Retry'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
