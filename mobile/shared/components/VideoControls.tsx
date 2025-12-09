/**
 * Video Controls Component - Patient App
 * Control buttons for video consultation (mute, video, end call)
 * Task: T156
 * FR-026: Consultations MUST support audio-only fallback for poor network conditions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

export interface VideoControlsProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioOnly?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onSwitchToAudioOnly?: () => void;
  onSwitchToVideo?: () => void;
  onEndCall: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  audioEnabled,
  videoEnabled,
  audioOnly = false,
  onToggleAudio,
  onToggleVideo,
  onSwitchToAudioOnly,
  onSwitchToVideo,
  onEndCall,
}) => {
  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this consultation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: onEndCall,
        },
      ]
    );
  };

  const handleSwitchMode = () => {
    if (audioOnly) {
      Alert.alert(
        'Enable Video',
        'Switch to video mode? This may use more data.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Enable Video',
            onPress: onSwitchToVideo,
          },
        ]
      );
    } else {
      Alert.alert(
        'Audio Only Mode',
        'Switch to audio-only mode to save data and improve connection?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Audio Only',
            onPress: onSwitchToAudioOnly,
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Audio Control */}
      <TouchableOpacity
        style={[styles.controlButton, !audioEnabled && styles.disabledControl]}
        onPress={onToggleAudio}
      >
        <Text style={styles.controlIcon}>
          {audioEnabled ? '🎤' : '🔇'}
        </Text>
        <Text style={styles.controlLabel}>
          {audioEnabled ? 'Mute' : 'Unmute'}
        </Text>
      </TouchableOpacity>

      {/* Video Control */}
      {!audioOnly && (
        <TouchableOpacity
          style={[styles.controlButton, !videoEnabled && styles.disabledControl]}
          onPress={onToggleVideo}
        >
          <Text style={styles.controlIcon}>
            {videoEnabled ? '📹' : '🚫'}
          </Text>
          <Text style={styles.controlLabel}>
            {videoEnabled ? 'Video On' : 'Video Off'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Switch Mode Control (Audio-only fallback) */}
      {(onSwitchToAudioOnly || onSwitchToVideo) && (
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSwitchMode}
        >
          <Text style={styles.controlIcon}>
            {audioOnly ? '📹' : '🎧'}
          </Text>
          <Text style={styles.controlLabel}>
            {audioOnly ? 'Enable Video' : 'Audio Only'}
          </Text>
        </TouchableOpacity>
      )}

      {/* End Call Button */}
      <TouchableOpacity
        style={[styles.controlButton, styles.endCallButton]}
        onPress={handleEndCall}
      >
        <Text style={styles.controlIcon}>📞</Text>
        <Text style={[styles.controlLabel, styles.endCallText]}>
          End Call
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 70,
  },
  disabledControl: {
    opacity: 0.5,
  },
  controlIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  endCallButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  endCallText: {
    color: '#fff',
  },
});

export default VideoControls;
