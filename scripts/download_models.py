#!/usr/bin/env python3
"""
Model Download Script for Krishi Mitra
Downloads required model files for the application to work.
"""

import os
import requests
from pathlib import Path
import zipfile
import shutil

def download_file(url, local_path, description):
    """Download a file with progress indication."""
    print(f"Downloading {description}...")
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"✓ Downloaded {description} to {local_path}")
        return True
    except Exception as e:
        print(f"✗ Failed to download {description}: {e}")
        return False

def main():
    """Download all required model files."""
    print("🚀 Krishi Mitra Model Downloader")
    print("=" * 50)
    
    # Create model directory
    model_dir = Path("model")
    model_dir.mkdir(exist_ok=True)
    
    # Model URLs - Replace these with your actual model hosting URLs
    # You can host these on Google Drive, Dropbox, or a cloud storage service
    models_to_download = [
        {
            "url": "https://your-storage-url/crop_recommender.joblib",
            "path": "model/crop_recommender.joblib",
            "description": "Crop Recommendation Model"
        },
        {
            "url": "https://your-storage-url/yield_predictor_real.joblib", 
            "path": "model/yield_predictor_real.joblib",
            "description": "Yield Prediction Model"
        },
        {
            "url": "https://your-storage-url/disease_detection_model.h5",
            "path": "model/disease_detection_model.h5", 
            "description": "Disease Detection Model"
        },
        {
            "url": "https://your-storage-url/disease_detection_model_metadata.json",
            "path": "model/disease_detection_model_metadata.json",
            "description": "Disease Detection Metadata"
        },
        {
            "url": "https://your-storage-url/yield_model_metadata_real.json",
            "path": "model/yield_model_metadata_real.json",
            "description": "Yield Model Metadata"
        },
        {
            "url": "https://your-storage-url/crop_encoder_real.joblib",
            "path": "model/crop_encoder_real.joblib", 
            "description": "Crop Encoder"
        },
        {
            "url": "https://your-storage-url/season_encoder.joblib",
            "path": "model/season_encoder.joblib",
            "description": "Season Encoder"
        },
        {
            "url": "https://your-storage-url/state_encoder.joblib",
            "path": "model/state_encoder.joblib",
            "description": "State Encoder"
        }
    ]
    
    success_count = 0
    total_count = len(models_to_download)
    
    for model_info in models_to_download:
        if download_file(model_info["url"], model_info["path"], model_info["description"]):
            success_count += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Download Summary: {success_count}/{total_count} models downloaded successfully")
    
    if success_count == total_count:
        print("🎉 All models downloaded! You can now run the application.")
    else:
        print("⚠️  Some models failed to download. Check the URLs and try again.")
        print("💡 Alternative: Manually download and place model files in the 'model/' directory")

if __name__ == "__main__":
    main()
