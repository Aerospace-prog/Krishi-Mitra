# # backend_app.py

# # --- Part 1: Imports ---
# import os
# import asyncio
# import httpx
# import joblib
# import numpy as np
# import pandas as pd
# import google.generativeai as genai
# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from dotenv import load_dotenv
# from datetime import datetime, timedelta

# # --- Part 2: Initial Configuration ---
# load_dotenv()
# app = FastAPI()

# # --- Part 3: Pydantic Model for GPS Input ---
# class LocationInput(BaseModel):
#     latitude: float
#     longitude: float

# # --- Part 4: Load Assets (ML Model & API Keys) ---
# model_path = os.path.join('model', 'crop_recommender.joblib')
# model = joblib.load(model_path)

# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# WEATHERAPI_KEY = os.getenv("WEATHERAPI_KEY")

# if not GEMINI_API_KEY or not WEATHERAPI_KEY:
#     # Minor Fix: Updated the error message to be accurate
#     raise ValueError("API keys for Gemini or WeatherAPI.com are missing. Please set them in your .env file.")

# genai.configure(api_key=GEMINI_API_KEY)
# gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# # --- Part 5: API Helper Functions ---
# async def get_weather_data(lat: float, lon: float, api_key: str) -> dict | None:
#     """Fetches live weather data from WeatherAPI.com."""
#     url = f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={lat},{lon}"
#     async with httpx.AsyncClient() as client:
#         try:
#             response = await client.get(url)
#             response.raise_for_status()
#             data = response.json()
#             return {
#                 "temperature": data['current']['temp_c'],
#                 "humidity": data['current']['humidity'],
#                 "rainfall": data['current']['precip_mm']
#             }
#         except httpx.HTTPStatusError as e:
#             print(f"WeatherAPI.com request failed: {e}")
#             return None

# async def get_monthly_rainfall(lat: float, lon: float) -> float | None:
#     """
#     Fetches historical rainfall for the last 90 days from Open-Meteo
#     and calculates an average monthly total. Returns None on failure.
#     """
#     # 1. Calculate the start and end dates for the last 90 days
#     today = datetime.utcnow()
#     end_date = today - timedelta(days=2) # Use data up to 2 days ago for stability
#     start_date = end_date - timedelta(days=90)
    
#     start_date_str = start_date.strftime('%Y-%m-%d')
#     end_date_str = end_date.strftime('%Y-%m-%d')

#     # 2. Construct the URL for the historical API to get daily precipitation
#     url = (f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}"
#            f"&start_date={start_date_str}&end_date={end_date_str}&daily=precipitation_sum")
           
#     async with httpx.AsyncClient(timeout=20.0) as client:
#         try:
#             response = await client.get(url)
#             response.raise_for_status()
#             data = response.json()
            
#             # 3. Calculate the average monthly rainfall from the daily data
#             daily_precipitations = data['daily']['precipitation_sum']
#             if not daily_precipitations:
#                 return 0.0 # Return 0 if the list is empty
                
#             # Calculate total rainfall over the period and extrapolate to a 30-day month
#             total_precip = sum(d for d in daily_precipitations if d is not None)
#             avg_daily_precip = total_precip / len(daily_precipitations)
#             avg_monthly_precip = avg_daily_precip * 30

#             return round(avg_monthly_precip, 2)
            
#         except (httpx.HTTPStatusError, KeyError, IndexError) as e:
#             # 4. If the API call fails for any reason, return None
#             print(f"Open-Meteo Historical API failed: {e}. Cannot fetch rainfall data.")
#             return None

# async def get_soil_data(lat: float, lon: float) -> dict | None:
#     """Fetches soil data from SoilGrids API."""
#     properties = ["phh2o","nitrogen"]
#     url = f"https://rest.isric.org/soilgrids/v2.0/properties/query?lon={lon}&lat={lat}&property=nitrogen&property=phh2o&depth=0-5cm&value=mean"
#     print(url)
#     async with httpx.AsyncClient() as client:
#         try:
#             response = await client.get(url)
#             response.raise_for_status()
#             data = response.json()
#             layers = data['properties']['layers']
#             ph_mean = layers[0]['depths'][0]['values'].get('mean')
#             n_mean = layers[1]['depths'][0]['values'].get('mean')

