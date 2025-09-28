# scripts/yield_predictor_real.py

import joblib
import numpy as np
import pandas as pd
import json
import os
from typing import Dict, List, Tuple, Optional, Union

class RealYieldPredictor:
    """
    A comprehensive yield prediction system using real crop yield data.
    Predicts crop yield in quintals/acre based on historical data and environmental conditions.
    """
    
    def __init__(self, model_dir: str = 'model'):
        """
        Initialize the yield predictor with trained models and metadata.
        
        Args:
            model_dir: Directory containing the trained models and metadata
        """
        self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.crop_encoder = None
        self.state_encoder = None
        self.season_encoder = None
        self.feature_columns = None
        self.metadata = None
        self.crop_mapping = None
        self.state_mapping = None
        self.season_mapping = None
        
        self._load_models()
    
    def _load_models(self):
        """Load the trained models and metadata."""
        try:
            # Load the trained model
            model_path = os.path.join(self.model_dir, 'yield_predictor_real.joblib')
            self.model = joblib.load(model_path)
            
            # Load scaler (if exists)
            scaler_path = os.path.join(self.model_dir, 'yield_scaler.joblib')
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
            
            # Load encoders
            self.crop_encoder = joblib.load(os.path.join(self.model_dir, 'crop_encoder_real.joblib'))
            self.state_encoder = joblib.load(os.path.join(self.model_dir, 'state_encoder.joblib'))
            self.season_encoder = joblib.load(os.path.join(self.model_dir, 'season_encoder.joblib'))
            
            # Load metadata
            metadata_path = os.path.join(self.model_dir, 'yield_model_metadata_real.json')
            with open(metadata_path, 'r') as f:
                self.metadata = json.load(f)
            
            self.feature_columns = self.metadata['feature_columns']
            self.crop_mapping = self.metadata['crop_mapping']
            self.state_mapping = self.metadata['state_mapping']
            self.season_mapping = self.metadata['season_mapping']
            
            print("Real yield prediction models loaded successfully!")
            
        except Exception as e:
            print(f"Error loading yield prediction models: {e}")
            raise
    
    def predict_yield(self, 
                     crop_name: str,
                     state: str,
                     season: str,
                     area: float,
                     annual_rainfall: float,
                     fertilizer: float,
                     pesticide: float,
                     crop_year: int = 2020) -> Dict[str, Union[float, str]]:
        """
        Predict yield for a given crop and conditions using real data.
        
        Args:
            crop_name: Name of the crop
            state: State name
            season: Season (Kharif, Rabi, Summer, etc.)
            area: Area in hectares
            annual_rainfall: Annual rainfall in mm
            fertilizer: Total fertilizer amount
            pesticide: Total pesticide amount
            crop_year: Year (default: 2020)
            
        Returns:
            Dictionary containing predicted yield and confidence metrics
        """
        if self.model is None:
            raise ValueError("Model not loaded. Please initialize the predictor first.")
        
        # Validate inputs (handle trailing spaces in season names)
        crop_name_clean = crop_name.strip()
        state_clean = state.strip()
        season_clean = season.strip()
        
        # Find matching season (handle trailing spaces)
        season_match = None
        for season_key in self.season_mapping.keys():
            if season_key.strip() == season_clean:
                season_match = season_key
                break
        
        if crop_name_clean not in self.crop_mapping:
            return {'error': f"Crop '{crop_name_clean}' not found in trained model. Available crops: {list(self.crop_mapping.keys())}"}
        
        if state_clean not in self.state_mapping:
            return {'error': f"State '{state_clean}' not found in trained model. Available states: {list(self.state_mapping.keys())}"}
        
        if season_match is None:
            return {'error': f"Season '{season_clean}' not found in trained model. Available seasons: {[s.strip() for s in self.season_mapping.keys()]}"}
        
        # Encode categorical variables
        crop_encoded = self.crop_mapping[crop_name_clean]
        state_encoded = self.state_mapping[state_clean]
        season_encoded = self.season_mapping[season_match]
        
        # Create additional features
        fertilizer_per_hectare = fertilizer / (area / 10000) if area > 0 else 0
        pesticide_per_hectare = pesticide / (area / 10000) if area > 0 else 0
        rainfall_fertilizer_interaction = annual_rainfall * fertilizer_per_hectare
        area_log = np.log1p(area)
        
        # Prepare feature vector in the correct order
        features = np.array([[
            crop_year, area, annual_rainfall, fertilizer, pesticide,
            crop_encoded, state_encoded, season_encoded,
            fertilizer_per_hectare, pesticide_per_hectare,
            rainfall_fertilizer_interaction, area_log
        ]])
        
        # Make prediction
        if self.scaler is not None:
            features_scaled = self.scaler.transform(features)
            predicted_yield = self.model.predict(features_scaled)[0]
        else:
            predicted_yield = self.model.predict(features)[0]
        
        # Calculate confidence interval
        confidence_interval = self._calculate_confidence_interval(
            predicted_yield, crop_name, state, season, area, annual_rainfall, fertilizer, pesticide
        )
        
        return {
            'predicted_yield_quintal_per_acre': round(predicted_yield, 2),
            'confidence_lower': round(confidence_interval[0], 2),
            'confidence_upper': round(confidence_interval[1], 2),
            'confidence_range': round(confidence_interval[1] - confidence_interval[0], 2),
            'fertilizer_per_hectare': round(fertilizer_per_hectare, 2),
            'pesticide_per_hectare': round(pesticide_per_hectare, 2)
        }
    
    def _calculate_confidence_interval(self, 
                                      predicted_yield: float,
                                      crop_name: str,
                                      state: str,
                                      season: str,
                                      area: float,
                                      annual_rainfall: float,
                                      fertilizer: float,
                                      pesticide: float) -> Tuple[float, float]:
        """
        Calculate confidence interval for yield prediction based on historical data variability.
        """
        # Get historical yield statistics for this crop
        crop_stats = self.get_crop_yield_statistics(crop_name)
        
        if crop_stats:
            # Use historical standard deviation as base uncertainty
            historical_std = crop_stats.get('std', predicted_yield * 0.2)
            base_uncertainty = min(historical_std, predicted_yield * 0.3)  # Cap at 30%
        else:
            base_uncertainty = predicted_yield * 0.2  # Default 20% uncertainty
        
        # Additional uncertainty based on input conditions
        # Extreme values increase uncertainty
        area_uncertainty = 0
        if area < 100 or area > 100000:  # Very small or very large areas
            area_uncertainty = predicted_yield * 0.1
        
        rainfall_uncertainty = 0
        if annual_rainfall < 200 or annual_rainfall > 3000:  # Extreme rainfall
            rainfall_uncertainty = predicted_yield * 0.15
        
        fertilizer_uncertainty = 0
        fertilizer_per_hectare = fertilizer / (area / 10000) if area > 0 else 0
        if fertilizer_per_hectare < 10 or fertilizer_per_hectare > 500:  # Extreme fertilizer use
            fertilizer_uncertainty = predicted_yield * 0.1
        
        # Total uncertainty
        total_uncertainty = base_uncertainty + area_uncertainty + rainfall_uncertainty + fertilizer_uncertainty
        
        # Calculate confidence interval
        lower_bound = max(0.1, predicted_yield - total_uncertainty)
        upper_bound = predicted_yield + total_uncertainty
        
        return lower_bound, upper_bound
    
    def predict_multiple_crops(self, 
                              crop_conditions: List[Dict],
                              crop_year: int = 2020) -> Dict[str, Dict]:
        """
        Predict yield for multiple crops with different conditions.
        
        Args:
            crop_conditions: List of dictionaries, each containing crop prediction parameters
            crop_year: Year (default: 2020)
            
        Returns:
            Dictionary mapping crop names to their yield predictions
        """
        results = {}
        for i, conditions in enumerate(crop_conditions):
            crop_name = conditions.get('crop_name', f'crop_{i}')
            conditions['crop_year'] = crop_year
            results[crop_name] = self.predict_yield(**conditions)
        
        return results
    
    def get_crop_yield_statistics(self, crop_name: str) -> Optional[Dict[str, float]]:
        """
        Get historical yield statistics for a specific crop.
        
        Args:
            crop_name: Name of the crop
            
        Returns:
            Dictionary with yield statistics or None if crop not found
        """
        # This would ideally load from a pre-computed statistics file
        # For now, return basic statistics based on common crop yields
        
        crop_yield_ranges = {
            'Rice': {'mean': 2.5, 'std': 0.8, 'min': 0.5, 'max': 5.0},
            'Wheat': {'mean': 2.8, 'std': 0.9, 'min': 0.8, 'max': 5.5},
            'Maize': {'mean': 2.2, 'std': 0.7, 'min': 0.5, 'max': 4.5},
            'Cotton(lint)': {'mean': 0.6, 'std': 0.2, 'min': 0.2, 'max': 1.2},
            'Sugarcane': {'mean': 45.0, 'std': 15.0, 'min': 20.0, 'max': 80.0},
            'Potato': {'mean': 8.5, 'std': 2.5, 'min': 3.0, 'max': 15.0},
            'Groundnut': {'mean': 1.2, 'std': 0.4, 'min': 0.3, 'max': 2.5},
            'Jute': {'mean': 2.8, 'std': 0.9, 'min': 1.0, 'max': 5.0},
            'Coconut': {'mean': 8500.0, 'std': 2500.0, 'min': 4000.0, 'max': 15000.0},
            'Arecanut': {'mean': 1.2, 'std': 0.4, 'min': 0.5, 'max': 2.5}
        }
        
        return crop_yield_ranges.get(crop_name)
    
    def get_optimal_conditions(self, crop_name: str) -> Optional[Dict]:
        """
        Get optimal growing conditions for a specific crop based on historical data.
        
        Args:
            crop_name: Name of the crop
            
        Returns:
            Dictionary with optimal conditions or None if crop not found
        """
        optimal_conditions = {
            'Rice': {
                'rainfall_range': (1000, 2500),
                'fertilizer_per_hectare': (80, 120),
                'temperature_range': (20, 35),
                'ph_range': (5.5, 7.0)
            },
            'Wheat': {
                'rainfall_range': (400, 800),
                'fertilizer_per_hectare': (100, 150),
                'temperature_range': (15, 25),
                'ph_range': (6.0, 7.5)
            },
            'Maize': {
                'rainfall_range': (500, 1000),
                'fertilizer_per_hectare': (120, 180),
                'temperature_range': (18, 30),
                'ph_range': (5.8, 7.2)
            },
            'Cotton(lint)': {
                'rainfall_range': (600, 1200),
                'fertilizer_per_hectare': (80, 120),
                'temperature_range': (20, 35),
                'ph_range': (6.0, 8.0)
            },
            'Sugarcane': {
                'rainfall_range': (1000, 2000),
                'fertilizer_per_hectare': (200, 300),
                'temperature_range': (25, 35),
                'ph_range': (6.0, 7.5)
            }
        }
        
        return optimal_conditions.get(crop_name)
    
    def get_model_info(self) -> Dict:
        """Get information about the trained model."""
        if self.metadata is None:
            return {'error': 'Model metadata not loaded'}
        
        return {
            'best_model_name': self.metadata['best_model_name'],
            'model_performance': self.metadata['model_results'],
            'feature_columns': self.feature_columns,
            'supported_crops': list(self.crop_mapping.keys()),
            'supported_states': list(self.state_mapping.keys()),
            'supported_seasons': list(self.season_mapping.keys()),
            'yield_statistics': self.metadata['yield_statistics'],
            'data_info': self.metadata['data_info']
        }
    
    def get_crop_recommendations(self, 
                                state: str,
                                season: str,
                                area: float,
                                annual_rainfall: float,
                                fertilizer: float,
                                pesticide: float,
                                top_n: int = 5) -> List[Dict]:
        """
        Get crop recommendations based on predicted yields for different crops.
        
        Args:
            state: State name
            season: Season
            area: Area in hectares
            annual_rainfall: Annual rainfall in mm
            fertilizer: Total fertilizer amount
            pesticide: Total pesticide amount
            top_n: Number of top recommendations to return
            
        Returns:
            List of dictionaries with crop recommendations and predicted yields
        """
        recommendations = []
        
        # Test all available crops
        for crop_name in self.crop_mapping.keys():
            try:
                result = self.predict_yield(
                    crop_name=crop_name,
                    state=state,
                    season=season,
                    area=area,
                    annual_rainfall=annual_rainfall,
                    fertilizer=fertilizer,
                    pesticide=pesticide
                )
                
                if 'error' not in result:
                    recommendations.append({
                        'crop_name': crop_name,
                        'predicted_yield': result['predicted_yield_quintal_per_acre'],
                        'confidence_lower': result['confidence_lower'],
                        'confidence_upper': result['confidence_upper']
                    })
            except Exception as e:
                continue
        
        # Sort by predicted yield and return top N
        recommendations.sort(key=lambda x: x['predicted_yield'], reverse=True)
        return recommendations[:top_n]

