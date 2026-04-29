#app/modekls/location.py

# This module defines the data model for location information, including latitude and longitude.

from pydantic import BaseModel, Field

class LocationData(BaseModel):
    latitude: float = Field(..., description="Latitude of the garden zone")
    longitude: float = Field(..., description="Longitude of the garden zone")

