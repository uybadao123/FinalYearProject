// app/edit-profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../src/api/api';
import { auth } from '../src/config/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uploadImage } from '../src/api/image';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [image, setImage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');

  useEffect(() => {
    if (!user) {
      Alert.alert("Authentication Error", "You must be logged in to edit your profile.");
      router.replace('/login');
      return;
    }
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const profile = await api.user.getMyProfile();
      setFullName(profile.full_name || profile.fullName || '');
      setExperienceLevel(profile.experience_level || profile.experienceLevel || 'beginner');
      setAvatarUrl(profile.image_url || null);
    } catch (e) {
      console.error("Profile Fetch Error:", e);
      Alert.alert("Error", "Failed to load identity data.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri: string) => {
    const uploadedUrl = await uploadImage(uri);
    if (!uploadedUrl) {
      throw new Error("Failed to upload image to Cloudinary");
    }
    return uploadedUrl;
  };

  const handleUpdate = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation", "Please enter your name.");
      return;
    }

    setUpdating(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (image) {
        finalAvatarUrl = await uploadImageAsync(image);
      }

      const updateData = {
        full_name: fullName.trim(),
        experience_level: experienceLevel,
        image_url: finalAvatarUrl
      };

      await api.user.updateProfile(updateData);
      Alert.alert("Success", "Profile updated!");
      router.back();
    } catch (e) {
      console.error("Update Error:", e);
      Alert.alert("Error", "Update failed. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#1B5E20" /></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialIcons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={handleUpdate} disabled={updating}>
              {updating ?
                <ActivityIndicator size="small" color="#1B5E20" /> :
                <Text style={styles.saveText}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          {/* AVATAR SECTION */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarCircle}>
              {image || avatarUrl ? (
                <Image source={{ uri: (image || avatarUrl)! }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarChar}>{fullName ? fullName.charAt(0).toUpperCase() : '?'}</Text>
              )}
              <View style={styles.editIconBadge}>
                <MaterialIcons name="photo-camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.emailText}>{auth.currentUser?.email}</Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your name"
              placeholderTextColor="#BDC3C7"
            />

            <Text style={styles.label}>Account Email</Text>
            <View style={[styles.input, { backgroundColor: '#F2F4F4', borderColor: '#E5E8E8' }]}>
              <Text style={{ color: '#7F8C8D' }}>{auth.currentUser?.email}</Text>
            </View>

            <Text style={styles.label}>Experience Level</Text>
            <View style={styles.optionRow}>
              {['Beginner', 'Intermediate', 'Expert'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelBtn,
                    experienceLevel === level && styles.levelBtnActive
                  ]}
                  onPress={() => setExperienceLevel(level)}
                >
                  <Text style={[
                    styles.levelText,
                    experienceLevel === level && styles.levelTextActive
                  ]}>
                    {level.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.hintContainer}>
              <MaterialIcons name="info-outline" size={18} color="#BDC3C7" />
              <Text style={styles.hintText}>
                Your level helps us customize your experience in the future features.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  backBtn: { padding: 5 },
  title: { fontSize: 20, fontWeight: '800', color: '#2C3E50' },
  saveText: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
  avatarSection: { alignItems: 'center', marginBottom: 40 },
  avatarCircle: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: '#1B5E20',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2
  },
  avatarImage: { width: 110, height: 110, borderRadius: 55 },
  avatarChar: { color: '#fff', fontSize: 44, fontWeight: 'bold' },
  editIconBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 32, height: 32,
    borderRadius: 16, backgroundColor: '#1B5E20', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff'
  },
  emailText: { marginTop: 15, color: '#95A5A6', fontSize: 14, fontWeight: '500' },
  form: { marginTop: 10 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#95A5A6', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: '#F8F9F9', borderRadius: 12, paddingHorizontal: 15,
    paddingVertical: 12, fontSize: 16, color: '#2C3E50', marginBottom: 25,
    borderWidth: 1, borderColor: '#EBEDEF'
  },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  levelBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#EBEDEF', borderRadius: 12, alignItems: 'center', marginHorizontal: 4, backgroundColor: '#fff' },
  levelBtnActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  levelText: { fontSize: 10, fontWeight: 'bold', color: '#7F8C8D' },
  levelTextActive: { color: '#fff' },
  hintContainer: { flexDirection: 'row', marginTop: 10, alignItems: 'center', paddingHorizontal: 5 },
  hintText: { fontSize: 12, color: '#BDC3C7', fontStyle: 'italic', marginLeft: 8 }
});