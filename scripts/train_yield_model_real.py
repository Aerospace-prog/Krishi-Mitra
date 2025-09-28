# scripts/train_yield_model_real.py

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os
import json
import warnings
warnings.filterwarnings('ignore')

# --- 1. Load and Prepare Real Yield Data ---
print("Step 1: Loading real crop yield data...")

# Load the real crop yield dataset
data_path = os.path.join('data', 'crop_yield.csv')
df = pd.read_csv(data_path)

print(f"Dataset shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")

# --- 2. Data Preprocessing ---
print("Step 2: Preprocessing data...")

# Remove rows with missing values
df_clean = df.dropna()

# Remove extreme outliers (yield > 1000 quintals/acre seems unrealistic for most crops)
# Keep only reasonable yield values
df_clean = df_clean[df_clean['Yield'] <= 1000]
df_clean = df_clean[df_clean['Yield'] > 0]

print(f"Data after cleaning: {df_clean.shape}")

# --- 3. Feature Engineering ---
print("Step 3: Feature engineering...")

# Create additional features
df_clean['Fertilizer_per_hectare'] = df_clean['Fertilizer'] / (df_clean['Area'] / 10000)  # kg/ha
df_clean['Pesticide_per_hectare'] = df_clean['Pesticide'] / (df_clean['Area'] / 10000)   # kg/ha
df_clean['Production_per_hectare'] = df_clean['Production'] / (df_clean['Area'] / 10000) # kg/ha

# Create interaction features
df_clean['Rainfall_Fertilizer_interaction'] = df_clean['Annual_Rainfall'] * df_clean['Fertilizer_per_hectare']
df_clean['Area_log'] = np.log1p(df_clean['Area'])  # Log transform area

# Encode categorical variables
le_crop = LabelEncoder()
le_state = LabelEncoder()
le_season = LabelEncoder()

df_clean['Crop_encoded'] = le_crop.fit_transform(df_clean['Crop'])
df_clean['State_encoded'] = le_state.fit_transform(df_clean['State'])
df_clean['Season_encoded'] = le_season.fit_transform(df_clean['Season'])

# --- 4. Prepare Features for Yield Prediction ---
print("Step 4: Preparing features...")

# Select features for yield prediction
feature_columns = [
    'Crop_Year', 'Area', 'Annual_Rainfall', 'Fertilizer', 'Pesticide',
    'Crop_encoded', 'State_encoded', 'Season_encoded',
    'Fertilizer_per_hectare', 'Pesticide_per_hectare',
    'Rainfall_Fertilizer_interaction', 'Area_log'
]

X = df_clean[feature_columns]
y = df_clean['Yield']

print(f"Features: {feature_columns}")
print(f"Target variable range: {y.min():.2f} - {y.max():.2f}")

# --- 5. Split Data ---
print("Step 5: Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Training set: {X_train.shape}")
print(f"Test set: {X_test.shape}")

# --- 6. Scale Features ---
print("Step 6: Scaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# --- 7. Train Multiple Models ---
print("Step 7: Training yield prediction models...")

models = {
    'random_forest': RandomForestRegressor(
        n_estimators=200, 
        max_depth=15, 
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    ),
    'gradient_boosting': GradientBoostingRegressor(
        n_estimators=200,
        max_depth=8,
        learning_rate=0.1,
        random_state=42
    ),
    'linear_regression': LinearRegression()
}

model_results = {}
trained_models = {}

for name, model in models.items():
    print(f"Training {name}...")
    
    # Use scaled data for linear regression, original for tree-based models
    if name == 'linear_regression':
        model.fit(X_train_scaled, y_train)
        y_pred_train = model.predict(X_train_scaled)
        y_pred_test = model.predict(X_test_scaled)
    else:
        model.fit(X_train, y_train)
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
    
    # Metrics
    train_mse = mean_squared_error(y_train, y_pred_train)
    test_mse = mean_squared_error(y_test, y_pred_test)
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)
    train_mae = mean_absolute_error(y_train, y_pred_train)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    
    model_results[name] = {
        'train_mse': train_mse,
        'test_mse': test_mse,
        'train_r2': train_r2,
        'test_r2': test_r2,
        'train_mae': train_mae,
        'test_mae': test_mae
    }
    
    trained_models[name] = model
    
    print(f"{name} - Train R²: {train_r2:.3f}, Test R²: {test_r2:.3f}")
    print(f"{name} - Train MAE: {train_mae:.2f}, Test MAE: {test_mae:.2f}")