#             ph = round(ph_mean / 10.0, 2) 
#             n = round(n_mean / 100.0, 2) 

#             return {"ph": ph, "N": n}
            
#         except httpx.HTTPStatusError as e:
#             print(f"SoilGrids API request failed: {e}")
#             return None

# # --- Part 6: Main API Endpoint ---
# @app.post("/recommend-by-location")
# async def recommend_by_location(location: LocationInput):
#     """
#     This is the main endpoint that takes GPS coordinates, fetches live data,
#     predicts a crop, and returns AI-generated advice.
#     """
#     # 1. Fetch data from both APIs concurrently
#     # <-- FIX: Added the WEATHERAPI_KEY argument here
#     weather_task = get_weather_data(location.latitude, location.longitude, WEATHERAPI_KEY)
#     soil_task = get_soil_data(location.latitude, location.longitude)
#     rainfall_task = get_monthly_rainfall(location.latitude, location.longitude)
    
#     results = await asyncio.gather(weather_task, soil_task,rainfall_task)
#     weather_data, soil_data, monthly_rainfall = results
    
#     if not weather_data or not soil_data or monthly_rainfall is None:
#         raise HTTPException(status_code=503, detail="Could not retrieve live data from one or more external services.")
        
#     # weather_data['rainfall'] = monthly_rainfall

#     # 2. Prepare data for the machine learning model
#     feature_names = ['N', 'temperature', 'humidity', 'ph', 'rainfall']
    
#     # Create the DataFrame using the collected data.
#     input_df = pd.DataFrame([[
#         soil_data['N'],
#         weather_data['temperature'],
#         weather_data['humidity'],
#         soil_data['ph'],
#         weather_data['rainfall']
#     ]], columns=feature_names)

#     # 3. Make a prediction
#     crop_name = model.predict(input_df)[0]

#     # 4. Generate advice using the Gemini API
#     prompt = f"""You are 'Krishi Mitra,' a helpful AI assistant for farmers in India.
#     Based on live soil and weather data from the farm's location , the model recommends planting '{crop_name}'.
#     Provide a short (2-3 sentences), simple paragraph of advice for this farmer. Mention why this crop is a good choice for the local conditions."""
    
#     response = gemini_model.generate_content(prompt)

#     # 5. Return the final, structured response
#     return {
#         'crop_recommendation': crop_name,
#         'advice': response.text,
#         'live_data_used': {**weather_data, **soil_data}
#     }

# @app.get("/")
# def read_root():
#     return {"message": "Welcome to the Krishi Mitra AI API"}




# # backend_app.py

# # --- Part 1: Imports ---
# import os
# import asyncio
# import httpx
# import joblib
# import numpy as np
# import google.generativeai as genai
# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from dotenv import load_dotenv
# from geopy.geocoders import Nominatim

# # --- Part 2: Initial Configuration ---
# load_dotenv()
# app = FastAPI()

