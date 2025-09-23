# scripts/test_model.py

import joblib
import numpy as np
import os

# --- 1. Load the Saved Model ---
# We load the .joblib file, which deserializes it back into a Python object.
print("Step 1: Loading the saved model...")
model_path = os.path.join('..', 'model', 'crop_recommender.joblib')
model = joblib.load(model_path)
print("Model loaded successfully.")

# --- 2. Prepare Sample Input Data ---
# This is a single data point that simulates the input the app would receive.
# The order of values MUST be the same as the columns used for training:
# [N, P, K, temperature, humidity, ph, rainfall]
print("Step 2: Preparing sample data...")
# Let's use data that should strongly suggest 'rice'.
sample_data = np.array([[117, 81, 53, 29.50, 78.2, 5.5, 98.1]])
print(f"Sample Input Data: {sample_data}")

# --- 3. Make a Prediction ---
# We use the loaded model to predict the crop for our sample data.
print("Step 3: Making a prediction...")
prediction = model.predict(sample_data)

# --- 4. Display the Result ---
# We print the output to verify the model is working.
print("\n--- MODEL PREDICTION ---")
print(f"The recommended crop is: {prediction[0]}")