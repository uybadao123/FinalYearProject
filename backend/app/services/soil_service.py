#app/services/soil_service.py

# SoilService: Manages soil media factors for leaching compensation.
# Loads substrate leaching compensation coefficients from a JSON file.


import json
import os
from typing import Dict
from fastapi import logger


class SoilService:  
    def __init__(self):
        self.soil_media_factors = self.load_soil_media_factors()



    def read_soil_media_factors(self) -> Dict[str, float]:
        if not self.soil_media_factors:
            logger.warning("Soil media factors not loaded. Returning empty dictionary.")
            return {}
        else:
            return self.soil_media_factors


    def load_soil_media_factors(self) -> Dict[str, float]:

            file_path = os.path.join("app", "data", "soil_media.json")
            if not os.path.exists(file_path):
                logger.warning("soil_media.json not found. Falling back to default factors.")
            else:
                try:
                    with open(file_path, "r") as data:
                        return json.load(data)
                except Exception as e:
                    logger.error(f"Failed to load soil factors: {e}, set default factors.")
                    return {"Soil Mix": 0}
            
    def get_k_media_factor(self, media_name: str) -> float:
        factors = self.load_soil_media_factors()
        print(f"Soil Service: Loaded soil media factors: {factors}")
        return factors.get(media_name, 1.0)