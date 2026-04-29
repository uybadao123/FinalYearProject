import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { uploadImage } from '../src/api/image';
import { api } from '../src/api/api';
import { auth } from '@/src/config/firebase';
import * as ImagePicker from 'expo-image-picker';


export default function AddCropScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  // Check login
  if (!user) {
    Alert.alert("Unauthorized", "Please log in to add crops.");
    router.push('/login');
    return null;
  }

  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  // Khởi tạo form trống hoàn toàn
  const [form, setForm] = useState<any>({
    name: '',
    family: '',
    description: '',
    image_url: '',
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

  //DEFICIENCIES ---
  const addDeficiency = () => {
    const newDeficiency = { element: '', symptoms: '', solution: '' };
    setForm({
      ...form,
      specific_deficiencies: [...form.specific_deficiencies, newDeficiency]
    });
  };

  const removeDeficiency = (index: number) => {
    const newList = [...form.specific_deficiencies];
    newList.splice(index, 1);
    setForm({ ...form, specific_deficiencies: newList });
  };

  const addMoreDeficiency = (index: number, field: string, value: string) => {
    const newList = [...form.specific_deficiencies];
    newList[index] = { ...newList[index], [field]: value };
    setForm({ ...form, specific_deficiencies: newList });
  };

  // N-P-K Section ---
  const updateStageFactor = (stage: string, element: string, value: string) => {
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.family) {
      Alert.alert("Validation", "Please fill in the Name and Family fields.");
      return;
    }

    try {
      setSaving(true);
      let finalImageUrl = "";

      if (image) {
        const uploadedUrl = await uploadImage(image);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const newCropData = {
        ...form,
        image_url: finalImageUrl,
        status: 'pending'
      };

      await api.crop.addCrop(newCropData);

      Alert.alert("Success", "New crop added successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to add crop.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Crop</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#27AE60" /> : <Text style={styles.saveText}>CREATE</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* BASIC CROP DETAIL*/}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CROP INFORMATION</Text>
          <View style={styles.section}>
            <Text style={[styles.label]}>Photo</Text>
            <TouchableOpacity onPress={pickImage} style={styles.imagePickerCard}>
              {image ? (
                <Image source={{ uri: image }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="add-a-photo" size={32} color="#BDC3C7" />
                  <Text style={styles.placeholderText}>Tap to add a photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Tomato"
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
          />
          <Text style={styles.label}>Family</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Solanaceae"
            value={form.family}
            onChangeText={(t) => setForm({ ...form, family: t })}
          />
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            placeholder="Description of plant"
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
          />
        </View>

        {/* CẤU HÌNH TIMELINE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growing Stage</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.subLabel}>Seedling End</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(form.growth_timeline.seedling_end)}
                onChangeText={(t) => setForm({ ...form, growth_timeline: { ...form.growth_timeline, seedling_end: parseInt(t) || 0 } })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Vegatative End</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(form.growth_timeline.vegetative_end)}
                onChangeText={(t) => setForm({ ...form, growth_timeline: { ...form.growth_timeline, vegetative_end: parseInt(t) || 0 } })}
              />
            </View>
          </View>
        </View>

        {/* NPK FACTORS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrient Ratio</Text>
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
                      onChangeText={(v) => updateStageFactor(stage, el, v)}
                    />
                  </View>


                ))}
                <View style={styles.freqRow}>
                  <Text style={styles.subLabel}>Frequency(day/time): </Text>
                  <TextInput
                    style={[styles.smallInput, { width: 50 }]}
                    keyboardType="numeric"
                    value={String(form.stage_frequency[stage] || 0)}
                    onChangeText={(v) => setForm({ ...form, stage_frequency: { ...form.stage_frequency, [stage]: parseInt(v) || 0 } })}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* TRIỆU CHỨNG THIẾU CHẤT */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Nutrient Deficiency Dianogsis</Text>
            <TouchableOpacity onPress={addDeficiency}>
              <Ionicons name="add-circle" size={26} color="#27AE60" />
            </TouchableOpacity>
          </View>

          {form.specific_deficiencies.map((item: any, index: number) => (
            <View key={index} style={styles.deficiencyCard}>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeDeficiency(index)}>
                <Ionicons name="close-circle" size={20} color="#E74C3C" />
              </TouchableOpacity>

              <TextInput
                style={[styles.input, { marginBottom: 10 }]}
                placeholder="Element (Ex: Kali)"
                value={item.element}
                onChangeText={(v) => addMoreDeficiency(index, 'element', v)}
              />
              <TextInput
                style={[styles.input, { height: 60, marginBottom: 10 }]}
                multiline
                placeholder="Symptoms"
                value={item.symptoms}
                onChangeText={(v) => addMoreDeficiency(index, 'symptoms', v)}
              />
              <TextInput
                style={[styles.input, { height: 60 }]}
                multiline
                placeholder="Solution"
                value={item.solution}
                onChangeText={(v) => addMoreDeficiency(index, 'solution', v)}
              />
            </View>
          ))}
        </View>

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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  saveText: { color: '#27AE60', fontWeight: 'bold', fontSize: 16 },
  content: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  label: { fontSize: 12, color: '#95A5A6', marginBottom: 8, fontWeight: 'bold' },
  subLabel: { fontSize: 11, color: '#BDC3C7', marginBottom: 5 },
  input: { backgroundColor: '#F8F9F9', borderRadius: 12, padding: 12, fontSize: 15, color: '#2C3E50', borderWidth: 1, borderColor: '#F2F4F4' },
  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  stageCard: { backgroundColor: '#FBFCFC', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F2F4F4' },
  stageName: { fontSize: 13, fontWeight: '900', color: '#27AE60', marginBottom: 10 },
  elInputGroup: { flex: 1, marginRight: 8, alignItems: 'center' },
  elLabel: { fontSize: 10, fontWeight: 'bold', color: '#95A5A6', marginBottom: 4 },
  smallInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D5DBDB', borderRadius: 8, width: '100%', textAlign: 'center', padding: 5 },
  deficiencyCard: { backgroundColor: '#FDFEFE', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EAEDED', position: 'relative' },
  removeBtn: { position: 'absolute', top: -10, right: -10, zIndex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  freqRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#F2F4F4', paddingTop: 10 },
});