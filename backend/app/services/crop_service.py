import logging
from typing import List, Optional
from datetime import datetime
from app.db.firebase_config import db
logger = logging.getLogger(__name__)

class CropService:
    @staticmethod
    def identify_stage(age: int, timeline: dict, factors: dict) -> str:
        available_stages = list(factors.keys())
        
        if age <= timeline.get('seedling_end', 14): 
            res = "seedling"
        elif age <= timeline.get('vegetative_end', 40): 
            res = "vegetative"
        elif "flowering" in factors and "fruiting" in factors:
            res = "flowering" if age <= (timeline.get('vegetative_end', 40) + 15) else "fruiting"
        else:
            res = "mature"

        if res not in available_stages and available_stages:
            return available_stages[-1] 
        
        return res


    @staticmethod
    def add_crop(crop_data: dict, user_data: dict) -> str:
        crop_data["created_by"] = user_data.get("full_name", "Unknown")
        crop_data["last_updated"] = datetime.now()
        doc_ref = db.collection("crops").add(crop_data)
        return doc_ref[1].id


    @staticmethod
    def get_all_crops(is_admin_view: bool = False) -> List[dict]:
        crops_ref = db.collection("crops")
        if not is_admin_view:
            docs = crops_ref.where("status", "==", "published").stream()
        else:
            docs = crops_ref.stream()
        return [{"id": doc.id, **doc.to_dict()} for doc in docs]


    @staticmethod
    def get_crop_by_id(crop_id: str, is_admin_view: bool = False) -> Optional[dict]:
        doc_ref = db.collection("crops").document(crop_id)
        doc = doc_ref.get()
        if doc.exists:
            crop_data = doc.to_dict()
            crop_data['id'] = crop_id
            if crop_data.get('status') == 'published' or is_admin_view:
                return crop_data
            logger.warning(f"Crop {crop_id} not published. Status: {crop_data.get('status')}")
            return None
        logger.info(f"Crop {crop_id} not found.")
        return None
    

    @staticmethod   
    def update_crop(crop_id: str, update_data: dict, user_name: str):
            update_data["updated_by"] = user_name
            update_data["last_updated"] = datetime.now()
            db.collection("crops").document(crop_id).update(update_data)
            return True


    @staticmethod
    def delete_crop(crop_id: str) -> bool:
        try:
            doc_ref = db.collection("crops").document(crop_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                logger.warning(f"Delete failed: Crop {crop_id} does not exist.")
                return False
                
            doc_ref.delete()
            logger.info(f"Crop {crop_id} has been successfully deleted.")
            return True
        except Exception as e:
            logger.error(f"Error deleting crop {crop_id}: {str(e)}")
            return False


    @staticmethod
    def toggle_crop_status(crop_id: str, user_data: dict = None):
        doc_ref = db.collection("crops").document(crop_id)
        doc = doc_ref.get()
        if not doc.exists:
            logger.warning(f"Attempt to toggle status of non-existent crop: {crop_id}")
            return False
        
        current_status = doc.to_dict().get("status", "published")
        
        #published -> unpublished -> pending -> published
        if current_status == "published":
            new_status = "unpublished"
        elif current_status == "unpublished":
            new_status = "pending"
        elif current_status == "pending":
            new_status = "published"
        else:
            new_status = "published"
        
        update_data = {
            "status": new_status, 
            "last_updated": datetime.now()
        }
        
        if user_data:
            update_data["updated_by"] = user_data.get("full_name", "Unknown")
        
        doc_ref.update(update_data)
        logger.info(f"Crop {crop_id} status toggled from {current_status} to {new_status}")
        return True
    