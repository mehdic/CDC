/**
 * Book Teleconsultation Screen - Patient App
 * Allows patients to book video consultations with pharmacists
 * Task: T152
 * FR-021: Patients MUST be able to view available time slots and book appointments
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { teleconsultationService } from '../services/teleconsultationService';

interface TimeSlot {
  datetime: string;
  available: boolean;
}

interface Pharmacist {
  id: string;
  name: string;
  availableSlots: string[];
}

const BookTeleconsultationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([]);
  const [selectedPharmacist, setSelectedPharmacist] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await teleconsultationService.getAvailability({
        days: 7,
      });
      setPharmacists(response.pharmacists);
    } catch (error) {
      Alert.alert('Error', 'Failed to load availability');
      console.error('Load availability error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedPharmacist || !selectedSlot) {
      Alert.alert('Error', 'Please select a pharmacist and time slot');
      return;
    }

    try {
      setLoading(true);
      await teleconsultationService.book({
        pharmacist_id: selectedPharmacist,
        scheduled_at: selectedSlot,
        duration_minutes: 15,
        recording_consent: recordingConsent,
      });

      Alert.alert('Success', 'Teleconsultation booked successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to book teleconsultation');
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Book Teleconsultation</Text>

      {/* Pharmacist Selection */}
      <Text style={styles.sectionTitle}>Select Pharmacist</Text>
      {pharmacists.map((pharmacist) => (
        <TouchableOpacity
          key={pharmacist.id}
          style={[
            styles.pharmacistCard,
            selectedPharmacist === pharmacist.id && styles.selectedCard,
          ]}
          onPress={() => setSelectedPharmacist(pharmacist.id)}
        >
          <Text style={styles.pharmacistName}>{pharmacist.name}</Text>
          <Text style={styles.availableSlots}>
            {pharmacist.availableSlots.length} slots available
          </Text>
        </TouchableOpacity>
      ))}

      {/* Time Slot Selection */}
      {selectedPharmacist && (
        <>
          <Text style={styles.sectionTitle}>Select Time Slot</Text>
          {/* AvailabilityCalendar component would go here - see T153 */}
          <Text style={styles.placeholder}>
            [AvailabilityCalendar Component - T153]
          </Text>
        </>
      )}

      {/* Recording Consent */}
      <View style={styles.consentContainer}>
        <Text style={styles.consentLabel}>
          I consent to this consultation being recorded for quality and training
          purposes
        </Text>
        {/* Checkbox component */}
      </View>

      {/* Book Button */}
      <TouchableOpacity
        style={[styles.bookButton, loading && styles.disabledButton]}
        onPress={handleBooking}
        disabled={loading || !selectedPharmacist || !selectedSlot}
      >
        <Text style={styles.bookButtonText}>
          {loading ? 'Booking...' : 'Book Teleconsultation'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  pharmacistCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#007AFF',
  },
  pharmacistName: {
    fontSize: 16,
    fontWeight: '600',
  },
  availableSlots: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  placeholder: {
    padding: 40,
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  consentContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  consentLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 40,
  },
  disabledButton: {
    opacity: 0.5,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BookTeleconsultationScreen;
