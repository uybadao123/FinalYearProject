// app/add-plot.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { db, auth } from '../src/config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../src/api/api';

export default function AddPlotScreen() {
  const router = useRouter();
  const { preselectedZoneId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [soilMediaOptions, setSoilMediaOptions] = useState<string[]>([]);

  const [plotName, setPlotName] = useState('');
  const [media, setMedia] = useState('Soil Mix');
  const [plotvolume, setPlotVolume] = useState('');
  const [selectedZone, setSelectedZone] = useState<string | null>((preselectedZoneId as string) || null);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return router.push("/login");

    const unsub = onSnapshot(query(collection(db, "garden_zones"), where("userId", "==", user.uid)), (snap) => {
      setZones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    Promise.allSettled([api.crop.getAll(), api.soil.getSoilMedia()]).then(([cropData, soilData]) => {
      const cropResult = cropData.status === 'fulfilled' ? cropData.value : null;
      const soilResult = soilData.status === 'fulfilled' ? soilData.value : null;

      setCrops(cropResult || []);
      setSoilMediaOptions(Object.keys(soilResult || {}));
      setLoading(false);

    }).catch(e => { console.error(e); setLoading(false); });

    return () => unsub();
  }, []);

  const handleSavePlot = async () => {
    if (!plotName || !media || !selectedZone || !selectedCrop || !plotvolume) return Alert.alert("Notification", "Please fill in all information.");
    setIsSaving(true);
    try {
      await api.garden.createPlot({
        userId: auth.currentUser?.uid,
        zone_id: selectedZone,
        plot_name: plotName,
        crop_id: selectedCrop,
        pot_volume: parseFloat(plotvolume),
        growing_media: media,
        start_date: startDate.toISOString(),
      });
      Alert.alert("Success", "New crop unit has been initialized.");
      router.back();
    } catch (e: any) { Alert.alert("Error", e.message); } finally { setIsSaving(false); }
  };

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#1B5E20" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-back" size={24} color="#1B5E20" /></TouchableOpacity>
          <Text style={styles.title}>Create New Plot</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Plot Name</Text>
          <TextInput style={styles.input} placeholder="Tomato Pot" value={plotName} onChangeText={setPlotName} />
        </View>

        <Text style={styles.label}>Planting Place</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
          {zones.map(zone => (
            <TouchableOpacity key={zone.id} style={[styles.chip, selectedZone === zone.id && styles.selectedChip]} onPress={() => setSelectedZone(zone.id)}>
              <Text style={[styles.chipText, selectedZone === zone.id && styles.selectedChipText]}>{zone.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Crop type</Text>
        <View style={styles.grid}>
          {crops.map(crop => (
            <TouchableOpacity key={crop.id} style={[styles.cropItem, selectedCrop === crop.id && styles.selectedCrop]} onPress={() => setSelectedCrop(crop.id)}>
              <Text style={[styles.cropText, selectedCrop === crop.id && styles.selectedCropText]}>{crop.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Pot Volume (Litter)</Text>
        <TextInput style={styles.input} placeholder="15.0" keyboardType="numeric" value={plotvolume} onChangeText={setPlotVolume} />

        <Text style={styles.label}>Grow Media</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
          {soilMediaOptions.map(m => (
            <TouchableOpacity key={m} style={[styles.chip, media === m && styles.selectedChip]} onPress={() => setMedia(m)}>
              <Text style={[styles.chipText, media === m && styles.selectedChipText]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Start day</Text>
        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar" size={20} color="#1B5E20" /><Text style={styles.dateText}>{startDate.toLocaleDateString('vi-VN')}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={startDate} mode="date" onChange={(e, d) => { setShowDatePicker(false); if (d) setStartDate(d); }} />
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSavePlot} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>CREATE PLOT</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FBFCFC' },
  container: { padding: 25 },
  center: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 10, backgroundColor: '#E8F5E9', borderRadius: 14, marginRight: 15 },
  title: { fontSize: 26, fontWeight: '900', color: '#1B5E20' },
  label: { fontSize: 13, fontWeight: '800', color: '#2C3E50', marginBottom: 12, marginTop: 20, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#ECF0F1', borderRadius: 18, padding: 18, backgroundColor: '#fff', fontSize: 15 },
  inputGroup: { marginBottom: 10 },
  selectorScroll: { flexDirection: 'row', marginBottom: 5 },
  chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#ECF0F1' },
  selectedChip: { backgroundColor: '#E67E22', borderColor: '#E67E22' },
  chipText: { color: '#7F8C8D', fontSize: 13, fontWeight: '700' },
  selectedChipText: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cropItem: { width: '48%', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#ECF0F1', backgroundColor: '#fff', alignItems: 'center', marginBottom: 12 },
  selectedCrop: { borderColor: '#1B5E20', backgroundColor: '#E8F5E9', borderWidth: 2 },
  cropText: { fontSize: 14, color: '#34495E', textAlign: 'center' },
  selectedCropText: { color: '#1B5E20', fontWeight: 'bold' },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECF0F1' },
  dateText: { marginLeft: 12, color: '#1B5E20', fontWeight: '700', fontSize: 15 },
  saveBtn: { backgroundColor: '#1B5E20', padding: 20, borderRadius: 22, alignItems: 'center', marginTop: 35 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});