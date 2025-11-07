/**
 * Doctor Message Screen
 * Allows pharmacist to message prescribing doctor for clarification
 * T112 - FR-004: Message doctor without leaving prescription context
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ============================================================================
// Types
// ============================================================================

export interface DoctorMessageScreenProps {
  route: any;
  navigation: any;
}

// ============================================================================
// Component
// ============================================================================

export const DoctorMessageScreen: React.FC<DoctorMessageScreenProps> = ({
  route,
  navigation,
}) => {
  const { prescriptionId, doctorId } = route.params;

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [loading, setLoading] = useState(false);

  // Predefined message templates for quick clarification requests
  const messageTemplates = [
    {
      title: 'Unclear Dosage',
      subject: 'Clarification Needed: Medication Dosage',
      body: 'Dear Doctor,\n\nI need clarification on the prescribed dosage for one of the medications in the prescription. The handwriting/OCR transcription is unclear.\n\nCould you please confirm the correct dosage?\n\nThank you,\nPharmacist',
    },
    {
      title: 'Drug Interaction',
      subject: 'Alert: Potential Drug Interaction',
      body: 'Dear Doctor,\n\nOur system has detected a potential drug interaction with this prescription and the patient\'s current medications.\n\nCould you please review and confirm if this prescription is appropriate or if an alternative should be considered?\n\nThank you,\nPharmacist',
    },
    {
      title: 'Allergy Conflict',
      subject: 'Alert: Patient Allergy Conflict',
      body: 'Dear Doctor,\n\nThe prescribed medication may conflict with the patient\'s documented allergies in our system.\n\nCould you please review the patient\'s allergy profile and confirm this prescription or provide an alternative?\n\nThank you,\nPharmacist',
    },
    {
      title: 'Missing Information',
      subject: 'Request: Missing Prescription Details',
      body: 'Dear Doctor,\n\nSome critical information is missing from this prescription (e.g., frequency, duration).\n\nCould you please provide the missing details so I can process this prescription?\n\nThank you,\nPharmacist',
    },
  ];

  const handleTemplateSelect = (template: typeof messageTemplates[0]) => {
    setSubject(template.subject);
    setMessage(template.body);
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Required Fields', 'Please provide both subject and message.');
      return;
    }

    try {
      setLoading(true);

      // TODO: Send message via messaging service API
      // await messagingService.sendMessage({
      //   to: doctorId,
      //   subject,
      //   body: message,
      //   priority,
      //   context: {
      //     prescriptionId,
      //     type: 'prescription_clarification',
      //   },
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert('Message Sent', 'Your message has been sent to the doctor.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Context Banner */}
        <View style={styles.contextBanner}>
          <Icon name="file-document-outline" size={20} color="#3B82F6" />
          <View style={styles.contextText}>
            <Text style={styles.contextTitle}>Prescription Context</Text>
            <Text style={styles.contextSubtitle}>
              Rx #{prescriptionId.substring(0, 8)}
            </Text>
          </View>
        </View>

        {/* Quick Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Templates</Text>
          <Text style={styles.sectionDescription}>
            Select a template or write your own message
          </Text>
          <View style={styles.templatesGrid}>
            {messageTemplates.map((template, index) => (
              <TouchableOpacity
                key={index}
                style={styles.templateCard}
                onPress={() => handleTemplateSelect(template)}
              >
                <Icon name="message-text-outline" size={20} color="#3B82F6" />
                <Text style={styles.templateTitle}>{template.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityRow}>
            <TouchableOpacity
              style={[
                styles.priorityButton,
                priority === 'normal' && styles.priorityButtonActive,
              ]}
              onPress={() => setPriority('normal')}
            >
              <Icon
                name="clock-outline"
                size={18}
                color={priority === 'normal' ? '#3B82F6' : '#6B7280'}
              />
              <Text
                style={[
                  styles.priorityText,
                  priority === 'normal' && styles.priorityTextActive,
                ]}
              >
                Normal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.priorityButton,
                priority === 'urgent' && styles.priorityButtonActiveUrgent,
              ]}
              onPress={() => setPriority('urgent')}
            >
              <Icon
                name="alert-circle-outline"
                size={18}
                color={priority === 'urgent' ? '#DC2626' : '#6B7280'}
              />
              <Text
                style={[
                  styles.priorityText,
                  priority === 'urgent' && styles.priorityTextActiveUrgent,
                ]}
              >
                Urgent
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter subject..."
            value={subject}
            onChangeText={setSubject}
            editable={!loading}
          />
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Message *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Type your message to the doctor..."
            multiline
            numberOfLines={10}
            value={message}
            onChangeText={setMessage}
            editable={!loading}
            textAlignVertical="top"
          />
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Icon name="information-outline" size={18} color="#3B82F6" />
          <Text style={styles.infoBannerText}>
            All messages are encrypted and logged for compliance. Expected response time:
            {priority === 'urgent' ? ' 30 minutes' : ' 2 hours'}
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!subject || !message) && styles.disabledButton,
          ]}
          onPress={handleSend}
          disabled={loading || !subject || !message}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="send" size={18} color="#fff" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  contextText: {
    marginLeft: 12,
  },
  contextTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  contextSubtitle: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: '47%',
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  priorityButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  priorityButtonActiveUrgent: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  priorityTextActive: {
    color: '#3B82F6',
  },
  priorityTextActiveUrgent: {
    color: '#DC2626',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 200,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 12,
    margin: 16,
    borderRadius: 6,
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  sendButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
});

export default DoctorMessageScreen;
