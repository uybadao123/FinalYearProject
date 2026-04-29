from dateutil import parser
import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from app.db.firebase_config import db
from app.services.crop_service import CropService
from app.services.weather_service import WeatherService
from app.services.garden_service import GardenService
from app.services.fertilizer_service import FertilizerService
from app.services.soil_service import SoilService


class DSSService:
    @staticmethod
    def _euclidean_match(targets: Dict[str, float], inventory: List[Dict[str, Any]], stage: str) -> Optional[Dict[str, Any]]:
        if not targets or not inventory: 
            return None
            
        best_match, best_distance = None, float('inf')
        weights = {'n': 1.0, 'p': 1.0, 'k': 1.0}
        if stage in ['vegetative', 'seedling']: 
            weights['n'] = 1.5
        elif stage in ['flowering', 'budding']: 
            weights['p'] = 2
        elif stage in ['fruiting', 'ripening']: 
            weights['k'] = 2
        #Normalize target requirements to relative ratios (0.0 to 1.0)
        total_target = sum(targets.get(k, 0) for k in ['n', 'p', 'k'])
        if total_target == 0: 
            return None
            
        t_n = targets.get('n', 0) / total_target
        t_p = targets.get('p', 0) / total_target
        t_k = targets.get('k', 0) / total_target

        for item in inventory:
            # Next, normalize fertilizer composition to relative ratios
            n_pct = item.get('n_pct', 0)
            p_pct = item.get('p_pct', 0)
            k_pct = item.get('k_pct', 0)
            
            total_fert = (n_pct + p_pct + k_pct)
            if total_fert == 0: 
                continue
            
            i_n, i_p, i_k = n_pct / total_fert, p_pct / total_fert, k_pct / total_fert
            #Calculate Weighted Euclidean Distance
            # Distance = sqrt( wN*(targetN - fertN)^2 + wP*(targetP - fertP)^2 + wK*(targetK - fertK)^2 )
            distance = math.sqrt( weights['n'] * (t_n - i_n) ** 2 +weights['p'] * (t_p - i_p) ** 2 +weights['k'] * (t_k - i_k) ** 2 )
            if distance < best_distance:
                best_distance = distance
                best_match = item
                
        return best_match
    

    #Day and stage calculation logic based on plot start date and crop growth timeline
    @staticmethod
    def calculate_day_and_stage(start_date, growth_timeline, stage_factors):
        if hasattr(start_date, 'to_pydatetime'):
            dt_start = start_date.to_pydatetime()
        elif isinstance(start_date, str):
            dt_start = parser.isoparse(start_date)
        else:
            dt_start = start_date

        if dt_start.tzinfo is None:
            dt_start = dt_start.replace(tzinfo=timezone.utc)
        else:
            dt_start = dt_start.astimezone(timezone.utc)
        now = datetime.now(timezone.utc)
        age = max(0, (now - dt_start).days)
        
        stage = CropService.identify_stage(age, growth_timeline, stage_factors)

        return {"age": age, "stage": stage}


    #Recommendation Fertilization 
    @staticmethod
    async def get_recommendation(user_id: str, plot_id: str, fertilizer_inventory: List[Dict[str, Any]]):
            plot = GardenService.get_plot_data(plot_id, user_id)
            if not plot: return None

            k_env = await WeatherService.get_k_env_by_garden_id(plot.get('zone_id'), user_id)
            print (f"Calculated k_env for plot_id {plot_id}: {k_env}")

            inventory = fertilizer_inventory if fertilizer_inventory else FertilizerService._load_system_presets()

            crop_meta = CropService.get_crop_by_id(plot['crop_id'])
            if not crop_meta:   
                raise ValueError(f"Crop metadata not found: {plot['crop_id']}")
            
            stage_info = DSSService.calculate_day_and_stage(plot['start_date'], crop_meta['growth_timeline'], crop_meta['stage_factors'])
            if not stage_info:
                raise ValueError(f"Could not calculate stage info for plot_id {plot_id}")
            stage = stage_info['stage']
            
            targets = crop_meta['stage_factors'].get(stage_info['stage'])

            best_fert = DSSService._euclidean_match(targets, inventory, stage)
            if not best_fert: return None

            k_media = SoilService().get_k_media_factor(plot.get('growing_media', 'Soil Mix'))
            if k_media is None:
                raise ValueError(f"Unknown growing media: {plot.get('growing_media', 'Soil Mix')}")
            
            volume = plot.get('pot_volume', 1.0)
        
            dosages = []
            for nutrient in ['n', 'p', 'k']:
                target_val = targets.get(nutrient, 0)
                fert_pct = best_fert.get(f'{nutrient}_pct', 0)
                
                if target_val > 0 and fert_pct > 0:
                    d = (target_val / (fert_pct / 100)) * volume * k_env * k_media
                    dosages.append(d)
            final_dosage = min(dosages) if dosages else 0

            return {
                    "dosage": round(final_dosage, 2),
                    "fertilizer_name": best_fert['name'],
                    "fertilizer_id": best_fert.get('id', 'manual'),
                    "stage": stage,
                    "age": stage_info['age'],
                    "applied_k_env": k_env,
                    "recommendation_text": f"Dosage Recommendation: {round(final_dosage, 2)}g {best_fert['name']} for current stage \"{stage}\"."
                }


    @staticmethod
    async def generate_dashboard_activities(plots: list) -> List[Dict[str, Any]]:
        activities = []
        for plot in plots:
            try:
                rec = await DSSService.get_recommendation(plot.get('userId'), plot['id'], [])
                if not rec: 
                    print(f"Error generating recommendation for plot_id {plot.get('id')}: No recommendation returned.")
                    continue

                crop_meta = CropService.get_crop_by_id(plot['crop_id'])
                print(f"Crop metadata for plot_id {plot.get('id')}: {crop_meta}")
                freq = int(crop_meta.get('stage_frequency', {}).get(rec['stage'], 2))
                print(f"Recommended frequency for stage {rec['stage']}: {freq} days")
                
                last_fed_val = plot.get('last_fertilized_at') or plot.get('start_date')
                if isinstance(last_fed_val, str):
                    last_fed = datetime.fromisoformat(last_fed_val.replace('Z', '+00:00'))
                else:
                    last_fed = last_fed_val
                days_since = (datetime.now(timezone.utc) - last_fed).days
                print(f"Days since last fertilizing for plot_id {plot.get('id')}: {days_since}")

                if days_since >= freq:
                    activities.append({
                        "plot_id": plot['id'],
                        "plot_name": plot['plot_name'],
                        "priority": "HIGH" if days_since > freq + 1 else "MEDIUM",
                        "title": f"Feeding for {plot['plot_name']}",
                        "recommendation": rec
                    })
            except Exception as e:
                raise ValueError(f"Sync error for plot {plot.get('id')}: {e}")
        print(f"Generated {len(activities)} dashboard activities.")
        return activities
    

    @staticmethod
    async def get_full_growth_schedule(user_id: str, plot_id: str) -> List[Dict[str, Any]]:
        if not user_id: return []
        
        plot = GardenService.get_plot_data(plot_id, user_id)
        crop_meta = CropService.get_crop_by_id(plot['crop_id'])
        if not plot or not crop_meta: return []

        volume = float(plot.get('pot_volume', 1.0))
        k_media = float(SoilService().get_k_media_factor(plot.get('growing_media', 'Soil Mix')))
        presets = FertilizerService._load_system_presets()
        stage_factors = crop_meta.get('stage_factors', {})
        timeline = crop_meta.get('growth_timeline', {})
        max_days = int(crop_meta.get('total_lifecycle', 90))

        stage_prescriptions = {}
        
        for stage, targets in stage_factors.items():
            # Find the best fertilizer by ratio (Smart match function fixed above)
            best_fert = DSSService._euclidean_match(targets, presets, stage)
            
            if best_fert:
                # Calculate dosage based on MIN of N, P, K to ensure safety
                dosages = []
                for nutrient in ['n', 'p', 'k']:
                    target_val = targets.get(nutrient, 0)
                    fert_pct = best_fert.get(f'{nutrient}_pct', 0)
                    
                    if target_val > 0 and fert_pct > 0:
                        #(Target / %Phân) * Volume * k_media
                        d = (target_val / (fert_pct / 100)) * volume * k_media
                        dosages.append(d)
                
                final_dosage = min(dosages) if dosages else 0
                stage_prescriptions[stage] = {
                    "name": best_fert['name'],
                    "dosage": round(final_dosage, 2)
                }
            else:
                stage_prescriptions[stage] = {"name": "N/A", "dosage": 0}

        # 3. Xử lý ngày bắt đầu
        try:
            dt_start = datetime.fromisoformat(plot['start_date'].replace('Z', '+00:00'))
        except:
            dt_start = datetime.utcnow()

        # 4. Tạo lịch trình dựa trên bước nhảy mong muốn
        full_schedule = []
        current_day = 1
        stage_freqs = crop_meta.get('stage_frequency', {})

        while current_day <= max_days:
            stage = CropService.identify_stage(current_day, timeline, stage_factors)
            p = stage_prescriptions.get(stage, {"name": "Standard Mix", "dosage": 0})

            full_schedule.append({
                "day_number": current_day,
                "date": (dt_start + timedelta(days=current_day)).isoformat(),
                "stage": stage,
                "task_name": f"Feeding ({stage.capitalize()})",
                "fertilizer_name": p['name'],
                "dosage": p['dosage']
            })

            freq = int(stage_freqs.get(stage, 7))
            current_day += max(freq, 1) 

        return full_schedule
    

    #Fertilizing activity confirmation logic to update plot schedule and last fertilized time
    @staticmethod
    async def confirm_fertilizing_activity(user_id: str, plot_id: str) -> Dict[str, Any]:
        try:
            plot = GardenService.get_plot_data(plot_id, user_id)
            if not plot: return {"success": False, "message": "Plot not found."}
            
            now = datetime.now(timezone.utc)
            current_schedule = GardenService.get_plot_schedule(plot_id, user_id)
            
            if current_schedule:
                completed_task = current_schedule.pop(0)
                
                activity_data = {
                    "plotId": plot_id,
                    "userId": user_id,
                    "type": "fertilized",
                    "note": f"Dosaged {completed_task.get('dosage')}g - {completed_task.get('fertilizer_name')}",
                    "timestamp": now,
                    "stage": completed_task.get('stage')
                }
                db.collection("activity_logs").add(activity_data)
                
                #Update plot's growth schedule and last fertilized time
                plot['growth_schedule'] = current_schedule
                plot['last_fertilized_at'] = now.isoformat()
                GardenService.update_plot(plot_id, plot, user_id)
                
                return {"success": True, "message": "Log created and schedule updated."}
            
            return {"success": False, "message": "No task to confirm."}
        except Exception as e:
            return {"success": False, "message": str(e)}
        

            
    
