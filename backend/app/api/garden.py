# app/api/v1/endpoints/garden.py
from fastapi import APIRouter, HTTPException, Depends
from app.services.garden_service import GardenService
from app.models.garden import ZoneCreate, ZoneUpdate, PlotCreate, PlotUpdate
from app.services.user_authorization_services import get_current_user_id

router = APIRouter()


# --- ZONE MANAGEMENT ---
@router.get("/zones")
async def get_all_zones(current_user: dict = Depends(get_current_user_id)):
    return GardenService.get_all_user_gardens(current_user)


@router.get("/zone-get/{zone_id}")
async def get_zone_by_id(zone_id: str, current_user_id: dict = Depends(get_current_user_id)):
    zone = GardenService.get_garden_data(zone_id, current_user_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found or access denied")
    return zone


@router.post("/zone-create")
async def create_zone(data: ZoneCreate, current_user_id: dict = Depends(get_current_user_id)):
    zone_id = GardenService.add_garden_zone(data.dict(), current_user_id)
    return {"id": zone_id, "message": "New garden zone created"}


@router.patch("/zone-update/{zone_id}")
async def update_zone(zone_id: str, data: ZoneUpdate, current_user_id: dict = Depends(get_current_user_id)):
    GardenService.update_garden_zone(zone_id, data.dict(exclude_unset=True), current_user_id)
    return {"message": "Garden zone information updated"}


@router.delete("/zone-delete/{zone_id}")
async def delete_zone(zone_id: str, current_user_id: dict = Depends(get_current_user_id)):
    GardenService.delete_garden_zone(zone_id, current_user_id)
    return {"message": "Garden zone deleted"}


# --- PLOT MANAGEMENT ---   
@router.get("/plots")
async def get_all_plots(current_user_id: dict = Depends(get_current_user_id)):
    return GardenService.get_all_user_plots(current_user_id)
    

@router.get("/plot-get/{plot_id}")
async def get_plot_by_id(plot_id: str, current_user_id: dict = Depends(get_current_user_id)):
    plot = GardenService.get_plot_data(plot_id, current_user_id)
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found or access denied")
    return plot


@router.post("/plot-create")
async def create_plot(data: PlotCreate, current_user_id: dict = Depends(get_current_user_id)):
    try:
        plot_id = GardenService.add_plot(data.dict(), current_user_id)
        return {"id": plot_id, "message": "New plot created"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/plot-delete/{plot_id}")
async def delete_plot(plot_id: str, current_user_id: dict = Depends(get_current_user_id)):
    GardenService.delete_plot(plot_id, current_user_id)
    return {"message": "Plot deleted"}


@router.patch("/plot-update/{plot_id}")
async def update_plot(plot_id: str, data: PlotUpdate, current_user_id: dict = Depends(get_current_user_id)):
    GardenService.update_plot(plot_id, data.dict(exclude_unset=True), current_user_id)
    return {"message": "Plot information updated"}


@router.get("/plot-logs/{plot_id}")
async def get_plot_logs(plot_id: str, current_user_id: dict = Depends(get_current_user_id)):
    logs = GardenService.get_plot_logs(plot_id, current_user_id)
    return logs