# Example usage and testing
if __name__ == "__main__":
    # Test the yield predictor
    try:
        predictor = RealYieldPredictor()
        
        # Test single crop prediction
        result = predictor.predict_yield(
            crop_name='Rice',
            state='Assam',
            season='Kharif     ',  # Note the trailing spaces
            area=1000,  # hectares
            annual_rainfall=2000,  # mm
            fertilizer=80000,  # total fertilizer
            pesticide=2000  # total pesticide
        )
        
        print("Single crop prediction:")
        if 'error' not in result:
            print(f"Predicted yield: {result['predicted_yield_quintal_per_acre']} quintals/acre")
            print(f"Confidence interval: {result['confidence_lower']} - {result['confidence_upper']}")
        else:
            print(f"Error: {result['error']}")
        
        # Test crop recommendations
        recommendations = predictor.get_crop_recommendations(
            state='Assam',
            season='Kharif     ',  # Note the trailing spaces
            area=1000,
            annual_rainfall=2000,
            fertilizer=80000,
            pesticide=2000,
            top_n=5
        )
        
        print("\nTop 5 crop recommendations:")
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec['crop_name']}: {rec['predicted_yield']} quintals/acre")
        
        # Get model info
        model_info = predictor.get_model_info()
        print(f"\nModel info: {model_info['best_model_name']}")
        print(f"Supported crops: {len(model_info['supported_crops'])}")
        
    except Exception as e:
        print(f"Error testing yield predictor: {e}")
