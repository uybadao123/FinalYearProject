# app/api/v1/endpoints/soil.py
from fastapi import APIRouter, HTTPException
from typing import Dict
from app.services.soil_service import SoilService

router = APIRouter()


@router.get("/soil_media", response_model=Dict[str, float])
async def list_soil_media():
    try:
        return SoilService.soil_media_factors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")