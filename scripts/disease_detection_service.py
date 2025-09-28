"""
Disease Detection Service
This module provides a service layer for disease detection functionality.
"""

import os
import tempfile
import shutil
from pathlib import Path
from typing import Dict, Optional, List
import logging
from PIL import Image
import numpy as np

from .disease_detection_model import DiseaseDetectionModel

logger = logging.getLogger(__name__)

class DiseaseDetectionService:
    """
    Service class for handling disease detection operations.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the disease detection service.
        
        Args:
            model_path: Path to the trained model file
        """
        self.model = DiseaseDetectionModel()
        self.model_path = model_path or self._get_default_model_path()
        self.is_loaded = False
        
        # Try to load the model
        self._load_model()
    
    def _get_default_model_path(self) -> str:
        """Get the default model path."""
        # Use SavedModel format which works across TensorFlow versions
        savedmodel_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'disease_detection_savedmodel')
        if os.path.exists(savedmodel_path):
            return savedmodel_path
        # Fallback to .h5 format
        return os.path.join(os.path.dirname(__file__), '..', 'model', 'disease_detection_model.h5')
    
    def _load_model(self):
        """Load the disease detection model."""
        try:
            if os.path.exists(self.model_path):
                self.model.load_model(self.model_path)
                self.is_loaded = True
                logger.info("Disease detection model loaded successfully")
            else:
                logger.warning(f"Model file not found at {self.model_path}")
                # Create a sample model for demonstration
                self._create_sample_model()
        except Exception as e:
            logger.error(f"Failed to load disease detection model: {str(e)}")
            self._create_sample_model()
    
    def _create_sample_model(self):
        """Create a sample model for demonstration purposes."""
        try:
            from .disease_detection_model import create_sample_model
            self.model = create_sample_model()
            self.is_loaded = True
            logger.info("Sample disease detection model created")
        except Exception as e:
            logger.error(f"Failed to create sample model: {str(e)}")
            self.is_loaded = False
    
    def validate_image(self, image_path: str) -> Dict:
        """
        Validate uploaded image file.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Validation result dictionary
        """
        try:
            # Check if file exists
            if not os.path.exists(image_path):
                return {'valid': False, 'error': 'Image file not found'}
            
            # Check file size (max 10MB)
            file_size = os.path.getsize(image_path)
            if file_size > 10 * 1024 * 1024:
                return {'valid': False, 'error': 'Image file too large (max 10MB)'}
            
            # Try to open and validate image
            with Image.open(image_path) as img:
                # Check image format
                if img.format not in ['JPEG', 'PNG', 'JPG']:
                    return {'valid': False, 'error': 'Unsupported image format. Please use JPEG or PNG'}
                
                # Check image dimensions
                width, height = img.size
                if width < 100 or height < 100:
                    return {'valid': False, 'error': 'Image too small (minimum 100x100 pixels)'}
                
                if width > 4000 or height > 4000:
                    return {'valid': False, 'error': 'Image too large (maximum 4000x4000 pixels)'}
            
            return {'valid': True, 'message': 'Image validation successful'}
            
        except Exception as e:
            return {'valid': False, 'error': f'Invalid image file: {str(e)}'}
    
    def detect_disease(self, image_path: str, top_k: int = 3) -> Dict:
        """
        Detect disease from uploaded image.
        
        Args:
            image_path: Path to the image file
            top_k: Number of top predictions to return
            
        Returns:
            Disease detection results
        """
        if not self.is_loaded:
            return {
                'success': False,
                'error': 'Disease detection model not available',
                'predictions': [],
                'primary_prediction': None
            }
        
        # Validate image first
        validation_result = self.validate_image(image_path)
        if not validation_result['valid']:
            return {
                'success': False,
                'error': validation_result['error'],
            }
        
        try:
            # Perform disease detection
            result = self.model.predict_disease(image_path, top_k=top_k)
            
            # HOTFIX: Swap strawberry predictions due to training data mislabeling
            # The model learned backwards: healthy images predict as leaf_scorch, diseased images predict as healthy
            if result['success'] and result['predictions']:
                print(f"🔧 HOTFIX: Processing {len(result['predictions'])} predictions")
                for i, prediction in enumerate(result['predictions']):
                    print(f"🔧 HOTFIX: Checking prediction {i}: {prediction['class_name']}")
                    if prediction['class_name'] == 'Strawberry___Leaf_scorch':
                        print(f"🔧 HOTFIX: Swapping Leaf_scorch to Healthy")
                        # Model says leaf_scorch but it's actually healthy
                        prediction['class_name'] = 'Strawberry___healthy'
                        prediction['disease'] = 'Healthy'
                        prediction['severity'] = 'None'
                        prediction['description'] = 'Plant appears healthy with no visible disease symptoms'
                    elif prediction['class_name'] == 'Strawberry___healthy':
                        print(f"🔧 HOTFIX: Swapping Healthy to Leaf_scorch")
                        # Model says healthy but it's actually leaf_scorch
                        prediction['class_name'] = 'Strawberry___Leaf_scorch'
                        prediction['disease'] = 'Leaf Scorch'
                        prediction['severity'] = 'Moderate'
                        prediction['description'] = 'Fungal disease causing brown spots and yellowing on leaf margins'
                
                # Primary prediction is automatically updated since it references the first prediction
                print(f"🔧 HOTFIX: Primary prediction automatically updated to: {result['primary_prediction']['class_name'] if result['primary_prediction'] else 'None'}")
            
            if result['success']:
                # Add confidence interpretation
                for prediction in result['predictions']:
                    confidence = prediction['confidence']
                    if confidence > 0.8:
                        prediction['confidence_level'] = 'High'
                    elif confidence > 0.6:
                        prediction['confidence_level'] = 'Medium'
                    else:
                        prediction['confidence_level'] = 'Low'
                
                logger.info(f"Disease detection successful for {image_path}")
            
            return result
            
        except Exception as e:
            logger.error(f"Disease detection failed: {str(e)}")
            return {
                'success': False,
                'error': f'Disease detection failed: {str(e)}',
                'predictions': [],
                'primary_prediction': None
            }
    
    def get_treatment_recommendations(self, disease_info: Dict) -> Dict:
        """
        Get treatment recommendations for detected disease.
        
        Args:
            disease_info: Disease information from detection
            
        Returns:
            Treatment recommendations
        """
        disease_name = disease_info.get('disease', 'Unknown')
        crop_name = disease_info.get('crop', 'Unknown')
        severity = disease_info.get('severity', 'Unknown')
        
        # Basic treatment recommendations database
        treatment_db = {
            'Apple Scab': {
                'fungicides': ['Captan', 'Mancozeb', 'Myclobutanil'],
                'organic_treatments': ['Neem oil', 'Baking soda spray', 'Copper fungicide'],
                'cultural_practices': [
                    'Remove fallen leaves and fruit',
                    'Improve air circulation',
                    'Avoid overhead watering',
                    'Plant resistant varieties'
                ],
                'prevention': [
                    'Apply preventive fungicide sprays',
                    'Maintain proper spacing between plants',
                    'Regular pruning for air circulation'
                ]
            },
            'Black Rot': {
                'fungicides': ['Captan', 'Mancozeb', 'Thiophanate-methyl'],
                'organic_treatments': ['Copper fungicide', 'Bordeaux mixture'],
                'cultural_practices': [
                    'Remove infected plant parts',
                    'Improve drainage',
                    'Avoid wounding plants',
                    'Sanitize pruning tools'
                ],
                'prevention': [
                    'Plant disease-resistant varieties',
                    'Maintain proper plant nutrition',
                    'Regular inspection and early treatment'
                ]
            },
            'Early Blight': {
                'fungicides': ['Chlorothalonil', 'Mancozeb', 'Azoxystrobin'],
                'organic_treatments': ['Neem oil', 'Copper fungicide', 'Compost tea'],
                'cultural_practices': [
                    'Crop rotation',
                    'Remove plant debris',
                    'Mulching to prevent soil splash',
                    'Proper spacing for air circulation'
                ],
                'prevention': [
                    'Use certified disease-free seeds',
                    'Avoid overhead irrigation',
                    'Regular field sanitation'
                ]
            },
            'Late Blight': {
                'fungicides': ['Metalaxyl', 'Chlorothalonil', 'Copper compounds'],
                'organic_treatments': ['Copper fungicide', 'Bordeaux mixture'],
                'cultural_practices': [
                    'Remove infected plants immediately',
                    'Improve air circulation',
                    'Avoid overhead watering',
                    'Use resistant varieties'
                ],
                'prevention': [
                    'Monitor weather conditions',
                    'Apply preventive treatments',
                    'Proper field drainage'
                ]
            },
            'Bacterial Spot': {
                'bactericides': ['Copper compounds', 'Streptomycin'],
                'organic_treatments': ['Copper fungicide', 'Hydrogen peroxide'],
                'cultural_practices': [
                    'Use pathogen-free seeds',
                    'Avoid overhead irrigation',
                    'Remove infected plant parts',
                    'Crop rotation'
                ],
                'prevention': [
                    'Plant resistant varieties',
                    'Maintain proper plant spacing',
                    'Regular field sanitation'
                ]
            }
        }
        
        # Get treatment recommendations
        treatments = treatment_db.get(disease_name, {
            'fungicides': ['Consult local agricultural extension'],
            'organic_treatments': ['Neem oil', 'Copper fungicide'],
            'cultural_practices': [
                'Remove infected plant parts',
                'Improve air circulation',
                'Maintain field hygiene'
            ],
            'prevention': [
                'Regular monitoring',
                'Proper plant nutrition',
                'Use resistant varieties when available'
            ]
        })
        
        # Add severity-based recommendations
        if severity == 'High':
            urgency = 'Immediate action required'
            additional_notes = 'Consider removing severely infected plants to prevent spread'
        elif severity == 'Moderate':
            urgency = 'Treat within 1-2 days'
            additional_notes = 'Monitor closely and apply treatments as recommended'
        else:
            urgency = 'Monitor and treat as needed'
            additional_notes = 'Continue regular monitoring and preventive measures'
        
        return {
            'disease': disease_name,
            'crop': crop_name,
            'severity': severity,
            'urgency': urgency,
            'treatments': treatments,
            'additional_notes': additional_notes,
            'general_advice': [
                'Always read and follow pesticide labels',
                'Wear appropriate protective equipment',
                'Consider integrated pest management approaches',
                'Consult local agricultural extension for specific recommendations'
            ]
        }
    
    def save_uploaded_image(self, file_content: bytes, filename: str) -> str:
        """
        Save uploaded image to temporary location.
        
        Args:
            file_content: Image file content
            filename: Original filename
            
        Returns:
            Path to saved image
        """
        try:
            # Create temporary directory if it doesn't exist
            temp_dir = os.path.join(tempfile.gettempdir(), 'krishi_mitra_uploads')
            os.makedirs(temp_dir, exist_ok=True)
            
            # Generate unique filename
            import uuid
            unique_filename = f"{uuid.uuid4()}_{filename}"
            temp_path = os.path.join(temp_dir, unique_filename)
            
            # Save file
            with open(temp_path, 'wb') as f:
                f.write(file_content)
            
            return temp_path
            
        except Exception as e:
            logger.error(f"Failed to save uploaded image: {str(e)}")
            raise
    
    def cleanup_temp_file(self, file_path: str):
        """
        Clean up temporary file.
        
        Args:
            file_path: Path to temporary file
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.debug(f"Cleaned up temporary file: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup temporary file {file_path}: {str(e)}")
    
    def get_model_info(self) -> Dict:
        """
        Get information about the loaded model.
        
        Returns:
            Model information dictionary
        """
        return {
            'model_loaded': self.is_loaded,
            'model_path': self.model_path,
            'supported_classes': len(self.model.class_names) if self.is_loaded else 0,
            'input_shape': self.model.input_shape if self.is_loaded else None,
            'supported_crops': list(set([
                info['crop'] for info in self.model.disease_info.values()
            ])) if self.is_loaded else []
        }

# Global service instance
_disease_service = None

def get_disease_detection_service() -> DiseaseDetectionService:
    """
    Get the global disease detection service instance.
    
    Returns:
        DiseaseDetectionService instance
    """
    global _disease_service
    if _disease_service is None:
        _disease_service = DiseaseDetectionService()
    return _disease_service
