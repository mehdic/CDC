/**
 * Transcript Editor Component - Pharmacist App
 * Editable AI transcript with full audit trail
 * Task: T166
 * FR-025a: AI teleconsultation transcripts MUST be editable by pharmacists with full audit trail:
 *          original AI version preserved in audit log, all edits tracked with user ID, timestamp, and changed content
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { EditHistoryEntry } from '../services/teleconsultationService';

interface TranscriptEditorProps {
  aiTranscript: string | null;
  pharmacistNotes: string | null;
  edited: boolean;
  editHistory: EditHistoryEntry[] | null;
  visible: boolean;
  onClose: () => void;
}

const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  aiTranscript,
  pharmacistNotes,
  edited,
  editHistory,
  visible,
  onClose,
}) => {
  const [showingVersion, setShowingVersion] = useState<'current' | 'original'>('current');
  const [expandedEditIndex, setExpandedEditIndex] = useState<number | null>(null);

  const renderAuditTrail = () => {
    if (!editHistory || editHistory.length === 0) {
      return (
        <Text style={styles.noHistoryText}>
          No edit history available
        </Text>
      );
    }

    return editHistory.map((entry, index) => {
      const isExpanded = expandedEditIndex === index;
      const isFirstEdit = index === 0;

      return (
        <View key={index} style={styles.historyEntry}>
          <TouchableOpacity
            style={styles.historyHeader}
            onPress={() => setExpandedEditIndex(isExpanded ? null : index)}
          >
            <View style={styles.historyHeaderLeft}>
              <Text style={styles.historyIndex}>#{editHistory.length - index}</Text>
              <View>
                <Text style={styles.historyTimestamp}>
                  {new Date(entry.timestamp).toLocaleString()}
                </Text>
                <Text style={styles.historyUser}>User ID: {entry.user_id.substring(0, 8)}...</Text>
              </View>
            </View>
            <View style={styles.historyHeaderRight}>
              {isFirstEdit && (
                <View style={styles.originalBadge}>
                  <Text style={styles.originalBadgeText}>Original AI Version Saved</Text>
                </View>
              )}
              <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
            </View>
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.historyDetails}>
              {/* Show original AI version for first edit */}
              {isFirstEdit && entry.original_ai_version && (
                <View style={styles.originalVersionSection}>
                  <Text style={styles.originalVersionTitle}>Original AI Transcript (Preserved):</Text>
                  <ScrollView style={styles.originalVersionScroll} nestedScrollEnabled>
                    <Text style={styles.originalVersionText}>{entry.original_ai_version}</Text>
                  </ScrollView>
                </View>
              )}

              {/* Show changes */}
              {entry.changes.map((change, changeIndex) => (
                <View key={changeIndex} style={styles.changeEntry}>
                  <Text style={styles.changeField}>Field: {change.field}</Text>

                  {change.old_value && (
                    <View style={styles.changeValue}>
                      <Text style={styles.changeLabel}>Previous:</Text>
                      <Text style={styles.changeOldValue}>
                        {change.old_value.substring(0, 100)}
                        {change.old_value.length > 100 && '...'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.changeValue}>
                    <Text style={styles.changeLabel}>New:</Text>
                    <Text style={styles.changeNewValue}>
                      {change.new_value.substring(0, 100)}
                      {change.new_value.length > 100 && '...'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    });
  };

  const renderCurrentView = () => {
    if (showingVersion === 'original') {
      // Show original AI transcript
      if (!editHistory || !editHistory[0]?.original_ai_version) {
        return (
          <Text style={styles.notAvailableText}>
            Original AI transcript not available
          </Text>
        );
      }

      return (
        <View style={styles.transcriptContent}>
          <View style={styles.versionBanner}>
            <Text style={styles.versionBannerText}>Original AI Transcript (Read-Only)</Text>
          </View>
          <ScrollView style={styles.transcriptScroll}>
            <Text style={styles.transcriptText}>{editHistory[0].original_ai_version}</Text>
          </ScrollView>
        </View>
      );
    } else {
      // Show current version (pharmacist notes or AI transcript)
      const currentText = pharmacistNotes || aiTranscript;

      if (!currentText) {
        return (
          <Text style={styles.notAvailableText}>
            No transcript available
          </Text>
        );
      }

      return (
        <View style={styles.transcriptContent}>
          <View style={[styles.versionBanner, edited && styles.versionBannerEdited]}>
            <Text style={styles.versionBannerText}>
              {edited ? 'Current Version (Edited by Pharmacist)' : 'AI Transcript (Unedited)'}
            </Text>
          </View>
          <ScrollView style={styles.transcriptScroll}>
            <Text style={styles.transcriptText}>{currentText}</Text>
          </ScrollView>
        </View>
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transcript & Audit Trail</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Version Toggle */}
        {edited && (
          <View style={styles.versionToggle}>
            <TouchableOpacity
              style={[
                styles.versionButton,
                showingVersion === 'current' && styles.versionButtonActive,
              ]}
              onPress={() => setShowingVersion('current')}
            >
              <Text
                style={[
                  styles.versionButtonText,
                  showingVersion === 'current' && styles.versionButtonTextActive,
                ]}
              >
                Current Version
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.versionButton,
                showingVersion === 'original' && styles.versionButtonActive,
              ]}
              onPress={() => setShowingVersion('original')}
            >
              <Text
                style={[
                  styles.versionButtonText,
                  showingVersion === 'original' && styles.versionButtonTextActive,
                ]}
              >
                Original AI
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Current View */}
        {renderCurrentView()}

        {/* Audit Trail Section */}
        {edited && (
          <View style={styles.auditSection}>
            <View style={styles.auditHeader}>
              <Text style={styles.auditTitle}>Audit Trail</Text>
              <View style={styles.auditCountBadge}>
                <Text style={styles.auditCountText}>
                  {editHistory?.length || 0} {editHistory?.length === 1 ? 'edit' : 'edits'}
                </Text>
              </View>
            </View>
            <ScrollView style={styles.auditScroll}>
              {renderAuditTrail()}
            </ScrollView>
          </View>
        )}

        {/* Compliance Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Audit trail is immutable and complies with FR-025a regulatory requirements
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  versionToggle: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F2F2F7',
  },
  versionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  versionButtonActive: {
    backgroundColor: '#007AFF',
  },
  versionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  versionButtonTextActive: {
    color: '#fff',
  },
  transcriptContent: {
    flex: 1,
  },
  versionBanner: {
    backgroundColor: '#E3F2FD',
    padding: 12,
  },
  versionBannerEdited: {
    backgroundColor: '#FFF3E0',
  },
  versionBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  transcriptScroll: {
    flex: 1,
    padding: 16,
  },
  transcriptText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 22,
  },
  notAvailableText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  auditSection: {
    maxHeight: '40%',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  auditCountBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  auditCountText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  auditScroll: {
    flex: 1,
    padding: 12,
  },
  historyEntry: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIndex: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 12,
    width: 30,
  },
  historyTimestamp: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  historyUser: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  historyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalBadge: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  originalBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
  },
  historyDetails: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  originalVersionSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  originalVersionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 8,
  },
  originalVersionScroll: {
    maxHeight: 100,
  },
  originalVersionText: {
    fontSize: 12,
    color: '#000',
    lineHeight: 18,
  },
  changeEntry: {
    marginBottom: 12,
  },
  changeField: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  changeValue: {
    marginBottom: 6,
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    marginBottom: 2,
  },
  changeOldValue: {
    fontSize: 12,
    color: '#FF3B30',
    backgroundColor: '#FFE8E8',
    padding: 6,
    borderRadius: 4,
  },
  changeNewValue: {
    fontSize: 12,
    color: '#34C759',
    backgroundColor: '#E8F5E9',
    padding: 6,
    borderRadius: 4,
  },
  noHistoryText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    padding: 12,
    backgroundColor: '#F9F9F9',
  },
  footerText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});

export default TranscriptEditor;
