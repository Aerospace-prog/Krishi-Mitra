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
from fastapi.middleware.cors import CORSMiddleware

# --- Part 2: Initial Configuration ---
load_dotenv()
app = FastAPI()

# Enable CORS for frontend (Vite dev server and common localhost origins)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost",
    "http://127.0.0.1",
    # Expo dev server (Android Emulator/Device tunneled host)
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # Allow localhost, 127.0.0.1, any IPv4 LAN IP, and *.expo.dev
    allow_origin_regex=r"^https?://((.*\\.expo\\.dev)|(localhost|127\\.0\\.0\\.1)(:\\d+)?|((?:\\d{1,3}\\.){3}\\d{1,3})(:\\d+)?)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Part 3: The State-Crop Database ---
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
    # ADDED TIMEOUT: Changed to 10.0 seconds
    async with httpx.AsyncClient(timeout=10.0) as client:
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
        except httpx.RequestError as e:
            # Catch Timeouts and other request errors specifically
            print(f"WeatherAPI.com request failed with a connection/read error: {e}")
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
            
    # Timeout is already set to 20.0 seconds here
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
        except httpx.RequestError as e:
            # Catch Timeouts and other request errors specifically
            print(f"Open-Meteo Historical API failed with a connection/read error: {e}")
            return None

async def get_soil_data(lat: float, lon: float) -> dict:
    """
    Fetches live soil data from SoilGrids API. 
    Returns a dictionary with default values if the API request fails.
    """
    DEFAULT_PH = 6.5
    DEFAULT_N = 90.0 # kg/ha
    DEFAULT_SOIL_DATA = {"ph": DEFAULT_PH, "N": DEFAULT_N}
    
    url = f"https://rest.isric.org/soilgrids/v2.0/properties/query?lon={lon}&lat={lat}&property=nitrogen&property=phh2o&depth=0-5cm&value=mean"
    
    # ADDED TIMEOUT: Set to 20.0 seconds
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            layers = data['properties']['layers']
            ph_mean = layers[0]['depths'][0]['values'].get('mean')
            n_mean = layers[1]['depths'][0]['values'].get('mean')

            # The API returns pH*10 and Nitrogen in cg/kg. We convert them.
            ph = round(ph_mean / 10.0, 2) if ph_mean is not None else DEFAULT_PH
            n = round(n_mean / 100.0, 2) if n_mean is not None else DEFAULT_N
            
            return {"ph": ph, "N": n}
        
        except (httpx.HTTPStatusError, KeyError, IndexError) as e:
            # Handle any API failure (HTTP error, JSON structure error, etc.) by returning defaults
            print(f"SoilGrids API request failed: {e}. Using default soil data: pH={DEFAULT_PH}, N={DEFAULT_N}.")
            return DEFAULT_SOIL_DATA 
        except httpx.RequestError as e:
            # Handle Timeouts and other request errors specifically
            print(f"SoilGrids API request failed with a connection/read error: {e}. Using default soil data: pH={DEFAULT_PH}, N={DEFAULT_N}.")
            return DEFAULT_SOIL_DATA

def get_state_from_coords(lat: float, lon: float) -> str | None:
    """Uses reverse geocoding to find the state from lat/lon."""
    try:
        # Geopy Nominatim uses a different approach, a small timeout is often fine.
        geolocator = Nominatim(user_agent="krishi_mitra_app", timeout=10) 
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
    
    # We check weather_data and monthly_rainfall because they don't have mandatory fallbacks to a dict/float.
    if not weather_data or monthly_rainfall is None:
        raise HTTPException(status_code=503, detail="Could not retrieve live environmental data (weather or rainfall) from external services.")

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

# Backward/compatibility alias
@app.post("/recommend")
async def recommend(location: LocationInput):
    return await recommend_by_location(location)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Krishi Mitra AI API (Live & Regional)"}

# --- Part 8: Health and Versioned Endpoints ---
@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/v1/recommendations/location")
async def v1_recommendations_location(location: LocationInput):
    return await recommend_by_location(location)