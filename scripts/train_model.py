# scripts/train_model.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

# --- 1. Load Data ---
# This section loads the dataset from the data folder.
print("Step 1: Loading data...")
# os.path.join creates a file path that works on any operating system (Windows, Mac, Linux).
# '../data/Crop_recommendation.csv' means "go up one level from 'scripts', then into 'data'".
data_path = os.path.join('..', 'data', 'Crop_recommendation.csv')
df = pd.read_csv(data_path)

# --- 2. Prepare Data for Training ---
# Here, we separate our data into features (the inputs) and the target (the output).
print("Step 2: Preparing data...")
# X contains all the input columns our model will learn from.
X = df[['N', 'temperature', 'humidity', 'ph', 'rainfall']]
# y contains the single output column we want to predict (the crop 'label').
y = df['label']

# We split the data into a training set (80%) and a testing set (20%).
# The model learns from the training set. We test its performance on the unseen testing set.
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- 3. Train the Machine Learning Model ---
# This is the core of the script where the model learns patterns.
print("Step 3: Training the RandomForestClassifier model...")
# We initialize the Random Forest model. `n_estimators=100` means it will build 100 decision trees.
# `random_state=42` ensures that the model is built the same way every time we run the script.
model = RandomForestClassifier(n_estimators=100, random_state=42)

# The .fit() method is the actual training step. The model "studies" the training data.
model.fit(X_train, y_train)

# --- 4. Evaluate the Model's Performance ---
# We check how well our trained model performs on the data it has never seen before.
print("Step 4: Evaluating model performance...")
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model trained with an accuracy of: {accuracy * 100:.2f}%")

# --- 5. Save the Trained Model ---
# This final step saves our trained model to a file so we can use it later in our app.
print("Step 5: Saving the model...")
# Ensure the 'model' directory exists before trying to save the file there.
os.makedirs('../model', exist_ok=True)
model_path = os.path.join('..', 'model', 'crop_recommender.joblib')

# joblib.dump() serializes our Python model object into a single file.
joblib.dump(model, model_path)
print(f"Model saved successfully to '{model_path}'")