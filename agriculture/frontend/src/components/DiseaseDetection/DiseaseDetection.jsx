import React, { useState, useRef } from 'react';
import { Camera, Upload, X, AlertTriangle, CheckCircle, Loader, Info } from 'lucide-react';
import './DiseaseDetection.css';

const DiseaseDetection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResults(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8000/detect-disease-with-ai-advice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Disease detection failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'none':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) return 'text-green-600';
    if (confidence > 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="disease-detection-container">
      <div className="disease-detection-header">
        <h2 className="section-title">
          <Camera className="icon" />
          Crop Disease Detection
        </h2>
        <p className="section-description">
          Upload an image of your crop to detect diseases and get AI-powered treatment recommendations
        </p>
      </div>

      {/* File Upload Area */}
      <div className="upload-section">
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="file-input"
          />

          {previewUrl ? (
            <div className="preview-container">
              <img src={previewUrl} alt="Preview" className="preview-image" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="clear-button"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="upload-placeholder">
              <Upload size={48} className="upload-icon" />
              <h3>Upload Crop Image</h3>
              <p>Drag and drop an image here, or click to select</p>
              <p className="upload-hint">Supports JPEG, PNG (max 10MB)</p>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="file-info">
            <p><strong>File:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {selectedFile && !isLoading && (
          <button onClick={analyzeImage} className="analyze-button">
            <Camera size={20} />
            Analyze for Diseases
          </button>
        )}

        {isLoading && (
          <div className="loading-container">
            <Loader className="loading-spinner" size={24} />
            <span>Analyzing image for diseases...</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {results && results.success && (
        <div className="results-section">
          <h3 className="results-title">Analysis Results</h3>

          {/* Primary Prediction */}
          {results.primary_prediction && (
            <div className="primary-result">
              <div className="result-header">
                <div className="result-status">
                  {results.primary_prediction.disease === 'Healthy' ? (
                    <CheckCircle className="status-icon healthy" size={24} />
                  ) : (
                    <AlertTriangle className="status-icon diseased" size={24} />
                  )}
                  <div>
                    <h4>{results.primary_prediction.disease}</h4>
                    <p className="crop-name">{results.primary_prediction.crop}</p>
                  </div>
                </div>
                <div className="confidence-badge">
                  <span className={`confidence ${getConfidenceColor(results.primary_prediction.confidence)}`}>
                    {(results.primary_prediction.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>
              </div>

              <div className="result-details">
                <div className={`severity-badge ${getSeverityColor(results.primary_prediction.severity)}`}>
                  <span>Severity: {results.primary_prediction.severity}</span>
                </div>
                <p className="description">{results.primary_prediction.description}</p>
              </div>
            </div>
          )}

          {/* AI Advice */}
          {results.ai_advice && (
            <div className="ai-advice">
              <h4>
                <Info size={20} />
                AI Recommendations
              </h4>
              <p>{results.ai_advice}</p>
            </div>
          )}

          {/* Treatment Recommendations */}
          {results.treatment_recommendations && (
            <div className="treatment-section">
              <h4>Treatment Recommendations</h4>
              
              <div className="urgency-alert">
                <AlertTriangle size={16} />
                <span>{results.treatment_recommendations.urgency}</span>
              </div>

              <div className="treatment-tabs">
                {results.treatment_recommendations.treatments.fungicides && (
                  <div className="treatment-category">
                    <h5>Chemical Treatments</h5>
                    <ul>
                      {results.treatment_recommendations.treatments.fungicides.map((treatment, index) => (
                        <li key={index}>{treatment}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.treatment_recommendations.treatments.organic_treatments && (
                  <div className="treatment-category">
                    <h5>Organic Treatments</h5>
                    <ul>
                      {results.treatment_recommendations.treatments.organic_treatments.map((treatment, index) => (
                        <li key={index}>{treatment}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.treatment_recommendations.treatments.cultural_practices && (
                  <div className="treatment-category">
                    <h5>Cultural Practices</h5>
                    <ul>
                      {results.treatment_recommendations.treatments.cultural_practices.map((practice, index) => (
                        <li key={index}>{practice}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.treatment_recommendations.treatments.prevention && (
                  <div className="treatment-category">
                    <h5>Prevention Measures</h5>
                    <ul>
                      {results.treatment_recommendations.treatments.prevention.map((measure, index) => (
                        <li key={index}>{measure}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {results.treatment_recommendations.additional_notes && (
                <div className="additional-notes">
                  <p><strong>Note:</strong> {results.treatment_recommendations.additional_notes}</p>
                </div>
              )}

              {results.treatment_recommendations.general_advice && (
                <div className="general-advice">
                  <h5>General Safety Guidelines</h5>
                  <ul>
                    {results.treatment_recommendations.general_advice.map((advice, index) => (
                      <li key={index}>{advice}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Alternative Predictions */}
          {results.predictions && results.predictions.length > 1 && (
            <div className="alternative-predictions">
              <h4>Alternative Possibilities</h4>
              <div className="predictions-list">
                {results.predictions.slice(1).map((prediction, index) => (
                  <div key={index} className="prediction-item">
                    <div className="prediction-info">
                      <span className="prediction-disease">{prediction.disease}</span>
                      <span className="prediction-crop">({prediction.crop})</span>
                    </div>
                    <span className={`prediction-confidence ${getConfidenceColor(prediction.confidence)}`}>
                      {(prediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {results && !results.success && (
        <div className="error-message">
          <AlertTriangle size={20} />
          <span>{results.error || 'Analysis failed. Please try again.'}</span>
        </div>
      )}
    </div>
  );
};

export default DiseaseDetection;
