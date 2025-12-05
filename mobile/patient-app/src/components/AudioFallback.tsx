/**
 * Audio Fallback Component - Patient App
 * Audio-only mode UI for poor network conditions
 * Task: T157
 * FR-026: Consultations MUST support audio-only fallback for poor network conditions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

export interface AudioFallbackProps {
  participantName?: string;
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'reconnecting';
  audioEnabled: boolean;
  onSwitchToVideo?: () => void;
  onToggleAudio: () => void;
}

const AudioFallback: React.FC<AudioFallbackProps> = ({
  participantName = 'Pharmacist',
  connectionQuality = 'good',
  audioEnabled,
  onSwitchToVideo,
  onToggleAudio,
}) => {
  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'poor':
        return '#FF9800';
      case 'reconnecting':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
        return '📶';
      case 'good':
        return '📶';
      case 'poor':
        return '📶';
      case 'reconnecting':
        return '⚠️';
      default:
        return '📶';
    }
  };

  const getQualityText = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'Excellent Connection';
      case 'good':
        return 'Good Connection';
      case 'poor':
        return 'Poor Connection';
      case 'reconnecting':
        return 'Reconnecting...';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      {/* Audio Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.audioIcon}>🎧</Text>
        <Text style={styles.modeText}>Audio Only Mode</Text>
      </View>

      {/* Participant Info */}
      <View style={styles.participantContainer}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {participantName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.participantName}>{participantName}</Text>
        <Text style={styles.participantStatus}>
          {audioEnabled ? 'Speaking...' : 'Muted'}
        </Text>
      </View>

      {/* Connection Quality */}
      <View style={styles.qualityContainer}>
        <View
          style={[
            styles.qualityIndicator,
            { backgroundColor: getQualityColor() },
          ]}
        >
          <Text style={styles.qualityIcon}>{getQualityIcon()}</Text>
          <Text style={styles.qualityText}>{getQualityText()}</Text>
        </View>

        {connectionQuality === 'reconnecting' && (
          <ActivityIndicator
            size="small"
            color="#fff"
            style={styles.loadingIndicator}
          />
        )}
      </View>

      {/* Switch to Video Button */}
      {onSwitchToVideo && connectionQuality !== 'poor' && (
        <TouchableOpacity
          style={styles.switchButton}
          onPress={onSwitchToVideo}
        >
          <Text style={styles.switchIcon}>📹</Text>
          <Text style={styles.switchText}>Switch to Video</Text>
        </TouchableOpacity>
      )}

      {/* Info Text */}
      <Text style={styles.infoText}>
        {connectionQuality === 'poor'
          ? 'Audio-only mode helps maintain call quality on slow connections'
          : 'Video has been disabled to save bandwidth'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  audioIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  modeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  participantContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  participantName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  participantStatus: {
    fontSize: 16,
    color: '#999',
  },
  qualityContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  qualityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loadingIndicator: {
    marginTop: 12,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 16,
  },
  switchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  switchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
    maxWidth: 300,
  },
});

export default AudioFallback;
