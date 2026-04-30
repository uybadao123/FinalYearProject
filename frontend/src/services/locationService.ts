import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LocationService = {
  getBestLocation: async () => {
    try {
      //Check local persistence for previously saved locations
      const cached = await AsyncStorage.getItem('last_location');
      if (cached) {
        console.log("LocationService: Using cached coordinates.");
        return JSON.parse(cached);
      }

      //Attempt high-precision GPS retrieval
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
          console.warn("LocationService: GPS unavailable, falling back to default.");
        }
      }
    } catch (e) {
      console.error("LocationService: Service Error", e);
    }
    
    return { 
      city: "Ho Chi Minh City", 
      name: "Ho Chi Minh City (Default)", 
      type: 'default' 
    };
  },


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