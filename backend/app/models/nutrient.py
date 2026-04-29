# app/models/nutrient.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any


class DashboardSyncRequest(BaseModel):
    user_id: str = Field(..., description="User ID from Firebase Auth")

class NutrientRequest(BaseModel):
    plot_id: str = Field(..., description="ID of the plot to calculate nutrients for")
    fertilizer_inventory: List[Dict[str, Any]] = Field(default=[])


class NutrientResponse(BaseModel):
    dosage: float = Field(..., description="Recommended dosage in grams or milliliters")
    fertilizer_name: str = Field(..., description="Name of the fertilizer to apply")
    fertilizer_id: str = Field(..., description="ID of the fertilizer to apply")
    stage: str = Field(..., description="Growth stage of the crop")
    age: int = Field(..., description="Age of the crop in days")
    applied_k_env: float = Field(..., description="Applied potassium environment value")
    recommendation_text: str = Field(..., description="Textual recommendation for the nutrient application")

class DashboardActivity(BaseModel):
    plot_id: str
    plot_name: str
    priority: str
    title: str
    recommendation: NutrientResponse

class NutrientDashboardEntry(BaseModel):
    plot_id: str
    plot_name: str
    stage: str
    age: int
    next_activity: str
    next_dosage: float
    fertilizer_name: str

class ConfirmActivityRequest(BaseModel):
    plot_id: str = Field(..., description="ID of the plot for which the activity is being confirmed")