# # --- Part 3: The State-Crop Database ---
# # This dictionary acts as our "common sense" filter.
# # You can expand this list with more states and their common crops.
# STATE_CROPS = {
#     # States
#     "Andhra Pradesh": ["rice", "cotton", "maize", "mango", "orange", "papaya"],
#     "Arunachal Pradesh": ["rice", "maize", "orange"],
#     "Assam": ["rice", "jute", "orange", "papaya", "banana"],
#     "Bihar": ["rice", "maize", "lentil", "mango", "jute", "pomegranate"],
#     "Chhattisgarh": ["rice", "maize", "lentil", "blackgram", "chickpea"],
#     "Goa": ["rice", "coconut", "mango"],
#     "Gujarat": ["cotton", "mothbeans", "mango", "banana", "papaya"],
#     "Haryana": ["rice", "maize", "cotton", "jute"],
#     "Himachal Pradesh": ["apple", "maize", "rice"],
#     "Jharkhand": ["rice", "maize", "pigeonpeas", "mungbean"],
#     "Karnataka": ["rice", "maize", "pigeonpeas", "cotton", "pomegranate", "grapes", "mango", "coffee"],
#     "Kerala": ["coconut", "rice", "coffee", "banana", "papaya"],
#     "Madhya Pradesh": ["chickpea", "lentil", "maize", "cotton", "orange"],
#     "Maharashtra": ["cotton", "pomegranate", "grapes", "mango", "orange", "chickpea", "pigeonpeas"],
#     "Manipur": ["rice", "maize"],
#     "Meghalaya": ["rice", "maize", "orange"],
#     "Mizoram": ["rice", "maize", "papaya", "banana"],
#     "Nagaland": ["rice", "maize"],
#     "Odisha": ["rice", "jute", "mango", "coconut"],
#     "Punjab": ["rice", "maize", "cotton"],
#     "Rajasthan": ["mothbeans", "chickpea", "orange", "pomegranate"],
#     "Sikkim": ["maize", "orange"],
#     "Tamil Nadu": ["rice", "maize", "cotton", "coconut", "mango", "banana", "grapes"],
#     "Telangana": ["rice", "cotton", "maize", "mango", "orange"],
#     "Tripura": ["rice", "jute"],
#     "Uttar Pradesh": ["rice", "maize", "pigeonpeas", "lentil", "mango", "jute"],
#     "Uttarakhand": ["rice", "maize", "apple", "mango", "lentil"],
#     "West Bengal": ["jute", "rice", "maize", "pigeonpeas", "mango"],

#     # Union Territories
#     "Andaman and Nicobar Islands": ["rice", "coconut"],
#     "Chandigarh": ["maize"], # Primarily urban, but surrounding areas
#     "Delhi": ["maize"], # Primarily urban, but surrounding areas
#     "Jammu and Kashmir": ["apple", "maize", "rice", "grapes"],
#     "Ladakh": ["apple"], # Very limited options from the dataset
#     "Puducherry": ["rice", "coconut", "banana"]
# }

# # --- Part 4: Pydantic Model for GPS Input ---
# class LocationInput(BaseModel):
#     latitude: float
#     longitude: float

# # --- Part 5: Load Assets (ML Model & API Keys) ---
# model_path = os.path.join('model', 'crop_recommender.joblib')
# model = joblib.load(model_path)

# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# WEATHERAPI_KEY = os.getenv("WEATHERAPI_KEY")

# if not GEMINI_API_KEY or not WEATHERAPI_KEY:
#     raise ValueError("API keys for Gemini or WeatherAPI.com are missing. Please set them in your .env file.")

# genai.configure(api_key=GEMINI_API_KEY)
# gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# # --- Part 6: Helper Functions ---
# async def get_weather_data(lat: float, lon: float, api_key: str) -> dict | None:
#     """Fetches live weather data from WeatherAPI.com."""
#     url = f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={lat},{lon}"
#     async with httpx.AsyncClient() as client:
#         try:
#             response = await client.get(url)
#             response.raise_for_status()
#             data = response.json()
#             return {"temperature": data['current']['temp_c'], "humidity": data['current']['humidity'], "rainfall": data['current']['precip_mm']}
#         except httpx.HTTPStatusError as e:
#             print(f"WeatherAPI.com request failed: {e}")
#             return None

# def get_regional_soil_defaults(lat: float, lon: float) -> dict:
#     """Returns reliable, static soil data based on major Indian soil zones."""
#     soil_zones = [
#         (("Haryana_Alluvial", 27.5, 30.8, 74.4, 77.6), {"P": 18.0, "K": 280.0, "N": 100.0, "ph": 7.2}),
#         (("Alluvial_UP_Bihar", 22, 30, 78, 88), {"P": 20.0, "K": 200.0, "N": 90.0, "ph": 7.0}),
#         (("Black_Soil", 16, 22, 72, 80), {"P": 15.0, "K": 220.0, "N": 70.0, "ph": 7.5}),
#         (("Red_Yellow_South", 8, 16, 75, 85), {"P": 18.0, "K": 140.0, "N": 85.0, "ph": 6.5}),
#     ]
#     for zone, values in soil_zones:
#         name, lat_min, lat_max, lon_min, lon_max = zone
#         if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
#             return values
#     return {"P": 25.0, "K": 150.0, "N": 85.0, "ph": 6.8}

