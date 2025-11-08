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

// NOTE: In production, use actual Twilio Video SDK
// import { TwilioVideoLocalView, TwilioVideoParticipantView, TwilioVideo } from 'twilio-video-react-native';

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
  const roomRef = useRef<any>(null);

  useEffect(() => {
    connectToRoom();

    return () => {
      disconnectFromRoom();
    };
  }, [accessToken, roomName]);

  const connectToRoom = async () => {
    try {
      setConnecting(true);

      // In production, use actual Twilio Video SDK
      // const room = await TwilioVideo.connect(accessToken, {
      //   roomName,
      //   enableVideo: !audioOnly,
      //   enableAudio: true,
      //   enableNetworkQualityReporting: true,
      //   dominantSpeakerEnabled: true,
      // });

      // roomRef.current = room;

      // Set up event listeners
      // room.on('participantConnected', handleParticipantConnected);
      // room.on('participantDisconnected', handleParticipantDisconnected);
      // room.on('disconnected', handleDisconnected);

      // Simulate successful connection for development
      setTimeout(() => {
        setConnected(true);
        setConnecting(false);
        onConnected?.();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to connect to room:', error);
      setConnecting(false);
      Alert.alert('Connection Error', 'Failed to connect to video call');
      onError?.(error);
    }
  };

  const disconnectFromRoom = () => {
    if (roomRef.current) {
      // In production: roomRef.current.disconnect();
      roomRef.current = null;
    }
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
          {/* In production, use TwilioVideoParticipantView */}
          {/* <TwilioVideoParticipantView
            participantSid={remoteParticipants[0].sid}
            style={styles.remoteVideo}
            scaleType="fit"
          /> */}
          <View style={styles.placeholderVideo}>
            <Text style={styles.placeholderText}>
              Remote Participant: {remoteParticipants[0].identity}
            </Text>
            <Text style={styles.placeholderSubtext}>
              (Twilio Video Feed)
            </Text>
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
          {/* In production, use TwilioVideoLocalView */}
          {/* <TwilioVideoLocalView
            enabled={true}
            style={styles.localVideo}
            scaleType="fit"
          /> */}
          <View style={styles.placeholderLocalVideo}>
            <Text style={styles.placeholderLocalText}>You</Text>
          </View>
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

// Exposed methods for controlling the video
export const toggleLocalVideo = (enabled: boolean) => {
  // In production: TwilioVideo.setLocalVideoEnabled(enabled);
  console.log('Toggle local video:', enabled);
};

export const toggleLocalAudio = (enabled: boolean) => {
  // In production: TwilioVideo.setLocalAudioEnabled(enabled);
  console.log('Toggle local audio:', enabled);
};

export const switchToAudioOnly = () => {
  // In production: TwilioVideo.setLocalVideoEnabled(false);
  console.log('Switched to audio-only mode');
};

export const switchToVideoMode = () => {
  // In production: TwilioVideo.setLocalVideoEnabled(true);
  console.log('Switched to video mode');
};

export const disconnectCall = () => {
  // In production: TwilioVideo.disconnect();
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
});

export default TwilioVideoComponent;
