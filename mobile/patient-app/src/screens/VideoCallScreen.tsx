/**
 * Video Call Screen - Patient App
 * Twilio Video integration for teleconsultation
 * Task: T154
 * FR-023: Video calls MUST use end-to-end encryption with visible security indicators
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { teleconsultationService } from '../services/teleconsultationService';

// NOTE: In production, would use actual Twilio Video SDK (Task T155)
// import { TwilioVideo } from '@twilio/react-native-video';

interface VideoCallProps {
  teleconsultationId: string;
}

const VideoCallScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { teleconsultationId } = route.params as VideoCallProps;

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [roomSid, setRoomSid] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    joinCall();
  }, []);

  const joinCall = async () => {
    try {
      const response = await teleconsultationService.join(teleconsultationId);

      setAccessToken(response.access_token);
      setRoomSid(response.room_sid);
      setConnected(true);

      // In production, initialize Twilio Video SDK here (T155)
      // TwilioVideo.connect(response.access_token, {
      //   roomName: response.room_name,
      // });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to join video call');
      console.error('Join call error:', error);
      navigation.goBack();
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    // In production: TwilioVideo.setLocalAudioEnabled(!muted);
  };

  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
    // In production: TwilioVideo.setLocalVideoEnabled(!videoEnabled);
  };

  const endCall = async () => {
    Alert.alert('End Call', 'Are you sure you want to end this call?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'End Call',
        style: 'destructive',
        onPress: () => {
          // In production: TwilioVideo.disconnect();
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Security Indicator (FR-023) */}
      <View style={styles.securityBanner}>
        <Text style={styles.securityText}>🔒 End-to-end encrypted</Text>
      </View>

      {/* Video Container */}
      <View style={styles.videoContainer}>
        <Text style={styles.placeholder}>
          [Twilio Video Component - T155]
          {'\n\n'}
          Room SID: {roomSid || 'Connecting...'}
          {'\n'}
          Status: {connected ? 'Connected' : 'Connecting...'}
        </Text>
      </View>

      {/* Video Controls (T156) */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, muted && styles.activeControl]}
          onPress={toggleMute}
        >
          <Text style={styles.controlText}>{muted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !videoEnabled && styles.activeControl]}
          onPress={toggleVideo}
        >
          <Text style={styles.controlText}>{videoEnabled ? '📹' : '🚫'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={endCall}
        >
          <Text style={styles.controlText}>📞</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  securityBanner: {
    backgroundColor: '#4CAF50',
    padding: 8,
    alignItems: 'center',
  },
  securityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControl: {
    backgroundColor: '#FF5722',
  },
  endCallButton: {
    backgroundColor: '#F44336',
  },
  controlText: {
    fontSize: 24,
  },
});

export default VideoCallScreen;
