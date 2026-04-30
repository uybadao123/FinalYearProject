// src/api/api.ts
import { auth } from '../config/firebase';
import { ENDPOINTS } from './config';


const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Please log in to perform this action.");

  try {
    const token = await user.getIdToken();

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    //API Fecthing
    const response = await fetch(`${endpoint}`, {
      ...options,
      headers,
    });

    // RESPONSE HANDLING
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Error message extraction with fallback
      const errorMessage = typeof errorData.detail === 'object'
        ? JSON.stringify(errorData.detail)
        : errorData.detail || `Error (${response.status})`;

      if (response.status === 401) {
        console.warn("Checkpoint: Unauthorized - Token may be invalid or expired.");
      }

      //Error throwing with detailed message
      throw new Error(errorMessage);
    }
    return await response.json();

  } catch (error) {
    console.error(`[API Error - ${endpoint}]:`, error);
    throw error;
  }
};

export const api = {
  // DSS MANAGEMENT //
  dss: {
    syncDashboard: () =>
      apiClient(`${ENDPOINTS.DSS}/dashboard-sync`, {
        method: 'POST',
      }),

    fetchDayAndStage: (plotId: string) =>
      apiClient(`${ENDPOINTS.DSS}/calculate-day-and-stage/${plotId}`),


    getFullSchedule: (plotId: string) =>
      apiClient(`${ENDPOINTS.DSS}/full-schedule/${plotId}`),


    calculateDosage: (data: { plot_id: string, fertilizer_inventory: any[] }) =>
      apiClient(`${ENDPOINTS.DSS}/calculate-next-dosage`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    confirmFertilizingActivity: (plot_id: string) =>
      apiClient(`${ENDPOINTS.DSS}/confirm-activity?plot_id=${plot_id}`, {
        method: 'POST',
        body: JSON.stringify({ plot_id: plot_id }),

      }),
  },


  // GARDEN MANAGEMENT //
  garden: {
    getAllGardenZones: () =>
      apiClient(`${ENDPOINTS.GARDEN}/zones`),

    getGardenZoneById: (zoneId: string) =>
      apiClient(`${ENDPOINTS.GARDEN}/zone-get/${zoneId}`),

    createZone: (data: any) =>
      apiClient(`${ENDPOINTS.GARDEN}/zone-create`, { method: 'POST', body: JSON.stringify(data) }),

    updateZone: (zoneId: string, data: any) =>
      apiClient(`${ENDPOINTS.GARDEN}/zone-update/${zoneId}`, { method: 'PATCH', body: JSON.stringify(data) }),

    deleteZone: (zoneId: string) =>
      apiClient(`${ENDPOINTS.GARDEN}/zone-delete/${zoneId}`, { method: 'DELETE' }),


    //  PLOT MANAGEMENT //
    getAllPlots: () =>
      apiClient(`${ENDPOINTS.GARDEN}/plots`),

    getPlotById: (plotId: string) =>
      apiClient(`${ENDPOINTS.GARDEN}/plot-get/${plotId}`),

    createPlot: (data: any) =>
      apiClient(`${ENDPOINTS.GARDEN}/plot-create`,
        { method: 'POST', body: JSON.stringify(data) }),


    updatePlot: (plotId: string, data: any) =>
      apiClient(`${ENDPOINTS.GARDEN}/plot-update/${plotId}`,
        { method: 'PATCH', body: JSON.stringify(data) }),

    deletePlot: (plotId: string) =>
      apiClient(`${ENDPOINTS.GARDEN}/plot-delete/${plotId}`,
        { method: 'DELETE' }),

    fetchActivityLogs: (plotId: string) =>
      apiClient(`${ENDPOINTS.GARDEN}/plot-logs/${plotId}`),

  },


  // USER MANAGEMENT //
  user: {
    createProfile: (data: any) =>
      apiClient(`${ENDPOINTS.USER}/profile`,
        { method: 'POST', body: JSON.stringify(data) }),

    getMyProfile: () =>
      apiClient(`${ENDPOINTS.USER}/me`),

    getProfile: (uid: string) =>
      apiClient(`${ENDPOINTS.USER}/profile/${uid}`),

    updateProfile: (data: any) => apiClient(`${ENDPOINTS.USER}/profile/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

    // ADMINISTATOR MANAGEMENT //
    updateUserRole: (targetUid: string, role: string) =>
      apiClient(`${ENDPOINTS.USER}/admin/update-role`, {
        method: 'POST',
        body: JSON.stringify({ uid: targetUid, role })
      }),

    getAllUsers: () =>
      apiClient(`${ENDPOINTS.USER}/all-users`),

    getUserById: (uid: string) =>
      apiClient(`${ENDPOINTS.USER}/admin/user/${uid}`),
  },


  // CROP MANAGEMENT //
  crop: {
    getAll: () => apiClient(`${ENDPOINTS.CROP}/list-all`),

    getById: (id: string) => apiClient(`${ENDPOINTS.CROP}/${id}`),

    addCrop: (data: any) =>
      apiClient(`${ENDPOINTS.CROP}/add`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    updateCrop: (id: string, data: any) =>
      apiClient(`${ENDPOINTS.CROP}/update/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),

    updateCropStatus: (id: string) =>
      apiClient(`${ENDPOINTS.CROP}/toggle/${id}`, {
        method: 'POST',
      }),

    deleteCrop: (id: string) =>
      apiClient(`${ENDPOINTS.CROP}/delete/${id}`, {
        method: 'DELETE',
      }),

  },


  // WEATHER MANAGEMENT //
  weather: {
    getCurrentWeather: (lat: number, lon: number) =>
      apiClient(`${ENDPOINTS.WEATHER}/get-weather/?lat=${lat}&lon=${lon}`),
  },

  // SOIL MANAGEMENT //
  soil: {
    getSoilMedia: () => apiClient(`${ENDPOINTS.SOIL}/soil_media`),
  },
};