# --- 8. Select Best Model ---
print("\nStep 8: Model comparison...")
best_model_name = max(model_results.keys(), key=lambda x: model_results[x]['test_r2'])
best_model = trained_models[best_model_name]

print(f"Best model: {best_model_name}")
print(f"Test R²: {model_results[best_model_name]['test_r2']:.3f}")
print(f"Test MAE: {model_results[best_model_name]['test_mae']:.2f}")

# --- 9. Feature Importance (for tree-based models) ---
if hasattr(best_model, 'feature_importances_'):
    print("\nStep 9: Feature importance...")
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("Top 10 most important features:")
    print(feature_importance.head(10))

# --- 10. Save Models and Metadata ---
print("\nStep 10: Saving models and metadata...")

# Ensure model directory exists
os.makedirs('model', exist_ok=True)

# Save the best model
model_path = os.path.join('model', 'yield_predictor_real.joblib')
joblib.dump(best_model, model_path)

# Save scaler (if linear regression is best)
if best_model_name == 'linear_regression':
    scaler_path = os.path.join('model', 'yield_scaler.joblib')
    joblib.dump(scaler, scaler_path)

# Save encoders
crop_encoder_path = os.path.join('model', 'crop_encoder_real.joblib')
state_encoder_path = os.path.join('model', 'state_encoder.joblib')
season_encoder_path = os.path.join('model', 'season_encoder.joblib')

joblib.dump(le_crop, crop_encoder_path)
joblib.dump(le_state, state_encoder_path)
joblib.dump(le_season, season_encoder_path)

# Save feature columns and model metadata
metadata = {
    'feature_columns': feature_columns,
    'best_model_name': best_model_name,
    'model_results': model_results,
    'crop_mapping': {str(k): int(v) for k, v in zip(le_crop.classes_, le_crop.transform(le_crop.classes_))},
    'state_mapping': {str(k): int(v) for k, v in zip(le_state.classes_, le_state.transform(le_state.classes_))},
    'season_mapping': {str(k): int(v) for k, v in zip(le_season.classes_, le_season.transform(le_season.classes_))},
    'yield_statistics': {
        'mean': float(df_clean['Yield'].mean()),
        'std': float(df_clean['Yield'].std()),
        'min': float(df_clean['Yield'].min()),
        'max': float(df_clean['Yield'].max()),
        'median': float(df_clean['Yield'].median())
    },
    'data_info': {
        'total_samples': len(df_clean),
        'unique_crops': len(le_crop.classes_),
        'unique_states': len(le_state.classes_),
        'year_range': [int(df_clean['Crop_Year'].min()), int(df_clean['Crop_Year'].max())]
    }
}

metadata_path = os.path.join('model', 'yield_model_metadata_real.json')
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"Yield prediction model saved to: {model_path}")
print(f"Model metadata saved to: {metadata_path}")

# --- 11. Generate Sample Predictions ---
print("\nStep 11: Sample predictions...")
sample_data = X_test.head(5)
if best_model_name == 'linear_regression':
    sample_data_scaled = scaler.transform(sample_data)
    sample_predictions = best_model.predict(sample_data_scaled)
else:
    sample_predictions = best_model.predict(sample_data)
sample_actual = y_test.head(5).values

print("Sample predictions vs actual:")
for i, (pred, actual) in enumerate(zip(sample_predictions, sample_actual)):
    print(f"Sample {i+1}: Predicted {pred:.2f}, Actual {actual:.2f}")

# --- 12. Crop-specific yield analysis ---
print("\nStep 12: Crop-specific yield analysis...")
crop_yield_stats = df_clean.groupby('Crop')['Yield'].agg(['count', 'mean', 'std', 'min', 'max']).round(2)
crop_yield_stats = crop_yield_stats.sort_values('count', ascending=False).head(15)

print("Top 15 crops by data availability:")
print(crop_yield_stats)

print("\nYield forecasting model training completed successfully!")
print(f"Best model: {best_model_name} with R² = {model_results[best_model_name]['test_r2']:.3f}")