# async def get_soil_data(lat: float, lon: float) -> dict | None:
#     """Wrapper for the reliable zonal soil data function."""
#     return get_regional_soil_defaults(lat, lon)

# def get_state_from_coords(lat: float, lon: float) -> str | None:
#     """Uses reverse geocoding to find the state from lat/lon."""
#     try:
#         geolocator = Nominatim(user_agent="krishi_mitra_app")
#         location = geolocator.reverse((lat, lon), exactly_one=True, language='en')
#         return location.raw.get('address', {}).get('state')
#     except Exception as e:
#         print(f"Geocoding failed: {e}")
#         return None

# # --- Part 7: Main API Endpoint with Regional Filter ---
# @app.post("/recommend-by-location")
# async def recommend_by_location(location: LocationInput):
#     weather_task = get_weather_data(location.latitude, location.longitude, WEATHERAPI_KEY)
#     soil_task = get_soil_data(location.latitude, location.longitude)
    
#     state = get_state_from_coords(location.latitude, location.longitude)
    
#     results = await asyncio.gather(weather_task, soil_task)
#     weather_data, soil_data = results
    
#     if not weather_data or not soil_data:
#         raise HTTPException(status_code=503, detail="Could not retrieve environmental data.")
#     if not state:
#         raise HTTPException(status_code=503, detail="Could not determine state for the given coordinates.")
        
#     input_data = np.array([[
#         soil_data['N'],
#         weather_data['temperature'], weather_data['humidity'],
#         soil_data['ph'], weather_data['rainfall']
#     ]])

#     # --- The Smart Prediction Loop ---
#     probabilities = model.predict_proba(input_data)[0]
#     all_crops = model.classes_
#     sorted_predictions = sorted(zip(all_crops, probabilities), key=lambda x: x[1], reverse=True)
    
#     suitable_crops_for_state = STATE_CROPS.get(state, list(all_crops)) # Fallback to all crops if state not in DB
    
#     final_crop_name = None
#     for crop, prob in sorted_predictions:
#         if crop in suitable_crops_for_state:
#             final_crop_name = crop
#             break # Found the best, regionally-appropriate crop

#     if not final_crop_name:
#         final_crop_name = sorted_predictions[0][0] # Fallback to the top scientific prediction

#     prompt = f"""You are 'Krishi Mitra,' an AI assistant for farmers in {state}, India.
#     Based on live weather and regional soil data, the model recommends planting '{final_crop_name}'.
#     Provide a short (2-3 sentences), simple paragraph of advice for this farmer about this crop."""
    
#     response = gemini_model.generate_content(prompt)

#     return {
#         'crop_recommendation': final_crop_name,
#         'advice': response.text,
#         'live_data_used': {**weather_data, **soil_data},
#         'location_info': {'state': state}
#     }

# @app.get("/")
# def read_root():
#     return {"message": "Welcome to the Krishi Mitra AI API"}




# backend_app.py

# --- Part 1: Imports ---
import os
import asyncio
import httpx
import joblib
import numpy as np
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from geopy.geocoders import Nominatim
from datetime import datetime, timedelta

# --- Part 2: Initial Configuration ---
load_dotenv()
app = FastAPI()

