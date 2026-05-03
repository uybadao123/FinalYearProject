# app/api/v1/endpoints/soil.py
from fastapi import APIRouter, HTTPException
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