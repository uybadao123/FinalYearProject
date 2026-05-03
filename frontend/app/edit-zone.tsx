// app/edit-zone.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator, Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { api } from '../src/api/api';

const ZONE_TYPES = [
  { id: 'frontyard', label: 'Frontyard', icon: 'fence' },
  { id: 'rooftop', label: 'Rooftop', icon: 'home-work' },
  { id: 'backyard', label: 'Backyard', icon: 'fence' },
  { id: 'balcony', label: 'Balcony', icon: 'deck' },
];

export default function EditZoneScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  const [name, setName] = useState(params.name as string || '');
  const [description, setDescription] = useState(params.description as string || '');
  const [zoneType, setZoneType] = useState(params.type as string || 'rooftop');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lon: number, address: string } | null>(
    params.latitude ? {
      lat: Number(params.latitude),
      lon: Number(params.longitude),
      address: params.address as string || "Current Location"
    } : null
  );
  const [showMap, setShowMap] = useState(false);
  const [tempCoords, setTempCoords] = useState({
    latitude: params.latitude ? Number(params.latitude) : 10.7626,
    longitude: params.longitude ? Number(params.longitude) : 106.6602
  });


  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.garden.getGardenZoneById(params.id as string);
      const zoneData = res?.name ? res : res?.data;
      if (!zoneData) {
        throw new Error("Invalid data format received from API");
      }
      setName(zoneData.name || "");
      setDescription(zoneData.description || "");
      setZoneType(zoneData.type || "rooftop");

      if (zoneData.latitude && zoneData.longitude) {
        const lat = Number(zoneData.latitude);
        const lon = Number(zoneData.longitude);

        setLocation({
          lat: lat,
          lon: lon,
          address: zoneData.address || "Current Location"
        });
        setTempCoords({ latitude: lat, longitude: lon });
      }

    } catch (e) {
      console.error("Fetch Data Error:", e);
      Alert.alert("Error", "Unable to load garden data.");

    } finally {
      setIsLoading(false);
    }
  }, [params.id]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const resolveAddress = async (lat: number, lon: number) => {
    try {
      const geoCode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (geoCode.length > 0) {
        const p = geoCode[0];
        return `${p.streetNumber || ''} ${p.street || ''}, ${p.subregion || p.district}, ${p.city || p.region}`.replace(/^\s*,\s*/, '').trim();
      }
    } catch (e) { console.error(e); }
    return "Custom Location";
  };

  const handleUpdate = async () => {
    if (!name.trim()) return Alert.alert("Notification", "Please enter the zone name.");

    setIsSaving(true);
    try {
      await api.garden.updateZone(params.id as string, {
        name: name.trim(),
        description: description.trim(),
        type: zoneType,
        latitude: location?.lat,
        longitude: location?.lon,
      });
      Alert.alert("Success", "Information has been updated.");
      router.back();
    } catch (e: any) {
      Alert.alert("Update Error", e.message || "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text style={{ marginTop: 10, color: '#95A5A6' }}>Loading data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#1B5E20" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Garden</Text>
        </View>

        {/* CURRENT LOCATION */}
        <Text style={styles.label}>Location & Coordinates</Text>
        <View style={styles.locationInfoBox}>
          <View style={styles.locationRow}>
            <Entypo name="location-pin" size={22} color="#E64A19" />
            <Text style={styles.addressDisplay} numberOfLines={2}>
              {location?.address || "Location not determined"}
            </Text>
          </View>
          {location && (
            <Text style={styles.coordDisplay}>GPS: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}</Text>
          )}
          <TouchableOpacity style={styles.changeLocBtn} onPress={() => setShowMap(true)}>
            <Text style={styles.changeLocText}>CHANGE LOCATION ON MAP</Text>
          </TouchableOpacity>
        </View>

        {/* GARDEN TYPE */}
        <Text style={styles.label}>Garden Type</Text>
        <View style={styles.typeGrid}>
          {ZONE_TYPES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.typeOption, zoneType === item.id && styles.selectedType]}
              onPress={() => setZoneType(item.id)}
            >
              <MaterialIcons
                name={item.icon as any}
                size={24}
                color={zoneType === item.id ? '#fff' : '#1B5E20'}
              />
              <Text style={[styles.typeText, zoneType === item.id && styles.selectedTypeText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* INPUTS */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Garden Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter garden name..."
          />

          <Text style={[styles.label, { marginTop: 20 }]}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="E.g.: Sunny, spacious..."
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* MAP MODAL */}
      <Modal visible={showMap} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: tempCoords.latitude,
              longitude: tempCoords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005
            }}
            onPress={(e) => setTempCoords(e.nativeEvent.coordinate)}
          >
            <Marker coordinate={tempCoords} draggable />
          </MapView>

          <View style={styles.mapOverlay}>
            <TouchableOpacity
              style={styles.mapConfirm}
              onPress={async () => {
                const addr = await resolveAddress(tempCoords.latitude, tempCoords.longitude);
                setLocation({ lat: tempCoords.latitude, lon: tempCoords.longitude, address: addr });
                setShowMap(false);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>CONFIRM THIS LOCATION</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapCancel} onPress={() => setShowMap(false)}>
              <Text style={{ color: '#7F8C8D', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FBFCFC' },
  container: { padding: 25 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { padding: 8, backgroundColor: '#E8F5E9', borderRadius: 12, marginRight: 15 },
  title: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },
  label: { fontSize: 11, fontWeight: '800', color: '#95A5A6', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  locationInfoBox: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 25, borderWidth: 1, borderColor: '#ECF0F1', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  addressDisplay: { flex: 1, marginLeft: 10, fontSize: 14, color: '#2C3E50', fontWeight: '600' },
  coordDisplay: { fontSize: 11, color: '#95A5A6', marginTop: 8, marginLeft: 32 },
  changeLocBtn: { marginTop: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F4F7F6', alignItems: 'center' },
  changeLocText: { color: '#1B5E20', fontSize: 11, fontWeight: '900' },
  inputGroup: { marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ECF0F1', borderRadius: 16, padding: 16, fontSize: 16, backgroundColor: '#fff', color: '#2C3E50' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  typeOption: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 20, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#ECF0F1' },
  selectedType: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  typeText: { fontSize: 12, fontWeight: '600', color: '#1B5E20', marginTop: 8 },
  selectedTypeText: { color: '#fff' },
  saveBtn: { backgroundColor: '#1B5E20', padding: 20, borderRadius: 18, alignItems: 'center', elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  mapOverlay: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  mapConfirm: { backgroundColor: '#1B5E20', padding: 18, borderRadius: 18, width: '100%', alignItems: 'center', marginBottom: 10, elevation: 5 },
  mapCancel: { backgroundColor: '#fff', padding: 12, borderRadius: 15, width: '40%', alignItems: 'center', borderWidth: 1, borderColor: '#ECF0F1' }
});