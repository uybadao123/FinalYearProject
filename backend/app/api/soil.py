# app/api/v1/endpoints/soil.py

# This module defines the API endpoint for fetching supported growing media and their leaching coefficients.
# It integrates with the SoilService to retrieve soil media factors and formats them for the mobile frontend

from fastapi import APIRouter, HTTPException
from typing import Dict
from app.services.soil_service import SoilService

router = APIRouter()
soil_svc = SoilService()

@router.get("/soil_media", response_model=Dict[str, float])
async def list_soil_media():
    try:
        return soil_svc.soil_media_factors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")