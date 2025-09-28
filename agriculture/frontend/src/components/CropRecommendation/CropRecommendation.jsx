import React from 'react';
import './CropRecommendation.css';

const CropRecommendation = ({ recommendation, onClose }) => {
  React.useEffect(() => {
    if (recommendation) {
      console.log("Received recommendation data in component:", recommendation);
    }
  }, [recommendation]);
  if (!recommendation) return null;

  const { crop_recommendation, advice, live_data_used, location_info, yield_quintal_per_acre, market_price_per_quintal_inr, profit_estimate_inr } = recommendation;

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
              <h3 >Top Recommended Crops</h3>
              <div className="crop-list">
                {/* Map over the array to display each crop */}
                {crop_recommendation && crop_recommendation.map((crop, index) => (
                  <div key={index} className="crop-name">{crop}</div>
                ))}
              </div>
            </div>
            
            <div className="ai-advice">
              <h3>AI Advice</h3>
              <p>{advice}</p>
            </div>
          </div>

          <div className="data-section">
            <div className="location-info">
              <h4>📍 Location</h4>
              <p>{[location_info?.city, location_info?.district, location_info?.state].filter(Boolean).join(', ') || 'Unknown'}</p>
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

            {(yield_quintal_per_acre || market_price_per_quintal_inr || profit_estimate_inr) && (
              <div className="environmental-data">
                <h4>📈 Yield & Market Estimates</h4>
                <div className="crop-estimates">
                  {crop_recommendation?.map((crop) => (
                    <div key={crop} className="crop-estimate-card">
                      <div className="crop-name-header">
                        <h5>{crop}</h5>
                      </div>
                      <div className="estimate-details">
                        {yield_quintal_per_acre?.[crop] != null && (
                          <div className="estimate-item">
                            <span className="estimate-label">🌾 Predicted Yield:</span>
                            <span className="estimate-value">{yield_quintal_per_acre[crop]} quintals/acre</span>
                          </div>
                        )}
                        {market_price_per_quintal_inr?.[crop] != null && (
                          <div className="estimate-item">
                            <span className="estimate-label">💰 Market Price:</span>
                            <span className="estimate-value">₹{market_price_per_quintal_inr[crop]}/quintal</span>
                          </div>
                        )}
                        {profit_estimate_inr?.[crop] != null && (
                          <div className="estimate-item">
                            <span className="estimate-label">📊 Estimated Profit:</span>
                            <span className="estimate-value profit">₹{profit_estimate_inr[crop]}/acre</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
