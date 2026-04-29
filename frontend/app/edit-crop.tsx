import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, Alert, ActivityIndicator, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import { uploadImage } from '../src/api/image';
import { api } from '../src/api/api';
import { auth } from '@/src/config/firebase';
import * as ImagePicker from 'expo-image-picker';

export default function EditCropScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  
  if (!user) {
    Alert.alert("Unauthorized", "Please log in to edit crop information.");
    router.push('/login');
    return null;
  }
  
  const { id } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const isStaff = ['admin','content_collaborator'].includes(userRole);
  
  const [form, setForm] = useState<any>({
    name: '',
    family: '',
    description: '',
    image_url: '', // Thêm field này để lưu link ảnh
    status: 'pending',
    growth_timeline: { 
      seedling_end: 14, 
      vegetative_end: 40, 
      flowering_end: 60, 
      total_lifecycle: 90 
    },
    stage_factors: {
      seedling: { n: 0, p: 0, k: 0 },
      vegetative: { n: 0, p: 0, k: 0 },
      flowering: { n: 0, p: 0, k: 0 },
      fruiting: { n: 0, p: 0, k: 0 }
    },
    stage_frequency: {
      seedling: 3,
      vegetative: 7,
      flowering: 5,
      fruiting: 7
    },
    specific_deficiencies: [],
  });

  useEffect(() => {
    if (id) fetchCropData();
  }, [id]);

  const fetchCropData = async () => {
    try {
      setLoading(true);
      const data = await api.crop.getById(id as string);
      setForm({ ...form, ...data });
      
      // Fetch user role
      const profile = await api.user.getMyProfile();
      const role = typeof profile === 'object' ? profile.role : profile;
      setUserRole(role || 'user');
    } catch (error) {
      Alert.alert("Error", "Unable to load crop information.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need gallery access to perform this action!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9], // Horizontal aspect ratio for crop images
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.family) {
      Alert.alert("Missing Information", "Please enter the crop name and family.");
      return;
    }

    try {
      setSaving(true);
      
      let finalImageUrl = form.image_url;

      // If user selected a new image, upload to Cloudinary first
      if (image) {
        const uploadedUrl = await uploadImage(image);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const updatedForm = { ...form, image_url: finalImageUrl };
      await api.crop.updateCrop(id as string, updatedForm);
      
      Alert.alert("Success", "Crop information updated successfully.");
      router.back();

    } catch (error: any) {
      const errMsg = error.message || "Error saving data.";
      Alert.alert("Save Error", errMsg);
    } finally {
      setSaving(false);
    }
  };

  // ... (Các hàm addDeficiency, updateDeficiency, updateStageFactor giữ nguyên)
  const addDeficiency = () => {
    const newDeficiency = { element: '', symptoms: '', solution: '' };
    setForm({ ...form, specific_deficiencies: [...form.specific_deficiencies, newDeficiency] });
  };
  const removeDeficiency = (index: number) => {
    const newList = [...form.specific_deficiencies];
    newList.splice(index, 1);
    setForm({ ...form, specific_deficiencies: newList });
  };
  const updateDeficiency = (index: number, field: string, value: string) => {
    const newList = [...form.specific_deficiencies];
    newList[index] = { ...newList[index], [field]: value };
    setForm({ ...form, specific_deficiencies: newList });
  };

  const addStageFactor = (stage: string, element: string, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
    setForm({
      ...form,
      stage_factors: {
        ...form.stage_factors,
        [stage]: {
          ...form.stage_factors[stage],
          [element]: value
        }
      }
    });
  }
  };


  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#27AE60" /></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Crop</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#27AE60" /> : <Text style={styles.saveText}>SAVE</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* CROP IMAGE SELECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crop Image</Text>
          <TouchableOpacity onPress={pickImage} style={styles.imagePickerCard}>
            {image || form.image_url ? (
              <Image source={{ uri: image || form.image_url }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={32} color="#BDC3C7" />
                <Text style={styles.placeholderText}>Tap to add image</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <MaterialIcons name="edit" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <Text style={styles.label}>Crop Name</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({...form, name: t})} />
          <Text style={styles.label}>Family</Text>
          <TextInput style={styles.input} value={form.family} onChangeText={(t) => setForm({...form, family: t})} />
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, {height: 80}]} multiline value={form.description} onChangeText={(t) => setForm({...form, description: t})} />
        </View>


        {/* Deficiency Diagnosis */}
        <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={styles.sectionTitle}>Deficiency Diagnosis</Text>
            <TouchableOpacity onPress={addDeficiency} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color="#27AE60" />
            </TouchableOpacity>
          </View>

          {form.specific_deficiencies.map((item: any, index: number) => (
            <View key={index} style={styles.deficiencyCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIndex}>Symptom #{index + 1}</Text>
                <TouchableOpacity onPress={() => removeDeficiency(index)}>
                  <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Element Name (e.g., Nitrogen)</Text>
              <TextInput 
                style={styles.input}
                value={item.element}
                onChangeText={(v) => updateDeficiency(index, 'element', v)}
                placeholder="Example: Nitrogen (N)"
              />

              <Text style={styles.label}>Symptoms</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]}
                multiline
                value={item.symptoms}
                onChangeText={(v) => updateDeficiency(index, 'symptoms', v)}
                placeholder="Describe symptoms like yellowing leaves, bud wilting..."
              />

              <Text style={styles.label}>Solution</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]}
                multiline
                value={item.solution}
                onChangeText={(v) => updateDeficiency(index, 'solution', v)}
                placeholder="Remedial actions: Add more fertilizer..."
              />
            </View>
          ))}
        </View>

        {/* Growth Timeline Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Timeline (Days)</Text>
          <View style={styles.row}>
            <View style={{flex: 1, marginRight: 10}}>
              <Text style={styles.subLabel}>Seedling End</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric"
                value={String(form.growth_timeline.seedling_end)} 
                onChangeText={(t) => setForm({...form, growth_timeline: {...form.growth_timeline, seedling_end: parseInt(t)||0}})} 
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.subLabel}>Vegetative End</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric"
                value={String(form.growth_timeline.vegetative_end)} 
                onChangeText={(t) => setForm({...form, growth_timeline: {...form.growth_timeline, vegetative_end: parseInt(t)||0}})} 
              />
            </View>
          </View>
        </View>

        {/* DSS Stage Factors (N-P-K) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Factors</Text>
          {Object.keys(form.stage_factors).map((stage) => (
            <View key={stage} style={styles.stageCard}>
              <Text style={styles.stageName}>{stage.toUpperCase()}</Text>
              <View style={styles.row}>
                {['n', 'p', 'k'].map((el) => (
                  <View key={el} style={styles.elInputGroup}>
                    <Text style={styles.elLabel}>{el.toUpperCase()}</Text>
                    <TextInput 
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={String(form.stage_factors[stage][el])}
                      onChangeText={(v) => addStageFactor(stage, el, v)}
                    />
                  </View>
                ))}
              </View>
              <View style={styles.freqRow}>
                <Text style={styles.subLabel}>Fertilization frequency (days): </Text>
                <TextInput 
                   style={[styles.smallInput, {width: 50}]}
                   keyboardType="numeric"
                   value={String(form.stage_frequency[stage] || 0)}
                   onChangeText={(v) => setForm({...form, stage_frequency: {...form.stage_frequency, [stage]: parseInt(v)||0}})}
                />
              </View>
            </View>

            
          ))}
        </View>

        {/* Status Management - Only for staff */}
        {isStaff && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Publication Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.status}
                onValueChange={(itemValue) => setForm({ ...form, status: itemValue })}
                style={styles.picker}
                enabled={!saving}
              >
                <Picker.Item label="Published" value="published" />
                <Picker.Item label="Unpublished" value="unpublished" />
                <Picker.Item label="Pending" value="pending" />
              </Picker>
            </View>
            <Text style={styles.statusNote}>
              Select the publication status for the crop.
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F2F4F4' 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  saveText: { color: '#27AE60', fontWeight: 'bold', fontSize: 16 },
  content: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  label: { fontSize: 12, color: '#95A5A6', marginBottom: 8, fontWeight: 'bold' },
  subLabel: { fontSize: 11, color: '#BDC3C7', marginBottom: 5 },
  input: { backgroundColor: '#F8F9F9', borderRadius: 12, padding: 12, fontSize: 15, color: '#2C3E50' },
  row: { flexDirection: 'row' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  imagePickerCard: {
    width: '100%',
    height: 180,
    backgroundColor: '#F8F9F9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBEDEF',
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  imagePlaceholder: {
    alignItems: 'center'
  },
  placeholderText: {
    marginTop: 8,
    color: '#BDC3C7',
    fontSize: 13,
    fontWeight: '500'
  },
  editBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#27AE60',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },

  deficiencyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#F2F4F4', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F2F4F4', paddingBottom: 5 },
  cardIndex: { fontSize: 13, fontWeight: 'bold', color: '#27AE60' },
  addButton: { padding: 5 },
  emptyText: { textAlign: 'center', color: '#BDC3C7', fontStyle: 'italic', marginTop: 10 },
  stageCard: { backgroundColor: '#FBFCFC', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F2F4F4' },
  stageName: { fontSize: 13, fontWeight: '900', color: '#27AE60', marginBottom: 10 },
  elInputGroup: { flex: 1, marginRight: 8, alignItems: 'center' },
  elLabel: { fontSize: 10, fontWeight: 'bold', color: '#95A5A6', marginBottom: 4 },
  smallInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D5DBDB', borderRadius: 8, width: '100%', textAlign: 'center', padding: 5 },
  freqRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#F2F4F4', paddingTop: 10 },
  pickerContainer: { backgroundColor: '#F8F9F9', borderRadius: 12, marginBottom: 10 },
  picker: { height: 50, color: '#2C3E50' },
  statusNote: { fontSize: 11, color: '#7F8C8D', fontStyle: 'italic', lineHeight: 16 },
});