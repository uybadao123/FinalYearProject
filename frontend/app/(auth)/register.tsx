// (auth)/register.tsx
import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  Text, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/config/firebase';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { api } from '../../src/api/api';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    // 1. Basic input validation
    if (!email || !password || !fullName) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Confirmation password must match the entered password.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // JWT Token atteched will go the same for backend to authorizing 
      try {
        await api.user.createProfile({
          uid: user.uid,
          email: email,
          full_name: fullName,
          role: 'gardener'
        });

        Alert.alert("Success", "Your account has been initialized!");
        router.replace('/(tabs)');

      } catch (backendError: any) {
        console.error("Firebase Error:", backendError);
        Alert.alert(
          "Error",
          "Failed Creating Account"
        );
        router.replace('/(tabs)');
      }

    } catch (firebaseError: any) {
      console.error("Firebase Auth Error:", firebaseError);
      Alert.alert("Registration Error", firebaseError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="eco" size={50} color="#1B5E20" />
          </View>
          <Text style={styles.title}>REGISTER</Text>
          <Text style={styles.subtitle}>Join the Green Urban</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Your name</Text>
          <TextInput style={styles.input} placeholder="John Mith" value={fullName} onChangeText={setFullName} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="gardener@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput style={styles.input} placeholder="••••••••" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>REGISTER NOW</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={{ fontWeight: 'bold' }}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFCFC' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  header: { alignItems: 'center', marginBottom: 35 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    borderWidth: 1, borderColor: '#C8E6C9'
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1B5E20' },
  subtitle: {
    fontSize: 14, color: '#7F8C8D', textAlign: 'center',
    marginTop: 10, paddingHorizontal: 15, lineHeight: 22
  },
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: '#F0F3F4' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
  input: { borderBottomWidth: 1, borderColor: '#ECF0F1', marginBottom: 25, paddingVertical: 10, fontSize: 16, color: '#2C3E50' },
  button: { backgroundColor: '#1B5E20', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginLinkText: { color: '#7F8C8D', fontSize: 14 }
});