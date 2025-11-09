/**
 * Availability Calendar Component - Patient App
 * Displays available time slots for teleconsultation booking
 * Task: T153
 * FR-021: Patients MUST be able to view available time slots and book appointments
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

export interface TimeSlot {
  datetime: string;
  available: boolean;
  duration_minutes?: number;
}

export interface AvailabilityCalendarProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (datetime: string) => void;
  loading?: boolean;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  loading = false,
}) => {
  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = new Date(slot.datetime);
    const dateKey = date.toISOString().split('T')[0];

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }

    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's today or tomorrow
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    // Format as "Mon, Jan 15"
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading available slots...</Text>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No available slots at this time
        </Text>
        <Text style={styles.emptySubtext}>
          Please try selecting a different pharmacist or check back later
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} nestedScrollEnabled>
      {Object.keys(slotsByDate)
        .sort()
        .map((dateKey) => {
          const dateSlots = slotsByDate[dateKey];
          const availableSlots = dateSlots.filter((s) => s.available);

          if (availableSlots.length === 0) {
            return null; // Don't show dates with no available slots
          }

          return (
            <View key={dateKey} style={styles.daySection}>
              <Text style={styles.dateHeader}>{formatDate(dateKey)}</Text>

              <View style={styles.slotsGrid}>
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.datetime;

                  return (
                    <TouchableOpacity
                      key={slot.datetime}
                      style={[
                        styles.slotButton,
                        isSelected && styles.selectedSlot,
                      ]}
                      onPress={() => onSelectSlot(slot.datetime)}
                    >
                      <Text
                        style={[
                          styles.slotTime,
                          isSelected && styles.selectedSlotText,
                        ]}
                      >
                        {formatTime(slot.datetime)}
                      </Text>
                      {slot.duration_minutes && (
                        <Text
                          style={[
                            styles.slotDuration,
                            isSelected && styles.selectedSlotText,
                          ]}
                        >
                          {slot.duration_minutes} min
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  daySection: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  slotButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedSlot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  slotDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectedSlotText: {
    color: '#fff',
  },
});

export default AvailabilityCalendar;
