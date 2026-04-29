import json
from typing import Dict, Any, List


class FertilizerService:
    # Internal utility to load fertilizer presets from a JSON file
    def _load_system_presets() -> List[Dict[str, Any]]:
        try:
            with open("app/data/fertilizer_presets.json", "r") as fertilizer_file:
                return json.load(fertilizer_file)
        except FileNotFoundError:
            print("Fertilizer presets file not found.")
            return []
        except json.JSONDecodeError:
            print("Error decoding JSON from fertilizer presets file.")
            return []