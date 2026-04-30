// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Alert, ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';

import { auth } from '../../src/config/firebase';
import { api } from '../../src/api/api';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  if (!user) return router.push("/login");

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ gardens: 0, plots: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatar, setAvatar] = useState(false);


  // Function to fetch all data (Profile + Stats)
  const fetchData = async () => {
    try {
      setAvatar(false);
      //Fetch personal profile information
      const userProfile = await api.user.getMyProfile();
      setProfile(userProfile);

      //Garden zone calculation
      const gardens = await api.garden.getAllGardenZones();

      //Plot available calculation: For each garden, fetch its plots and sum them up to get total plot count
      const totalPlots = await api.garden.getAllPlots().then(plots => {
        return plots.length;
      }, error => {
        console.error("Error fetching plots for stats:", error);
        return 0; // Return 0 if there's an error fetching plots to avoid breaking the stats display
      });
      //Set the calculated stats in state to be displayed on the profile screen
      setStats({
        gardens: gardens.length,
        plots: totalPlots,
      });

    } catch (error) {
      console.error("Profile System Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Pull-to-refresh handler to allow users to manually refresh their profile data and stats
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Logout handler with confirmation alert to prevent accidental logouts and ensure a smooth user experience
  const handleLogout = () => {
    Alert.alert("Log out ?", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await auth.signOut();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  // Function to render role badge based on user's role with specific colors and icons
  const renderRoleBadge = () => {
    const roleConfigs: any = {
      admin: { label: 'Admin System', color: '#E74C3C', bg: '#FDEDEC', icon: 'crown' },
      content_collaborator: { label: 'Collaborator', color: '#F39C12', bg: '#FEF5E7', icon: 'pen-nib' },
      gardener: { label: 'Member', color: '#7F8C8D', bg: '#F4F7F6', icon: 'user' }
    };
    // Get the configuration for the user's role, defaulting to 'user' if role is undefined or unrecognized
    const config = roleConfigs[profile?.role] || roleConfigs.user;

    // Styled badge component that displays the user's role with an icon and label
    return (
      <View style={[styles.roleBadge, { backgroundColor: config.bg }]}>
        <FontAwesome5 name={config.icon} size={10} color={config.color} />
        <Text style={[styles.roleText, { color: config.color }]}>{config.label.toUpperCase()}</Text>
      </View>
    );
  };
  const nagivateToEditProfile = () => {
    router.push('/edit-profile');
  };


  // Loading spinner activity indicator while fetching data
  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1B5E20" />
    </View>
  );


  // Main render of the profile screen
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B5E20" />}
      >

        {/* WELCOME STATEMENT SECTION */}
        <View style={styles.headerSection}>
          <Text style={styles.greetingText}>Good day,</Text>
        </View>

        {/* MAIN PROFILE CARD */}
        <View style={styles.mainCard}>
          <View style={styles.avatarWrapper}>
            {avatar ? (
              // Fallback avatar with user initials
              <View style={[styles.avatarImage, { backgroundColor: '#1B5E20', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.avatarInitial}>{profile?.full_name?.charAt(0).toUpperCase() || '?'}</Text>
              </View>
            ) : (
              <Image
                source={{ uri: profile?.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email}` }}
                style={styles.avatarImage}
                onError={() => setAvatar(true)}
              />
            )}
            <TouchableOpacity style={styles.editIconBtn} onPress={() => router.push('/edit-profile')}>
              <MaterialIcons name="camera-alt" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.displayName}>{profile?.full_name || 'User'}</Text>
          {renderRoleBadge()}

          {/* USER STATS CARD */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.gardens}</Text>
              <Text style={styles.statLabel}>Gardens</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.plots}</Text>
              <Text style={styles.statLabel}>Plots</Text>
            </View>
          </View>
        </View>

        {/* STAFF FEATURES SECTION */}
        {['admin', 'content_collaborator'].includes(profile?.role) && (
          <View style={styles.menuSection}>
            <Text style={styles.menuHeaderLabel}>System Management</Text>
            <View style={styles.menuListCard}>
              {profile?.role === 'admin' && (
                <MenuRow icon="users" color="#E74C3C" bg="#FDEDEC" label="User Management" onPress={() => router.push('/manage-user')} />
              )}

              {profile?.role === 'admin' && (
                <MenuRow icon="book" color="#27AE60" bg="#E8F5E9" label="Crop Management" onPress={() => router.push('/manage-crop')} />
              )}
             
             {(profile?.role === 'content_collaborator' || profile?.role === 'admin')&& (
                <MenuRow icon="mail" color="#3498DB" bg="#EBF5FB" label="Suggestion Mail" onPress={() => { }} />
              )}
            </View>
          </View>
        )}

        {/* PERSONAL SETTINGS CARD */}
        <View style={styles.menuSection}>
          <Text style={styles.menuHeaderLabel}>ACCOUNT</Text>
          <View style={styles.menuListCard}>
            <MenuRow icon="user" color="#2C3E50" bg="#F8F9F9" label="Profile" onPress={nagivateToEditProfile} />
            <MenuRow icon="bell" color="#2C3E50" bg="#F8F9F9" label="Notification Settings" onPress={() => { }} />
            <MenuRow icon="shield" color="#2C3E50" bg="#F8F9F9" label="Privacy Policy" onPress={() => { }} />
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#E74C3C" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionLabel}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const MenuRow = ({ icon, label, onPress, bg, color }: any) => (
  <TouchableOpacity style={styles.menuRowItem} onPress={onPress}>
    <View style={[styles.menuIconContainer, { backgroundColor: bg }]}>
      <Feather name={icon} size={18} color={color} />
    </View>
    <Text style={styles.menuRowText}>{label}</Text>
    <Feather name="chevron-right" size={16} color="#BDC3C7" />
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FBFCFC' },
  scrollContainer: { paddingHorizontal: 22, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerSection: { marginTop: 25, marginBottom: 25 },
  greetingText: { fontSize: 24, color: '#1B5E20', fontWeight: 'bold' },
  userNameHeader: { fontSize: 34, fontWeight: '900', color: '#1B5E20', letterSpacing: -0.5 },

  mainCard: { alignItems: 'center', backgroundColor: '#fff', padding: 25, borderRadius: 32, borderWidth: 1, borderColor: '#F0F3F4', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.02, shadowRadius: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#E8F5E9' },
  avatarInitial: { fontSize: 44, fontWeight: 'bold', color: '#fff' },
  editIconBtn: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#1B5E20', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#fff' },
  displayName: { fontSize: 24, fontWeight: '800', color: '#2C3E50' },

  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginTop: 10, gap: 6 },
  roleText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },

  statsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F7F9F9', width: '100%' },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#1B5E20' },
  statLabel: { fontSize: 11, color: '#BDC3C7', marginTop: 4, fontWeight: '600' },
  statDivider: { width: 1, height: 25, backgroundColor: '#F0F3F4' },

  menuSection: { marginTop: 35 },
  menuHeaderLabel: { fontSize: 11, fontWeight: '900', color: '#BDC3C7', letterSpacing: 1.5, marginBottom: 15, paddingHorizontal: 5 },
  menuListCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F3F4' },

  menuRowItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F7F9F9' },
  menuIconContainer: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuRowText: { flex: 1, marginLeft: 15, fontSize: 15, color: '#2C3E50', fontWeight: '600' },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 20, borderRadius: 24, backgroundColor: '#FDEDEC' },
  logoutButtonText: { marginLeft: 10, fontSize: 16, fontWeight: '800', color: '#E74C3C' },

  versionLabel: { textAlign: 'center', marginTop: 30, color: '#D5DBDB', fontSize: 11, fontWeight: '700' }
});