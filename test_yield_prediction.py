#!/usr/bin/env python3
"""
Test script for the Yield Forecasting Model
This script demonstrates how to use the yield prediction API
"""

import requests
import json

# Backend API URL
API_BASE_URL = "http://localhost:8000"

def test_yield_prediction():
    """Test the yield prediction endpoint"""
    print("🌾 Testing Yield Forecasting Model")
    print("=" * 50)
    
    # Test data for yield prediction
    test_data = {
        "crop_name": "Rice",
        "state": "Assam",
        "season": "Kharif     ",  # Note: trailing spaces required
        "area": 1.0,  # hectares
        "annual_rainfall": 2000.0,  # mm
        "fertilizer": 80000.0,  # kg
        "pesticide": 2000.0,  # kg
        "crop_year": 2024
    }
    
    try:
        print(f"📊 Predicting yield for {test_data['crop_name']} in {test_data['state']}")
        print(f"   Season: {test_data['season'].strip()}")
        print(f"   Area: {test_data['area']} hectares")
        print(f"   Annual Rainfall: {test_data['annual_rainfall']} mm")
        print(f"   Fertilizer: {test_data['fertilizer']} kg")
        print(f"   Pesticide: {test_data['pesticide']} kg")
        print()
        
        # Make API request
        response = requests.post(
            f"{API_BASE_URL}/predict-yield",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ Yield Prediction Successful!")
            print("-" * 30)
            print(f"🌾 Crop: {result['crop_name']}")
            print(f"📍 Location: {result['state']} ({result['season']})")
            print(f"📈 Predicted Yield: {result['predicted_yield_quintal_per_acre']} quintals/acre")
            print(f"📊 Confidence Interval: {result['confidence_lower']} - {result['confidence_upper']} quintals/acre")
            print(f"📏 Confidence Range: ±{result['confidence_range']} quintals/acre")
            print(f"🌱 Fertilizer per hectare: {result['fertilizer_per_hectare']} kg/ha")
            print(f"🐛 Pesticide per hectare: {result['pesticide_per_hectare']} kg/ha")
            print()
            
            # Show input parameters
            print("📋 Input Parameters:")
            for key, value in result['input_parameters'].items():
                print(f"   {key}: {value}")
            
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_yield_model_info():
    """Test the yield model info endpoint"""
    print("\n🔍 Testing Yield Model Info")
    print("=" * 50)
    
    try:
        response = requests.get(f"{API_BASE_URL}/yield-model-info")
        
        if response.status_code == 200:
            info = response.json()
            
            print("✅ Model Info Retrieved Successfully!")
            print("-" * 30)
            print(f"🤖 Best Model: {info['best_model_name']}")
            print(f"📊 Model Performance:")
            for model_name, metrics in info['model_performance'].items():
                print(f"   {model_name}: R² = {metrics['test_r2']:.3f}, MAE = {metrics['test_mae']:.2f}")
            
            print(f"\n🌾 Supported Crops: {len(info['supported_crops'])}")
            print(f"📍 Supported States: {len(info['supported_states'])}")
            print(f"📅 Supported Seasons: {len(info['supported_seasons'])}")
            
            print(f"\n📈 Yield Statistics:")
            stats = info['yield_statistics']
            print(f"   Mean: {stats['mean']:.2f} quintals/acre")
            print(f"   Std: {stats['std']:.2f} quintals/acre")
            print(f"   Range: {stats['min']:.2f} - {stats['max']:.2f} quintals/acre")
            
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_multiple_crops():
    """Test yield prediction for multiple crops"""
    print("\n🌾 Testing Multiple Crop Predictions")
    print("=" * 50)
    
    crops_to_test = [
        {"crop_name": "Rice", "state": "Assam", "season": "Kharif     "},
        {"crop_name": "Wheat", "state": "Punjab", "season": "Rabi       "},
        {"crop_name": "Maize", "state": "Karnataka", "season": "Kharif     "},
        {"crop_name": "Sugarcane", "state": "Maharashtra", "season": "Whole Year "},
    ]
    
    base_params = {
        "area": 1.0,
        "annual_rainfall": 1500.0,
        "fertilizer": 60000.0,
        "pesticide": 1500.0,
        "crop_year": 2024
    }
    
    for crop_info in crops_to_test:
        test_data = {**base_params, **crop_info}
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/predict-yield",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {result['crop_name']} in {result['state']}: {result['predicted_yield_quintal_per_acre']} quintals/acre")
            else:
                print(f"❌ {crop_info['crop_name']}: Error {response.status_code}")
                
        except Exception as e:
            print(f"❌ {crop_info['crop_name']}: {e}")

if __name__ == "__main__":
    print("🚀 Yield Forecasting Model Test Suite")
    print("=" * 60)
    
    # Test yield prediction
    test_yield_prediction()
    
    # Test model info
    test_yield_model_info()
    
    # Test multiple crops
    test_multiple_crops()
    
    print("\n🎉 Test completed!")
    print("\nTo start the backend server, run:")
    print("   uvicorn backend_app:app --reload --host 0.0.0.0 --port 8000")
    print("\nTo start the frontend, run:")
    print("   cd agriculture/frontend && npm run dev")
