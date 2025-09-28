import React, { useState } from 'react';
import './YieldPrediction.css';

const YieldPrediction = ({ onClose }) => {
  const [formData, setFormData] = useState({
    crop_name: '',
    state: '',
    season: 'Kharif',
    area: '',
    annual_rainfall: '',
    fertilizer: '',
    pesticide: '',
    crop_year: 2024
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const seasons = ['Kharif', 'Rabi', 'Summer', 'Autumn', 'Winter', 'Whole Year'];
  
  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal'
  ];

  const crops = [
    'Rice', 'Wheat', 'Maize', 'Cotton(lint)', 'Sugarcane', 'Potato',
    'Groundnut', 'Jute', 'Coconut', 'Arecanut', 'Moong(Green Gram)',
    'Urad', 'Sesamum', 'Rapeseed &Mustard', 'Bajra', 'Jowar', 'Arhar/Tur',
    'Ragi', 'Gram', 'Onion', 'Tapioca', 'Sweet potato', 'Turmeric',
    'Dry chillies', 'Ginger', 'Garlic', 'Coriander', 'Black pepper',
    'Cardamom', 'Horse-gram', 'Linseed', 'Niger seed', 'Castor seed',
    'Tobacco', 'Small millets', 'Oilseeds total'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // Add trailing spaces to season to match backend format
      const seasonWithSpaces = formData.season + '     ';
      
      const response = await fetch('http://localhost:8000/predict-yield', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          season: seasonWithSpaces,
          area: parseFloat(formData.area),
          annual_rainfall: parseFloat(formData.annual_rainfall),
          fertilizer: parseFloat(formData.fertilizer),
          pesticide: parseFloat(formData.pesticide),
          crop_year: parseInt(formData.crop_year)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to predict yield');
      }

      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="yield-prediction-overlay">
      <div className="yield-prediction-modal">
        <div className="modal-header">
          <h2>📊 Yield Prediction</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {!prediction ? (
            <form onSubmit={handleSubmit} className="yield-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="crop_name">Crop Name *</label>
                  <select
                    id="crop_name"
                    name="crop_name"
                    value={formData.crop_name}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a crop</option>
                    {crops.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="state">State *</label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a state</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="season">Season *</label>
                  <select
                    id="season"
                    name="season"
                    value={formData.season}
                    onChange={handleInputChange}
                    required
                  >
                    {seasons.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="area">Area (hectares) *</label>
                  <input
                    type="number"
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    min="0.1"
                    step="0.1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="annual_rainfall">Annual Rainfall (mm) *</label>
                  <input
                    type="number"
                    id="annual_rainfall"
                    name="annual_rainfall"
                    value={formData.annual_rainfall}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fertilizer">Total Fertilizer (kg) *</label>
                  <input
                    type="number"
                    id="fertilizer"
                    name="fertilizer"
                    value={formData.fertilizer}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pesticide">Total Pesticide (kg) *</label>
                  <input
                    type="number"
                    id="pesticide"
                    name="pesticide"
                    value={formData.pesticide}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="crop_year">Crop Year</label>
                  <input
                    type="number"
                    id="crop_year"
                    name="crop_year"
                    value={formData.crop_year}
                    onChange={handleInputChange}
                    min="1997"
                    max="2030"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <p>❌ {error}</p>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="action-button primary" disabled={loading}>
                  {loading ? 'Predicting...' : 'Predict Yield'}
                </button>
                <button type="button" className="action-button secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="prediction-result">
              <div className="result-header">
                <h3>🎯 Yield Prediction Result</h3>
                <p className="crop-info">
                  <strong>{prediction.crop_name}</strong> in {prediction.state} ({prediction.season})
                </p>
              </div>

              <div className="result-grid">
                <div className="result-card primary">
                  <h4>Predicted Yield</h4>
                  <div className="yield-value">
                    {prediction.predicted_yield_quintal_per_acre} quintals/acre
                  </div>
                </div>

                <div className="result-card">
                  <h4>Confidence Interval</h4>
                  <div className="confidence-range">
                    {prediction.confidence_lower} - {prediction.confidence_upper} quintals/acre
                  </div>
                  <div className="confidence-note">
                    Range: ±{prediction.confidence_range} quintals/acre
                  </div>
                </div>

                <div className="result-card">
                  <h4>Fertilizer Usage</h4>
                  <div className="usage-value">
                    {prediction.fertilizer_per_hectare} kg/hectare
                  </div>
                </div>

                <div className="result-card">
                  <h4>Pesticide Usage</h4>
                  <div className="usage-value">
                    {prediction.pesticide_per_hectare} kg/hectare
                  </div>
                </div>
              </div>

              <div className="input-summary">
                <h4>📋 Input Parameters</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Area:</span>
                    <span className="value">{prediction.input_parameters.area_hectares} hectares</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Annual Rainfall:</span>
                    <span className="value">{prediction.input_parameters.annual_rainfall_mm} mm</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Total Fertilizer:</span>
                    <span className="value">{prediction.input_parameters.fertilizer_total} kg</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Total Pesticide:</span>
                    <span className="value">{prediction.input_parameters.pesticide_total} kg</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Crop Year:</span>
                    <span className="value">{prediction.input_parameters.crop_year}</span>
                  </div>
                </div>
              </div>

              <div className="result-actions">
                <button className="action-button primary" onClick={() => setPrediction(null)}>
                  New Prediction
                </button>
                <button className="action-button secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YieldPrediction;
