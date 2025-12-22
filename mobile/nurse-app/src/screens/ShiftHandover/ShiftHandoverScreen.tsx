/**
 * Shift Handover Screen
 * Create and view shift handover notes
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import useHandover from '../../hooks/useHandover';
import { HandoverNoteForm } from '../../components/HandoverNoteForm';
import { HandoverNoteCard } from '../../components/HandoverNoteCard';
import { Patient, NurseProfile } from '../../types/nurse';

const ShiftHandoverScreen: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const patientState = useSelector((state: RootState) => state.patient);
  const patients = patientState.allPatients || patientState.searchResults || [];
  const handover = useHandover();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [currentShift, setCurrentShift] = useState<'day' | 'night'>('day');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  useEffect(() => {
    // Fetch handover notes for current nurse
    handover.fetchMyHandoverNotes();
  }, []);

  useEffect(() => {
    if (handover.success) {
      setShowForm(false);
      handover.clearSuccess();
    }
  }, [handover.success]);

  const nurse = auth.nurse as NurseProfile | null;

  if (!nurse) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to view handover notes</Text>
      </View>
    );
  }

  const handleCreateHandover = () => {
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleAcknowledge = (noteId: string) => {
    handover.acknowledgeHandover(noteId);
  };

  const isAcknowledged = (noteId: string) => {
    return handover.acknowledgedNotes.includes(noteId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shift Handover</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateHandover}>
          <Text style={styles.createButtonText}>+ Create Note</Text>
        </TouchableOpacity>
      </View>

      {/* Shift Selector */}
      <View style={styles.shiftSelector}>
        <TouchableOpacity
          style={[
            styles.shiftButton,
            currentShift === 'day' && styles.shiftButtonActive,
          ]}
          onPress={() => setCurrentShift('day')}
        >
          <Text
            style={[
              styles.shiftButtonText,
              currentShift === 'day' && styles.shiftButtonTextActive,
            ]}
          >
            Day Shift
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.shiftButton,
            currentShift === 'night' && styles.shiftButtonActive,
          ]}
          onPress={() => setCurrentShift('night')}
        >
          <Text
            style={[
              styles.shiftButtonText,
              currentShift === 'night' && styles.shiftButtonTextActive,
            ]}
          >
            Night Shift
          </Text>
        </TouchableOpacity>
      </View>

      {/* Handover Notes List */}
      <ScrollView style={styles.notesList}>
        {handover.loading && handover.notes.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading handover notes...</Text>
          </View>
        ) : handover.notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Handover Notes</Text>
            <Text style={styles.emptyStateText}>
              Create your first handover note for this shift
            </Text>
          </View>
        ) : (
          <View style={styles.notesContainer}>
            {handover.notes.map((note) => (
              <HandoverNoteCard
                key={note.id}
                note={note}
                isAcknowledged={isAcknowledged(note.id)}
                onAcknowledge={() => handleAcknowledge(note.id)}
                onView={() => setSelectedNote(note.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Handover Includes:</Text>
        <Text style={styles.infoItem}>• Patient status updates</Text>
        <Text style={styles.infoItem}>• Critical pending tasks</Text>
        <Text style={styles.infoItem}>• Medication administration notes</Text>
        <Text style={styles.infoItem}>• Special patient requirements</Text>
        <Text style={styles.infoItem}>• Shift-specific concerns</Text>
      </View>

      {/* Error Message */}
      {handover.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{handover.error}</Text>
          <TouchableOpacity onPress={handover.clearError}>
            <Text style={styles.errorBannerClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Handover Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        onRequestClose={handleCloseForm}
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Handover Note</Text>
            <TouchableOpacity onPress={handleCloseForm}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <HandoverNoteForm
            nurse={nurse}
            patients={patients}
            shift={currentShift}
            onSubmit={(note) => handover.createHandover(note) as unknown as Promise<void>}
            onCancel={handleCloseForm}
            isLoading={handover.loading}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#212529',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  shiftSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  shiftButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  shiftButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  shiftButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  shiftButtonTextActive: {
    color: '#fff',
  },
  notesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  notesContainer: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6c757d',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#212529',
  },
  infoItem: {
    fontSize: 13,
    marginBottom: 4,
    color: '#495057',
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8d7da',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#721c24',
    flex: 1,
  },
  errorBannerClose: {
    fontSize: 16,
    color: '#721c24',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#6c757d',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ShiftHandoverScreen;
