// app/manage-crop.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView,
  TouchableOpacity, RefreshControl, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { api } from '../src/api/api';

interface Crop {
  id: string;
  name: string;
  family: string;
  description: string;
  image_url?: string;
  status: 'pending' | 'published' | 'unpublished';
  created_by?: string;
  updated_by?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Pending', color: '#F39C12', bg: '#FEF5E7', icon: 'clock' },
  published: { label: 'Published', color: '#27AE60', bg: '#E8F5E9', icon: 'check-circle' },
  unpublished: { label: 'Unpublished', color: '#E67E22', bg: '#FDEDEC', icon: 'eye-off' }
};

export default function ManageCropScreen() {
  const router = useRouter();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingCrop, setUpdatingCrop] = useState<string | null>(null);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      setLoading(true);
      const allCrops = await api.crop.getAll();
      setCrops(Array.isArray(allCrops) ? allCrops : []);
    } catch (err) {
      console.error('Fetch crops error:', err);
      Alert.alert('Error', 'Failed to load crops');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCrops();
  };

  const handleToggleStatus = async (cropId: string, currentStatus: string) => {
    const statusFlow = {
      'published': 'unpublished',
      'unpublished': 'pending',
      'pending': 'published'
    };

    const newStatus = statusFlow[currentStatus as keyof typeof statusFlow] || 'published';

    Alert.alert(
      'Confirm Status Change',
      `Change crop status from ${currentStatus} to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            try {
              setUpdatingCrop(cropId);
              await api.crop.updateCropStatus(cropId);

              setCrops(prevCrops =>
                prevCrops.map(crop =>
                  crop.id === cropId ? { ...crop, status: newStatus as any } : crop
                )
              );

              Alert.alert('Success', 'Crop status updated successfully');
            } catch (err) {
              console.error('Status update error:', err);
              Alert.alert('Error', 'Failed to update crop status');
            } finally {
              setUpdatingCrop(null);
            }
          }
        }
      ]
    );
  };

  const handleDeleteCrop = async (cropId: string, cropName: string) => {
    Alert.alert(
      'Delete Crop',
      `Are you sure you want to delete "${cropName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingCrop(cropId);
              await api.crop.deleteCrop(cropId);

              setCrops(prevCrops => prevCrops.filter(crop => crop.id !== cropId));
              Alert.alert('Deleted', 'Crop has been removed successfully');
            } catch (err) {
              console.error('Delete crop error:', err);
              Alert.alert('Error', 'Failed to delete crop');
            } finally {
              setUpdatingCrop(null);
            }
          }
        }
      ]
    );
  };

  const getStatusStats = () => {
    const stats = {
      total: crops.length,
      published: crops.filter(c => c.status === 'published').length,
      pending: crops.filter(c => c.status === 'pending').length,
      unpublished: crops.filter(c => c.status === 'unpublished').length,
    };
    return stats;
  };

  const stats = getStatusStats();

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1B5E20" />
          <Text style={styles.loadingText}>Loading crops...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Management</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Crops</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.published}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { marginRight: 0 }]}>
          <Text style={styles.statValue}>{stats.unpublished}</Text>
          <Text style={styles.statLabel}>Unpublished</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1B5E20"
          />
        }
      >
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>All Crops</Text>
          {crops.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="grass" size={48} color="#BDC3C7" />
              <Text style={styles.emptyText}>No crops found</Text>
            </View>
          ) : (
            crops.map((crop) => (
              <CropCard
                key={crop.id}
                crop={crop}
                isUpdating={updatingCrop === crop.id}
                onToggleStatus={() => handleToggleStatus(crop.id, crop.status)}
                onDelete={() => handleDeleteCrop(crop.id, crop.name)}
                onViewDetail={() => router.push({ pathname: '/crop-detail', params: { id: crop.id } })}
              />
            ))
          )}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface CropCardProps {
  crop: Crop;
  isUpdating: boolean;
  onToggleStatus: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
}

const CropCard: React.FC<CropCardProps> = ({ crop, isUpdating, onToggleStatus, onDelete, onViewDetail }) => {
  const statusConfig = STATUS_CONFIG[crop.status];

  return (
    <TouchableOpacity style={styles.cropCard} onPress={onViewDetail}>
      <Image
        source={{
          uri: crop.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${crop.name}`,
        }}
        style={styles.cropImage}
      />

      <View style={styles.cropDetails}>
        <Text style={styles.cropName} numberOfLines={1}>
          {crop.name}
        </Text>
        <Text style={styles.cropFamily} numberOfLines={1}>
          {crop.family}
        </Text>
        <Text style={styles.cropDescription} numberOfLines={2}>
          {crop.description}
        </Text>
      </View>

      <View style={styles.cropActions}>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <FontAwesome5 name={statusConfig.icon} size={10} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, isUpdating && styles.toggleBtnDisabled]}
            onPress={onToggleStatus}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#1B5E20" />
            ) : (
              <MaterialIcons
                name={
                  crop.status === 'published' ? 'unpublished' :
                    crop.status === 'unpublished' ? 'schedule' : 'publish'
                }
                size={18}
                color="#1B5E20"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, isUpdating && styles.toggleBtnDisabled]}
            onPress={onDelete}
            disabled={isUpdating}
          >
            <MaterialIcons name="delete-outline" size={18} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBFCFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F4',
  },
  backBtn: {
    padding: 8,
  },
  backBtnPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3E50',
  },
  statsSection: {
    flexDirection: 'row',
    margin: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F3F4',
    marginRight: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B5E20',
  },
  statLabel: {
    fontSize: 10,
    color: '#BDC3C7',
    marginTop: 4,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  listSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#BDC3C7',
    fontWeight: '500',
  },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F3F4',
    minHeight: 80,
  },
  cropImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    flexShrink: 0,
  },
  cropDetails: {
    flex: 1,
    minWidth: 0,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    flexShrink: 1,
  },
  cropFamily: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
    flexShrink: 1,
  },
  cropDescription: {
    fontSize: 12,
    color: '#BDC3C7',
    marginTop: 4,
    lineHeight: 16,
  },
  cropActions: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  toggleBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    marginRight: 8,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FDEDEC',
  },
  toggleBtnDisabled: {
    opacity: 0.6,
  },
});