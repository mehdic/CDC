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

interface TwilioVideoRef {
  connect: (options: {
    accessToken: string;
    roomName: string;
    enableVideo: boolean;
    enableAudio: boolean;
  }) => void;
  disconnect: () => void;
  setLocalVideoEnabled: (enabled: boolean) => void;
}

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
  const twilioRef = useRef<TwilioVideoRef | null>(null);

  useEffect(() => {
    connectToRoom();

    return () => {
      disconnectFromRoom();
    };
  }, [accessToken, roomName]);

  const connectToRoom = async () => {
    try {
      if (!accessToken || accessToken.trim() === '') {
        throw new Error('Access token is required');
      }

      if (!twilioRef.current) {
        throw new Error('TwilioVideo component not initialized');
      }

      setConnecting(true);

      // Connect to Twilio Video using the ref-based API
      twilioRef.current.connect({
        accessToken,
        roomName,
        enableVideo: !audioOnly,
        enableAudio: true,
      });
    } catch (error: any) {
      console.error('Failed to connect to room:', error);
      setConnecting(false);
      Alert.alert('Connection Error', 'Failed to connect to video call');
      onError?.(error);
    }
  };

  const disconnectFromRoom = () => {
    if (twilioRef.current) {
      twilioRef.current.disconnect();
    }
    setConnected(false);
    setRemoteParticipants([]);
    onDisconnected?.();
  };

  const handleRoomDidConnect = () => {
    console.log('Connected to room');
    setConnected(true);
    setConnecting(false);
    onConnected?.();
  };

  const handleRoomDidDisconnect = () => {
    console.log('Disconnected from room');
    setConnected(false);
    setRemoteParticipants([]);
    onDisconnected?.();
  };

  const handleRoomDidFailToConnect = (error: any) => {
    console.error('Failed to connect to room:', error);
    setConnecting(false);
    Alert.alert('Connection Error', 'Failed to connect to video call');
    onError?.(new Error(error.error || 'Connection failed'));
  };

  const handleParticipantAddedVideoTrack = (event: any) => {
    console.log('Participant added video track:', event.participant.identity);
    const newParticipant: Participant = {
      sid: event.participant.sid,
      identity: event.participant.identity,
      videoEnabled: true,
      audioEnabled: true,
    };
    setRemoteParticipants((prev) => {
      const exists = prev.find((p) => p.sid === event.participant.sid);
      if (exists) {
        return prev;
      }
      return [...prev, newParticipant];
    });
    onParticipantConnected?.(event.participant.sid);
  };

  const handleParticipantRemovedVideoTrack = (event: any) => {
    console.log('Participant removed video track:', event.participant.identity);
    setRemoteParticipants((prev) =>
      prev.filter((p) => p.sid !== event.participant.sid)
    );
    onParticipantDisconnected?.(event.participant.sid);
  };

  const handleNetworkQualityLevelsChanged = (event: any) => {
    const qualityLevel = event.participant?.networkQualityLevel ?? 5;

    // FR-026: Suggest audio fallback when quality < 2
    if (qualityLevel < 2 && !audioOnly && localVideoEnabled) {
      Alert.alert(
        'Poor Network Connection',
        'Your connection quality is low. Would you like to switch to audio-only mode?',
        [
          { text: 'Continue with Video', style: 'cancel' },
          {
            text: 'Switch to Audio Only',
            onPress: () => {
              if (twilioRef.current) {
                twilioRef.current.setLocalVideoEnabled(false);
                setLocalVideoEnabled(false);
              }
            },
          },
        ]
      );
    }
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
      {/* TwilioVideo component with event handlers */}
      <TwilioVideo
        ref={twilioRef}
        onRoomDidConnect={handleRoomDidConnect}
        onRoomDidDisconnect={handleRoomDidDisconnect}
        onRoomDidFailToConnect={handleRoomDidFailToConnect}
        onParticipantAddedVideoTrack={handleParticipantAddedVideoTrack}
        onParticipantRemovedVideoTrack={handleParticipantRemovedVideoTrack}
        onNetworkQualityLevelsChanged={handleNetworkQualityLevelsChanged}
      />

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
    </View>
  );
};

const { width } = Dimensions.get('window');

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
});

export default TwilioVideoComponent;
