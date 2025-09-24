import React from 'react';
import './ErrorModal.css';

const ErrorModal = ({ isVisible, error, onClose, onRetry }) => {
  if (!isVisible) return null;

  return (
    <div className="error-overlay">
      <div className="error-modal">
        <div className="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p className="error-message">{error || "Unable to analyze your farm. Please try again."}</p>
        <div className="error-actions">
          <button className="error-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="error-button primary" onClick={onRetry}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
