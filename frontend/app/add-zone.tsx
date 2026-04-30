// app/add-zone.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Modal, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, Entypo, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../src/config/firebase';
import { api } from '../src/api/api';

const STORAGE_KEY = '@recent_locations';
const ZONE_TYPES = [
  { id: 'frontyard', label: 'Frontyard', icon: 'fence' },
  { id: 'rooftop', label: 'Rooftop', icon: 'home-work' },
  { id: 'backyard', label: 'Backyard', icon: 'fence' },
  { id: 'balcony', label: 'Balcony', icon: 'deck' },
];

export default function AddZoneScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [zoneType, setZoneType] = useState('rooftop');
  const [isSaving, setIsSaving] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lon: number, address: string } | null>(null);
  // const [isLocating, setIsLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tempCoords, setTempCoords] = useState({ latitude: 10.7626, longitude: 106.6602 });

  useEffect(() => { loadRecentSearches(); }, []);


  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (e) { console.error(e); }
  };


  const resolveAddress = async (lat: number, lon: number) => {
    try {
      const geoCode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });

      if (geoCode && geoCode.length > 0) {
        const p = geoCode[0];

        const street = p.street ? `${p.street}, ` : "";
        const district = p.district || p.subregion || "";
        const city = p.city || p.region || "";

        const address = `${p.name || ''} ${street}${district}, ${city}`.trim();

        return address.replace(/^,|,$/g, '').trim() || "Unknow Location";
      }
    } catch (e) {
      console.error("Resolve Address Error:", e);
    }
    return "Pointed Location";
  };


  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) return;
    try {
      setIsSearching(true); Keyboard.dismiss();
      const result = await Location.geocodeAsync(searchQuery);
      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        setTempCoords({ latitude, longitude });
        mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 1000);
      } else { Alert.alert("Error", "Address not found."); }
    } catch (e) { Alert.alert("Error", "Map service encountered an issue."); } finally { setIsSearching(false); }
  };

  // const handleAutoLocation = async () => {
  //   try {
  //     let enabled = await Location.hasServicesEnabledAsync();
  //     if (!enabled) {
  //       return Alert.alert("Error", "Please enable GPS on your phone.");
  //     }

  //     setIsLocating(true);
  //     let { status } = await Location.requestForegroundPermissionsAsync();
  //     if (status !== 'granted') return Alert.alert("Denied", "Location access permission required.");
      
  //     const pos = await Location.getCurrentPositionAsync({
  //       accuracy: Location.Accuracy.Balanced,
  //       timeInterval: 5000,
  //     });

  //     const address = await resolveAddress(pos.coords.latitude, pos.coords.longitude);
  //     setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, address });
  //   } catch (e) { Alert.alert("Error", "Unable to get GPS."); } finally { setIsLocating(false); }
  

    const handleSaveZone = async () => {
    if (!name.trim() || !location) return Alert.alert("Error", "Please complete the required fields.");
    setIsSaving(true);
    try {
      await api.garden.createZone({
        userId: auth.currentUser?.uid,
        name: name.trim(),
        description: description.trim(),
        latitude: location.lat,
        longitude: location.lon,
        type: zoneType
      });
      router.back();
    } catch (e: any) { Alert.alert("Error", e.message); } finally { setIsSaving(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-back" size={24} color="#1B5E20" /></TouchableOpacity>
          <Text style={styles.title}>New Zone</Text>
        </View>

        <Text style={styles.label}>Location</Text>
        <View style={styles.locationContainer}>
          {/*
          <TouchableOpacity style={styles.locationActionBtn} onPress={handleAutoLocation}>
            {isLocating ? <ActivityIndicator size="small" color="#1B5E20" /> : <><MaterialIcons name="gps-fixed" size={20} color="#1B5E20" /><Text style={styles.locationActionText}>GPS tự động</Text></>}
          </TouchableOpacity>
          */}
          <TouchableOpacity style={[styles.locationActionBtn, { borderColor: '#2E7D32' }]} onPress={() => setShowMap(true)}>
            <MaterialIcons name="map" size={18} color="#2E7D32" /><Text style={[styles.locationActionText, { color: '#2E7D32' }]}>Pick the zone location</Text>
          </TouchableOpacity>
        </View>

        {location && (
          <View style={styles.addressDisplay}>
            <Entypo name="location-pin" size={18} color="#E64A19" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.addressText} numberOfLines={1}>{location.address}</Text>
              <Text style={styles.coordText}>{location.lat.toFixed(4)}, {location.lon.toFixed(4)}</Text>
            </View>
            <TouchableOpacity onPress={() => setLocation(null)}><MaterialIcons name="cancel" size={20} color="#BDC3C7" /></TouchableOpacity>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} placeholder="Son's Balcony, Rooftop,..." value={name} onChangeText={setName} />
        </View>

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeGrid}>
          {ZONE_TYPES.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.typeOption, zoneType === item.id && styles.selectedType]} onPress={() => setZoneType(item.id)}>
              <MaterialIcons name={item.icon as any} size={28} color={zoneType === item.id ? '#fff' : '#1B5E20'} />
              <Text style={[styles.typeText, zoneType === item.id && styles.selectedTypeText]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, { height: 100 }]} placeholder="Description of the zone" value={description} onChangeText={setDescription} multiline />
        </View>



        <TouchableOpacity style={styles.saveButton} onPress={handleSaveZone} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>CREATE</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showMap} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView ref={mapRef} style={{ flex: 1 }} provider={PROVIDER_GOOGLE} initialRegion={{ ...tempCoords, latitudeDelta: 0.01, longitudeDelta: 0.01 }} onPress={(e) => setTempCoords(e.nativeEvent.coordinate)}><Marker coordinate={tempCoords} /></MapView>
          <SafeAreaView style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#7F8C8D" style={{ marginLeft: 15 }} />
              <TextInput style={styles.searchInput} placeholder="Tìm địa chỉ..." value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearchAddress} />
              {isSearching ? <ActivityIndicator size="small" style={{ marginRight: 15 }} /> : <TouchableOpacity onPress={handleSearchAddress}><Text style={styles.searchBtnText}>Tìm</Text></TouchableOpacity>}
            </View>
          </SafeAreaView>
          <View style={styles.mapOverlay}>
            <View style={styles.mapActions}>
              <TouchableOpacity style={styles.mapCancel} onPress={() => setShowMap(false)}><Text style={{ color: '#E64A19', fontWeight: 'bold' }}>Quay lại</Text></TouchableOpacity>
              <TouchableOpacity style={styles.mapConfirm} onPress={async () => {
                const addr = await resolveAddress(tempCoords.latitude, tempCoords.longitude);
                setLocation({ lat: tempCoords.latitude, lon: tempCoords.longitude, address: addr });
                setShowMap(false);
              }}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm Location</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FBFCFC' },
  container: { padding: 25 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#E8F5E9', borderRadius: 12, marginRight: 15 },
  title: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },
  label: { fontSize: 13, fontWeight: '700', color: '#7F8C8D', marginBottom: 12, textTransform: 'uppercase' },
  locationContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  locationActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '48%', padding: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#1B5E20' },
  locationActionText: { marginLeft: 8, fontSize: 12, fontWeight: 'bold', color: '#1B5E20' },
  addressDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: '#F0F3F4' },
  addressText: { fontSize: 13, color: '#2C3E50', fontWeight: '600' },
  coordText: { fontSize: 11, color: '#95A5A6' },
  inputGroup: { marginBottom: 25 },
  input: { borderWidth: 1, borderColor: '#F0F3F4', borderRadius: 16, padding: 16, fontSize: 16, backgroundColor: '#fff' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  typeOption: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 20, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#F0F3F4' },
  selectedType: { backgroundColor: '#1B5E20' },
  typeText: { fontSize: 12, fontWeight: '600', color: '#1B5E20', marginTop: 8 },
  selectedTypeText: { color: '#fff' },
  saveButton: { backgroundColor: '#1B5E20', padding: 18, borderRadius: 18, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  searchBarContainer: { position: 'absolute', top: 20, width: '100%', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', width: '90%', height: 50, borderRadius: 15, elevation: 5 },
  searchInput: { flex: 1, paddingHorizontal: 15, fontSize: 14 },
  searchBtnText: { marginRight: 15, color: '#1B5E20', fontWeight: 'bold' },
  mapOverlay: { position: 'absolute', bottom: 40, width: '100%', paddingHorizontal: 20 },
  mapActions: { flexDirection: 'row', justifyContent: 'space-between' },
  mapCancel: { backgroundColor: '#fff', padding: 18, borderRadius: 18, width: '25%', alignItems: 'center' },
  mapConfirm: { backgroundColor: '#1B5E20', padding: 18, borderRadius: 18, width: '70%', alignItems: 'center' }
});