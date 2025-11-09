/**
 * Recording Consent Component - Patient App
 * Prompt for patient consent to record teleconsultation
 * Task: T158
 * FR-028: System MUST save consultation notes and recordings (with consent) to patient medical records
 * FR-025: System MUST support AI-assisted note-taking during consultations with patient consent
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';

export interface RecordingConsentProps {
  visible: boolean;
  onAccept: (recordingConsent: boolean) => void;
  onDecline: () => void;
  canProceedWithoutConsent?: boolean;
}

const RecordingConsent: React.FC<RecordingConsentProps> = ({
  visible,
  onAccept,
  onDecline,
  canProceedWithoutConsent = true,
}) => {
  const [consentGiven, setConsentGiven] = useState(false);

  const handleAccept = () => {
    onAccept(consentGiven);
  };

  const handleDecline = () => {
    if (canProceedWithoutConsent) {
      onAccept(false); // Proceed without recording
    } else {
      onDecline(); // Cancel the consultation
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🎥</Text>
            <Text style={styles.title}>Recording Consent</Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>
              Your Privacy Matters
            </Text>

            <Text style={styles.paragraph}>
              We would like to record this teleconsultation for the following purposes:
            </Text>

            <View style={styles.bulletList}>
              <Text style={styles.bullet}>
                • Quality assurance and training
              </Text>
              <Text style={styles.bullet}>
                • AI-assisted transcription for consultation notes
              </Text>
              <Text style={styles.bullet}>
                • Medical record documentation
              </Text>
              <Text style={styles.bullet}>
                • Reference for follow-up care
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              Your Rights
            </Text>

            <Text style={styles.paragraph}>
              • The recording will be stored securely and encrypted
            </Text>
            <Text style={styles.paragraph}>
              • Only authorized healthcare professionals can access it
            </Text>
            <Text style={styles.paragraph}>
              • You can request a copy or deletion at any time
            </Text>
            {canProceedWithoutConsent && (
              <Text style={styles.paragraph}>
                • You can proceed without recording if you prefer
              </Text>
            )}

            <Text style={styles.sectionTitle}>
              Data Protection
            </Text>

            <Text style={styles.paragraph}>
              This recording complies with HIPAA, GDPR, and Swiss Federal Act on
              Data Protection (FADP). All recordings are:
            </Text>

            <View style={styles.bulletList}>
              <Text style={styles.bullet}>
                • End-to-end encrypted
              </Text>
              <Text style={styles.bullet}>
                • Stored on secure, HIPAA-compliant servers
              </Text>
              <Text style={styles.bullet}>
                • Accessible only with your permission
              </Text>
              <Text style={styles.bullet}>
                • Retained according to legal requirements
              </Text>
            </View>

            {/* Consent Toggle */}
            <View style={styles.consentToggle}>
              <View style={styles.toggleLabel}>
                <Text style={styles.toggleText}>
                  I consent to this consultation being recorded
                </Text>
                <Text style={styles.toggleSubtext}>
                  (You can still join the call without recording)
                </Text>
              </View>
              <Switch
                value={consentGiven}
                onValueChange={setConsentGiven}
                trackColor={{ false: '#ccc', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {canProceedWithoutConsent && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleDecline}
              >
                <Text style={styles.secondaryButtonText}>
                  Proceed Without Recording
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                consentGiven && styles.primaryButtonActive,
              ]}
              onPress={handleAccept}
            >
              <Text style={styles.primaryButtonText}>
                {consentGiven ? 'Accept & Join Call' : 'Join Without Recording'}
              </Text>
            </TouchableOpacity>

            {!canProceedWithoutConsent && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onDecline}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel Consultation
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 12,
  },
  bullet: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  consentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  toggleLabel: {
    flex: 1,
    marginRight: 12,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  toggleSubtext: {
    fontSize: 13,
    color: '#999',
  },
  actions: {
    padding: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonActive: {
    backgroundColor: '#4CAF50',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default RecordingConsent;
