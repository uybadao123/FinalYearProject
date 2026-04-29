import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, 
  TouchableOpacity, Animated, Alert, Image, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';

import { api } from '../src/api/api';


export default function CropDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [cropData, setCropData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInitialData();
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const data = await api.crop.getById(id as string);
      setCropData(data);

      const profile = await api.user.getMyProfile();
      const role = typeof profile === 'object' ? profile.role : profile;
      setUserRole(role || 'user');
      
      
    } catch (error: any) {
      console.error("Error fetching crop data:", error);
      Alert.alert("Error", "Loading crop data unsuccessfully.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  //Role-based access control for edit button
  const isStaff = ['admin', 'content_collaborator'].includes(userRole);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text style={styles.loadingText}>Loading crop data</Text>
      </View>
    );
  }

  if (!cropData) return null;
  return (
    <SafeAreaView style={styles.container}>
      {/* CUSTOM HEADER (STAFF ACCESS) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>{cropData.name}</Text>
        {isStaff ? (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push({ pathname: '/edit-crop', params: { id: cropData.id } })}
          >
            <MaterialIcons name="edit" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 30 }} /> 
        )}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B5E20" />}
        scrollEventThrottle={8}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* BOTANICAL PROFILE SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="leaf" size={18} color="#27AE60" />
            <Text style={styles.sectionTitle}>Botanical Profile</Text>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Family species</Text>
              <Text style={styles.infoValue}>{cropData.family}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0.5 }]}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.descriptionText}>{cropData.description}</Text>
            </View>
          </View>
        </View>

        {/* IMAGE SECTION */}
        <View style={styles.imageSection}>
          <View style={styles.imageCard}>
            {cropData.image_url ? (
              <Image 
                source={{ uri: cropData.image_url }} 
                style={styles.cropImage} 
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <FontAwesome5 name="image" size={30} color="#BDC3C7" />
                <Text style={styles.placeholderText}>No Image Available</Text>
              </View>
            )}
          </View>
        </View>

        {/*GROWTH TIMELINE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="timeline" size={20} color="#27AE60" />
            <Text style={styles.sectionTitle}>Growth Timeline</Text>
          </View>
          <View style={styles.timelineContainer}>
            <View style={styles.timelineItem}>
              <View style={[styles.dot, { backgroundColor: '#81C784' }]} />
              <Text style={styles.timelineLabel}>Seedling</Text>
              <Text style={styles.timelineDays}>0 - {cropData.growth_timeline.seedling_end} days</Text>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.timelineLabel}>Vegetative</Text>
              <Text style={styles.timelineDays}>{cropData.growth_timeline.seedling_end + 1} - {cropData.growth_timeline.vegetative_end} days</Text>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.dot, { backgroundColor: '#2E7D32' }]} />
              <Text style={styles.timelineLabel}>Maturity</Text>
              <Text style={styles.timelineDays}> {'>'}{cropData.growth_timeline.vegetative_end} days</Text>
            </View>
          </View>
        </View>

        {/*DIAGNOSTIC SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="stethoscope" size={18} color="#E67E22" />
            <Text style={styles.sectionTitle}>Insufficient Diagnosis </Text>
          </View>

          {cropData.specific_deficiencies?.map((item: any, index: number) => (
            <View key={index} style={styles.medicalCard}>
              <View style={styles.medicalHeader}>
                <View style={styles.elementBadge}>
                  <Text style={styles.elementText}>{item.element.split(' ')[0][0]}</Text>
                </View>
                <Text style={styles.medicalTitle}>{item.element}</Text>
              </View>

              <View style={styles.symptomBox}>
                <Text style={styles.boxLabel}>HOW TO REGCONIZE</Text>
                <Text style={styles.symptomText}>{item.symptoms}</Text>
              </View>

              <View style={styles.treatmentBox}>
                <Entypo name="tools" size={14} color="#1B5E20" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.boxLabel}>SOLUTION</Text>
                  <Text style={styles.treatmentText}>{item.solution}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/*METADATA SECTION (STAFF ACCESS AND MONITORING) */}
        {isStaff && (
          <View style={styles.staffFooter}>
            <Text style={styles.staffTitle}>UPDATED INFORMATION</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status: </Text>
              <Text style={[styles.statusBadge, { color: cropData.status === 'published' ? '#27AE60' : 
                                                         cropData.status === 'pending' ? '#F39C12' :
                                                         cropData.status === 'unpublished' ?'#E67E22' :
                                                  '#E67E22', textTransform: 'capitalize' }]}>
                          {cropData.status}
              </Text>
            </View>
            <Text style={styles.metaText}>
              Last updated by: {
                typeof cropData.updated_by === 'object' && cropData.updated_by !== null
                  ? cropData.updated_by.full_name || cropData.updated_by.email 
                  : (cropData.created_by || 'System')
              }
            </Text>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFCFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#7F8C8D', fontSize: 14 },
  
  imageSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },

  imageCard: {
    width: '100%',
    height: 220,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F3F4',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
  },

  cropImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9F9',
  },
  placeholderText: {
    marginTop: 10,
    color: '#BDC3C7',
    fontSize: 12,
    fontWeight: '500'
  },

  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#F2F4F4'
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#2C3E50', flex: 1, textAlign: 'center' },
  editButton: { 
    width: 40, height: 40, backgroundColor: '#1B5E20', 
    borderRadius: 20, justifyContent: 'center', alignItems: 'center' 
  },

  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#2C3E50', marginLeft: 10 },

  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F0F3F4' },
  infoRow: { justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7F9F9' },
  infoLabel: { fontSize: 14, color: '#95A5A6' },
  infoValue: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50' },
  descriptionText: { fontSize: 14, color: '#34495E', lineHeight: 22, marginTop: 10, textAlign: 'justify' },

  timelineContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 20, borderRadius: 20 },
  timelineItem: { alignItems: 'center', flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 8 },
  timelineLabel: { fontSize: 12, fontWeight: 'bold', color: '#2C3E50' },
  timelineDays: { fontSize: 10, color: '#7F8C8D', marginTop: 4 },

  medicalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F0F3F4' },
  medicalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  elementBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FBE9E7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  elementText: { color: '#E64A19', fontWeight: 'bold', fontSize: 14 },
  medicalTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  symptomBox: { backgroundColor: '#FBFCFC', padding: 15, borderRadius: 15, marginBottom: 12 },
  boxLabel: { fontSize: 9, fontWeight: '900', color: '#BDC3C7', marginBottom: 5, letterSpacing: 1 },
  symptomText: { fontSize: 14, color: '#34495E', lineHeight: 22 },
  treatmentBox: { flexDirection: 'row', backgroundColor: '#E8F5E9', padding: 15, borderRadius: 15, alignItems: 'center' },
  treatmentText: { fontSize: 14, color: '#1B5E20', lineHeight: 22 },

  staffFooter: { margin: 20, padding: 20, backgroundColor: '#F4F6F6', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#BDC3C7' },
  staffTitle: { fontSize: 12, fontWeight: 'bold', color: '#7F8C8D', marginBottom: 15, textAlign: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  metaLabel: { fontSize: 13, color: '#7F8C8D' },
  statusBadge: { fontSize: 13, fontWeight: 'bold' },
  metaText: { fontSize: 12, color: '#95A5A6', marginTop: 5 }
});