# api/endpoints/weather.py
import os
from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional

from app.services.weather_service import WeatherService
from app.models.weather import WeatherResponse
from app.services.user_authorization_services import get_current_user_id
from app.services.location_service import LocationService

router = APIRouter()

# Global instance for the service
_weather_service_instance: Optional[WeatherService] = None

def get_weather_service() -> WeatherService:
    global _weather_service_instance
    if _weather_service_instance is None:
        api_key = os.getenv("OPENWEATHER_API_KEY")
        if not api_key:
            raise RuntimeError("Weather API key environment variable is not set.")
        _weather_service_instance = WeatherService(api_key)
    return _weather_service_instance


@router.get("/get-weather", response_model=WeatherResponse)
async def get_weather(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    service: WeatherService = Depends(get_weather_service)):  
    try:
        return await service.get_current_weather(lat=lat, lon=lon)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Weather service error: {str(e)}")
    
@router.get("/k-env/{garden_id}")
async def get_garden_k_env(
    garden_id: str,
    service: WeatherService = Depends(get_weather_service),
    location_svc = Depends(LocationService.get_garden_zone_coordinates),
    current_user: dict = Depends(get_current_user_id)
):
    return await service.get_k_env_by_garden_id(garden_id, location_svc, current_user["uid"])
