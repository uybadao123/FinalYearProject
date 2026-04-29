from firebase_admin import firestore
from app.db.firebase_config import db
from fastapi import HTTPException, logger
from typing import List, Dict, Any

def server_timestamp():
    return firestore.SERVER_TIMESTAMP

class GardenService:
    #GET USER GARDENS AND PLOTS
    @staticmethod
    def get_all_user_gardens(user_id: str):
        docs = db.collection("garden_zones").where("userId", "==", user_id).stream()
        return [{"id": d.id, **d.to_dict()} for d in docs]
    

    @staticmethod
    def get_all_user_plots(user_id: str):
        docs = db.collection("plots").where("userId", "==", user_id).stream()
        return [{"id": d.id, **d.to_dict()} for d in docs]


    @staticmethod
    def get_garden_data(zone_id: str, user_id: str):
        zone_ref = db.collection("garden_zones").document(zone_id)
        zone_doc = zone_ref.get()

        if not zone_doc.exists:
            raise HTTPException(status_code=404, detail="Get Garden Data: Garden not found")
        
        if zone_doc.to_dict().get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Get Garden Data: You do not have permission to access this garden")

        return zone_doc.to_dict()
    

    @staticmethod
    def add_garden_zone(zone_data: dict, user_id: str):
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        doc_ref = db.collection("garden_zones").document()
        zone_data["userId"] = user_id
        zone_data["createdAt"] = server_timestamp()
        doc_ref.set(zone_data)
        return doc_ref.id


    @staticmethod
    def delete_garden_zone(zone_id: str, user_id: str):
        zone_ref = db.collection("garden_zones").document(zone_id)
        zone_doc = zone_ref.get()
        if not zone_doc.exists:
            raise HTTPException(status_code=404, detail="Delete Garden Zone: Garden not found")
        
        if zone_doc.to_dict().get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Delete Garden Zone: You do not have permission to delete this garden")

        plots = db.collection("plots").where("zone_id", "==", zone_id).stream()
        batch = db.batch()
        for plot in plots:
            batch.delete(plot.reference)

        batch.delete(zone_ref)
        batch.commit()
        return True


    @staticmethod
    def update_garden_zone(zone_id: str, update_data: dict, user_id: str):
        zone_ref = db.collection("garden_zones").document(zone_id)
        zone_doc = zone_ref.get()

        if not zone_doc.exists:
            raise HTTPException(status_code=404, detail="Update Garden Zone: Garden not found")
        
        if zone_doc.to_dict().get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Update Garden Zone: You do not have permission to update this garden")

        clean_data = {k: v for k, v in update_data.items() if v is not None}
        zone_ref.update(clean_data)
        return True
    

    @staticmethod
    def update_plot(plot_id: str, update_data: dict, user_id: str):
        plot_ref = db.collection("plots").document(plot_id)
        plot_doc = plot_ref.get()

        if not plot_doc.exists:
            raise HTTPException(status_code=404, detail="Update Plot: Plot not found")
        
        if plot_doc.to_dict().get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Update Plot: You do not have permission to update this plot")

        clean_data = {k: v for k, v in update_data.items() if v is not None}
        plot_ref.update(clean_data)
        return True


    @staticmethod
    def get_plot_data(plot_id: str, user_id: str):
        if not user_id:
            raise HTTPException(status_code=401, detail="Access Unauthorized")
        else:
            plot_ref = db.collection("plots").document(plot_id)
            plot_doc = plot_ref.get()

            if not plot_doc.exists:
                raise HTTPException(status_code=404, detail="Get Plot Data: Plot not found")
            
            if plot_doc.to_dict().get("userId") != user_id:
                raise HTTPException(status_code=403, detail="Get Plot Data: Access Forbidden")

            return plot_doc.to_dict()
        

    @staticmethod
    def add_plot(plot_data: dict, user_id: str):
        zone_id = plot_data.get("zone_id")
        zone_doc = db.collection("garden_zones").document(zone_id).get()
        
        if not zone_doc.exists or zone_doc.to_dict().get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Add Plot: Invalid garden zone or insufficient permissions")

        doc_ref = db.collection("plots").document()
        plot_data["userId"] = user_id 
        plot_data["createdAt"] = server_timestamp()
        doc_ref.set(plot_data)
        return doc_ref.id


    @staticmethod
    def delete_plot(plot_id: str, user_id: str):
        plot_ref = db.collection("plots").document(plot_id)
        plot_doc = plot_ref.get()

        if not plot_doc.exists:
            raise HTTPException(status_code=404, detail="Delete Plot: Plot not found")
        
        if plot_doc.to_dict().get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Delete Plot: User do not have permission to delete this plot")

        plot_ref.delete()
        return True
    

    @staticmethod
    def get_plot_schedule(plot_id: str, user_id: str) -> List[Dict[str, Any]]:
        plot_ref = db.collection("plots").document(plot_id)
        plot_doc = plot_ref.get()

        if not plot_doc.exists:
            raise HTTPException(status_code=404, detail="Get Plot Schedule: Plot not found")
        
        if plot_doc.to_dict().get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Get Plot Schedule: You do not have permission to access this plot")

        return plot_doc.to_dict().get("growth_schedule", [])

    
    @staticmethod
    def get_plot_logs(plot_id: str, user_id: str) -> List[Dict[str, Any]]:
        plot_ref = db.collection("plots").document(plot_id)
        plot_doc = plot_ref.get()

        if not plot_doc.exists:
            raise HTTPException(status_code=404, detail="Get Plot Logs: Plot not found")
        
        if plot_doc.to_dict().get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Get Plot Logs: You do not have permission to access this plot")

        logs_query = db.collection("activity_logs").where("plotId", "==", plot_id).order_by("timestamp", direction=firestore.Query.DESCENDING).stream()
        return [{"id": log.id, **log.to_dict()} for log in logs_query]
    
    
    @staticmethod
    def save_plot_schedule(user_id: str, plot_id: str, schedule: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            plot_ref = db.collection("plots").document(plot_id)
            plot_doc = plot_ref.get()

            if not plot_doc.exists:
                raise HTTPException(status_code=404, detail="Save Plot Schedule: Plot not found")
            
            if plot_doc.to_dict().get("userId") != user_id:
                raise HTTPException(status_code=403, detail="Save Plot Schedule: You do not have permission to update this plot")

            plot_ref.update({"growth_schedule": schedule})
            return {"success": True, "message": "Save Plot Schedule: Schedule saved successfully"}
        except Exception as e:
            logger.error(f"Error saving schedule for plot {plot_id}: {e}")
            return {"success": False, "message": "Save Plot Schedule: Error saving schedule"}   