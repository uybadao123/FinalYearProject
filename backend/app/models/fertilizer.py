# app/models/fertilizer.py
from pydantic import BaseModel, Field
from typing import Optional

class FertilizerBase(BaseModel):
    name: str = Field(..., example="Worm Castings", description="Name of the fertilizer")
    n_pct: float = Field(..., ge=0, le=100, alias="n_percent", description="Nitrogen percentage")
    p_pct: float = Field(..., ge=0, le=100, alias="p_percent", description="Phosphorus percentage")
    k_pct: float = Field(..., ge=0, le=100, alias="k_percent", description="Potassium percentage")
    te_pct: Optional[str] = Field(None, description="Trace elements")
    is_liquid: bool = Field(default=False, description="Indicates if the fertilizer is liquid")

class FertilizerPreset(FertilizerBase):
    id: str
    description: Optional[str] = Field(None, description="Description of the fertilizer preset")

class FertilizerCreate(FertilizerBase):
    pass

class FertilizerUpdate(BaseModel):
    name: Optional[str] = None
    n_pct: Optional[float] = Field(None, ge=0, le=100, alias="n_percent")
    p_pct: Optional[float] = Field(None, ge=0, le=100, alias="p_percent")
    k_pct: Optional[float] = Field(None, ge=0, le=100, alias="k_percent")
    te_pct: Optional[str] = None
    is_liquid: Optional[bool] = None