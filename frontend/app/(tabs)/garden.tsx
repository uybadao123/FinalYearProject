// app/(tabs)/garden.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  TouchableOpacity, ActivityIndicator, Alert, Dimensions, RefreshControl 
} from 'react-native';

import { useRouter } from 'expo-router';
import { auth } from '../../src/config/firebase';
import { api } from '../../src/api/api';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

export default function GardenGridTab() {
  const router = useRouter();
  const user = auth.currentUser;
    
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user]);

  const fetchZones = useCallback(async (isManual = false) => {
    if (!user) return;
    if (isManual) setRefreshing(true);
    
    try {
      const data = await api.garden.getAllGardenZones();
      setZones(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Unable to load garden list");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleDeleteZone = (zoneId: string, zoneName: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${zoneName}"? All crops inside will also be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete All", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await api.garden.deleteZone(zoneId);
              fetchZones();
            } catch (error: any) {
              setLoading(false);
              Alert.alert("Error", error.message || "Unable to delete garden");
            }
          } 
        }
      ]
    );
  };

  const renderZoneCard = ({ item }: { item: any }) => (
    <View style={[styles.zoneCard, styles.shadow]}>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          onPress={() => router.push({ pathname: "/edit-zone", params: { id: item.id, ...item } })}
          style={{ marginRight: 10 }}
        >
          <MaterialIcons name="edit" size={18} color="#1B5E20" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteZone(item.id, item.name)}>
          <MaterialIcons name="delete-outline" size={18} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => router.push({ 
          pathname: "/zone-detail", 
          params: { zoneId: item.id, zoneName: item.name } 
        })}
      >
        <View style={styles.iconCircle}>
          <MaterialIcons 
            name={item.type === 'rooftop' ? 'home-work' : 'deck'} 
            size={30} color="#1B5E20" 
          />
        </View>
        <Text style={styles.zoneName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.zoneType}>{item.type?.toUpperCase() || 'GENERAL'}</Text>
      </TouchableOpacity>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome5 name="box" size={42} color="#BDC3C7" />
      <Text style={styles.emptyTitle}>Create your garden zone now</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Garden Zone</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-zone')}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={zones}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        renderItem={renderZoneCard}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchZones(true)} />
        }
        ListEmptyComponent={<EmptyState />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFCFC' },
  center: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 65, paddingHorizontal: 25, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', color: '#1B5E20' },
  subtitle: { fontSize: 13, color: '#95A5A6', fontWeight: '500' },
  addButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#1B5E20', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  listPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  row: { justifyContent: 'space-between' },
  zoneCard: { backgroundColor: '#fff', width: COLUMN_WIDTH, borderRadius: 28, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#F0F3F4' },
  cardContent: { alignItems: 'center', marginTop: 5 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%' },
  iconCircle: { width: 65, height: 65, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  zoneName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center' },
  zoneType: { fontSize: 10, color: '#95A5A6', fontWeight: '700', marginTop: 4, letterSpacing: 1 },
  factorBadge: { backgroundColor: '#F1F8E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 12 },
  factorText: { fontSize: 11, color: '#1B5E20', fontWeight: 'bold' },
  shadow: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 3 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 14, color: '#BDC3C7', marginTop: 15, fontWeight: '500' },
  plantBtn: { backgroundColor: '#1B5E20', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18, marginTop: 20 },
});