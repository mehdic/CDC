/**
 * Pharmacist Video Call Screen - Pharmacist App
 * Main teleconsultation video call interface for pharmacists
 * Task: T163
 * FR-023: Video calls MUST use end-to-end encryption with visible security indicators
 * FR-024: Pharmacists MUST be able to access patient medical records in sidebar during active video consultations
 * FR-025: System MUST support AI-assisted note-taking during consultations with patient consent
 * FR-026: Consultations MUST support audio-only fallback for poor network conditions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  teleconsultationService,
  Teleconsultation,
  JoinResponse,
  ConsultationNote,
} from '../services/teleconsultationService';
import ConsultationStatus from '../components/ConsultationStatus';
import PatientRecordSidebar from '../components/PatientRecordSidebar';
import ConsultationNotes from '../components/ConsultationNotes';
import TranscriptEditor from '../components/TranscriptEditor';

const { width, height } = Dimensions.get('window');

interface PharmacistVideoCallRouteParams {
  teleconsultationId: string;
}

const PharmacistVideoCallScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as PharmacistVideoCallRouteParams;
  const teleconsultationId = params?.teleconsultationId;

  const [teleconsultation, setTeleconsultation] = useState<Teleconsultation | null>(null);
  const [joinData, setJoinData] = useState<JoinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoConnected, setVideoConnected] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  // UI State
  const [showPatientRecord, setShowPatientRecord] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [consultationNote, setConsultationNote] = useState<ConsultationNote | null>(null);

  useEffect(() => {
    if (teleconsultationId) {
      loadTeleconsultation();
    }
  }, [teleconsultationId]);

  const loadTeleconsultation = async () => {
    try {
      setLoading(true);
      const consultation = await teleconsultationService.getTeleconsultation(
        teleconsultationId
      );
      setTeleconsultation(consultation);

      // Join video call
      const joinResponse = await teleconsultationService.join(teleconsultationId);
      setJoinData(joinResponse);

      // Initialize Twilio Video (TODO: Integrate Twilio SDK - see T155)
      // This would connect to Twilio Video using the access_token
      simulateVideoConnection();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load teleconsultation');
      console.error('Load teleconsultation error:', error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const simulateVideoConnection = () => {
    // Simulate Twilio Video connection
    setTimeout(() => {
      setVideoConnected(true);
    }, 2000);
  };

  const handleToggleMic = () => {
    setMicMuted(!micMuted);
    // TODO: Integrate with Twilio Video SDK to mute/unmute audio
  };

  const handleToggleCamera = () => {
    setCameraOff(!cameraOff);
    // TODO: Integrate with Twilio Video SDK to enable/disable camera
  };

  const handleSwitchToAudioOnly = () => {
    Alert.alert(
      'Switch to Audio Only',
      'Switch to audio-only mode for better connection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => {
            setAudioOnly(true);
            setCameraOff(true);
            // TODO: Disable video track in Twilio
          },
        },
      ]
    );
  };

  const handleCreatePrescription = () => {
    if (!teleconsultation) return;

    (navigation as any).navigate('ConsultationPrescription', {
      teleconsultation,
    });
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Consultation',
      'Are you sure you want to end this teleconsultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            try {
              // Complete teleconsultation
              await teleconsultationService.completeTeleconsultation(teleconsultationId);
              // Disconnect Twilio Video
              // TODO: Disconnect Twilio SDK
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to end consultation');
              console.error('End consultation error:', error);
            }
          },
        },
      ]
    );
  };

  const handleViewTranscript = async () => {
    try {
      const note = await teleconsultationService.getNotes(teleconsultationId);
      setConsultationNote(note);
      setShowTranscriptModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load transcript');
      console.error('Load transcript error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Connecting to video call...</Text>
      </View>
    );
  }

  if (!teleconsultation || !joinData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load teleconsultation</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video Display Area */}
      <View style={styles.videoContainer}>
        {!videoConnected ? (
          <View style={styles.connectingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.connectingText}>Connecting...</Text>
          </View>
        ) : (
          <>
            {/* TODO: Integrate Twilio Video View Component (see T155) */}
            {/* TwilioVideoLocalView and TwilioVideoParticipantView would go here */}
            <View style={styles.placeholderVideo}>
              <Text style={styles.placeholderText}>
                {audioOnly ? '🔊 Audio Only Mode' : '📹 Video Call Active'}
              </Text>
              <Text style={styles.placeholderSubtext}>
                Twilio Video SDK Integration (T155)
              </Text>
            </View>

            {/* Security Indicator (FR-023) */}
            <View style={styles.securityIndicator}>
              <View style={styles.securityIcon}>
                <Text style={styles.securityIconText}>🔒</Text>
              </View>
              <Text style={styles.securityText}>End-to-End Encrypted</Text>
            </View>

            {/* Patient Name Overlay */}
            <View style={styles.patientOverlay}>
              <Text style={styles.patientOverlayText}>
                {teleconsultation.patient?.first_name} {teleconsultation.patient?.last_name}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Consultation Status */}
      <View style={styles.statusContainer}>
        <ConsultationStatus
          status={teleconsultation.status}
          scheduledAt={teleconsultation.scheduled_at}
          startedAt={teleconsultation.started_at}
          endedAt={teleconsultation.ended_at}
          durationMinutes={teleconsultation.duration_minutes}
          recordingConsent={teleconsultation.recording_consent}
        />
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          {/* Mic Toggle */}
          <TouchableOpacity
            style={[styles.controlButton, micMuted && styles.controlButtonDanger]}
            onPress={handleToggleMic}
          >
            <Text style={styles.controlIcon}>{micMuted ? '🔇' : '🎤'}</Text>
            <Text style={styles.controlLabel}>{micMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          {/* Camera Toggle */}
          <TouchableOpacity
            style={[styles.controlButton, cameraOff && styles.controlButtonDanger]}
            onPress={handleToggleCamera}
          >
            <Text style={styles.controlIcon}>{cameraOff ? '📷' : '📹'}</Text>
            <Text style={styles.controlLabel}>{cameraOff ? 'Camera Off' : 'Camera On'}</Text>
          </TouchableOpacity>

          {/* Audio Only */}
          {!audioOnly && (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleSwitchToAudioOnly}
            >
              <Text style={styles.controlIcon}>🔊</Text>
              <Text style={styles.controlLabel}>Audio Only</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.controlsRow}>
          {/* Patient Record */}
          <TouchableOpacity
            style={[styles.controlButton, showPatientRecord && styles.controlButtonActive]}
            onPress={() => setShowPatientRecord(!showPatientRecord)}
          >
            <Text style={styles.controlIcon}>📋</Text>
            <Text style={styles.controlLabel}>Patient Record</Text>
          </TouchableOpacity>

          {/* Notes */}
          <TouchableOpacity
            style={[styles.controlButton, showNotes && styles.controlButtonActive]}
            onPress={() => setShowNotes(!showNotes)}
          >
            <Text style={styles.controlIcon}>📝</Text>
            <Text style={styles.controlLabel}>Notes</Text>
          </TouchableOpacity>

          {/* Transcript */}
          {teleconsultation.recording_consent && (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleViewTranscript}
            >
              <Text style={styles.controlIcon}>📄</Text>
              <Text style={styles.controlLabel}>Transcript</Text>
            </TouchableOpacity>
          )}

          {/* Create Prescription */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleCreatePrescription}
          >
            <Text style={styles.controlIcon}>💊</Text>
            <Text style={styles.controlLabel}>Rx</Text>
          </TouchableOpacity>
        </View>

        {/* End Call Button */}
        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
          <Text style={styles.endCallIcon}>📞</Text>
          <Text style={styles.endCallText}>End Consultation</Text>
        </TouchableOpacity>
      </View>

      {/* Patient Medical Record Sidebar (FR-024) */}
      {showPatientRecord && teleconsultation.patient && (
        <Modal
          visible={showPatientRecord}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <PatientRecordSidebar
            patientId={teleconsultation.patient.id}
            visible={showPatientRecord}
            onClose={() => setShowPatientRecord(false)}
          />
        </Modal>
      )}

      {/* Consultation Notes (FR-025) */}
      {showNotes && (
        <Modal
          visible={showNotes}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Consultation Notes</Text>
              <TouchableOpacity onPress={() => setShowNotes(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ConsultationNotes
              teleconsultationId={teleconsultationId}
              recordingConsent={teleconsultation.recording_consent}
              onSave={(note) => {
                setConsultationNote(note);
              }}
            />
          </View>
        </Modal>
      )}

      {/* Transcript Editor with Audit Trail (FR-025a) */}
      {consultationNote && (
        <TranscriptEditor
          aiTranscript={consultationNote.ai_transcript}
          pharmacistNotes={consultationNote.pharmacist_notes}
          edited={consultationNote.edited}
          editHistory={consultationNote.edit_history}
          visible={showTranscriptModal}
          onClose={() => setShowTranscriptModal(false)}
        />
      )}
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
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  connectingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
  },
  placeholderVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
  },
  securityIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  securityIcon: {
    marginRight: 6,
  },
  securityIconText: {
    fontSize: 14,
  },
  securityText: {
    fontSize: 12,
    color: '#fff',
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
  statusContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#f5f5f5',
  },
  controlsContainer: {
    backgroundColor: '#f5f5f5',
    paddingBottom: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  controlButtonActive: {
    backgroundColor: '#007AFF',
  },
  controlButtonDanger: {
    backgroundColor: '#FF3B30',
  },
  controlIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  endCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 8,
  },
  endCallIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  endCallText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
});

export default PharmacistVideoCallScreen;
