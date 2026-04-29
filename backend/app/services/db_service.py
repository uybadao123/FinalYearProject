# app/services/db_service.py

#Logic for interacting with Firestore database, including fetching plot data, user inventory, and updating fertilizer stock levels.
from app.db.firebase_config import db
from firebase_admin import firestore


#Get current server timestamp for consistent time tracking in Firestore
def server_timestamp():
    """Utility function to get Firestore server timestamp."""
    return firestore.SERVER_TIMESTAMP


class DBService:
    @staticmethod
    def get_user_inventory(user_id: str):
        """Fetch user's fertilizer inventory for matching against DSS recommendations."""
        docs = db.collection("fertilizers").where("userId", "==", user_id).stream()
        return [{"id": d.id, **d.to_dict()} for d in docs]


    @staticmethod
    def get_user_profile(uid: str):
        doc = db.collection("users").document(uid).get()
        if doc.exists:
            return doc.to_dict()
        return None
        

    @staticmethod
    def create_user_profile(user_data: dict):
        """Create new profile if it doesn't exist."""
        uid = user_data.get("uid")
        db.collection("users").document(uid).set(user_data)
        return uid


    @staticmethod
    def update_user_profile(uid: str, data: dict):
        """Update user profile."""
        clean_data = {k: v for k, v in data.items() if v is not None}
        db.collection("users").document(uid).update(clean_data)
        return DBService.get_user_profile(uid)
    

    @staticmethod
    def get_all_users():
        """Lấy tất cả người dùng (Admin/Manager use case)."""
        docs = db.collection("users").stream()
        return [{"uid": d.id, **d.to_dict()} for d in docs]
    
    
    @staticmethod
    def delete_user(uid: str):
        """Delete user (Admin/Manager use case)."""
        db.collection("users").document(uid).delete()
        return True
    

    @staticmethod
    def update_role(uid: str, new_role: str):
        """Update user role (Admin/Manager use case)."""
        db.collection("users").document(uid).update({"role": new_role})
        return DBService.get_user_profile(uid)


    @staticmethod
    def get_user_name(uid: str):
        doc = db.collection("users").document(uid).get()
        if doc.exists:
            return doc.to_dict().get("name")
        return None