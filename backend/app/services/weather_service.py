import httpx
from typing import Optional
from datetime import datetime
from app.models.weather import WeatherResponse, ForecastDay
from app.services.location_service import LocationService
import os

class WeatherService:
    HEAT_THRESHOLD = 32.0
    COLD_THRESHOLD = 24.0
    TEMP_OPTIMAL_MAX = 28.0
    TEMP_OPTIMAL_MIN = 26.0


    def __init__(self, api_key: str = None):
        self.api_key = os.getenv("OPENWEATHER_API_KEY") if api_key is None else api_key
        self.base_url = "https://api.openweathermap.org/data/2.5/forecast"
        self.current_url = "https://api.openweathermap.org/data/2.5/weather"
        self.client = httpx.AsyncClient(timeout=10.0)
    

    @staticmethod
    def calculate_k_env_logic(temp: float, humidity: int) -> float:
        k = 1.0
        if temp > WeatherService.TEMP_OPTIMAL_MAX:
            k += 0.1  
            if humidity < 60: k += 0.05 
        elif temp < WeatherService.TEMP_OPTIMAL_MIN:
            k -= 0.15 
        return round(max(0.7, min(1.3, k)), 2)
    

    @staticmethod
    def get_recommendation(temp: float) -> str:
        if temp > WeatherService.HEAT_THRESHOLD:
            return "Extreme heat detected! Increase irrigation to compensate."
        if temp < WeatherService.COLD_THRESHOLD:
            return "Low temperature alert. Growth may decelerate."
        return "Optimal conditions for plant metabolic activity."


    async def get_current_weather(self, lat: Optional[float], lon: Optional[float]) -> WeatherResponse:
        params = {"appid": self.api_key, "units": "metric", "lat": lat, "lon": lon}
        if lat is None or lon is None:
            raise ValueError("Get weather information: requires both latitude and longitude.")        
        try:
            curr_resp = await self.client.get(self.current_url, params=params)
            curr_data = curr_resp.json()
            
            fore_resp = await self.client.get(self.base_url, params=params)
            fore_data = fore_resp.json()

            daily_forecast = []
            seen_days = set()
            for entry in fore_data.get("list", []):
                dt = datetime.fromtimestamp(int(entry["dt"]))
                day_str = dt.strftime("%a")
          
                # Forecast 7 days at 11:00 AM to capture midday conditions
                if day_str not in seen_days and dt.hour >= 11:
                    daily_forecast.append(ForecastDay(
                        day=day_str,
                        temp=round(entry["main"]["temp"], 1),
                        condition=entry["weather"][0]["main"]
                    ))
                    seen_days.add(day_str)
                if len(daily_forecast) >= 7: break

            return WeatherResponse(
                temp=round(float(curr_data["main"]["temp"]), 1),
                condition=curr_data["weather"][0]["main"],
                description=curr_data["weather"][0]["description"].capitalize(),
                humidity=curr_data["main"]["humidity"],
                recommendation=WeatherService.get_recommendation(curr_data["main"]["temp"]), 
                forecast=daily_forecast
            )
        except Exception as e:
            return WeatherResponse(temp=0.0, condition="Error", description="N/A", humidity=0, recommendation="System offline.", forecast=[])
        
        
    @staticmethod
    async def get_k_env_by_garden_id(garden_id: str, user_id: str) -> float:
        location_data = await LocationService.get_garden_zone_coordinates(garden_id, user_id)
        if not location_data:
            raise RuntimeError(f"Location data not found for garden_id {garden_id}")
            
        try: 
            weather = await WeatherService().get_current_weather(location_data.latitude, location_data.longitude)
            if weather.condition != "Error":
                k_env = WeatherService.calculate_k_env_logic(weather.temp, weather.humidity)
                print(f"Calculated k_env for garden_id {garden_id}: {k_env} based on temp={weather.temp} and humidity={weather.humidity}")
                return k_env
            else:
                raise RuntimeError(f"Weather data retrieval failed for garden_id {garden_id}")
        except Exception as e:
            raise RuntimeError(f"Error fetching weather data for garden_id {garden_id}: {e}")
            
    
    async def aclose(self):
        await self.client.aclose()