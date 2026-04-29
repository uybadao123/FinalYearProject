from pydantic import BaseModel, Field, ConfigDict
from typing import List

class ForecastDay(BaseModel):
    day: str
    temp: float
    condition: str

class WeatherResponse(BaseModel):
    temp: float
    condition: str
    description: str
    humidity: int
    recommendation: str
    forecast: List[ForecastDay] = Field(default_factory=list)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "temp": 28.5,
                "condition": "Clouds",
                "description": "Scattered clouds",
                "humidity": 75,
                "recommendation": "Optimal conditions for plant metabolic activity.",
                "forecast": [
                    {"day": "Monday", "temp": 29.0, "condition": "Clear"},
                    {"day": "Tuesday", "temp": 31.0, "condition": "Rain"}
                ]
            }
        }
    )
