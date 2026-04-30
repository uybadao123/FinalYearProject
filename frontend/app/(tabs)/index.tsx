// app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { auth } from '../../src/config/firebase';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/api';


export default function DashboardScreen() {
  // Router & Auth
  const router = useRouter();
  const user = auth.currentUser;
  if (!user) return router.push("/login");
  const hasInitialized = useRef(false);
  const weatherIntervalRef = useRef<any>(null);

  const [zones, setZones] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [featuredCrops, setFeaturedCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [weather, setWeather] = useState<any>({
    temp: '--',
    humidity: 0,
    condition: 'Loading...',
    recommendation: 'Analyzing conditions...',
    locationName: 'Loading location...',
    forecast: []
  });

  // Function to render weather icons based on condition text
  const getWeatherIcon = (condition: string, size: number = 24, color: string = "#1B5E20") => {
    const c = condition.toLowerCase();
    if (c.includes('sun') || c.includes('clear')) return <MaterialIcons name="wb-sunny" size={size} color={color} />;
    if (c.includes('cloud')) return <MaterialIcons name="cloud" size={size} color={color} />;
    if (c.includes('rain')) return <Ionicons name="rainy" size={size} color={color} />;
    return <MaterialIcons name="wb-cloudy" size={size} color={color} />;
  };


  const refreshDashboardData = useCallback(async (isManual: boolean = false) => {
    if (isManual) setRefreshing(true);

    await fetchWeatherUpdate();

    try {
      const results = await Promise.allSettled([
        api.garden.getAllGardenZones(),
        api.crop.getAll(),
        api.dss.syncDashboard()
      ]);

      const zonesData = results[0].status === 'fulfilled' ? results[0].value : [];
      const cropsData = results[1].status === 'fulfilled' ? results[1].value : [];
      const dssData = results[2].status === 'fulfilled' ? results[2].value : [];

      setZones(Array.isArray(zonesData) ? zonesData : []);
      setFeaturedCrops(Array.isArray(cropsData) ? cropsData.slice(0, 4) : []);
      setActivities(Array.isArray(dssData) ? dssData : []);

      results.forEach((res, index) => {
        if (res.status === 'rejected') {
          console.error(`Service ${index} failed:`, res.reason);
        }
      });

    } catch (error) {
      console.error("[Dashboard Sync Error]:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  /**
   * WEATHER UPDATE LOGIC
   */
  const fetchWeatherUpdate = useCallback(async () => {
    let lat = 10.7769;
    let lon = 106.6602;
    let readableAddress = "Ho Chi Minh City, Vietnam";

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getLastKnownPositionAsync({}) ||
          await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

        if (location) {
          lat = location.coords.latitude;
          lon = location.coords.longitude;
          const geoCode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
          if (geoCode.length > 0) {
            const place = geoCode[0];
            readableAddress = `${place.district || place.city || place.subregion}, ${place.region || place.isoCountryCode}`;
          }
        }
      }
    } catch (err) {
      console.warn("Location permission denied or error occurred. Using default location.");
    }

    try {
      // API call to fetch weather data based on the obtained coordinates
      const weatherData = await api.weather.getCurrentWeather(lat, lon);
      setWeather({
        temp: weatherData.temp,
        humidity: weatherData.humidity,
        condition: weatherData.condition,
        recommendation: weatherData.recommendation,
        locationName: readableAddress,
        forecast: weatherData.forecast || []
      });
    } catch (err) {
      console.error("[Weather Update Error]:", err);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialized.current) {
      refreshDashboardData();
      hasInitialized.current = true;
    }

    weatherIntervalRef.current = setInterval(() => fetchWeatherUpdate(), 3600000);

    return () => {
      if (weatherIntervalRef.current) clearInterval(weatherIntervalRef.current);
    };
  }, [refreshDashboardData, fetchWeatherUpdate]);


  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#1B5E20" />;


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refreshDashboardData(true)}
            colors={['#1B5E20']}
            tintColor="#1B5E20"
            title="Kéo xuống để tải lại"
            titleColor="#1B5E20"
          />
        }
      >

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Urban Farmer Dashboard</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.mainLabel}>CURRENT WEATHER CONDITION</Text>
          <TouchableOpacity onPress={() => fetchWeatherUpdate()} disabled={refreshing}>
            {refreshing ? (
              <ActivityIndicator size="small" color="#1B5E20" />
            ) : (
              <MaterialIcons name="refresh" size={18} color="#1B5E20" />
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.weatherCard, styles.shadow]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationName} numberOfLines={1}>
                <MaterialIcons name="location-on" size={14} color="#fff" /> {weather.locationName}
              </Text>
              <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
            </View>
            <MaterialIcons
              name={Number(weather.temp) > 30 ? "wb-sunny" : "cloud"}
              size={54}
              color="#FFD600"
            />
          </View>
          <Text style={styles.dssQuote}>"{weather.recommendation}"</Text>
          <View style={styles.weatherStatsRow}>
            <View style={styles.statItem}><Text style={styles.statLabel}>Humidity</Text><Text style={styles.statVal}>{weather.humidity}%</Text></View>
            <View style={styles.vDivider} />
            <View style={styles.statItem}><Text style={styles.statLabel}>Condition</Text><Text style={styles.statVal}>{weather.condition}</Text></View>
          </View>
        </View>

        <Text style={styles.mainLabel}>7-Day Forecast</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastContainer} contentContainerStyle={{ paddingRight: 20 }}>
          {weather.forecast.length > 0 ? (
            weather.forecast.map((item: any, index: number) => (
              <View key={index} style={styles.forecastItem}>
                <Text style={styles.forecastDay}>{item.day}</Text>
                <View style={styles.forecastIconBox}>
                  {getWeatherIcon(item.condition, 22, "#2E7D32")}
                </View>
                <Text style={styles.forecastTemp}>{item.temp}°</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyForecastText}>Loading forecast data...</Text>
          )}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Next Tasks</Text>
        </View>
        <View style={styles.activityBox}>
          {activities.length > 0 ? (
            <FlatList
              data={activities}
              horizontal
              keyExtractor={(item) => item.plot_id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.taskCard}
                  onPress={() => router.push({ pathname: "/plot-detail", params: { id: item.plot_id } })}
                >
                  <View style={styles.taskIcon}><MaterialIcons name="opacity" size={20} color="#E67E22" /></View>
                  <View>
                    <Text style={styles.taskTitle}>{item.plot_name}</Text>
                    <Text style={styles.taskSub}>Fertilizing: {item.recommendation.dosage}g NPK</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.optimalRow}>
              <Ionicons name="checkmark-circle" size={22} color="#2ECC71" />
              <Text style={styles.optimalText}>No tasks scheduled.</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Garden</Text>
          <TouchableOpacity onPress={() => router.push('/garden')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoneScroll}>
          <TouchableOpacity style={styles.newZoneBtn} onPress={() => router.push('/add-zone')}>
            <MaterialIcons name="add-location-alt" size={28} color="#1B5E20" />
            <Text style={styles.newZoneText}>Add Zone</Text>
          </TouchableOpacity>
          {zones.map(zone => (
            <TouchableOpacity key={zone.id} style={styles.zoneCard} onPress={() => router.push({ pathname: "/zone-detail", params: { zoneId: zone.id } })}>
              <MaterialIcons name="layers" size={24} color="#1B5E20" />
              <Text style={styles.zoneName} numberOfLines={1}>{zone.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Plant Handbook</Text>
        </View>
        <View style={styles.handbookPreview}>
          {featuredCrops.map(crop => (
            <TouchableOpacity key={crop.id} style={styles.cropLine} onPress={() => router.push({ pathname: "/crop-detail", params: { id: crop.id } })}>
              <FontAwesome5 name="leaf" size={14} color="#1B5E20" />
              <Text style={styles.cropNameText}>{crop.name}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#BDC3C7" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FBFCFC' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 25 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#1B5E20', justifyContent: 'center' },
  dateText: { fontSize: 14, color: '#95A5A6', marginTop: 2, justifyContent: 'center' },
  profileBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3
  },
  mainLabel: { fontSize: 10, fontWeight: '800', color: '#95A5A6', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1.2 },
  weatherCard: { backgroundColor: '#1B5E20', borderRadius: 28, padding: 22, marginBottom: 25 },
  locationName: { color: '#fff', fontSize: 13, opacity: 0.8, marginBottom: 4 },
  weatherTemp: { fontSize: 46, fontWeight: 'bold', color: '#fff' },
  dssQuote: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontStyle: 'italic', marginTop: 8, lineHeight: 18 },
  weatherStatsRow: { flexDirection: 'row', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, textTransform: 'uppercase' },
  statVal: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  vDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  forecastContainer: { marginBottom: 30, flexDirection: 'row' },
  forecastItem: { backgroundColor: '#fff', padding: 15, borderRadius: 20, marginRight: 12, alignItems: 'center', width: 75, borderWidth: 1, borderColor: '#F0F3F4' },
  forecastDay: { fontSize: 11, fontWeight: 'bold', color: '#95A5A6', marginBottom: 8 },
  forecastIconBox: { marginBottom: 8 },
  forecastTemp: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50' },
  emptyForecastText: { fontSize: 12, fontStyle: 'italic', color: '#BDC3C7', marginLeft: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  viewAll: { fontSize: 13, color: '#1B5E20', fontWeight: '700' },
  activityBox: { backgroundColor: '#fff', borderRadius: 24, padding: 15, borderWidth: 1, borderColor: '#F0F3F4', marginBottom: 25 },
  taskCard: { backgroundColor: '#FBFCFC', padding: 12, borderRadius: 18, marginRight: 12, width: 210, borderWidth: 1, borderColor: '#F0F3F4', flexDirection: 'row', alignItems: 'center' },
  taskIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  taskTitle: { fontSize: 13, fontWeight: 'bold', color: '#2C3E50' },
  taskSub: { fontSize: 11, color: '#E67E22', fontWeight: '800' },
  optimalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  optimalText: { marginLeft: 10, color: '#7F8C8D', fontSize: 13, fontStyle: 'italic' },
  zoneScroll: { marginBottom: 30 },
  newZoneBtn: { width: 120, height: 130, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderStyle: 'dashed', borderWidth: 2, borderColor: '#1B5E20' },
  newZoneText: { color: '#1B5E20', fontSize: 12, fontWeight: 'bold', marginTop: 8 },
  zoneCard: { width: 145, height: 130, borderRadius: 24, backgroundColor: '#fff', padding: 18, marginRight: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#F0F3F4' },
  zoneName: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50', marginTop: 10 },
  handbookPreview: { backgroundColor: '#fff', borderRadius: 24, padding: 15, borderWidth: 1, borderColor: '#F0F3F4' },
  cropLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F4F7F6' },
  cropNameText: { flex: 1, marginLeft: 15, fontSize: 14, color: '#2C3E50', fontWeight: '500' },
  shadow: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});