// (auth)/login.tsx
import React, { useState } from 'react';
import {
  View, TextInput, StyleSheet, Text, Alert,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/config/firebase';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  // State variables for email, password, and loading state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Input Required", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      // Firebase Authentication process
      await signInWithEmailAndPassword(auth, email, password);
      if (!auth.currentUser) {
        Alert.alert("Authentication Error", "User not found. Please check your credentials.");
        await auth.signOut();
      }
      else {
        const userId = auth.currentUser.uid;
        if (!userId) {
          Alert.alert("Authentication Error", "User ID not found. Please try again.");
          await auth.signOut();
          return;
        }
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1200);
      }

    } catch (error: any) {
      console.error("Auth Error:", error);
      Alert.alert("Login Failed", "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <MaterialIcons name="eco" size={48} color="#1B5E20" />
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to manage your precision garden.</Text>
      </View>

      <View style={[styles.card, styles.shadow]}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="gardener@example.com"
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#BDC3C7"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          secureTextEntry
          onChangeText={setPassword}
          placeholderTextColor="#BDC3C7"
        />

        <TouchableOpacity
          onPress={() => router.push('/forgot-password' as any)}
          style={styles.forgotPasswordLink}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.8 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>SIGN IN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/register' as any)}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.bold}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFCFC', justifyContent: 'center', padding: 25 },

  header: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    borderWidth: 1, borderColor: '#C8E6C9'
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1B5E20' },
  subtitle: { fontSize: 14, color: '#7F8C8D', marginTop: 8, textAlign: 'center' },

  card: { backgroundColor: '#fff', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: '#F0F3F4' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ECF0F1',
    marginBottom: 25,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2C3E50'
  },

  loginBtn: {
    backgroundColor: '#1B5E20',
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10
  },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },

  forgotPasswordLink: { alignItems: 'flex-end', marginBottom: 15 },
  forgotPasswordText: { color: '#1B5E20', fontSize: 13, fontWeight: '600' },

  registerLink: { marginTop: 25, alignItems: 'center' },
  registerText: { color: '#7F8C8D', fontSize: 14 },
  bold: { color: '#1B5E20', fontWeight: 'bold' },

  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4
  }
});