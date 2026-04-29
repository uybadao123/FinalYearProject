# app/services/location_service.py

from typing import Optional
import logging

import httpx
from app.models.location import LocationData
from app.services.garden_service import GardenService


logger = logging.getLogger(__name__)

class LocationService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)

    @staticmethod
    async def get_garden_zone_coordinates(garden_id: str, user_id: str) -> Optional[LocationData]:
        try:
            garden_zone_data = GardenService.get_garden_data(garden_id, user_id)

            #print(f"DEBUG INPUT: Data from GardenService for {garden_id}: {garden_zone_data}")
            latitude = garden_zone_data.get('latitude')
            longitude = garden_zone_data.get('longitude')                                                                                                    
            #print (f"DEBUG OUTPUT: Extracted lat/lon for garden_id {garden_id}: lat={latitude}, lon={longitude}")
            if latitude is None or longitude is None:
                logger.error(f"Location Service: Missing latitude or longitude for garden_id {garden_id}")
                return None
            return LocationData(latitude=latitude, longitude=longitude)

        except Exception as e:
            logger.error(f"Location Service: Error fetching location for garden_id {garden_id}: {e}")
            return None
        
        
    def __del__(self):
        try:
            self.client.aclose()
        except Exception as e:
            logger.error(f"Location Service: Error closing HTTP client: {e}")