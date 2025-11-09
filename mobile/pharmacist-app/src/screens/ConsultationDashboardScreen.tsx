/**
 * Consultation Dashboard Screen - Pharmacist App
 * Shows upcoming and active teleconsultations for pharmacist
 * Task: T162
 * FR-021, FR-022: View scheduled consultations and receive reminders
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  teleconsultationService,
  Teleconsultation,
  TeleconsultationStatus,
} from '../services/teleconsultationService';

const ConsultationDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeConsultations, setActiveConsultations] = useState<Teleconsultation[]>([]);
  const [upcomingConsultations, setUpcomingConsultations] = useState<Teleconsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConsultations();

    // Auto-refresh every 30 seconds for active consultations
    const interval = setInterval(() => {
      refreshActiveConsultations();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      await Promise.all([loadActiveConsultations(), loadUpcomingConsultations()]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load consultations');
      console.error('Load consultations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveConsultations = async () => {
    try {
      const active = await teleconsultationService.getActive();
      setActiveConsultations(active);
    } catch (error) {
      console.error('Load active consultations error:', error);
    }
  };

  const loadUpcomingConsultations = async () => {
    try {
      const upcoming = await teleconsultationService.getUpcoming();
      setUpcomingConsultations(upcoming);
    } catch (error) {
      console.error('Load upcoming consultations error:', error);
    }
  };

  const refreshActiveConsultations = async () => {
    try {
      await loadActiveConsultations();
    } catch (error) {
      console.error('Refresh active consultations error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConsultations();
    setRefreshing(false);
  };

  const handleJoinConsultation = (consultation: Teleconsultation) => {
    // Navigate to video call screen (T163)
    (navigation as any).navigate('PharmacistVideoCall', {
      teleconsultationId: consultation.id,
    });
  };

  const handleViewConsultation = (consultation: Teleconsultation) => {
    Alert.alert(
      'Consultation Details',
      `Patient: ${consultation.patient?.first_name} ${consultation.patient?.last_name}\nScheduled: ${new Date(consultation.scheduled_at).toLocaleString()}\nDuration: ${consultation.duration_minutes} minutes`,
      [{ text: 'OK' }]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (scheduledAt: string): string => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diffMs = scheduled.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return 'Now';
    if (diffMins < 60) return `in ${diffMins} min`;
    if (diffMins < 1440) return `in ${Math.floor(diffMins / 60)} hours`;
    return `in ${Math.floor(diffMins / 1440)} days`;
  };

  const renderConsultationCard = (
    consultation: Teleconsultation,
    isActive: boolean
  ) => {
    const canJoin = isActive ||
      new Date(consultation.scheduled_at).getTime() - Date.now() < 15 * 60 * 1000; // 15 min before

    return (
      <TouchableOpacity
        key={consultation.id}
        style={[
          styles.consultationCard,
          isActive && styles.activeCard,
        ]}
        onPress={() => handleViewConsultation(consultation)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              {consultation.patient?.first_name} {consultation.patient?.last_name}
            </Text>
            <Text style={styles.patientEmail}>
              {consultation.patient?.email}
            </Text>
          </View>
          {isActive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.consultationDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled:</Text>
            <Text style={styles.detailValue}>{formatDate(consultation.scheduled_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{consultation.duration_minutes} minutes</Text>
          </View>
          {!isActive && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Starts:</Text>
              <Text style={[styles.detailValue, styles.timeUntil]}>
                {getTimeUntil(consultation.scheduled_at)}
              </Text>
            </View>
          )}
          {consultation.recording_consent && (
            <View style={styles.detailRow}>
              <Text style={styles.recordingBadge}>Recording Consented</Text>
            </View>
          )}
        </View>

        {canJoin && (
          <TouchableOpacity
            style={[
              styles.joinButton,
              isActive && styles.joinButtonActive,
            ]}
            onPress={() => handleJoinConsultation(consultation)}
          >
            <Text style={styles.joinButtonText}>
              {isActive ? 'Rejoin Call' : 'Join Consultation'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading consultations...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.title}>Teleconsultations</Text>

      {/* Active Consultations */}
      {activeConsultations.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Now</Text>
            <View style={styles.activeCount}>
              <Text style={styles.activeCountText}>{activeConsultations.length}</Text>
            </View>
          </View>
          {activeConsultations.map((consultation) =>
            renderConsultationCard(consultation, true)
          )}
        </>
      )}

      {/* Upcoming Consultations */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming</Text>
        <Text style={styles.sectionCount}>({upcomingConsultations.length})</Text>
      </View>

      {upcomingConsultations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No upcoming consultations</Text>
          <Text style={styles.emptyStateSubtext}>
            Patients will be able to book consultations with you
          </Text>
        </View>
      ) : (
        upcomingConsultations.map((consultation) =>
          renderConsultationCard(consultation, false)
        )
      )}

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  activeCount: {
    marginLeft: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  consultationDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  timeUntil: {
    fontWeight: '600',
    color: '#007AFF',
  },
  recordingBadge: {
    fontSize: 12,
    color: '#34C759',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  joinButtonActive: {
    backgroundColor: '#FF3B30',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    height: 40,
  },
});

export default ConsultationDashboardScreen;
