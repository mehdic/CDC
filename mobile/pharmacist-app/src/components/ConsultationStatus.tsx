/**
 * Consultation Status Component - Pharmacist App
 * Displays current status and progress of teleconsultation
 * Task: T168
 * FR-028: Track consultation session state
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TeleconsultationStatus } from '../services/teleconsultationService';

interface ConsultationStatusProps {
  status: TeleconsultationStatus;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number;
  recordingConsent: boolean;
}

const ConsultationStatus: React.FC<ConsultationStatusProps> = ({
  status,
  scheduledAt,
  startedAt,
  endedAt,
  durationMinutes,
  recordingConsent,
}) => {
  const getStatusColor = (): string => {
    switch (status) {
      case TeleconsultationStatus.SCHEDULED:
        return '#007AFF';
      case TeleconsultationStatus.IN_PROGRESS:
        return '#FF3B30';
      case TeleconsultationStatus.COMPLETED:
        return '#34C759';
      case TeleconsultationStatus.CANCELLED:
        return '#8E8E93';
      case TeleconsultationStatus.NO_SHOW:
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case TeleconsultationStatus.SCHEDULED:
        return 'Scheduled';
      case TeleconsultationStatus.IN_PROGRESS:
        return 'In Progress';
      case TeleconsultationStatus.COMPLETED:
        return 'Completed';
      case TeleconsultationStatus.CANCELLED:
        return 'Cancelled';
      case TeleconsultationStatus.NO_SHOW:
        return 'No Show';
      default:
        return 'Unknown';
    }
  };

  const getElapsedTime = (): string | null => {
    if (!startedAt) return null;

    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = (): string | null => {
    if (!startedAt || status !== TeleconsultationStatus.IN_PROGRESS) return null;

    const start = new Date(startedAt);
    const now = new Date();
    const elapsedMs = now.getTime() - start.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const remaining = durationMinutes - elapsedMinutes;

    if (remaining <= 0) return 'Overtime';
    return `${remaining} min remaining`;
  };

  const formatScheduledTime = (): string => {
    const date = new Date(scheduledAt);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const elapsedTime = getElapsedTime();
  const remainingTime = getRemainingTime();

  return (
    <View style={styles.container}>
      {/* Status Badge */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        {recordingConsent && status === TeleconsultationStatus.IN_PROGRESS && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording</Text>
          </View>
        )}
      </View>

      {/* Time Information */}
      <View style={styles.timeInfo}>
        {status === TeleconsultationStatus.SCHEDULED && (
          <Text style={styles.timeText}>Scheduled for {formatScheduledTime()}</Text>
        )}

        {status === TeleconsultationStatus.IN_PROGRESS && elapsedTime && (
          <View style={styles.progressInfo}>
            <Text style={styles.elapsedText}>Elapsed: {elapsedTime}</Text>
            {remainingTime && (
              <Text
                style={[
                  styles.remainingText,
                  remainingTime === 'Overtime' && styles.overtimeText,
                ]}
              >
                {remainingTime}
              </Text>
            )}
          </View>
        )}

        {status === TeleconsultationStatus.COMPLETED && (
          <Text style={styles.completedText}>
            Completed on {endedAt && new Date(endedAt).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Progress Bar for Active Consultations */}
      {status === TeleconsultationStatus.IN_PROGRESS && startedAt && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(
                  ((Date.now() - new Date(startedAt).getTime()) /
                    (durationMinutes * 60000)) *
                    100,
                  100
                )}%`,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timeInfo: {
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  elapsedText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 14,
    color: '#007AFF',
  },
  overtimeText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  completedText: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
});

export default ConsultationStatus;
