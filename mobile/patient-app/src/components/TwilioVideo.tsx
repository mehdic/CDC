/**
 * Twilio Video Component - Patient App
 * Integrates Twilio Video SDK for secure video consultations
 * Task: T155
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
  const [_localVideoEnabled, _setLocalVideoEnabled] = useState(!audioOnly);
  const [_localAudioEnabled, _setLocalAudioEnabled] = useState(true);
  const [_networkQuality, _setNetworkQuality] = useState<number>(5);
  const [_reconnecting, _setReconnecting] = useState(false);
  const [_reconnectAttempts, _setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 3;
  const _roomRef = useRef<any>(null);

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

      TwilioVideo.setOnRoomDidDisconnect((_event: any) => {
        handleDisconnected();
      });

      TwilioVideo.setOnRoomDidFailToConnect((_error: any) => {
        console.error('Failed to connect to room:', _error);
        setConnecting(false);
        Alert.alert('Connection Error', 'Failed to connect to video call');
        onError?.(new Error(_error.error || 'Connection failed'));
      });

      TwilioVideo.setOnParticipantAddedVideoTrack((event: any) => {
        const newParticipant: Participant = {
          sid: event.participant.sid,
          identity: event.participant.identity,
          videoEnabled: true,
          audioEnabled: true,
        };
        setRemoteParticipants((prev) => {
          const exists = prev.find((p) => p.sid === event.participant.sid);
          if (exists) {return prev;}
          return [...prev, newParticipant];
        });
        onParticipantConnected?.(event.participant.sid);
      });

      TwilioVideo.setOnParticipantRemovedVideoTrack((event: any) => {
        setRemoteParticipants((prev) =>
          prev.filter((p) => p.sid !== event.participant.sid)
        );
        onParticipantDisconnected?.(event.participant.sid);
      });

      // Network quality monitoring (INT-006)
      TwilioVideo.setOnNetworkQualityLevelsChanged((event: any) => {
        const quality = event.localQuality || 5;
        setNetworkQuality(quality);

        // Suggest audio-only if poor connection
        if (quality < 2 && !audioOnly && localVideoEnabled) {
          Alert.alert(
            'Poor Connection',
            'Video quality is poor. Switch to audio-only mode?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Switch to Audio',
                onPress: () => {
                  TwilioVideo.setLocalVideoEnabled(false);
                  setLocalVideoEnabled(false);
                },
              },
            ]
          );
        }
      });

      // Reconnection handling (INT-006)
      TwilioVideo.setOnReconnecting((error: any) => {
        setReconnecting(true);
        setReconnectAttempts((prev) => prev + 1);

        if (reconnectAttempts >= maxReconnectAttempts) {
          Alert.alert(
            'Connection Lost',
            'Unable to reconnect after multiple attempts. Please try again.',
            [
              {
                text: 'OK',
                onPress: () => {
                  disconnectFromRoom();
                },
              },
            ]
          );
        }
      });

      TwilioVideo.setOnReconnected(() => {
        setReconnecting(false);
        setReconnectAttempts(0);
        Alert.alert(
          'Connection Restored',
          'Video call has been restored'
        );
      });
    } catch (error: any) {
      console.error('Failed to connect to room:', error);
      setConnecting(false);
      Alert.alert('Connection Error', 'Failed to connect to video call');
      onError?.(error);
    }
  };

  const disconnectFromRoom = () => {
    TwilioVideo.disconnect();
    setConnected(false);
    setRemoteParticipants([]);
    onDisconnected?.();
  };

  const _handleParticipantConnected = (participant: any) => {
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

  const _handleParticipantDisconnected = (participant: any) => {
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

  if (connecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Connecting to video call...</Text>
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
      {/* Remote Participant Video */}
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
          {/* Security indicator */}
          <View style={styles.securityIndicator}>
            <Text style={styles.securityText}>🔒 Encrypted</Text>
          </View>
        </View>
      ) : (
        <View style={styles.waitingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.waitingText}>
            Waiting for pharmacist to join...
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

      {/* Reconnecting Overlay (INT-006) */}
      {reconnecting && (
        <View style={styles.reconnectingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.reconnectingText}>
            Reconnecting... (Attempt {reconnectAttempts}/{maxReconnectAttempts})
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

const { width, height: _height } = Dimensions.get('window');

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
  placeholderVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
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
  placeholderLocalVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  placeholderLocalText: {
    color: '#fff',
    fontSize: 12,
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
  securityIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 128, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  securityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reconnectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  reconnectingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
});

export default TwilioVideoComponent;
