#app/api/v1/endpoint
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.models.nutrient import DashboardActivity, NutrientRequest, NutrientResponse
from app.services.dss_service import DSSService
from app.services.garden_service import GardenService
from app.services.user_authorization_services import get_current_user_id
from app.services.crop_service import CropService

router = APIRouter()


@router.get("/full-schedule/{plot_id}", response_model=List[Dict[str, Any]])
async def get_plot_schedule(plot_id: str, current_user_id: str = Depends(get_current_user_id)):
    plot = GardenService.get_plot_data(plot_id, current_user_id)
    schedule = plot.get("growth_schedule")
        
    try:
        if schedule:
            print(f"Schedule for plot {plot_id} retrieved from database.")
            return schedule
        else:
            print(f"No schedule found for plot {plot_id} in database. Generating new schedule.")   
            schedule_initialization = await DSSService.get_full_growth_schedule(current_user_id, plot_id)
            if schedule_initialization:
                GardenService.save_plot_schedule(current_user_id, plot_id, schedule_initialization)
                return schedule_initialization
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#
@router.post("/dashboard-sync", response_model=List[DashboardActivity])
async def sync_dashboard_activities(current_user_id: str = Depends(get_current_user_id)):
    plots = GardenService.get_all_user_plots(current_user_id)
    activities = await DSSService.generate_dashboard_activities(plots)
    return activities


@router.post("/calculate-next-dosage", response_model=NutrientResponse)
async def calculate_nutrient_dosage(request: NutrientRequest, current_user_id: str = Depends(get_current_user_id)):
    recommendation = await DSSService.get_recommendation(user_id=current_user_id,plot_id=request.plot_id,fertilizer_inventory=request.fertilizer_inventory)
    if not recommendation:
        raise HTTPException(status_code=404, detail="No recommendation generated.")
    
    return recommendation


@router.get("/calculate-day-and-stage/{plot_id}", response_model=Dict[str, Any])
async def calculate_day_and_stage(plot_id: str, current_user_id: str = Depends(get_current_user_id)):
    plot = GardenService.get_plot_data(plot_id, current_user_id)
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found.")
    crop_meta = CropService.get_crop_by_id(plot['crop_id'])

    if not crop_meta:
        raise HTTPException(status_code=404, detail="Crop metadata not found.")
        
    return DSSService.calculate_day_and_stage(plot['start_date'], crop_meta['growth_timeline'], crop_meta['stage_factors'])


@router.post("/confirm-activity", response_model=Dict[str, Any])
async def confirm_fertilizing_activity(plot_id: str, current_user_id: str = Depends(get_current_user_id)):
    try:
        result = await DSSService.confirm_fertilizing_activity(current_user_id, plot_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
