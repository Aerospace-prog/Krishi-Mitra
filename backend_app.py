# backend_app.py

# --- Part 1: Imports ---
import os
import asyncio
import httpx
import joblib
import numpy as np
import pandas as pd
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from geopy.geocoders import Nominatim
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import uuid

# --- Part 2: Initial Configuration ---
load_dotenv()
app = FastAPI()

# Enhanced CORS for cross-platform support (Web, Mobile, Development)
origins = [
    # Web development servers
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",  # Added for React dev server
    "http://127.0.0.1:3000",
    "http://localhost",
    "http://127.0.0.1",
    "*",  # Allow all origins for testing (remove in production)
    # Expo development servers
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:19000",
    "http://127.0.0.1:19000",
    "http://localhost:19006",
    "http://127.0.0.1:19006",
    # Production domains 
    # "https://your-web-app.com",
    # "https://your-mobile-app.expo.dev",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive for testing
    # Enhanced regex for Expo tunneling, LAN IPs, and development environments
    allow_origin_regex=r"^https?://((.*\\.expo\\.dev)|(.*\\.ngrok\\.io)|(localhost|127\\.0\\.0\\.1)(:\\d+)?|((?:192\\.168|10\\.0|172\\.(?:1[6-9]|2[0-9]|3[01]))\\.(?:\\d{1,3}\\.){1}\\d{1,3})(:\\d+)?)$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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


# --- Part 4: Pydantic Models for Cross-Platform API ---
class LocationInput(BaseModel):
    latitude: float
    longitude: float

class RecommendationResponse(BaseModel):
    crop_recommendation: str
    advice: str
    live_data_used: dict
    location_info: dict
    confidence_score: float = 0.0
    alternative_crops: list = []

class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    services: dict

class ErrorResponse(BaseModel):
    error: str
    message: str
    code: int

# --- Part 5: Load Assets (ML Model & API Keys) ---
model_path = os.path.join('model', 'crop_recommender.joblib')
model = joblib.load(model_path)

# Load yield prediction model
try:
    from scripts.yield_predictor_real import RealYieldPredictor
    yield_predictor = RealYieldPredictor()
    print("Yield prediction model loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load yield prediction model: {e}")
    yield_predictor = None

# Load disease detection service
try:
    from scripts.disease_detection_service import get_disease_detection_service
    disease_service = get_disease_detection_service()
    print("Disease detection service loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load disease detection service: {e}")
    disease_service = None

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHERAPI_KEY = os.getenv("WEATHERAPI_KEY")
TESTING_MODE = os.getenv("TESTING_MODE")

if not WEATHERAPI_KEY:
    raise ValueError("WeatherAPI key is missing. Please set WEATHERAPI_KEY in your .env file.")

# Only require Gemini API key if not in testing mode
if not TESTING_MODE and not GEMINI_API_KEY:
    raise ValueError("Gemini API key is missing. Please set GEMINI_API_KEY in your .env file or enable TESTING_MODE=true.")

# Only configure Gemini if not in testing mode
gemini_model = None
if not TESTING_MODE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')

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

async def get_comprehensive_weather_data(lat: float, lon: float, api_key: str) -> dict | None:
    """Fetches comprehensive weather data from WeatherAPI.com for frontend display."""
    url = f"http://api.weatherapi.com/v1/forecast.json?key={api_key}&q={lat},{lon}&days=7"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            # Extract current weather
            current = data['current']
            location = data['location']
            forecast = data['forecast']['forecastday']
            
            return {
                "current": {
                    "temp_c": current['temp_c'],
                    "temp_f": current['temp_f'],
                    "humidity": current['humidity'],
                    "condition": current['condition']['text'],
                    "condition_icon": current['condition']['icon'],
                    "wind_kph": current['wind_kph'],
                    "wind_mph": current['wind_mph'],
                    "pressure_mb": current['pressure_mb'],
                    "feelslike_c": current['feelslike_c'],
                    "uv": current['uv'],
                    "visibility_km": current['vis_km']
                },
                "location": {
                    "name": location['name'],
                    "region": location['region'],
                    "country": location['country'],
                    "lat": location['lat'],
                    "lon": location['lon']
                },
                "forecast": [
                    {
                        "date": day['date'],
                        "day": {
                            "maxtemp_c": day['day']['maxtemp_c'],
                            "mintemp_c": day['day']['mintemp_c'],
                            "condition": day['day']['condition']['text'],
                            "condition_icon": day['day']['condition']['icon']
                        }
                    } for day in forecast[:7]  # Next 7 days
                ]
            }
        except httpx.HTTPStatusError as e:
            print(f"WeatherAPI.com comprehensive request failed: {e}")
            return None
        except httpx.RequestError as e:
            print(f"WeatherAPI.com comprehensive request failed with connection error: {e}")
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

# --- Agmarknet price integration (data.gov.in) ---
AGMARKNET_API_KEY = os.getenv("AGMARKNET_API_KEY")
AGMARKNET_RESOURCE_ID = os.getenv("AGMARKNET_RESOURCE_ID")  # e.g. commodity prices dataset resource id
AGMARKNET_DEBUG = os.getenv("AGMARKNET_DEBUG", "true").lower() == "true"

async def get_agmarknet_price_per_quintal(crop_name: str, state: str | None) -> float | None:
    """
    Fetch latest modal price (Rs/quintal) for a crop from the Agmarknet dataset on data.gov.in.

    Handles common field-name variations automatically.
    """
    # Expanded mock prices for crops not available in AgMarkNet
    mock_prices = {
        "rice": 2800.0,
        "wheat": 2600.0,
        "maize": 2200.0,
        "cotton": 6500.0,
        "chickpea": 5000.0,
        "coffee": 8500.0,
        "jute": 4200.0,
        "banana": 1800.0,
        "mango": 3500.0,
        "orange": 2500.0,
        "apple": 4500.0,
        "grapes": 6000.0,
        "pomegranate": 7500.0,
        "coconut": 2200.0,
        "papaya": 1500.0,
        "lentil": 6500.0,
        "pigeonpeas": 5800.0,
        "blackgram": 7200.0,
        "mungbean": 6800.0,
        "mothbeans": 4500.0,
    }
    
    # AgMarkNet-specific crop name mappings (based on actual AgMarkNet commodity names)
    agmarknet_crop_mappings = {
        "coffee": "Coffee",
        "pigeonpeas": "Pegeon Pea (Arhar Fall)",
        "chickpea": "Gram",
        "lentil": "Masoor",
        "blackgram": "Urad",
        "mungbean": "Moong(Green Gram)",
    }
    
    # Fallback to mock if configuration missing
    if not AGMARKNET_API_KEY or not AGMARKNET_RESOURCE_ID:
        return mock_prices.get(crop_name.lower())

    base_url = f"https://api.data.gov.in/resource/{AGMARKNET_RESOURCE_ID}"

    def normalize_name(text: str | None) -> str | None:
        if not text:
            return text
        s = str(text).strip()
        # Agmarknet often uses Title Case
        return s.title()

    # Apply AgMarkNet-specific crop name mapping
    mapped_crop_name = agmarknet_crop_mappings.get(crop_name.lower(), crop_name)
    crop_norm = normalize_name(mapped_crop_name)
    state_norm = normalize_name(state) if state else None

    params = {
        "api-key": AGMARKNET_API_KEY,
        "format": "json",
        "limit": 50,
    }

    # Use primary field names based on actual AgMarkNet API structure
    # Only use the primary field names to avoid filter conflicts
    params[f"filters[Commodity]"] = crop_norm
    if state_norm:
        params[f"filters[State]"] = state_norm
    
    # Keep field lists for record processing
    commodity_fields = ["Commodity", "commodity", "commodity_name", "variety"]
    state_fields = ["State", "state", "state_name"]

    if AGMARKNET_DEBUG:
        print(f"Agmarknet request for {crop_name}:", base_url, params)

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(base_url, params=params)
            if AGMARKNET_DEBUG:
                print("Agmarknet status:", resp.status_code)
            resp.raise_for_status()
            data = resp.json()
            records = data.get("records") or []
            if AGMARKNET_DEBUG:
                print(f"Agmarknet records fetched: {len(records)}")
                if len(records) > 0:
                    print("Agmarknet sample record keys:", list(records[0].keys()))
            if not records:
                return None

            def to_float(x):
                try:
                    # Some fields have commas or spaces; strip them
                    return float(str(x).replace(",", "").strip())
                except Exception:
                    return None

            # Price field variants (based on actual dataset structure)
            modal_keys = ["Modal_Price", "modal_price", "modal", "modal_pric", "modalprice"]
            min_keys = ["Min_Price", "min_price", "min", "minprice"]
            max_keys = ["Max_Price", "max_price", "max", "maxprice"]

            modal_prices: list[float] = []
            derived_prices: list[float] = []

            for rec in records:
                # Skip non-matching commodity/state if filters are ignored by dataset
                rec_comm = None
                for k in commodity_fields:
                    if k in rec and rec[k]:
                        rec_comm = str(rec[k]).strip()
                        break
                if rec_comm and crop_norm and rec_comm.title() != crop_norm:
                    continue
                if state_norm:
                    rec_state = None
                    for k in state_fields:
                        if k in rec and rec[k]:
                            rec_state = str(rec[k]).strip()
                            break
                    if rec_state and rec_state.title() != state_norm:
                        continue

                mp = None
                for k in modal_keys:
                    if k in rec and rec[k] not in (None, "", "NA"):
                        mp = to_float(rec[k])
                        break
                mn = None
                for k in min_keys:
                    if k in rec and rec[k] not in (None, "", "NA"):
                        mn = to_float(rec[k])
                        break
                mx = None
                for k in max_keys:
                    if k in rec and rec[k] not in (None, "", "NA"):
                        mx = to_float(rec[k])
                        break

                if mp is not None and mp > 0:
                    modal_prices.append(mp)
                elif mn is not None and mx is not None and mn > 0 and mx > 0:
                    derived_prices.append((mn + mx) / 2.0)

            chosen = None
            if modal_prices:
                modal_prices.sort()
                n = len(modal_prices)
                mid = n // 2
                chosen = modal_prices[mid] if n % 2 == 1 else (modal_prices[mid - 1] + modal_prices[mid]) / 2.0
            elif derived_prices:
                chosen = sum(derived_prices) / len(derived_prices)

            if AGMARKNET_DEBUG:
                print("Agmarknet chosen price:", chosen)
            
            # If AgMarkNet didn't return a price, fall back to mock prices
            if chosen is None:
                fallback_price = mock_prices.get(crop_name.lower())
                if AGMARKNET_DEBUG:
                    print(f"Using fallback price for {crop_name}: ₹{fallback_price}")
                return fallback_price
            
            return round(chosen, 2)
        except httpx.HTTPStatusError as e:
            error_msg = f"Agmarknet HTTP error {e.response.status_code if hasattr(e, 'response') else 'unknown'}: {str(e)}"
            print(error_msg)
            fallback_price = mock_prices.get(crop_name.lower())
            if AGMARKNET_DEBUG:
                print(f"Using fallback price due to HTTP error for {crop_name}: ₹{fallback_price}")
            return fallback_price
        except httpx.TimeoutException as e:
            error_msg = f"Agmarknet timeout error: Request took longer than 20 seconds"
            print(error_msg)
            fallback_price = mock_prices.get(crop_name.lower())
            if AGMARKNET_DEBUG:
                print(f"Using fallback price due to timeout for {crop_name}: ₹{fallback_price}")
            return fallback_price
        except httpx.RequestError as e:
            error_msg = f"Agmarknet connection error: {type(e).__name__} - {str(e)}"
            print(error_msg)
            fallback_price = mock_prices.get(crop_name.lower())
            if AGMARKNET_DEBUG:
                print(f"Using fallback price due to connection error for {crop_name}: ₹{fallback_price}")
            return fallback_price
        except Exception as e:
            error_msg = f"Agmarknet unexpected error: {type(e).__name__} - {str(e)}"
            print(error_msg)
            fallback_price = mock_prices.get(crop_name.lower())
            if AGMARKNET_DEBUG:
                print(f"Using fallback price due to unexpected error for {crop_name}: ₹{fallback_price}")
            return fallback_price

from fastapi import Query

@app.get("/debug/agmarknet")
async def debug_agmarknet(commodity: str = Query(...), state: str | None = Query(None), raw: bool = Query(False)):
    """Debug helper to inspect Agmarknet response and parsing."""
    # Prepare env status
    env_status = {
        "AGMARKNET_API_KEY_set": bool(os.getenv("AGMARKNET_API_KEY")),
        "AGMARKNET_RESOURCE_ID": os.getenv("AGMARKNET_RESOURCE_ID"),
        "AGMARKNET_DEBUG": os.getenv("AGMARKNET_DEBUG"),
    }

    # Reuse normalization and params
    def normalize_name(text: str | None) -> str | None:
        if not text:
            return text
        s = str(text).strip()
        return s.title()

    crop_norm = normalize_name(commodity)
    state_norm = normalize_name(state) if state else None

    if not AGMARKNET_API_KEY or not AGMARKNET_RESOURCE_ID:
        return {
            "error": "Missing AGMARKNET_API_KEY or AGMARKNET_RESOURCE_ID",
            "env": env_status,
            "normalized": {"commodity": crop_norm, "state": state_norm},
            "hint": "Set .env values and restart backend."
        }

    base_url = f"https://api.data.gov.in/resource/{AGMARKNET_RESOURCE_ID}"
    
    # Define field names for later use (based on actual dataset structure)
    commodity_fields = ["Commodity", "commodity", "commodity_name", "variety"]
    state_fields = ["State", "state", "state_name"]
    
    # If raw=true, get unfiltered data to see actual field names and values
    if raw:
        params = {
            "api-key": AGMARKNET_API_KEY,
            "format": "json",
            "limit": 20,
        }
    else:
        params = {
            "api-key": AGMARKNET_API_KEY,
            "format": "json",
            "limit": 100,
        }
        # Use primary field names only to avoid filter conflicts
        params[f"filters[Commodity]"] = crop_norm
        if state_norm:
            params[f"filters[State]"] = state_norm

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            resp = await client.get(base_url, params=params)
            status = resp.status_code
            
            # Get response text for debugging
            response_text = await resp.atext() if hasattr(resp, 'atext') else resp.text
            
            if status != 200:
                return {
                    "error": f"HTTP {status}: {response_text[:500]}",
                    "request": {"url": base_url, "params": params, "status": status},
                    "env": env_status
                }
            
            try:
                payload = resp.json()
            except Exception as json_error:
                return {
                    "error": f"JSON parsing failed: {str(json_error)}. Response: {response_text[:200]}",
                    "request": {"url": base_url, "params": params, "status": status},
                    "env": env_status
                }
            
            records = (payload or {}).get("records") or []

            def to_float(x):
                try:
                    return float(str(x).replace(",", "").strip())
                except Exception:
                    return None

            modal_keys = ["modal_price", "modal", "modal_pric", "modalprice"]
            min_keys = ["min_price", "min", "minprice"]
            max_keys = ["max_price", "max", "maxprice"]

            modal_prices = []
            derived_prices = []
            for rec in records:
                # ensure matching
                rec_comm = None
                for k in commodity_fields:
                    if k in rec and rec[k]:
                        rec_comm = str(rec[k]).strip()
                        break
                if rec_comm and crop_norm and rec_comm.title() != crop_norm:
                    continue
                if state_norm:
                    rec_state = None
                    for k in state_fields:
                        if k in rec and rec[k]:
                            rec_state = str(rec[k]).strip()
                            break
                    if rec_state and rec_state.title() != state_norm:
                        continue

                mp = None
                for k in modal_keys:
                    if k in rec and rec[k] not in (None, "", "NA"):
                        mp = to_float(rec[k])
                        break
                mn = None
                for k in min_keys:
                    if k in rec and rec[k] not in (None, "", "NA"):
                        mn = to_float(rec[k])
                        break
                mx = None
                for k in max_keys:
                    if k in rec and rec[k] not in (None, "", "NA"):
                        mx = to_float(rec[k])
                        break

                if mp is not None and mp > 0:
                    modal_prices.append(mp)
                elif mn is not None and mx is not None and mn > 0 and mx > 0:
                    derived_prices.append((mn + mx) / 2.0)

            chosen = None
            if modal_prices:
                modal_prices.sort()
                n = len(modal_prices)
                mid = n // 2
                chosen = modal_prices[mid] if n % 2 == 1 else (modal_prices[mid - 1] + modal_prices[mid]) / 2.0
            elif derived_prices:
                chosen = sum(derived_prices) / len(derived_prices)

            result = {
                "request": {"url": base_url, "params": params, "status": status},
                "env": env_status,
                "normalized": {"commodity": crop_norm, "state": state_norm},
                "records_count": len(records),
                "sample_record_keys": list(records[0].keys()) if records else [],
                "modal_prices": modal_prices[:20],
                "derived_prices": [round(x, 2) for x in derived_prices[:20]],
                "chosen_price": round(chosen, 2) if chosen is not None else None,
            }
            
            # If raw=true, also show sample records to see actual field values
            if raw and records:
                result["sample_records"] = records[:5]
                # Show unique values for common fields
                commodity_values = set()
                state_values = set()
                for rec in records[:50]:  # Check first 50 records
                    for field in ["commodity", "commodity_name", "variety"]:
                        if field in rec and rec[field]:
                            commodity_values.add(str(rec[field]).strip())
                    for field in ["state", "state_name"]:
                        if field in rec and rec[field]:
                            state_values.add(str(rec[field]).strip())
                result["unique_commodity_values"] = sorted(list(commodity_values))[:20]
                result["unique_state_values"] = sorted(list(state_values))[:20]
            
            return result
        except Exception as e:
            return {"error": str(e), "request": {"url": base_url, "params": params}, "env": env_status}

def estimate_yield_quintal_per_acre(crop_name: str, weather: dict, soil: dict, state: str = None, season: str = "Kharif     ") -> float:
    """Advanced yield estimator using real data model."""
    if yield_predictor is None:
        # Fallback to simple heuristic if yield predictor not available
        base = {
            "rice": 20.0,
            "wheat": 18.0,
            "maize": 15.0,
            "cotton": 8.0,
            "chickpea": 10.0,
        }.get(crop_name.lower(), 12.0)
        ph_penalty = 0.0 if 6.0 <= soil.get("ph", 6.5) <= 7.5 else -2.0
        humidity_bonus = 1.0 if 50 <= weather.get("humidity", 60) <= 80 else 0.0
        return max(0.0, round(base + ph_penalty + humidity_bonus, 1))
    
    try:
        # Map crop names from recommendation model to yield model format
        crop_name_mapping = {
            "rice": "Rice",
            "wheat": "Wheat", 
            "maize": "Maize",
            "cotton": "Cotton(lint)",
            "chickpea": "Gram",
            "kidneybeans": "Cowpea(Lobia)",
            "pigeonpeas": "Arhar/Tur",
            "mothbeans": "Moth",
            "mungbean": "Moong(Green Gram)",
            "blackgram": "Urad",
            "lentil": "Masoor",
            "pomegranate": "Pomegranate",  # Not in yield model, will fallback
            "banana": "Banana",
            "mango": "Mango",  # Not in yield model, will fallback
            "grapes": "Grapes",  # Not in yield model, will fallback
            "watermelon": "Watermelon",  # Not in yield model, will fallback
            "muskmelon": "Muskmelon",  # Not in yield model, will fallback
            "apple": "Apple",  # Not in yield model, will fallback
            "orange": "Orange",  # Not in yield model, will fallback
            "papaya": "Papaya",  # Not in yield model, will fallback
            "coconut": "Coconut ",
            "jute": "Jute",
            "coffee": "Coffee",  # Not in yield model, will fallback
        }
        
        # Get the mapped crop name, fallback to original if not found
        mapped_crop_name = crop_name_mapping.get(crop_name.lower(), crop_name.title())
        
        # Use real yield predictor
        # Estimate area, fertilizer, and pesticide based on typical values
        area_hectares = 1.0  # 1 hectare = 2.47 acres
        fertilizer = soil.get("N", 60) * 10  # Convert kg/ha to total amount
        pesticide = 1000  # Typical pesticide amount
        
        # Get rainfall from weather data (convert from monthly to annual estimate)
        rainfall = weather.get("rainfall_mm_monthly_avg", 200) * 12  # Annual estimate
        
        result = yield_predictor.predict_yield(
            crop_name=mapped_crop_name,
            state=state or "Assam",  # Default state
            season=season,
            area=area_hectares,
            annual_rainfall=rainfall,
            fertilizer=fertilizer,
            pesticide=pesticide
        )
        
        if 'error' not in result:
            return result['predicted_yield_quintal_per_acre']
        else:
            # Fallback if crop not found in yield model
            print(f"Yield prediction error for {crop_name} (mapped to {mapped_crop_name}): {result['error']}")
            # Use fallback heuristic for unmapped crops
            base = {
                "rice": 20.0,
                "wheat": 18.0,
                "maize": 15.0,
                "cotton": 8.0,
                "chickpea": 10.0,
            }.get(crop_name.lower(), 12.0)
            ph_penalty = 0.0 if 6.0 <= soil.get("ph", 6.5) <= 7.5 else -2.0
            humidity_bonus = 1.0 if 50 <= weather.get("humidity", 60) <= 80 else 0.0
            return max(0.0, round(base + ph_penalty + humidity_bonus, 1))
            
    except Exception as e:
        print(f"Error in yield prediction: {e}")
        # Use fallback heuristic
        base = {
            "rice": 20.0,
            "wheat": 18.0,
            "maize": 15.0,
            "cotton": 8.0,
            "chickpea": 10.0,
        }.get(crop_name.lower(), 12.0)
        ph_penalty = 0.0 if 6.0 <= soil.get("ph", 6.5) <= 7.5 else -2.0
        humidity_bonus = 1.0 if 50 <= weather.get("humidity", 60) <= 80 else 0.0
        return max(0.0, round(base + ph_penalty + humidity_bonus, 1))

# --- Optional: Reverse geocoding ---
def get_location_details_from_coords(lat: float, lon: float) -> dict | None:
    """Uses reverse geocoding to find location details (state, district, city) from lat/lon."""
    try:
        geolocator = Nominatim(user_agent="krishi_mitra_app", timeout=10) 
        location = geolocator.reverse((lat, lon), exactly_one=True, language='en')
        address = location.raw.get('address', {})
        
        # --- DEBUGGING: Print the full address dictionary from the geocoding service ---
        print("\n--- Geocoding Service Response ---")
        import json
        print(json.dumps(address, indent=2))
        print("------------------------------------\n")
        
        # Extract relevant details, providing fallbacks
        state = address.get('state')
        # District can be under 'county' or 'state_district' depending on the location
        district = address.get('county') or address.get('state_district')
        city = address.get('city') or address.get('town') or address.get('village')

        if not state: # State is the most critical part for regional filtering
            return None

        return {
            "state": state,
            "district": district,
            "city": city
        }
    except Exception as e:
        print(f"Geocoding failed: {e}")
        return None

# --- Part 7: Main API Endpoint ---
@app.post("/recommend-by-location")
async def recommend_by_location(location: LocationInput):
    """
    Main endpoint that takes GPS coordinates, fetches live data from multiple sources,
    predicts up to 3 crops using regional filtering, and returns AI-generated advice for them.
    """
    # 1. Get location details first (this is a synchronous call)
    location_details = get_location_details_from_coords(location.latitude, location.longitude)
    if not location_details or not location_details.get('state'):
        raise HTTPException(status_code=503, detail="Could not determine the state for the given coordinates.")
    
    state = location_details['state']
        
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
    # Create DataFrame with proper feature names to avoid sklearn warning
    feature_names = ['N', 'temperature', 'humidity', 'ph', 'rainfall']
    input_data = pd.DataFrame([[
        soil_data['N'],
        weather_data['temperature'], 
        weather_data['humidity'],
        soil_data['ph'], 
        monthly_rainfall # Using the more accurate historical average rainfall
    ]], columns=feature_names)

    # 4. Enhanced Smart Prediction with Confidence Scores and Alternatives
    probabilities = model.predict_proba(input_data)[0]
    all_crops = model.classes_
    sorted_predictions = sorted(zip(all_crops, probabilities), key=lambda x: x[1], reverse=True)
    
    suitable_crops_for_state = STATE_CROPS.get(state, list(all_crops))
    
    final_crop_names = []
    for crop, _ in sorted_predictions:
        if crop in suitable_crops_for_state and crop not in final_crop_names:
            final_crop_names.append(crop)
            

        for crop, _ in sorted_predictions:
            if len(final_crop_names) >= 3:
                break
            if crop not in final_crop_names:
                final_crop_names.append(crop)

    # Ensure we only have a maximum of 3 recommendations
    final_crop_names = final_crop_names[:3]

    if not final_crop_names:
        raise HTTPException(status_code=500, detail="Could not generate any crop recommendations.")

    # 5. Generate advice for the top crops using the Gemini API
    crop_list_str = ", ".join(final_crop_names)

    location_str = state
    if location_details.get('district'):
        location_str = f"{location_details['district']}, {state}"
    elif location_details.get('city'):
        location_str = f"{location_details['city']}, {state}"

    # 5. Generate advice using the Gemini API (with fallback for testing mode)
    if TESTING_MODE or not gemini_model:
        # Use fallback advice in testing mode or when Gemini is not available
        advice_text = (
            f"Based on current environmental conditions in {location_str}, we recommend growing {crop_list_str}. "
            f"These crops are well-suited for the current temperature ({weather_data['temperature']}°C), "
            f"humidity ({weather_data['humidity']}%), and soil conditions in your region."
        )
    else:
        prompt = f"""You are 'Krishi Mitra,' a helpful AI assistant for farmers in {location_str}, India.
        Based on live weather and regional soil data, the model recommends planting '{crop_list_str}'.
        Provide a short (2-3 sentences), simple paragraph of advice for this farmer about this crop. Mention why it's a good choice for the current conditions."""
        try:
            response = gemini_model.generate_content(prompt)
            advice_text = response.text
        except Exception as e:
            print(f"Gemini generation failed: {e}")
            advice_text = (
                f"Recommended crops: {crop_list_str}. Conditions in {location_str} currently favor these crops based on temperature, humidity, soil pH and recent rainfall."
            )

    # Optional market price and yield/profit estimates for each crop
    market_prices: dict[str, float | None] = {}
    yield_estimates: dict[str, float] = {}
    profit_estimates: dict[str, float | None] = {}
    for crop in final_crop_names:
        market_prices[crop] = await get_agmarknet_price_per_quintal(crop, state)
        yield_estimates[crop] = estimate_yield_quintal_per_acre(crop, weather_data, soil_data, state)
        price = market_prices[crop]
        profit_estimates[crop] = round(price * yield_estimates[crop], 2) if price is not None else None

    # 6. Return the final, structured response
    return {
        'crop_recommendation': final_crop_names,
        'advice': advice_text,
        'live_data_used': {**weather_data, **soil_data, 'rainfall_mm_monthly_avg': monthly_rainfall},
        'location_info': location_details,
        'yield_quintal_per_acre': yield_estimates,
        'market_price_per_quintal_inr': market_prices,
        'profit_estimate_inr': profit_estimates,
    }

# Backward/compatibility alias
@app.post("/recommend")
async def recommend(location: LocationInput):
    return await recommend_by_location(location)

# --- Manual input endpoint ---
class ManualInput(BaseModel):
    N: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float
    state: str | None = None
    district: str | None = None
    city: str | None = None

# --- Yield prediction endpoint ---
class YieldPredictionInput(BaseModel):
    crop_name: str
    state: str
    season: str = "Kharif     "  # Default season with trailing spaces
    area: float  # in hectares
    annual_rainfall: float  # in mm
    fertilizer: float  # total fertilizer amount
    pesticide: float  # total pesticide amount
    crop_year: int = 2020

@app.post("/recommend-manual")
async def recommend_manual(payload: ManualInput):
    """Predict crops from manually entered parameters."""
    # Create DataFrame with proper feature names to avoid sklearn warning
    feature_names = ['N', 'temperature', 'humidity', 'ph', 'rainfall']
    input_data = pd.DataFrame([[
        payload.N,
        payload.temperature,
        payload.humidity,
        payload.ph,
        payload.rainfall,
    ]], columns=feature_names)

    probabilities = model.predict_proba(input_data)[0]
    all_crops = model.classes_
    sorted_predictions = sorted(zip(all_crops, probabilities), key=lambda x: x[1], reverse=True)

    # If state provided, filter; else no filtering
    state = payload.state
    suitable_crops_for_state = STATE_CROPS.get(state, list(all_crops)) if state else list(all_crops)

    final_crop_names = []
    for crop, _ in sorted_predictions:
        if crop in suitable_crops_for_state and crop not in final_crop_names:
            final_crop_names.append(crop)
        if len(final_crop_names) >= 3:
            break

    if not final_crop_names:
        raise HTTPException(status_code=500, detail="Could not generate any crop recommendations.")

    crop_list_str = ", ".join(final_crop_names)
    location_str = payload.state or "your area"

    if TESTING_MODE or not gemini_model:
        # Use fallback advice in testing mode or when Gemini is not available
        advice_text = (
            f"Based on your provided parameters, we recommend growing {crop_list_str}. "
            f"These crops are well-suited for temperature {payload.temperature}°C, "
            f"humidity {payload.humidity}%, pH {payload.ph}, and rainfall {payload.rainfall}mm."
        )
    else:
        prompt = f"""You are 'Krishi Mitra,' a helpful AI assistant for farmers in {location_str}, India.
        Based on provided soil and weather parameters, the model recommends '{crop_list_str}'.
        Provide a short (2-3 sentences) advice tailored to these inputs."""
        try:
            response = gemini_model.generate_content(prompt)
            advice_text = response.text
        except Exception:
            advice_text = (
                f"Recommended crops: {crop_list_str}. These match your entered temperature, humidity, pH and rainfall conditions."
            )

    weather_data = {"temperature": payload.temperature, "humidity": payload.humidity}
    soil_data = {"N": payload.N, "ph": payload.ph}

    market_prices: dict[str, float | None] = {}
    yield_estimates: dict[str, float] = {}
    profit_estimates: dict[str, float | None] = {}
    for crop in final_crop_names:
        market_prices[crop] = await get_agmarknet_price_per_quintal(crop, payload.state)
        yield_estimates[crop] = estimate_yield_quintal_per_acre(crop, weather_data, soil_data, payload.state)
        price = market_prices[crop]
        profit_estimates[crop] = round(price * yield_estimates[crop], 2) if price is not None else None

    return {
        'crop_recommendation': final_crop_names,
        'advice': advice_text,
        'live_data_used': {**weather_data, **soil_data, 'rainfall_mm_monthly_avg': payload.rainfall},
        'location_info': {'state': payload.state, 'district': payload.district, 'city': payload.city},
        'yield_quintal_per_acre': yield_estimates,
        'market_price_per_quintal_inr': market_prices,
        'profit_estimate_inr': profit_estimates,
    }

@app.post("/predict-yield")
async def predict_yield(payload: YieldPredictionInput):
    """Predict crop yield using the trained yield forecasting model."""
    if yield_predictor is None:
        raise HTTPException(status_code=503, detail="Yield prediction model not available.")
    
    try:
        result = yield_predictor.predict_yield(
            crop_name=payload.crop_name,
            state=payload.state,
            season=payload.season,
            area=payload.area,
            annual_rainfall=payload.annual_rainfall,
            fertilizer=payload.fertilizer,
            pesticide=payload.pesticide,
            crop_year=payload.crop_year
        )
        
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return {
            'crop_name': payload.crop_name,
            'state': payload.state,
            'season': payload.season.strip(),
            'predicted_yield_quintal_per_acre': result['predicted_yield_quintal_per_acre'],
            'confidence_lower': result['confidence_lower'],
            'confidence_upper': result['confidence_upper'],
            'confidence_range': result['confidence_range'],
            'fertilizer_per_hectare': result['fertilizer_per_hectare'],
            'pesticide_per_hectare': result['pesticide_per_hectare'],
            'input_parameters': {
                'area_hectares': payload.area,
                'annual_rainfall_mm': payload.annual_rainfall,
                'fertilizer_total': payload.fertilizer,
                'pesticide_total': payload.pesticide,
                'crop_year': payload.crop_year
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yield prediction failed: {str(e)}")

@app.get("/yield-model-info")
async def get_yield_model_info():
    """Get information about the yield prediction model."""
    if yield_predictor is None:
        raise HTTPException(status_code=503, detail="Yield prediction model not available.")
    
    try:
        model_info = yield_predictor.get_model_info()
        return model_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

# --- Crop history with MongoDB (pymongo) ---
try:
    from pymongo import MongoClient
    from bson import ObjectId
    from datetime import datetime as dt

    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB = os.getenv("MONGODB_DB", "krishi_mitra")
    MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "crop_history")

    _mongo_client = MongoClient(MONGODB_URI)
    _db = _mongo_client[MONGODB_DB]
    _crop_history = _db[MONGODB_COLLECTION]

    class CropHistoryInput(BaseModel):
        farm_id: str
        crop: str
        season: str | None = None
        yield_quintal_per_acre: float | None = None
        state: str | None = None
        district: str | None = None
        city: str | None = None

    @app.post("/crop-history")
    def add_crop_history(entry: CropHistoryInput):
        doc = {
            "farm_id": entry.farm_id,
            "crop": entry.crop,
            "season": entry.season or "unknown",
            "yield_quintal_per_acre": float(entry.yield_quintal_per_acre or 0.0),
            "state": entry.state or "",
            "district": entry.district or "",
            "city": entry.city or "",
            "created_at": dt.utcnow(),
        }
        res = _crop_history.insert_one(doc)
        return {"status": "ok", "id": str(res.inserted_id)}

    @app.get("/crop-history")
    def list_crop_history(farm_id: str):
        rows = list(_crop_history.find({"farm_id": farm_id}).sort("created_at", -1))
        def to_api(r):
            return {
                "id": str(r.get("_id")),
                "farm_id": r.get("farm_id"),
                "state": r.get("state"),
                "district": r.get("district"),
                "city": r.get("city"),
                "crop": r.get("crop"),
                "season": r.get("season"),
                "yield_quintal_per_acre": r.get("yield_quintal_per_acre"),
                "created_at": r.get("created_at").isoformat() if r.get("created_at") else None,
            }
        return [to_api(r) for r in rows]
except Exception as e:
    print(f"MongoDB not available or failed to initialize: {e}")

# --- Disease Detection Endpoints ---

class DiseaseDetectionResponse(BaseModel):
    success: bool
    predictions: list = []
    primary_prediction: Optional[dict] = None
    error: Optional[str] = None
    treatment_recommendations: Optional[dict] = None

@app.post("/detect-disease", response_model=DiseaseDetectionResponse)
async def detect_disease(file: UploadFile = File(...)):
    """
    Detect crop disease from uploaded image.
    
    Args:
        file: Uploaded image file (JPEG/PNG, max 10MB)
        
    Returns:
        Disease detection results with treatment recommendations
    """
    if disease_service is None:
        raise HTTPException(
            status_code=503, 
            detail="Disease detection service not available. Please check model configuration."
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image file (JPEG/PNG)."
        )
    
    # Validate file size (10MB limit)
    if hasattr(file, 'size') and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )
    
    temp_file_path = None
    try:
        # Read file content
        file_content = await file.read()
        
        # Save to temporary file
        temp_file_path = disease_service.save_uploaded_image(file_content, file.filename)
        
        # Perform disease detection
        detection_result = disease_service.detect_disease(temp_file_path, top_k=3)
        
        # Get treatment recommendations if disease detected
        treatment_recommendations = None
        if detection_result['success'] and detection_result['primary_prediction']:
            primary_prediction = detection_result['primary_prediction']
            if primary_prediction['disease'] != 'Healthy':
                treatment_recommendations = disease_service.get_treatment_recommendations(primary_prediction)
        
        # Prepare response
        response_data = {
            'success': detection_result['success'],
            'predictions': detection_result['predictions'],
            'primary_prediction': detection_result['primary_prediction'],
            'error': detection_result.get('error'),
            'treatment_recommendations': treatment_recommendations
        }
        
        return DiseaseDetectionResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Disease detection error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Disease detection failed: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file_path and disease_service:
            disease_service.cleanup_temp_file(temp_file_path)

@app.post("/detect-disease-with-ai-advice")
async def detect_disease_with_ai_advice(file: UploadFile = File(...)):
    """
    Detect crop disease and get AI-powered treatment advice using Gemini.
    
    Args:
        file: Uploaded image file (JPEG/PNG, max 10MB)
        
    Returns:
        Disease detection results with AI-generated treatment advice
    """
    if disease_service is None:
        raise HTTPException(
            status_code=503, 
            detail="Disease detection service not available. Please check model configuration."
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image file (JPEG/PNG)."
        )
    
    temp_file_path = None
    try:
        # Read file content
        file_content = await file.read()
        
        # Save to temporary file
        temp_file_path = disease_service.save_uploaded_image(file_content, file.filename)
        
        # Perform disease detection
        detection_result = disease_service.detect_disease(temp_file_path, top_k=3)
        
        # Get AI-powered advice if disease detected
        ai_advice = None
        treatment_recommendations = None
        
        if detection_result['success'] and detection_result['primary_prediction']:
            primary_prediction = detection_result['primary_prediction']
            
            # Get basic treatment recommendations
            if primary_prediction['disease'] != 'Healthy':
                treatment_recommendations = disease_service.get_treatment_recommendations(primary_prediction)
                
                # Generate AI advice using Gemini
                if not TESTING_MODE and gemini_model:
                    try:
                        prompt = f"""You are 'Krishi Mitra,' an expert agricultural AI assistant. 
                        A farmer has uploaded an image of their {primary_prediction['crop']} crop, and our AI model has detected {primary_prediction['disease']} with {primary_prediction['confidence']:.1%} confidence.
                        
                        Disease Details:
                        - Crop: {primary_prediction['crop']}
                        - Disease: {primary_prediction['disease']}
                        - Severity: {primary_prediction['severity']}
                        - Description: {primary_prediction['description']}
                        
                        Please provide:
                        1. A brief explanation of this disease in simple terms
                        2. Immediate action steps the farmer should take
                        3. Prevention measures for the future
                        4. When to seek professional help
                        
                        Keep your response practical, actionable, and easy to understand for farmers. Limit to 4-5 sentences."""
                        
                        response = gemini_model.generate_content(prompt)
                        ai_advice = response.text
                        
                    except Exception as e:
                        print(f"Gemini AI advice generation failed: {e}")
                        ai_advice = f"Based on our analysis, your {primary_prediction['crop']} shows signs of {primary_prediction['disease']}. Please refer to the treatment recommendations below and consider consulting with a local agricultural expert for personalized advice."
                else:
                    # Fallback advice for testing mode
                    if primary_prediction['disease'] != 'Healthy':
                        ai_advice = f"Our AI model detected {primary_prediction['disease']} in your {primary_prediction['crop']} with {primary_prediction['confidence']:.1%} confidence. Please review the treatment recommendations and consider consulting with a local agricultural expert."
                    else:
                        ai_advice = f"Great news! Your {primary_prediction['crop']} appears healthy. Continue with regular monitoring and good agricultural practices."
        
        # Prepare response
        response_data = {
            'success': detection_result['success'],
            'predictions': detection_result['predictions'],
            'primary_prediction': detection_result['primary_prediction'],
            'error': detection_result.get('error'),
            'treatment_recommendations': treatment_recommendations,
            'ai_advice': ai_advice
        }
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Disease detection with AI advice error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Disease detection failed: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file_path and disease_service:
            disease_service.cleanup_temp_file(temp_file_path)

@app.get("/disease-model-info")
async def get_disease_model_info():
    """Get information about the disease detection model."""
    if disease_service is None:
        raise HTTPException(
            status_code=503,
            detail="Disease detection service not available."
        )
    
    try:
        model_info = disease_service.get_model_info()
        return model_info
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get model info: {str(e)}"
        )

@app.get("/")
def read_root():
    return {"message": "Welcome to the Krishi Mitra AI API (Live & Regional)"}

@app.get("/status")
def get_status():
    """Get API status and configuration info"""
    return {
        "status": "running",
        "testing_mode": TESTING_MODE,
        "gemini_available": gemini_model is not None,
        "weatherapi_configured": bool(WEATHERAPI_KEY),
        "agmarknet_configured": bool(AGMARKNET_API_KEY and AGMARKNET_RESOURCE_ID),
        "agmarknet_debug": AGMARKNET_DEBUG,
        "yield_model_available": yield_predictor is not None,
        "disease_detection_available": disease_service is not None and disease_service.is_loaded,
        "endpoints": [
            "/recommend-by-location",
            "/recommend-manual",
            "/predict-yield",
            "/yield-model-info",
            "/detect-disease",
            "/detect-disease-with-ai-advice",
            "/disease-model-info",
            "/debug/agmarknet",
            "/status"
        ]
    }