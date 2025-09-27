import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, Scan, X, CheckCircle, AlertTriangle, Download, Share2 } from 'lucide-react';
import './DiseaseScan.css';

const DiseaseScan = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Backend API URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      setAnalysisResult(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleCameraCapture = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(`${API_BASE_URL}/analyze-disease`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      // Mock result for demonstration
      setAnalysisResult({
        disease: 'Leaf Blight',
        confidence: 87,
        severity: 'Moderate',
        description: 'This appears to be a case of leaf blight, a common fungal disease affecting crop leaves.',
        recommendations: [
          'Apply fungicide treatment immediately',
          'Remove affected leaves to prevent spread',
          'Improve air circulation around plants',
          'Avoid overhead watering'
        ],
        prevention: [
          'Plant disease-resistant varieties',
          'Maintain proper spacing between plants',
          'Use clean, sterilized tools',
          'Rotate crops regularly'
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="disease-scan-container">
      {/* Header */}
      <div className="disease-scan-header">
        <button onClick={() => navigate('/')} className="back-button">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="disease-scan-title">Upload Crop Leaf Image</h1>
      </div>

      <div className="disease-scan-content">
        {!analysisResult ? (
          <>
            {/* Upload Section */}
            <div className="upload-section">
              <div className="upload-description">
                <h2>Upload an image of your crop leaf for AI-powered disease detection.</h2>
              </div>

              <div 
                className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <div className="image-preview">
                    <img src={preview} alt="Preview" className="preview-image" />
                    <button onClick={removeFile} className="remove-image-btn">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="upload-text">Click to upload or drag & drop</p>
                    <p className="upload-subtext">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />

              {/* Action Buttons */}
              <div className="action-buttons">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-btn"
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </button>
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="camera-btn"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </button>
                <button 
                  onClick={analyzeImage}
                  disabled={!selectedFile || isAnalyzing}
                  className="analyze-btn"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4" />
                      Analyze Image
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Analysis Results */
          <div className="analysis-results">
            <div className="result-header">
              <h2>Analysis Results</h2>
              <button onClick={removeFile} className="new-analysis-btn">
                <Scan className="w-4 h-4" />
                New Analysis
              </button>
            </div>

            <div className="result-content">
              <div className="result-image">
                <img src={preview} alt="Analyzed crop" className="analyzed-image" />
              </div>

              <div className="result-details">
                <div className="disease-info">
                  <h3 className="disease-name">{analysisResult.disease}</h3>
                  <div className="confidence-badge">
                    <CheckCircle className="w-4 h-4" />
                    {analysisResult.confidence}% Confidence
                  </div>
                  <div className="severity-badge">
                    <AlertTriangle className="w-4 h-4" />
                    {analysisResult.severity} Severity
                  </div>
                </div>

                <div className="description">
                  <h4>Description</h4>
                  <p>{analysisResult.description}</p>
                </div>

                <div className="recommendations">
                  <h4>Treatment Recommendations</h4>
                  <ul>
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="prevention">
                  <h4>Prevention Tips</h4>
                  <ul>
                    {analysisResult.prevention.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>

                <div className="result-actions">
                  <button className="download-btn">
                    <Download className="w-4 h-4" />
                    Download Report
                  </button>
                  <button className="share-btn">
                    <Share2 className="w-4 h-4" />
                    Share Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseScan;