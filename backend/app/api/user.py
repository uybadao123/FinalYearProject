# app/api/v1/endpoints/user.py
from fastapi import APIRouter, Depends, HTTPException
from app.services.db_service import DBService
from app.models.user import UserProfile, UserProfileUpdate
from app.services.user_authorization_services import get_current_user_id

router = APIRouter()

@router.post("/profile", status_code=201)
async def create_profile(profile: UserProfile):
    try:
        DBService.create_user_profile(profile.dict())
        return {"message": "Profile created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/profile/{uid}", response_model=UserProfile)
async def get_profile_by_uid(uid: str, current_user_id: dict = Depends(get_current_user_id)):
    uid = get_current_user_id(uid)
    profile = DBService.get_user_profile(uid)
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return profile


@router.get("/me", response_model=UserProfile)
async def get_my_profile(current_user_id: dict = Depends(get_current_user_id)):
    try:
        profile = DBService.get_user_profile(current_user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Your profile not found")
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
#Update profile
@router.put("/profile/update", response_model=UserProfileUpdate)
async def update_profile(profile: UserProfileUpdate, current_user_id: dict = Depends(get_current_user_id)):
    try:
        updated_profile = DBService.update_user_profile(current_user_id, profile.dict())
        if not updated_profile:
            raise HTTPException(status_code=404, detail="Profile not found to update")
        return updated_profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.delete("/profile/delete")
async def delete_profile(current_user_id: dict = Depends(get_current_user_id)):
    try:
        DBService.delete_user(current_user_id)
        return {"message": "Profile deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.get("/all-users", response_model=list[UserProfile])
async def get_all_users(current_user_id: dict = Depends(get_current_user_id)):
    current_profile = DBService.get_user_profile(current_user_id)
    print(current_profile)
    if not current_profile or current_profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập thông tin này")
    try:
        users = DBService.get_all_users()

        return users
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/admin/update-role")
async def admin_update_user_role(data: dict, current_user_id: dict = Depends(get_current_user_id)):
    current_profile = DBService.get_user_profile(current_user_id)
    if not current_profile or current_profile['role'] != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập thông tin này")
    
    target_uid = data.get("uid")
    new_role = data.get("role")
    
    if not target_uid or not new_role:
        raise HTTPException(status_code=400, detail="Missing uid or role")
    
    try:
        updated_user = DBService.update_role(target_uid, new_role)
        return updated_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
