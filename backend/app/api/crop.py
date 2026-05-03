# app/api/v1/endpoints/crop.py
from fastapi import APIRouter, HTTPException, Depends
from app.services.crop_service import CropService
from app.models.crop import CropUpdate
from app.services.user_authorization_services import check_user_role, get_user_data


router = APIRouter()


@router.get("/list-all")
async def list_crops(current_user_id: str = Depends(check_user_role(["gardener", "admin", "content_collaborator"]))):
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Get Crop List: Unauthorized access")
    user_data = get_user_data(current_user_id)
    is_admin_view = user_data.get("role") in ["admin", "content_collaborator"]
    return CropService.get_all_crops(is_admin_view=is_admin_view)


@router.get("/{crop_id}")
async def get_crop_details(crop_id: str, current_user_id: str = Depends(check_user_role(["gardener", "admin", "content_collaborator"]))):
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Get Crop: Unauthorized access")
    user_data = get_user_data(current_user_id)
    is_admin_view = user_data.get("role") in ["admin", "content_collaborator"]
    crop = CropService.get_crop_by_id(crop_id, is_admin_view=is_admin_view)
    if crop:
        return crop

    if not is_admin_view and CropService.get_crop_by_id(crop_id, is_admin_view=True):
        raise HTTPException(status_code=403, detail="Get Crop: Access denied to unpublished crop details.")

    raise HTTPException(status_code=404, detail="Get Crop: Species details not found in database.")


@router.post("/add")
async def add_crop(
    crop_data: CropUpdate, 
    current_user_role = Depends(check_user_role(["admin", "content_collaborator"]))
):
    if not current_user_role:
        raise HTTPException(status_code=401, detail="Add Crop: Unauthorized access.")
    else:
        new_crop_id = CropService.add_crop(crop_data.dict(), get_user_data(current_user_role))
        return {"message": "Add Crop: New crop added successfully", "crop_id": new_crop_id}


@router.patch("/update/{crop_id}")
async def edit_crop(
    crop_id: str, 
    data: CropUpdate, 
    current_user_role = Depends(check_user_role(["admin", "content_collaborator"]))
):
    
    if not current_user_role:
        raise HTTPException(status_code=401, detail="Edit Crop: Unauthorized access.")
        
    if not CropService.get_crop_by_id(crop_id, is_admin_view=True):
        raise HTTPException(status_code=404, detail="Edit Crop: Crop not found for update.")
    success = CropService.update_crop(crop_id, data.dict(exclude_unset=True), get_user_data(current_user_role))
    return {"message": "Edit Crop: Update successful"} if success else {"message": "Edit Crop: Update failed"}


@router.delete("/delete/{crop_id}")
async def delete_crop(
    crop_id: str, 
    current_user_role = Depends(check_user_role(["admin"]))
):
    if not current_user_role:
        raise HTTPException(status_code=401, detail="Delete Crop: Unauthorized access.")

    # Check if the crop exists before attempting deletion
    crop = CropService.get_crop_by_id(crop_id, is_admin_view=True)
    if not crop:
        raise HTTPException(status_code=404, detail="Delete Crop: Crop not found.")
    
    # Call the service layer to handle the actual deletion logic
    success = CropService.delete_crop(crop_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Delete Crop: Failed to delete crop from database.")
        
    return {"message": f"Delete Crop: Crop '{crop.get('name')}' deleted successfully"}


@router.post("/toggle/{crop_id}")
async def toggle_crop_status(
    crop_id: str, 
    current_user_role = Depends(check_user_role(["admin"]))
):
    if not current_user_role:
        raise HTTPException(status_code=401, detail="Edit Crop: Unauthorized access.")

    crop = CropService.get_crop_by_id(crop_id, is_admin_view=True)
    if not crop:
        raise HTTPException(status_code=404, detail="Edit Crop: Crop not found for status toggle.")
    
    user_data = get_user_data(current_user_role)
    success = CropService.toggle_crop_status(crop_id, user_data)
    return {"message": "Edit Crop: Status changed successfully"} if success else {"message": "Edit Crop: Status change failed"}