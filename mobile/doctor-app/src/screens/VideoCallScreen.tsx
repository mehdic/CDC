/**
 * Video Call Screen - Doctor App
 * Twilio Video integration for teleconsultation with prescription overlay
 * Task: T8-005
 * FR-023: Video calls MUST use end-to-end encryption with visible security indicators
 * FR-026: Consultations MUST support audio-only fallback for poor network conditions
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

import TwilioVideoComponent, { TwilioVideoHandle } from '../../../shared/components/TwilioVideo';
import VideoControls from '../../../shared/components/VideoControls';
import { teleconsultationService } from '../services/teleconsultationService';

interface VideoCallProps {
  teleconsultationId: string;
  prescriptionId?: string; // Optional prescription to display during call
}

const VideoCallScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { teleconsultationId, prescriptionId } = route.params as VideoCallProps;

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioOnly, setAudioOnly] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showPrescriptionOverlay, setShowPrescriptionOverlay] = useState(false);

  const twilioRef = useRef<TwilioVideoHandle>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  /**
   * Request camera and microphone permissions
   * FR-023: Must handle permissions for iOS and Android
   */
  const requestPermissions = async () => {
    try {
      const cameraPermission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;
      const micPermission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const cameraResult = await request(cameraPermission);
      const micResult = await request(micPermission);

      if (
        cameraResult === RESULTS.GRANTED &&
        micResult === RESULTS.GRANTED
      ) {
        setPermissionsGranted(true);
        joinCall();
      } else if (micResult === RESULTS.GRANTED) {
        // Audio-only mode if camera denied
        Alert.alert(
          'Camera Permission Denied',
          'You can continue with audio-only mode.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            {
              text: 'Continue Audio Only',
              onPress: () => {
                setAudioOnly(true);
                setVideoEnabled(false);
                setPermissionsGranted(true);
                joinCall();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone access are required for video calls.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions');
      navigation.goBack();
    }
  };

  /**
   * Join the video call and get Twilio access token
   */
  const joinCall = async () => {
    try {
      const response = await teleconsultationService.join(teleconsultationId);

      setAccessToken(response.access_token);
      setRoomName(response.room_name);
      setIsLoading(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to join video call');
      console.error('Join call error:', error);
      navigation.goBack();
    }
  };

  /**
   * Toggle audio mute
   */
  const handleToggleAudio = () => {
    if (twilioRef.current) {
      twilioRef.current.setLocalAudioEnabled(!audioEnabled);
      setAudioEnabled(!audioEnabled);
    }
  };

  /**
   * Toggle video on/off
   */
  const handleToggleVideo = () => {
    if (twilioRef.current && !audioOnly) {
      twilioRef.current.setLocalVideoEnabled(!videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  };

  /**
   * Switch to audio-only mode (FR-026)
   */
  const handleSwitchToAudioOnly = () => {
    if (twilioRef.current) {
      twilioRef.current.setLocalVideoEnabled(false);
      setVideoEnabled(false);
      setAudioOnly(true);
    }
  };

  /**
   * Switch back to video mode
   */
  const handleSwitchToVideo = () => {
    if (twilioRef.current) {
      twilioRef.current.setLocalVideoEnabled(true);
      setVideoEnabled(true);
      setAudioOnly(false);
    }
  };

  /**
   * End the call
   */
  const handleEndCall = () => {
    navigation.goBack();
  };

  /**
   * Toggle prescription overlay (T8-005 requirement)
   */
  const togglePrescriptionOverlay = () => {
    setShowPrescriptionOverlay(!showPrescriptionOverlay);
  };

  /**
   * Handle video connection established
   */
  const handleConnected = () => {
    console.log('Connected to video call');
  };

  /**
   * Handle video disconnection
   */
  const handleDisconnected = () => {
    console.log('Disconnected from video call');
    navigation.goBack();
  };

  /**
   * Handle video errors
   */
  const handleError = (error: Error) => {
    console.error('Video call error:', error);
    Alert.alert('Connection Error', 'An error occurred during the video call');
  };

  // Show loading while requesting permissions or joining
  if (isLoading || !permissionsGranted) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {!permissionsGranted ? 'Requesting permissions...' : 'Joining call...'}
        </Text>
      </View>
    );
  }

  // Show error if no access token
  if (!accessToken || !roomName) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to join call</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Twilio Video Component */}
      <TwilioVideoComponent
        ref={twilioRef}
        accessToken={accessToken}
        roomName={roomName}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        onError={handleError}
        audioOnly={audioOnly}
      />

      {/* Prescription Overlay (T8-005) */}
      {showPrescriptionOverlay && prescriptionId && (
        <View style={styles.prescriptionOverlay}>
          <ScrollView style={styles.prescriptionContent}>
            <Text style={styles.prescriptionTitle}>Prescription Details</Text>
            <Text style={styles.prescriptionText}>
              Prescription ID: {prescriptionId}
            </Text>
            <Text style={styles.prescriptionNote}>
              [Prescription details would be loaded from API]
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.closeOverlayButton}
            onPress={togglePrescriptionOverlay}
          >
            <Text style={styles.closeOverlayText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Video Controls */}
      <View style={styles.controlsContainer}>
        {/* Prescription Toggle Button (if prescriptionId provided) */}
        {prescriptionId && (
          <TouchableOpacity
            style={styles.prescriptionButton}
            onPress={togglePrescriptionOverlay}
          >
            <Text style={styles.prescriptionButtonText}>
              {showPrescriptionOverlay ? 'Hide' : 'Show'} Prescription
            </Text>
          </TouchableOpacity>
        )}

        <VideoControls
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          audioOnly={audioOnly}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onSwitchToAudioOnly={handleSwitchToAudioOnly}
          onSwitchToVideo={handleSwitchToVideo}
          onEndCall={handleEndCall}
        />
      </View>
    </View>
  );
};

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
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  prescriptionButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  prescriptionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  prescriptionOverlay: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 300,
    maxHeight: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  prescriptionContent: {
    flex: 1,
  },
  prescriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  prescriptionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  prescriptionNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  closeOverlayButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VideoCallScreen;
