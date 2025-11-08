/**
 * Consultation Notes Component - Pharmacist App
 * AI-assisted note-taking during teleconsultation
 * Task: T165
 * FR-025: System MUST support AI-assisted note-taking during consultations with patient consent
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  teleconsultationService,
  ConsultationNote,
} from '../services/teleconsultationService';

interface ConsultationNotesProps {
  teleconsultationId: string;
  recordingConsent: boolean;
  onSave?: (note: ConsultationNote) => void;
}

const ConsultationNotes: React.FC<ConsultationNotesProps> = ({
  teleconsultationId,
  recordingConsent,
  onSave,
}) => {
  const [note, setNote] = useState<ConsultationNote | null>(null);
  const [pharmacistNotes, setPharmacistNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAISummary, setShowAISummary] = useState(true);
  const [showAITranscript, setShowAITranscript] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [teleconsultationId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const consultationNote = await teleconsultationService.getNotes(teleconsultationId);
      setNote(consultationNote);
      setPharmacistNotes(consultationNote.pharmacist_notes || '');
    } catch (error: any) {
      console.error('Load notes error:', error);
      // If notes don't exist yet, that's okay
      setNote(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAINotes = async () => {
    if (!recordingConsent) {
      Alert.alert(
        'Recording Required',
        'AI transcription requires patient consent for recording, which was not granted for this consultation.'
      );
      return;
    }

    try {
      setSaving(true);
      const newNote = await teleconsultationService.createNotes(teleconsultationId);
      setNote(newNote);
      Alert.alert('Success', 'AI notes generated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate AI notes');
      console.error('Generate AI notes error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!pharmacistNotes.trim()) {
      Alert.alert('Error', 'Please enter some notes before saving');
      return;
    }

    try {
      setSaving(true);
      const updatedNote = await teleconsultationService.updateNotes(
        teleconsultationId,
        pharmacistNotes
      );
      setNote(updatedNote);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
      Alert.alert('Success', 'Notes saved successfully');
      onSave?.(updatedNote);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save notes');
      console.error('Save notes error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading notes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Consultation Notes</Text>

      {/* AI Summary Section */}
      {note?.ai_summary && (
        <View style={styles.aiSection}>
          <TouchableOpacity
            style={styles.aiSectionHeader}
            onPress={() => setShowAISummary(!showAISummary)}
            testID="expand-ai-summary-button"
          >
            <Text style={styles.aiSectionTitle}>AI Summary</Text>
            <Text style={styles.expandIcon}>{showAISummary ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {showAISummary && (
            <View style={styles.aiContent}>
              <Text style={styles.aiText}>{note.ai_summary}</Text>
            </View>
          )}
        </View>
      )}

      {/* AI Highlighted Medical Terms */}
      {note?.ai_highlighted_terms && note.ai_highlighted_terms.length > 0 && (
        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>Key Medical Terms</Text>
          <View style={styles.termsContainer}>
            {note.ai_highlighted_terms.map((term, index) => (
              <View key={index} style={styles.termBadge}>
                <Text style={styles.termText}>{term}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* AI Transcript Section */}
      {note?.ai_transcript && (
        <View style={styles.aiSection}>
          <TouchableOpacity
            style={styles.aiSectionHeader}
            onPress={() => setShowAITranscript(!showAITranscript)}
            testID="expand-ai-transcript-button"
          >
            <Text style={styles.aiSectionTitle}>
              {showAITranscript ? 'Hide AI Transcript' : 'Show AI Transcript'}
            </Text>
            <Text style={styles.expandIcon}>{showAITranscript ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {showAITranscript && (
            <View style={styles.aiContent}>
              <Text style={styles.aiTranscriptText}>{note.ai_transcript}</Text>
            </View>
          )}
        </View>
      )}

      {/* Generate AI Notes Button (if not yet generated) */}
      {!note && recordingConsent && (
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateAINotes}
          disabled={saving}
          testID="generate-ai-notes-button"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate AI Notes</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Generate AI Notes Button (when recording consent not granted) */}
      {!note && !recordingConsent && (
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateAINotes}
          disabled={saving}
          testID="generate-ai-notes-button"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate AI Notes</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Pharmacist Notes Input */}
      <View style={styles.notesSection}>
        <Text style={styles.notesSectionTitle}>Your Notes</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          placeholder="Add your consultation notes here..."
          value={pharmacistNotes}
          onChangeText={setPharmacistNotes}
          textAlignVertical="top"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving || !pharmacistNotes.trim()}
        testID="save-notes-button"
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Notes</Text>
        )}
      </TouchableOpacity>

      {/* Saved Indicator */}
      {justSaved && (
        <View style={styles.savedIndicator} testID="saved-indicator">
          <Text style={styles.savedIndicatorText}>✓ Saved</Text>
        </View>
      )}

      {/* Edit History Section (FR-025a Compliance) */}
      {note?.edited && note.edit_history && note.edit_history.length > 0 && (
        <View style={styles.editHistorySection}>
          <TouchableOpacity
            style={styles.editHistorySectionHeader}
            onPress={() => setShowEditHistory(!showEditHistory)}
            testID="expand-edit-history-button"
          >
            <Text style={styles.editHistorySectionTitle}>
              Edit History ({note.edit_history.length} edit{note.edit_history.length > 1 ? 's' : ''})
            </Text>
            <Text style={styles.expandIcon}>{showEditHistory ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {showEditHistory && (
            <View style={styles.editHistoryContent}>
              {note.edit_history.map((edit, index) => (
                <View key={index} style={styles.editHistoryEntry} testID={`edit-history-entry-${index}`}>
                  <Text style={styles.editHistoryTimestamp}>
                    {new Date(edit.timestamp).toLocaleString()}
                  </Text>
                  <Text style={styles.editHistoryUser}>User ID: {edit.user_id}</Text>
                  <Text style={styles.editHistoryChangesLabel}>
                    Changes ({edit.changes.length}):
                  </Text>
                  {edit.changes.map((change, changeIndex) => (
                    <View key={changeIndex} style={styles.editHistoryChange}>
                      <Text style={styles.editHistoryChangeField}>Field: {change.field}</Text>
                      <Text style={styles.editHistoryChangeValue}>
                        Old: {change.old_value?.substring(0, 100)}
                        {change.old_value && change.old_value.length > 100 ? '...' : ''}
                      </Text>
                      <Text style={styles.editHistoryChangeValue}>
                        New: {change.new_value?.substring(0, 100)}
                        {change.new_value && change.new_value.length > 100 ? '...' : ''}
                      </Text>
                    </View>
                  ))}
                  {edit.original_ai_version && (
                    <View style={styles.originalAISection}>
                      <Text style={styles.originalAILabel}>Original AI Version:</Text>
                      <Text style={styles.originalAIText}>
                        {edit.original_ai_version.substring(0, 150)}
                        {edit.original_ai_version.length > 150 ? '...' : ''}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Recording Consent Warning */}
      {!recordingConsent && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⓘ AI transcription not available: Patient did not consent to recording
          </Text>
        </View>
      )}

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  aiSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  aiSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
  },
  aiSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  expandIcon: {
    fontSize: 12,
    color: '#007AFF',
  },
  aiContent: {
    padding: 12,
    backgroundColor: '#F9F9F9',
  },
  aiText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  aiTranscriptText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  termsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  termsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  termBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  termText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notesSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  notesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 150,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  savedIndicator: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#D4EDDA',
    borderRadius: 8,
    alignItems: 'center',
  },
  savedIndicatorText: {
    fontSize: 14,
    color: '#155724',
    fontWeight: '600',
  },
  editHistorySection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF9500',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFF3E0',
  },
  editHistorySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FF9500',
  },
  editHistorySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  editHistoryContent: {
    padding: 12,
    backgroundColor: '#FFF9F0',
  },
  editHistoryEntry: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  editHistoryTimestamp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  editHistoryUser: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  editHistoryChangesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  editHistoryChange: {
    backgroundColor: '#F9F9F9',
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  editHistoryChangeField: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  editHistoryChangeValue: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  originalAISection: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
  },
  originalAILabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  originalAIText: {
    fontSize: 11,
    color: '#333',
    fontStyle: 'italic',
  },
  warningBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningText: {
    fontSize: 13,
    color: '#000',
  },
  footer: {
    height: 40,
  },
});

export default ConsultationNotes;
