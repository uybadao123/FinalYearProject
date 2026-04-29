// (tabs)/handbook.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { auth } from '@/src/config/firebase';
import { api } from '@/src/api/api';


export default function HandbookScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  if (!user) return router.push("/login");

  // State for crop data and loading status
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const isStaff = ['admin', 'content_collaborator'].includes(userRole);

  // Fetch crop handbook data from the backend API on component mount
  useEffect(() => {
    fetchHandbook();
  }, []);

  const fetchHandbook = async (isManual: boolean = false) => {
    if (isManual) setRefreshing(true);

    try {
      const cropResponse = await api.crop.getAll();

      const cropData = Array.isArray(cropResponse) ? cropResponse : [];
      const profile = await api.user.getMyProfile();
      const role = typeof profile === 'object' ? profile.role : profile;
      setUserRole(role || 'user');
      setCrops(cropData);

    } catch (error) {
      console.error("Handbook Sync Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const renderCropItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.cropCard, styles.shadow]}
      onPress={() => router.push({
        pathname: "/crop-detail",
        params: { id: item.id }
      })}
    >
      <View style={styles.iconContainer}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.imageThumbnail}
            resizeMode="cover"
          />
        ) : (
          <FontAwesome5 name="leaf" size={20} color="#1B5E20" />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.cropName}>{item.name}</Text>
        <Text style={styles.familyText}>Family: {item.family.toUpperCase()}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#BDC3C7" />
    </TouchableOpacity>
  );


  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#1B5E20" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#1B5E20" />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.title}>Crop Handbook</Text>
          <Text style={styles.subtitle}>Scientific guide for urban species</Text>
        </View>
      </View>

      <FlatList
        data={crops}
        renderItem={renderCropItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchHandbook(true)}
            colors={['#1B5E20']}
            tintColor="#1B5E20"
            title="Kéo xuống để tải lại"
            titleColor="#1B5E20"
          />
        }
        // --- ĐẶT NÚT ADD Ở ĐÂY ---
        ListHeaderComponent={
          isStaff ? (
            <TouchableOpacity
              onPress={() => router.push("/add-crop")}
              style={styles.addCard}
            >
              <Ionicons name="add-circle-outline" size={28} color="#27AE60" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.addCardTitle}>Add New Species</Text>
                <Text style={styles.addCardSub}>Expand the handbook database</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#BDC3C7" />
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFCFC', paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', marginTop: 70, marginBottom: 25 },
  backBtn: { padding: 10, backgroundColor: '#E8F5E9', borderRadius: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },
  subtitle: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },

  addCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 18, borderRadius: 20, marginBottom: 15 },
  cropCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 22, marginBottom: 15, borderWidth: 1, borderColor: '#F0F3F4' },
  addCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#27AE60' },
  addCardSub: { fontSize: 12, color: '#7F8C8D', marginTop: 4 },

  iconContainer: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imageThumbnail: { width: '100%', height: '100%' },
  info: { flex: 1, marginLeft: 16 },

  cropName: { fontSize: 17, fontWeight: 'bold', color: '#2C3E50' },
  addButton: { alignSelf: 'flex-end', marginBottom: 15 },
  familyText: { fontSize: 12, color: '#E67E22', marginTop: 4, fontWeight: '700', letterSpacing: 0.5 },

  shadow: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }
});