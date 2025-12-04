/**
 * Twilio Video Component - Pharmacist App
 * Integrates Twilio Video SDK for secure video consultations
 * Task: T163, INT-005
 * FR-023: Video calls MUST use end-to-end encryption with visible security indicators
 * FR-026: Consultations MUST support audio-only fallback for poor network conditions
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import {
  TwilioVideo,
  TwilioVideoLocalView,
  TwilioVideoParticipantView,
} from 'react-native-twilio-video-webrtc';

export interface TwilioVideoProps {
  accessToken: string;
  roomName: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onParticipantConnected?: (participantSid: string) => void;
  onParticipantDisconnected?: (participantSid: string) => void;
  onError?: (error: Error) => void;
  audioOnly?: boolean;
}

interface Participant {
  sid: string;
  identity: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

const TwilioVideoComponent: React.FC<TwilioVideoProps> = ({
  accessToken,
  roomName,
  onConnected,
  onDisconnected,
  onParticipantConnected,
  onParticipantDisconnected,
  onError,
  audioOnly = false,
}) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [remoteParticipants, setRemoteParticipants] = useState<Participant[]>([]);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(!audioOnly);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [networkQuality, setNetworkQuality] = useState<number>(5); // 0-5 scale
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const roomRef = useRef<any>(null);
  const maxReconnectAttempts = 3;

  useEffect(() => {
    connectToRoom();

    return () => {
      disconnectFromRoom();
    };
  }, [accessToken, roomName]);

  const connectToRoom = async () => {
    try {
      setConnecting(true);

      // Connect to Twilio Video using the SDK
      TwilioVideo.connect(accessToken, {
        roomName,
        enableVideo: !audioOnly,
        enableAudio: true,
        enableNetworkQualityReporting: true,
        dominantSpeakerEnabled: true,
      });

      // Set up event listeners
      TwilioVideo.setOnRoomDidConnect(() => {
        setConnected(true);
        setConnecting(false);
        onConnected?.();
      });

      TwilioVideo.setOnRoomDidDisconnect(() => {
        handleDisconnected();
      });

      TwilioVideo.setOnRoomDidFailToConnect((error: any) => {
        console.error('Failed to connect to room:', error);
        setConnecting(false);
        Alert.alert('Connection Error', 'Failed to connect to video call');
        onError?.(new Error(error.error || 'Connection failed'));
      });

      TwilioVideo.setOnParticipantAddedVideoTrack((participant: any) => {
        handleParticipantConnected(participant.participant);
      });

      TwilioVideo.setOnParticipantRemovedVideoTrack((participant: any) => {
        handleParticipantDisconnected(participant.participant);
      });

      // Network quality monitoring (INT-006)
      TwilioVideo.setOnNetworkQualityLevelsChanged((event: any) => {
        const quality = event.localQuality || 5;
        setNetworkQuality(quality);

        // Auto-fallback to audio-only if network is poor (quality < 2)
        if (quality < 2 && !audioOnly && localVideoEnabled) {
          console.warn('Poor network quality detected, switching to audio-only');
          Alert.alert(
            'Poor Connection',
            'Video quality is poor. Switch to audio-only mode?',
            [
              {
                text: 'Continue Video',
                style: 'cancel',
              },
              {
                text: 'Audio Only',
                onPress: () => {
                  switchToAudioOnly();
                  setLocalVideoEnabled(false);
                },
              },
            ]
          );
        }
      });

      // Reconnection handling (INT-006)
      TwilioVideo.setOnReconnecting((error: any) => {
        console.warn('Room reconnecting:', error);
        setReconnecting(true);
        setReconnectAttempts((prev) => prev + 1);
      });

      TwilioVideo.setOnReconnected(() => {
        console.log('Room reconnected successfully');
        setReconnecting(false);
        setReconnectAttempts(0);
        Alert.alert('Connection Restored', 'Video call has been restored');
      });
    } catch (error: any) {
      console.error('Failed to connect to room:', error);
      setConnecting(false);

      // Enhanced error handling (INT-006)
      if (reconnectAttempts < maxReconnectAttempts) {
        Alert.alert(
          'Connection Error',
          `Failed to connect. Retry attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}?`,
          [
            {
              text: 'Cancel',
              onPress: () => onError?.(error),
            },
            {
              text: 'Retry',
              onPress: () => {
                setReconnectAttempts((prev) => prev + 1);
                setTimeout(() => connectToRoom(), 2000);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Connection Failed',
          'Unable to connect after multiple attempts. Please check your network and try again later.'
        );
        onError?.(error);
      }
    }
  };

  const disconnectFromRoom = () => {
    TwilioVideo.disconnect();
    roomRef.current = null;
    setConnected(false);
    onDisconnected?.();
  };

  const handleParticipantConnected = (participant: any) => {
    console.log('Participant connected:', participant.identity);

    const newParticipant: Participant = {
      sid: participant.sid,
      identity: participant.identity,
      videoEnabled: true,
      audioEnabled: true,
    };

    setRemoteParticipants((prev) => [...prev, newParticipant]);
    onParticipantConnected?.(participant.sid);
  };

  const handleParticipantDisconnected = (participant: any) => {
    console.log('Participant disconnected:', participant.identity);

    setRemoteParticipants((prev) =>
      prev.filter((p) => p.sid !== participant.sid)
    );
    onParticipantDisconnected?.(participant.sid);
  };

  const handleDisconnected = () => {
    console.log('Disconnected from room');
    setConnected(false);
    setRemoteParticipants([]);
    onDisconnected?.();
  };

  if (connecting || reconnecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {reconnecting ? 'Reconnecting...' : 'Connecting to video call...'}
        </Text>
        {reconnecting && reconnectAttempts > 0 && (
          <Text style={styles.reconnectText}>
            Attempt {reconnectAttempts}/{maxReconnectAttempts}
          </Text>
        )}
      </View>
    );
  }

  if (!connected) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Not connected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Remote Participant Video (Patient) */}
      {remoteParticipants.length > 0 ? (
        <View style={styles.remoteVideoContainer}>
          <TwilioVideoParticipantView
            trackIdentifier={{
              participantSid: remoteParticipants[0].sid,
              videoTrackSid: remoteParticipants[0].sid + '_video',
            }}
            style={styles.remoteVideo}
            scaleType="fit"
          />
          {/* Patient Name Overlay */}
          <View style={styles.patientOverlay}>
            <Text style={styles.patientOverlayText}>
              {remoteParticipants[0].identity}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.waitingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.waitingText}>
            Waiting for patient to join...
          </Text>
        </View>
      )}

      {/* Local Video (Picture-in-Picture) */}
      {!audioOnly && localVideoEnabled && (
        <View style={styles.localVideoContainer}>
          <TwilioVideoLocalView
            enabled={true}
            style={styles.localVideo}
            scaleType="fit"
          />
        </View>
      )}

      {/* Audio-Only Indicator */}
      {audioOnly && (
        <View style={styles.audioOnlyContainer}>
          <Text style={styles.audioOnlyIcon}>🎤</Text>
          <Text style={styles.audioOnlyText}>Audio Only Mode</Text>
        </View>
      )}

      {/* Network Quality Indicator */}
      {networkQuality < 3 && (
        <View style={styles.networkWarning}>
          <Text style={styles.networkWarningText}>
            {networkQuality < 2 ? '⚠️ Poor Connection' : '⚡ Fair Connection'}
          </Text>
        </View>
      )}
    </View>
  );
};

// Exposed methods for controlling the video
export const toggleLocalVideo = (enabled: boolean) => {
  TwilioVideo.setLocalVideoEnabled(enabled);
  console.log('Toggle local video:', enabled);
};

export const toggleLocalAudio = (enabled: boolean) => {
  TwilioVideo.setLocalAudioEnabled(enabled);
  console.log('Toggle local audio:', enabled);
};

export const switchToAudioOnly = () => {
  TwilioVideo.setLocalVideoEnabled(false);
  console.log('Switched to audio-only mode');
};

export const switchToVideoMode = () => {
  TwilioVideo.setLocalVideoEnabled(true);
  console.log('Switched to video mode');
};

export const disconnectCall = () => {
  TwilioVideo.disconnect();
  console.log('Disconnecting from call');
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  reconnectText: {
    color: '#FF9500',
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  waitingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: width * 0.3,
    height: width * 0.4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  localVideo: {
    flex: 1,
  },
  audioOnlyContainer: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  audioOnlyIcon: {
    fontSize: 64,
  },
  audioOnlyText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  patientOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  patientOverlayText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  networkWarning: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 149, 0, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  networkWarningText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TwilioVideoComponent;
