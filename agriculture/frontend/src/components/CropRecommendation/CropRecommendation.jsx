import React from 'react';
import './CropRecommendation.css';

const CropRecommendation = ({ recommendation, onClose }) => {
  if (!recommendation) return null;

  const { crop_recommendation, advice, live_data_used, location_info } = recommendation;

  return (
    <div className="crop-recommendation-overlay">
      <div className="crop-recommendation-modal">
        <div className="modal-header">
          <h2>🌾 Crop Recommendation</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="recommendation-section">
            <div className="recommended-crop">
              <h3>Recommended Crop</h3>
              <div className="crop-name">{crop_recommendation}</div>
            </div>
            
            <div className="ai-advice">
              <h3>AI Advice</h3>
              <p>{advice}</p>
            </div>
          </div>

          <div className="data-section">
            <div className="location-info">
              <h4>📍 Location</h4>
              <p>{location_info?.state || 'Unknown'}</p>
            </div>

            <div className="environmental-data">
              <h4>🌡️ Environmental Data</h4>
              <div className="data-grid">
                <div className="data-item">
                  <span className="label">Temperature:</span>
                  <span className="value">{live_data_used?.temperature}°C</span>
                </div>
                <div className="data-item">
                  <span className="label">Humidity:</span>
                  <span className="value">{live_data_used?.humidity}%</span>
                </div>
                <div className="data-item">
                  <span className="label">pH Level:</span>
                  <span className="value">{live_data_used?.ph}</span>
                </div>
                <div className="data-item">
                  <span className="label">Nitrogen:</span>
                  <span className="value">{live_data_used?.N} kg/ha</span>
                </div>
                <div className="data-item">
                  <span className="label">Rainfall:</span>
                  <span className="value">{live_data_used?.rainfall_mm_monthly_avg} mm/month</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-button primary" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;
