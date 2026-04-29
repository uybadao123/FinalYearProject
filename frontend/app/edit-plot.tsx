// app/edit-plot.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { api } from '../src/api/api';

export default function EditPlotScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [crops, setCrops] = useState<any[]>([]);
  const [soilMediaOptions, setSoilMediaOptions] = useState<string[]>([]);

  // Form states initialized from params
  const [plotName, setPlotName] = useState(params.plot_name as string || '');
  const [media, setMedia] = useState(params.growing_media as string || 'Soil Mix');
  const [volume, setVolume] = useState(params.pot_volume?.toString() || '');
  const [selectedCrop, setSelectedCrop] = useState<string | null>(params.crop_id as string || null);

  useEffect(() => {
    // Fetch static data from Backend for user to reselect if desired
    Promise.all([api.crop.getAll(), api.soil.getSoilMedia()])
      .then(([cropData, soilData]) => {
        setCrops(cropData);
        setSoilMediaOptions(Object.keys(soilData));
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const handleUpdate = async () => {
    if (!plotName || !volume || !selectedCrop) return Alert.alert("Notification", "Please do not leave core information blank.");

    setIsSaving(true);
    try {
      // Call API to update plot
      await api.garden.updatePlot(params.id as string, {
        plot_name: plotName.trim(),
        crop_id: selectedCrop,
        pot_volume: parseFloat(volume),
        growing_media: media
      });
      Alert.alert("Success", "Plot information has been synchronized.");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#1B5E20" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="close" size={24} color="#1B5E20" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Plot</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Identification Name</Text>
          <TextInput style={styles.input} value={plotName} onChangeText={setPlotName} />
        </View>

        <Text style={styles.label}>Crop Type</Text>
        <View style={styles.grid}>
          {crops.map(crop => (
            <TouchableOpacity
              key={crop.id}
              style={[styles.cropItem, selectedCrop === crop.id && styles.selectedCrop]}
              onPress={() => setSelectedCrop(crop.id)}
            >
              <Text style={[styles.cropText, selectedCrop === crop.id && styles.selectedCropText]}>{crop.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>Volume (Liters)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={volume} onChangeText={setVolume} />
          </View>
        </View>

        <Text style={styles.label}>Growing Media (Soil)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
          {soilMediaOptions.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, media === m && styles.selectedChip]}
              onPress={() => setMedia(m)}
            >
              <Text style={[styles.chipText, media === m && styles.selectedChipText]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>}
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
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { padding: 10, backgroundColor: '#E8F5E9', borderRadius: 14, marginRight: 15 },
  title: { fontSize: 24, fontWeight: '900', color: '#1B5E20' },
  label: { fontSize: 11, fontWeight: '800', color: '#95A5A6', marginBottom: 12, marginTop: 20, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#ECF0F1', borderRadius: 16, padding: 16, backgroundColor: '#fff', fontSize: 16, color: '#2C3E50' },
  inputGroup: { marginBottom: 10 },
  selectorScroll: { flexDirection: 'row', marginBottom: 5 },
  chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#ECF0F1' },
  selectedChip: { backgroundColor: '#E67E22', borderColor: '#E67E22' },
  chipText: { color: '#7F8C8D', fontSize: 13, fontWeight: '700' },
  selectedChipText: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cropItem: { width: '48%', padding: 15, borderRadius: 18, borderWidth: 1, borderColor: '#ECF0F1', backgroundColor: '#fff', alignItems: 'center', marginBottom: 12 },
  selectedCrop: { borderColor: '#1B5E20', backgroundColor: '#E8F5E9', borderWidth: 2 },
  cropText: { fontSize: 13, color: '#34495E', textAlign: 'center', fontWeight: '600' },
  selectedCropText: { color: '#1B5E20', fontWeight: 'bold' },
  row: { flexDirection: 'row', marginTop: 10 },
  saveBtn: { backgroundColor: '#1B5E20', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 35, elevation: 2 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});