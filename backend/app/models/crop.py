# app/models/crop.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
class CropStatus(str, Enum):
    PENDING = "pending"     
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished" 

class GrowthTimeline(BaseModel):
    seedling_end: int = Field(..., description="End day of seedling stage")
    vegetative_end: int = Field(..., description="End day of vegetative stage")

class Deficiency(BaseModel):
    element: str = Field(..., example="Nitrogen (N)")
    symptoms: str = Field(..., description="Description of deficiency symptoms")
    solution: str = Field(..., description="Description of the solution to address the deficiency")

class Crop(BaseModel):
    id: str
    name: str = Field(..., example="Tomato", description="Common name of the crop")  
    family: str = Field(..., example="Solanaceae", description="Plant family")
    description: str = Field(..., example="A brief description of the crop")
    image_url: Optional[str] = None
    growth_timeline: GrowthTimeline = Field(..., description="Information about the growth stages timeline")
    stage_factors: Dict[str, Dict[str, float]] = Field(..., description="Factors affecting each stage, e.g., {'vegetative': {'light': 0.8, 'water': 0.6}}")
    stage_frequency: Dict[str, int] = Field(..., description="Recommended care frequency for each stage, e.g., {'seedling': 3, 'vegetative': 5}")
    specific_deficiencies: List[Deficiency] = Field(default_factory=list) 

    status: CropStatus = CropStatus.PUBLISHED 
    created_by: Optional[str] = None  
    updated_by: Optional[str] = None  
    last_updated: datetime = Field(default_factory=datetime.now)

class CropUpdate(BaseModel):
    name: Optional[str] = Field(None, example="Tomato", description="Common name of the crop")  
    family: Optional[str] = Field(None, example="Solanaceae", description="Plant family")
    description: Optional[str] = Field(None, example="A brief description of the crop")
    image_url: Optional[str] = None
    growth_timeline: Optional[GrowthTimeline] = Field(None, description="Information about the growth stages timeline")
    stage_factors: Optional[Dict[str, Dict[str, float]]] = Field(None, description="Factors affecting each stage, e.g., {'vegetative': {'light': 0.8, 'water': 0.6}}")
    stage_frequency: Optional[Dict[str, int]] = Field(None, description="Recommended care frequency for each stage, e.g., {'seedling': 3, 'vegetative': 5}")
    specific_deficiencies: Optional[List[Deficiency]] = Field(None)
    status: CropStatus