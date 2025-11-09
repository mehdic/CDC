/**
 * Upcoming Consultations Screen - Patient App
 * Lists upcoming teleconsultations with join/cancel options
 * Task: T159
 * FR-021: Patients MUST be able to view available time slots and book appointments
 * FR-022: System MUST send appointment reminder notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { teleconsultationService } from '../services/teleconsultationService';

interface Teleconsultation {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  pharmacist: {
    id: string;
    name: string;
  };
  recording_consent: boolean;
}

const UpcomingConsultationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [consultations, setConsultations] = useState<Teleconsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const response = await teleconsultationService.getUpcoming();
      setConsultations(response.consultations || []);
    } catch (error) {
      console.error('Failed to load consultations:', error);
      Alert.alert('Error', 'Failed to load upcoming consultations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConsultations();
    setRefreshing(false);
  };

  const handleJoinCall = (consultation: Teleconsultation) => {
    const scheduledTime = new Date(consultation.scheduled_at);
    const now = new Date();
    const minutesUntil = (scheduledTime.getTime() - now.getTime()) / 1000 / 60;

    // Allow joining 5 minutes early
    if (minutesUntil > 5) {
      Alert.alert(
        'Too Early',
        `This consultation starts in ${Math.floor(minutesUntil)} minutes. You can join 5 minutes before the scheduled time.`
      );
      return;
    }

    // Navigate to video call screen
    navigation.navigate('VideoCall', {
      teleconsultationId: consultation.id,
    });
  };

  const handleCancelConsultation = (consultationId: string) => {
    Alert.alert(
      'Cancel Consultation',
      'Are you sure you want to cancel this consultation?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await teleconsultationService.cancel(
                consultationId,
                'Patient requested cancellation'
              );
              Alert.alert('Success', 'Consultation cancelled successfully');
              loadConsultations();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel consultation');
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today at ${timeString}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeString}`;
    } else {
      const dateString = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `${dateString} at ${timeString}`;
    }
  };

  const getTimeUntil = (datetime: string) => {
    const scheduledTime = new Date(datetime);
    const now = new Date();
    const minutesUntil = Math.floor(
      (scheduledTime.getTime() - now.getTime()) / 1000 / 60
    );

    if (minutesUntil < 0) {
      return 'Starting now';
    } else if (minutesUntil < 60) {
      return `in ${minutesUntil} min`;
    } else if (minutesUntil < 24 * 60) {
      const hours = Math.floor(minutesUntil / 60);
      return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutesUntil / (24 * 60));
      return `in ${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const canJoin = (datetime: string) => {
    const scheduledTime = new Date(datetime);
    const now = new Date();
    const minutesUntil = (scheduledTime.getTime() - now.getTime()) / 1000 / 60;

    // Can join 5 minutes early, up to 15 minutes late
    return minutesUntil <= 5 && minutesUntil >= -15;
  };

  const renderConsultation = ({ item }: { item: Teleconsultation }) => {
    const joinable = canJoin(item.scheduled_at);

    return (
      <View style={styles.consultationCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.pharmacistName}>{item.pharmacist.name}</Text>
            <Text style={styles.dateTime}>{formatDateTime(item.scheduled_at)}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{getTimeUntil(item.scheduled_at)}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.detailText}>
            ⏱ Duration: {item.duration_minutes} minutes
          </Text>
          {item.recording_consent && (
            <Text style={styles.detailText}>
              🎥 Recording enabled
            </Text>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.joinButton, !joinable && styles.disabledButton]}
            onPress={() => handleJoinCall(item)}
            disabled={!joinable}
          >
            <Text style={styles.joinButtonText}>
              {joinable ? 'Join Call' : 'Not Yet Available'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelConsultation(item.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No Upcoming Consultations</Text>
      <Text style={styles.emptyText}>
        You don't have any scheduled teleconsultations
      </Text>
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => navigation.navigate('BookTeleconsultation')}
      >
        <Text style={styles.bookButtonText}>Book a Consultation</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading consultations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={consultations}
        renderItem={renderConsultation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
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
  listContent: {
    padding: 16,
  },
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pharmacistName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UpcomingConsultationsScreen;
