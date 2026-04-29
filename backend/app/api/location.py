# app/api/v1/endpoints/soil.py

# This module defines the API endpoint for fetching supported growing media and their leaching coefficients.
# It integrates with the SoilService to retrieve soil media factors and formats them for the mobile frontend

from fastapi import APIRouter, HTTPException
from typing import Dict
from app.services.location_service import LocationService
from app.models.location import LocationData
router = APIRouter()

@router.get("/location", response_model=LocationData)
async def get_garden_location_info():
    try:
        location_info = await LocationService.get_garden_zone_coordinates()
        return location_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching location info: {str(e)}")