# --- Part 3: The State-Crop Database ---
# This dictionary acts as our "common sense" filter to ensure recommendations are regionally appropriate.
STATE_CROPS = {
    "Andhra Pradesh": ["rice", "cotton", "maize", "mango", "orange", "papaya"],
    "Arunachal Pradesh": ["rice", "maize", "orange"],
    "Assam": ["rice", "jute", "orange", "papaya", "banana"],
    "Bihar": ["rice", "maize", "lentil", "mango", "jute", "pomegranate"],
    "Chhattisgarh": ["rice", "maize", "lentil", "blackgram", "chickpea"],
    "Goa": ["rice", "coconut", "mango"],
    "Gujarat": ["cotton", "mothbeans", "mango", "banana", "papaya"],
    "Haryana": ["rice", "maize", "cotton", "jute"],
    "Himachal Pradesh": ["apple", "maize", "rice"],
    "Jharkhand": ["rice", "maize", "pigeonpeas", "mungbean"],
    "Karnataka": ["rice", "maize", "pigeonpeas", "cotton", "pomegranate", "grapes", "mango", "coffee"],
    "Kerala": ["coconut", "rice", "coffee", "banana", "papaya"],
    "Madhya Pradesh": ["chickpea", "lentil", "maize", "cotton", "orange"],
    "Maharashtra": ["cotton", "pomegranate", "grapes", "mango", "orange", "chickpea", "pigeonpeas"],
    "Manipur": ["rice", "maize"],
    "Meghalaya": ["rice", "maize", "orange"],
    "Mizoram": ["rice", "maize", "papaya", "banana"],
    "Nagaland": ["rice", "maize"],
    "Odisha": ["rice", "jute", "mango", "coconut"],
    "Punjab": ["rice", "maize", "cotton"],
    "Rajasthan": ["mothbeans", "chickpea", "orange", "pomegranate"],
    "Sikkim": ["maize", "orange"],
    "Tamil Nadu": ["rice", "maize", "cotton", "coconut", "mango", "banana", "grapes"],
    "Telangana": ["rice", "cotton", "maize", "mango", "orange"],
    "Tripura": ["rice", "jute"],
    "Uttar Pradesh": ["rice", "maize", "pigeonpeas", "lentil", "mango", "jute"],
    "Uttarakhand": ["rice", "maize", "apple", "mango", "lentil"],
    "West Bengal": ["jute", "rice", "maize", "pigeonpeas", "mango"],
    "Andaman and Nicobar Islands": ["rice", "coconut"],
    "Chandigarh": ["maize"],
    "Delhi": ["maize"],
    "Jammu and Kashmir": ["apple", "maize", "rice", "grapes"],
    "Ladakh": ["apple"],
    "Puducherry": ["rice", "coconut", "banana"]
}

# --- Part 4: Pydantic Model for GPS Input ---
class LocationInput(BaseModel):
    latitude: float
    longitude: float

# --- Part 5: Load Assets (ML Model & API Keys) ---
model_path = os.path.join('model', 'crop_recommender.joblib')
model = joblib.load(model_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHERAPI_KEY = os.getenv("WEATHERAPI_KEY")

if not GEMINI_API_KEY or not WEATHERAPI_KEY:
    raise ValueError("API keys for Gemini or WeatherAPI.com are missing. Please set them in your .env file.")

genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# --- Part 6: Helper Functions (Live Data Fetchers) ---
async def get_weather_data(lat: float, lon: float, api_key: str) -> dict | None:
    """Fetches live weather data from WeatherAPI.com."""
    url = f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={lat},{lon}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            return {
                "temperature": data['current']['temp_c'],
                "humidity": data['current']['humidity']
            }
        except httpx.HTTPStatusError as e:
            print(f"WeatherAPI.com request failed: {e}")
            return None

async def get_monthly_rainfall(lat: float, lon: float) -> float | None:
    """
    Fetches historical rainfall for the last 90 days from Open-Meteo
    and calculates an average monthly total. Returns None on failure.
    """
    today = datetime.utcnow()
    end_date = today - timedelta(days=2)
    start_date = end_date - timedelta(days=90)
    
    start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')

    url = (f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}"
           f"&start_date={start_date_str}&end_date={end_date_str}&daily=precipitation_sum")
           
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            daily_precipitations = data['daily']['precipitation_sum']
            if not daily_precipitations:
                return 0.0
            
            total_precip = sum(d for d in daily_precipitations if d is not None)
            avg_daily_precip = total_precip / len(daily_precipitations)
            avg_monthly_precip = avg_daily_precip * 30

            return round(avg_monthly_precip, 2)
        
        except (httpx.HTTPStatusError, KeyError, IndexError) as e:
            print(f"Open-Meteo Historical API failed: {e}. Cannot fetch rainfall data.")
            return None

