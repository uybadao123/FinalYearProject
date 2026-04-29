// app/plot-detail.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
  Dimensions, RefreshControl // Added RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth } from '../src/config/firebase';
import { api } from '../src/api/api';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';


const { width } = Dimensions.get('window');

export default function PlotDetailScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  if (!user) {
    Alert.alert("Authentication Required", "You need to be logged in to view plot details.");
    router.push('/login');
    return null;
  }

  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // New Refresh State
  const [isSyncing, setIsSyncing] = useState(false);
  const [plotData, setPlotData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [dayAndStage, setDayAndStage] = useState<any>(null);

  //Fetching Logic
  const fetchDayAndStage = async (plotId: string) => {
    try {
      const dayAndStageData = await api.dss.fetchDayAndStage(plotId);
      setDayAndStage(dayAndStageData);
    } catch (e: any) {
      console.error("Day and Stage Query Error:", e.message);
    }
  };

  const fetchLogs = async (plotId: string) => {
    try {
      const logsData = await api.garden.fetchActivityLogs(plotId);
      setLogs(logsData);
    } catch (e) {
      console.error("Fetch Logs Error:", e);
    }
  };

  const fetchPlotData = async () => {
    try {
      const plotDoc = await api.garden.getPlotById(id);
      if (plotDoc) {
        setPlotData(plotDoc);
        // Sync DSS data immediately after getting plot info
        await syncDSSData(id);
      } else {
        Alert.alert("Error", "Plot not found.");
        router.back();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load plot information.");
      router.back();
    }
  };

  // Main initialization function
  const loadAllData = async () => {
    await Promise.all([
      fetchPlotData(),
      fetchDayAndStage(id),
      fetchLogs(id)
    ]);
  };

  useEffect(() => {
    loadAllData().finally(() => setLoading(false));
  }, [id]);

  // 4. Handlers
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [id]);

  const syncDSSData = async (plotId: string) => {
    setIsSyncing(true);
    try {
      const recData = await api.dss.calculateDosage({
        plot_id: plotId,
        fertilizer_inventory: []
      });
      setRecommendation(recData);

      const schedData = await api.dss.getFullSchedule(plotId);
      setSchedule(schedData);
    } catch (e: any) {
      console.error("Sync Error Detail:", e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFertilize = async () => {
    try {
      setIsSyncing(true);
      const response = await api.dss.confirmFertilizingActivity(id);

      if (!response.ok && response.status === 422) {
        const errorDetail = await response.json();
        Alert.alert("Error 422", JSON.stringify(errorDetail.detail));
        return;
      }

      Alert.alert("Success", "Fertilized!");
      await loadAllData(); // Refresh everything
    } catch (e) {
      console.log("Catch error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#1B5E20" />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#1B5E20" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.title}>{plotData?.plot_name || "Plot Details"}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>PLOT ACTIVE</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1B5E20']}
            tintColor={'#1B5E20'}
          />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <FontAwesome5 name="calendar-alt" size={18} color="#1B5E20" />
            <Text style={styles.statValue}>{dayAndStage?.age || '0'} days</Text>
            <Text style={styles.statLabel}>Age</Text>
          </View>
          <View style={styles.statCard}>
            <Entypo name="drop" size={18} color="#3498DB" />
            <Text style={styles.statValue}>{plotData?.pot_volume || '--'}L</Text>
            <Text style={styles.statLabel}>Pot Volume</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="check-circle" size={18} color="#E67E22" />
            <Text style={styles.statValue}>{dayAndStage?.stage || 'Scanning...'}</Text>
            <Text style={styles.statLabel}>Stage</Text>
          </View>
        </View>

        {/* AI Recommendation Card */}
        <View style={[styles.recomCard, styles.shadow]}>
          <View style={styles.recomHeader}>
            <View style={styles.aiBadge}>
              <MaterialIcons name="auto-awesome" size={14} color="#fff" />
              <Text style={styles.aiBadgeText}>RECOMMENDED</Text>
            </View>
            {isSyncing && <ActivityIndicator size="small" color="#fff" />}
          </View>

          {recommendation ? (
            <>
              <View style={styles.dosageBox}>
                <Text style={styles.dosageValue}>{recommendation.dosage}<Text style={{ fontSize: 18 }}>g</Text></Text>
                <View style={styles.verticalDivider} />
                <View>
                  <Text style={styles.targetFert} numberOfLines={1}>{recommendation.fertilizer_name}</Text>
                  <Text style={styles.waterNote}>Mix with {plotData?.pot_volume / 8 || 1}L Water</Text>
                </View>
              </View>

              <View style={styles.reasoningBox}>
                <Ionicons name="information-circle" size={16} color="#1B5E20" />
                <Text style={styles.reasonText}>{recommendation.recommendation_text}</Text>
              </View>

              <TouchableOpacity style={styles.applyBtn} onPress={handleFertilize} disabled={isSyncing}>
                <Text style={styles.applyBtnText}>CONFIRM FERTILIZATION</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.emptyText}>No recommendations available. Please check your fertilizer inventory.</Text>
          )}
        </View>

        {/* Timeline Section */}
        <Text style={styles.sectionTitle}>Fertilizing Schedule</Text>
        <View style={styles.timelineWrapper}>
          {schedule.length > 0 ? schedule.map((item, index) => {
            const dateObj = parseISO(item.date);
            const formattedDate = format(dateObj, 'dd/MM/yyyy');
            const dayName = format(dateObj, 'EEEE', { locale: enUS });
            const isPast = (dayAndStage?.age || 0) >= item.day_number;

            return (
              <View key={index} style={[styles.timelineNode, isPast && { opacity: 0.5 }]}>
                <View style={[styles.timelineDot, isPast && { backgroundColor: '#4CAF50' }]} />
                {index !== schedule.length - 1 && <View style={styles.timelineLine} />}

                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineDate}>{dayName}, {formattedDate}</Text>
                    {item.dosage > 0 && (
                      <View style={styles.miniBadge}>
                        <Text style={styles.miniBadgeText}>{item.dosage}g</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.timelineTask}>{item.task_name} - Day {item.day_number}</Text>
                  {item.fertilizer_name && (
                    <View style={styles.prescriptRow}>
                      <MaterialIcons name="science" size={12} color="#1B5E20" />
                      <Text style={styles.prescriptText}>Recommended: {item.fertilizer_name}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }) : (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#1B5E20" />
              <Text style={styles.emptyLog}>Creating fertilizer schedule...</Text>
            </View>
          )}
        </View>

        {/* History Section */}
        <Text style={styles.sectionTitle}>Fertilizer History</Text>
        {logs.length > 0 ? logs.map((log) => (
          <View key={log.id} style={styles.logItem}>
            <View style={styles.logLine} />
            <View style={styles.logDot} />
            <View style={styles.logContent}>
              <Text style={styles.logType}>{log.type?.toUpperCase()}</Text>
              <Text style={styles.logNote}>{log.note}</Text>
              <Text style={styles.logTime}>
                {format(parseISO(log.timestamp), 'dd/MM/yyyy HH:mm')}
              </Text>
            </View>
          </View>
        )) : <Text style={styles.emptyLog}>No activity logs available.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFCFC', paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 55, marginBottom: 25 },
  backBtn: { width: 40, height: 40, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F3F4' },
  title: { fontSize: 22, fontWeight: '900', color: '#1B5E20' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 6 },
  statusText: { fontSize: 10, color: '#95A5A6', fontWeight: 'bold', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { width: (width - 60) / 3, backgroundColor: '#fff', borderRadius: 20, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#F0F3F4' },
  statValue: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50', marginTop: 8 },
  statLabel: { fontSize: 10, color: '#95A5A6', marginTop: 2 },
  recomCard: { backgroundColor: '#1B5E20', borderRadius: 28, padding: 22, marginBottom: 30 },
  recomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  aiBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold', marginLeft: 5 },
  dosageBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  dosageValue: { fontSize: 48, fontWeight: '900', color: '#fff' },
  verticalDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 20 },
  targetFert: { color: '#fff', fontSize: 18, fontWeight: 'bold', maxWidth: 150 },
  waterNote: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  reasoningBox: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 15, alignItems: 'center' },
  reasonText: { color: '#fff', fontSize: 11, marginLeft: 10, flex: 1, lineHeight: 16, fontStyle: 'italic' },
  applyBtn: { backgroundColor: '#F39C12', padding: 16, borderRadius: 18, alignItems: 'center', marginTop: 20 },
  applyBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', textAlign: 'center', marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  timelineWrapper: { backgroundColor: '#ffffff', borderRadius: 24, padding: 15, borderWidth: 0.5, borderColor: '#F0F3F4', marginBottom: 30 },
  timelineNode: { flexDirection: 'row', marginBottom: 20, position: 'relative' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D5DBDB', zIndex: 2, marginTop: 4 },
  timelineLine: { position: 'absolute', left: 5.5, top: 15, bottom: -25, width: 1, backgroundColor: '#ECF0F1' },
  timelineContent: { flex: 1, marginLeft: 15 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  timelineDate: { fontSize: 10, fontWeight: 'bold', color: '#95A5A6' },
  timelineTask: { fontSize: 14, color: '#34495E', fontWeight: '600' },
  miniBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#C8E6C9' },
  miniBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#d57d09' },
  prescriptRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  prescriptText: { fontSize: 11, color: '#1B5E20', fontStyle: 'italic', marginLeft: 5, fontWeight: '500' },
  logItem: { flexDirection: 'row', marginBottom: 20, paddingLeft: 10 },
  logLine: { position: 'absolute', left: 13, top: 20, bottom: -20, width: 1, backgroundColor: '#ECF0F1' },
  logDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1B5E20', marginTop: 6, zIndex: 1 },
  logContent: { flex: 1, marginLeft: 20 },
  logType: { fontSize: 10, fontWeight: '900', color: '#1B5E20', letterSpacing: 1 },
  logNote: { fontSize: 14, color: '#34495E', marginVertical: 2 },
  logTime: { fontSize: 11, color: '#BDC3C7' },
  shadow: { shadowColor: "#1B5E20", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  emptyLog: { textAlign: 'center', color: '#95A5A6', fontStyle: 'italic', marginTop: 10, marginBottom: 20 },
  loadingBox: { padding: 20, alignItems: 'center' },
});