# app/models/garden.py
# 
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# GARDEN ZONE MODEL 
class ZoneBase(BaseModel):
    name: str = Field(..., example="Balcony", description="Garden Zone Name")
    description: Optional[str] = Field(None, example="Lots of sunlight, facing East", description="Detailed description of the zone")
    latitude: float = Field(..., example=10.7626, description="Latitude of the garden zone") 
    longitude: float = Field(..., example=106.6602, description="Longitude of the garden zone")
    type: str = Field(..., example="balcony", description="Type of garden: balcony, rooftop, backyard, community")

class ZoneCreate(ZoneBase):
    pass

class ZoneUpdate(ZoneBase):
    name: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    type: Optional[str] = None

class ZoneResponse(ZoneBase):
    id: str
    userId: str
    createdAt: Optional[datetime] = None


# --- PLOT MODEL ---

class PlotBase(BaseModel):
    plot_name: str = Field(..., example="Tomato Planter 01", description="Name of the plot")
    crop_id: str = Field(..., example="tomato_determinate", description="ID of the crop")
    pot_volume: float = Field(..., ge=0.5, example=15.0, description="Volume of the pot in liters")
    growing_media: str = Field(..., example="Soil Mix", description="Type of growing media")
    start_date: datetime = Field(..., example="2024-03-20T00:00:00Z", description="Start date of the plot")

class PlotCreate(PlotBase):
    zone_id: str = Field(..., description="ID of the garden containing this plot")

class PlotUpdate(BaseModel):
    plot_name: Optional[str] = None
    crop_id: Optional[str] = None
    pot_volume: Optional[float] = None
    growing_media: Optional[str] = None
    start_date: Optional[datetime] = None

class PlotResponse(PlotBase):
    id: str 
    userId: str
    zone_id: str
    createdAt: Optional[datetime] = None
    class Config:
        from_attributes = True