async def get_soil_data(lat: float, lon: float) -> dict | None:
    """Fetches live soil data from SoilGrids API."""
    url = f"https://rest.isric.org/soilgrids/v2.0/properties/query?lon={lon}&lat={lat}&property=nitrogen&property=phh2o&depth=0-5cm&value=mean"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            layers = data['properties']['layers']
            ph_mean = layers[0]['depths'][0]['values'].get('mean')
            n_mean = layers[1]['depths'][0]['values'].get('mean')

            # The API returns pH*10 and Nitrogen in cg/kg. We convert them.
            ph = round(ph_mean / 10.0, 2) if ph_mean is not None else 6.5 # Default pH
            n = round(n_mean / 100.0, 2) if n_mean is not None else 90.0  # Default N
            
            return {"ph": ph, "N": n}
        
        except (httpx.HTTPStatusError, KeyError, IndexError) as e:
            print(f"SoilGrids API request failed: {e}")
            return None

def get_state_from_coords(lat: float, lon: float) -> str | None:
    """Uses reverse geocoding to find the state from lat/lon."""
    try:
        geolocator = Nominatim(user_agent="krishi_mitra_app")
        location = geolocator.reverse((lat, lon), exactly_one=True, language='en')
        return location.raw.get('address', {}).get('state')
    except Exception as e:
        print(f"Geocoding failed: {e}")
        return None

# --- Part 7: Main API Endpoint ---
@app.post("/recommend-by-location")
async def recommend_by_location(location: LocationInput):
    """
    Main endpoint that takes GPS coordinates, fetches live data from multiple sources,
    predicts a crop using regional filtering, and returns AI-generated advice.
    """
    # 1. Get the state name first (this is a synchronous call)
    state = get_state_from_coords(location.latitude, location.longitude)
    if not state:
        raise HTTPException(status_code=503, detail="Could not determine the state for the given coordinates.")
        
    # 2. Fetch all live environmental data concurrently
    weather_task = get_weather_data(location.latitude, location.longitude, WEATHERAPI_KEY)
    soil_task = get_soil_data(location.latitude, location.longitude)
    rainfall_task = get_monthly_rainfall(location.latitude, location.longitude)
    
    results = await asyncio.gather(weather_task, soil_task, rainfall_task)
    weather_data, soil_data, monthly_rainfall = results
    
    if not weather_data or not soil_data or monthly_rainfall is None:
        raise HTTPException(status_code=503, detail="Could not retrieve live environmental data from one or more external services.")

    # 3. Prepare the input data for the model in the correct order
    input_data = np.array([[
        soil_data['N'],
        weather_data['temperature'], 
        weather_data['humidity'],
        soil_data['ph'], 
        monthly_rainfall # Using the more accurate historical average rainfall
    ]])

    # 4. The Smart Prediction Loop with Regional Filtering
    probabilities = model.predict_proba(input_data)[0]
    all_crops = model.classes_
    sorted_predictions = sorted(zip(all_crops, probabilities), key=lambda x: x[1], reverse=True)
    
    suitable_crops_for_state = STATE_CROPS.get(state, list(all_crops))
    
    final_crop_name = None
    for crop, prob in sorted_predictions:
        if crop in suitable_crops_for_state:
            final_crop_name = crop
            break # Found the best, regionally-appropriate crop

    if not final_crop_name:
        final_crop_name = sorted_predictions[0][0] # Fallback to the top scientific prediction

    # 5. Generate advice using the Gemini API
    prompt = f"""You are 'Krishi Mitra,' a helpful AI assistant for farmers in {state}, India.
    Based on live weather and regional soil data, the model recommends planting '{final_crop_name}'.
    Provide a short (2-3 sentences), simple paragraph of advice for this farmer about this crop. Mention why it's a good choice for the current conditions."""
    
    response = gemini_model.generate_content(prompt)

    # 6. Return the final, structured response
    return {
        'crop_recommendation': final_crop_name,
        'advice': response.text,
        'live_data_used': {**weather_data, **soil_data, 'rainfall_mm_monthly_avg': monthly_rainfall},
        'location_info': {'state': state}
    }

@app.get("/")
def read_root():
    return {"message": "Welcome to the Krishi Mitra AI API (Live & Regional)"}