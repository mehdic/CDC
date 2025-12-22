/**
 * Handover Note Card Component
 * Displays a shift handover note
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { ShiftHandoverNote } from '../types/nurse';

export interface HandoverNoteCardProps {
  note: ShiftHandoverNote;
  isAcknowledged?: boolean;
  onAcknowledge?: () => void;
  onView?: () => void;
}

export const HandoverNoteCard: React.FC<HandoverNoteCardProps> = ({
  note,
  isAcknowledged = false,
  onAcknowledge,
  onView,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [acknowledging, setAcknowledging] = useState<boolean>(false);

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      if (onAcknowledge) {
        onAcknowledge();
      }
      Alert.alert('Success', 'Handover acknowledged');
    } catch (error) {
      Alert.alert('Error', 'Failed to acknowledge handover');
    } finally {
      setAcknowledging(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasCriticalAlerts = note.patients.some((p) =>
    p.criticalNotes && p.criticalNotes.length > 0
  );

  return (
    <View
      style={[
        styles.card,
        hasCriticalAlerts && styles.cardCritical,
        isAcknowledged && styles.cardAcknowledged,
      ]}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.shiftBadge}>{note.shift.toUpperCase()}</Text>
            <Text style={styles.date}>{formatDate(note.date)}</Text>
          </View>
          <View style={styles.stats}>
            <Text style={styles.patientCount}>
              {note.patients.length} patient{note.patients.length !== 1 ? 's' : ''}
            </Text>
            {hasCriticalAlerts && (
              <Text style={styles.criticalBadge}>Critical Alert</Text>
            )}
          </View>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          {/* Nurse Info */}
          <View style={styles.infoSection}>
            <Text style={styles.label}>From Nurse</Text>
            <Text style={styles.value}>{note.fromNurse}</Text>
          </View>

          {/* Patients */}
          <View style={styles.infoSection}>
            <Text style={styles.label}>Patients</Text>
            {note.patients.map((patient, index) => (
              <View key={index} style={styles.patientItem}>
                <Text style={styles.patientName}>{patient.patientName}</Text>
                <Text style={styles.patientInfo}>Status: {patient.status}</Text>
                {patient.criticalNotes && (
                  <Text style={styles.criticalInfo}>
                    Critical: {patient.criticalNotes}
                  </Text>
                )}
                {patient.pendingTasks && patient.pendingTasks.length > 0 && (
                  <View style={styles.tasksContainer}>
                    <Text style={styles.tasksLabel}>Pending Tasks:</Text>
                    {patient.pendingTasks.map((task, taskIndex) => (
                      <Text key={taskIndex} style={styles.taskItem}>
                        • {task}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* General Notes */}
          {note.generalNotes && (
            <View style={styles.infoSection}>
              <Text style={styles.label}>General Notes</Text>
              <Text style={styles.value}>{note.generalNotes}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {onView && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onView}
              >
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
            )}
            {!isAcknowledged && onAcknowledge && (
              <TouchableOpacity
                style={[styles.actionButton, styles.acknowledgeButton]}
                onPress={handleAcknowledge}
                disabled={acknowledging}
              >
                <Text style={styles.acknowledgeButtonText}>
                  {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Acknowledged Badge */}
      {isAcknowledged && (
        <View style={styles.acknowledgedBadge}>
          <Text style={styles.acknowledgedBadgeText}>✓ Acknowledged</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  cardCritical: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    backgroundColor: '#fff8f9',
  },
  cardAcknowledged: {
    backgroundColor: '#f1f9f1',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#6c757d',
  },
  stats: {
    alignItems: 'flex-end',
  },
  patientCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  criticalBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expandIcon: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginBottom: 12,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#212529',
  },
  patientItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  patientInfo: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 2,
  },
  criticalInfo: {
    fontSize: 13,
    color: '#dc3545',
    fontWeight: '500',
    marginBottom: 4,
  },
  tasksContainer: {
    marginTop: 8,
  },
  tasksLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  taskItem: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  acknowledgeButton: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  acknowledgeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  acknowledgedBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
  },
  acknowledgedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#28a745',
  },
});

export default HandoverNoteCard;
