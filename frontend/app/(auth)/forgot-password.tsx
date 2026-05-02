// (auth)/forgot-password.tsx
import React, { useState } from 'react';
import {
    View, TextInput, StyleSheet, Text, Alert,
    TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../src/config/firebase';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert("Input Required", "Please enter your email address.");
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert(
                "Success",
                "Password reset email has been sent to your email address. Please check your inbox and follow the link to reset your password.",
                [
                    {
                        text: "Back to Login",
                        onPress: () => router.back(),
                    },
                ]
            );
            setEmail('');
        } catch (error: any) {
            console.error("Password Reset Error:", error);
            if (error.code === 'auth/user-not-found') {
                Alert.alert("Error", "No account found with this email address.");
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert("Error", "Please enter a valid email address.");
            } else {
                Alert.alert("Error", error.message || "Failed to send password reset email. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView
            style={styles.container}
        >
            <View style={styles.header}>

                <View style={styles.logoCircle}>
                    <MaterialIcons name="lock-reset" size={48} color="#1B5E20" />
                </View>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                    Enter your email address and we'll send you a link to reset your password.
                </Text>
            </View>

            <View style={[styles.card, styles.shadow]}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    style={styles.input}
                    placeholder="gardener@example.com"
                    onChangeText={setEmail}
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor="#BDC3C7"
                    editable={!loading}
                />

                <TouchableOpacity
                    style={[styles.resetBtn, loading && { opacity: 0.8 }]}
                    onPress={handleResetPassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.resetBtnText}>SEND RESET EMAIL</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backLink}
                >
                    <Text style={styles.backLinkText}>
                        <MaterialIcons name="arrow-back" size={14} /> Back to Login
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FBFCFC',
        padding: 25,
    },

    header: {
        alignItems: 'center',
        marginBottom: 40,
    },

    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 20,
        padding: 8,
    },

    logoCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },

    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1B5E20',
    },

    subtitle: {
        fontSize: 14,
        color: '#7F8C8D',
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 20,
    },

    card: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#F0F3F4',
    },

    label: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
    },

    input: {
        borderBottomWidth: 1,
        borderColor: '#ECF0F1',
        marginBottom: 25,
        paddingVertical: 10,
        fontSize: 16,
        color: '#2C3E50',
    },

    resetBtn: {
        backgroundColor: '#1B5E20',
        padding: 20,
        borderRadius: 18,
        alignItems: 'center',
        marginTop: 10,
    },

    resetBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
        letterSpacing: 1,
    },

    backLink: {
        marginTop: 25,
        alignItems: 'center',
    },

    backLinkText: {
        color: '#1B5E20',
        fontSize: 14,
        fontWeight: '600',
    },

    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
});
