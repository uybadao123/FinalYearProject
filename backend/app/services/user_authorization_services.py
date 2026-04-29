from fastapi import Header, HTTPException, Depends
from firebase_admin import auth as firebase_auth
from app.db.firebase_config import db



async def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token['uid'] 
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_user_data(user_id: str):
    user_doc = db.collection("users").document(user_id).get()
    if user_doc.exists:
        return user_doc.to_dict()
    raise HTTPException(status_code=404, detail="User not found")


def check_user_role(allowed_roles: list):
        def role_checker(current_user=Depends(get_current_user_id)):
            user_role = db.collection("users").document(current_user).get().to_dict().get("role")
            if user_role not in allowed_roles:
                raise HTTPException(status_code=403, detail="Check role: Permission denied")
            return current_user
        return role_checker


def admin_only(current_user: dict = Depends(get_current_user_id)):
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Yêu cầu quyền Admin")
        return current_user
