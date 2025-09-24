import React from 'react';
import './LoadingModal.css';

const LoadingModal = ({ isVisible, message = "Analyzing your farm..." }) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-modal">
        <div className="loading-animation">
          <div className="spinner"></div>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <h3>{message}</h3>
        <p>Getting your location and analyzing environmental data...</p>
      </div>
    </div>
  );
};

export default LoadingModal;
