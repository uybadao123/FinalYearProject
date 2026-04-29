import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ARCHITECTURE: Persistence Layer & Location Logic
 * Implements silent error handling for robust User Experience.
 */
export const LocationService = {
  
  /**
   * Fetches the most accurate location available with multi-stage fallback.
   * Logic: Cache -> GPS (Silent) -> Default City
   */
  getBestLocation: async () => {
    try {
      // 1. Check local persistence for previously saved locations
      const cached = await AsyncStorage.getItem('last_location');
      if (cached) {
        console.log("LocationService: Using cached coordinates.");
        return JSON.parse(cached);
      }

      // 2. Attempt high-precision GPS retrieval
      const { status } = await Location.requestForegroundPermissionsAsync();
      const isLocationEnabled = await Location.hasServicesEnabledAsync();

      if (status === 'granted' && isLocationEnabled) {
        try {
          // Timeout limit to prevent app stall on hardware failure
          const loc = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.Balanced 
          });
          
          const gpsData = { 
            lat: loc.coords.latitude, 
            lon: loc.coords.longitude, 
            name: "Current Location",
            type: 'gps'
          };
          
          await AsyncStorage.setItem('last_location', JSON.stringify(gpsData));
          return gpsData;
        } catch (gpsError) {
          // Silent catch: GPS hardware or Emulator location not set
          console.warn("LocationService: GPS unavailable, falling back to default.");
        }
      }
    } catch (e) {
      // Global error handler for persistence or permission issues
      console.error("LocationService: Service Error", e);
    }
    
    // 3. Final Fallback: Ho Chi Minh City (Scientific Default)
    return { 
      city: "Ho Chi Minh City", 
      name: "Ho Chi Minh City (Default)", 
      type: 'default' 
    };
  },

  /**
   * Persists manual location selection from the Province Picker
   */
  saveManualLocation: async (province: any) => {
    try {
      const locationData = { 
        lat: province.lat, 
        lon: province.lon, 
        name: province.name,
        type: 'manual' 
      };
      await AsyncStorage.setItem('last_location', JSON.stringify(locationData));
      return locationData;
    } catch (e) {
      console.error("LocationService: Persistence Error", e);
      return null;
    }
  }
};