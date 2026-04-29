// app/zone-details.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';
import { api } from '../src/api/api';


export default function ZoneDetailsScreen() {
  const { zoneId } = useLocalSearchParams();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [zoneData, setZoneData] = useState<any>(null);
  const [plots, setPlots] = useState<any[]>([]);
  const [zoneWeather, setZoneWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getWeatherIcon = (condition: string = "") => {
    const c = condition.toLowerCase();
    if (c.includes('rain')) return <Ionicons name="rainy" size={20} color="#1B5E20" />;
    if (c.includes('cloud')) return <MaterialIcons name="cloud" size={20} color="#1B5E20" />;
    return <MaterialIcons name="wb-sunny" size={20} color="#F39C12" />;
  };

  const fetchZoneWeather = async (lat: number, lon: number, exposure: string) => {
    try {
      const weatherData = await api.weather.getCurrentWeather(lat, lon);
      setZoneWeather(weatherData);
      setForecast(weatherData.forecast || []);

      const newAlerts = [];
      if (weatherData.temp > 33) {
        newAlerts.push({
          type: 'heat',
          icon: 'warning',
          msg: `Heat alert: ${weatherData.temp}°C. ${exposure === 'full_sun' ? 'Direct sunlight - increase watering.' : 'Check ventilation.'}`,
          color: '#E67E22'
        });
      }
      if (weatherData.condition.toLowerCase().includes('rain')) {
        newAlerts.push({
          type: 'rain',
          icon: 'water',
          msg: "Rain alert: lowering watering frequency to prevent overwatering.",
          color: '#3498DB'
        });
      }
      setAlerts(newAlerts);
    } catch (e) {
      console.error("[Zone Weather Sync Error]:", e);
    }

  };

  const loadData = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      
      const zone = await api.garden.getGardenZoneById(zoneId as string);
      const zoneDataFinal = zone?.name ? zone : zone?.data;
      setZoneData(zoneDataFinal);

      const plotsList = await api.garden.getAllPlots();
      setPlots(plotsList.filter((p: any) => p.zone_id === zoneId));

      if (zoneDataFinal?.latitude) {
        await fetchZoneWeather(zoneDataFinal.latitude, zoneDataFinal.longitude, zoneDataFinal.type);
      }
    } catch (error) {
      console.error("Fetch Weather Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    if (zoneId) loadData();
  }, [zoneId]);


  const deletePlot = async (plotId: string) => {
    await api.garden.deletePlot(plotId);
    loadData();
  }

  const navigateToAddPlot = () => {
    router.push({ pathname: '/add-plot', params: { preselectedZoneId: zoneId } });
  };



  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1B5E20" />
      <Text style={{ marginTop: 10, color: '#95A5A6' }}></Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="chevron-left" size={28} color="#1B5E20" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.title} numberOfLines={1}>{zoneData?.name || "Khu vực"}</Text>
          <Text style={styles.subtitle}>Environmental Command Center</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }>

        {/* WEATHER CARD */}
        <View style={[styles.climateCard, styles.shadow]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.climateLabel}>ENVIRONMENT </Text>
              <Text style={styles.climateAddress} numberOfLines={1}>
                <Entypo name="location-pin" size={10} color="rgba(255,255,255,0.7)" /> {zoneData?.address || "Saved location"}
              </Text>
              <Text style={styles.climateTemp}>{zoneWeather?.temp || '--'}°C</Text>
              <Text style={styles.climateCondition}>{zoneWeather?.condition || 'Syncing...'}</Text>
            </View>
            <View style={styles.exposureBadge}>
              <MaterialIcons
                name={zoneData?.type === 'rooftop' ? 'home-work' : 'deck'}
                size={22} color="#F39C12"
              />
              <Text style={styles.exposureText}>{zoneData?.type}</Text>
            </View>
          </View>
        </View>

        {/* 7-DAY FORECAST */}
        <Text style={styles.sectionLabel}>7-DAY FORECAST</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastContainer} contentContainerStyle={{ paddingRight: 20 }}>
          {forecast.map((day, index) => (
            <View key={index} style={[styles.forecastItem, styles.shadowSmall]}>
              <Text style={styles.forecastDay}>{day.day}</Text>
              <View style={styles.forecastIconBox}>{getWeatherIcon(day.condition)}</View>
              <Text style={styles.forecastTemp}>{Math.round(day.temp)}°</Text>
            </View>
          ))}
        </ScrollView>

        {/* DSS ALERTS */}
        {alerts.length > 0 && (
          <View style={styles.alertSection}>
            {alerts.map((alert, i) => (
              <View key={i} style={[styles.alertBar, { backgroundColor: alert.color }]}>
                <Ionicons name={alert.icon as any} size={18} color="#fff" />
                <Text style={styles.alertText}>{alert.msg}</Text>
              </View>
            ))}
          </View>
        )}

        {/* PLOTS LIST */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Plot ({plots.length})</Text>
          <TouchableOpacity style={styles.addSmallBtn} onPress={navigateToAddPlot}>
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {plots.map(item => (
          <View key={item.id} style={[styles.plotCard, styles.shadow]}>
            <TouchableOpacity
              style={styles.plotMainContent}
              onPress={() => router.push({ pathname: "/plot-detail", params: { id: item.id } })}
            >
              <View style={styles.iconBox}>
                <FontAwesome5 name="leaf" size={18} color="#1B5E20" />
              </View>
              <View style={styles.info}>
                <Text style={styles.plotName}>{item.plot_name}</Text>
              </View>
            </TouchableOpacity>

            {/* EDIT PLOT BUTTON */}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push({ pathname: "/edit-plot", params: { ...item } })}
            >
              <MaterialIcons name="edit" size={20} color="#1B5E20" />
            </TouchableOpacity>

            {/* DELETE PLOT BUTTON */}
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: '#FDEDEC', marginLeft: 10 }]}
              onPress={() => Alert.alert(
                "Delete Plot",
                "Are you sure you want to delete this plot? This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deletePlot(item.id) }
                ]
              )}
            >
              <MaterialIcons name="delete" size={20} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        ))}

        {plots.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome5 name="seedling" size={42} color="#BDC3C7" />
            <Text style={styles.emptyTitle}>No crops in this area</Text>
            <TouchableOpacity style={styles.plantBtn} onPress={navigateToAddPlot}>
              <Text style={styles.plantBtnText}>Add a crop</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFCFC', paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 55, marginBottom: 20 },
  backBtn: { width: 44, height: 44, backgroundColor: '#E8F5E9', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#1B5E20' },
  subtitle: { fontSize: 11, color: '#95A5A6', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  climateCard: { backgroundColor: '#1B5E20', borderRadius: 28, padding: 22, marginBottom: 20, marginTop: 5 },
  climateLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  climateAddress: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginVertical: 6, opacity: 0.9 },
  climateTemp: { color: '#fff', fontSize: 42, fontWeight: 'bold', marginVertical: 2 },
  climateCondition: { color: '#fff', fontSize: 15, opacity: 0.9, fontWeight: '600', textTransform: 'capitalize' },
  exposureBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, alignItems: 'center' },
  exposureText: { color: '#fff', fontSize: 9, fontWeight: 'bold', marginTop: 5, textTransform: 'uppercase' },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#95A5A6', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1.2 },
  forecastContainer: { marginBottom: 25, flexDirection: 'row' },
  forecastItem: { backgroundColor: '#fff', padding: 15, borderRadius: 20, marginRight: 12, alignItems: 'center', width: 75, borderWidth: 1, borderColor: '#F0F3F4' },
  forecastDay: { fontSize: 11, fontWeight: 'bold', color: '#95A5A6', marginBottom: 8 },
  forecastIconBox: { marginBottom: 8 },
  forecastTemp: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50' },
  alertSection: { marginBottom: 15 },
  alertBar: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, marginBottom: 10 },
  alertText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 10, flex: 1, lineHeight: 17 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
  sectionTitle: { fontSize: 19, fontWeight: 'bold', color: '#2C3E50' },
  addSmallBtn: { backgroundColor: '#1B5E20', width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  plotCard: {
    backgroundColor: '#fff', borderRadius: 24, marginBottom: 14,
    borderWidth: 1, borderColor: '#F0F3F4', flexDirection: 'row',
    alignItems: 'center', paddingRight: 15
  },
  plotMainContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 18 },
  editBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F4F7F6',
    justifyContent: 'center', alignItems: 'center'
  },

  iconBox: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 15 },
  plotName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  plotMeta: { fontSize: 12, color: '#95A5A6', marginTop: 4 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 14, color: '#BDC3C7', marginTop: 15, fontWeight: '500' },
  plantBtn: { backgroundColor: '#1B5E20', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18, marginTop: 20 },
  plantBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  shadow: { shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  shadowSmall: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});