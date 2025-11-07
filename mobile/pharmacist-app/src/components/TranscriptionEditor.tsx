/**
 * AI Transcription Editor Component
 * Displays and allows editing of AI-transcribed prescription fields with confidence indicators
 * T108 - FR-013, FR-013a: AI transcription with low-confidence field highlighting
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PrescriptionItem } from '../services/prescriptionService';
import { ConfidenceWarning } from './ConfidenceWarning';

// ============================================================================
// Types
// ============================================================================

export interface TranscriptionEditorProps {
  items: PrescriptionItem[];
  onItemUpdate: (itemId: string, field: string, value: string) => void;
  onItemCorrect: (itemId: string, corrections: Partial<PrescriptionItem>) => void;
  readOnly?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const TranscriptionEditor: React.FC<TranscriptionEditorProps> = ({
  items,
  onItemUpdate,
  onItemCorrect,
  readOnly = false,
}) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, any>>({});

  const handleFieldEdit = (itemId: string, field: string, value: string) => {
    setEditedFields({
      ...editedFields,
      [`${itemId}_${field}`]: value,
    });
    onItemUpdate(itemId, field, value);
  };

  const handleSaveCorrections = (item: PrescriptionItem) => {
    const corrections: Partial<PrescriptionItem> = {};
    const itemKeys = Object.keys(editedFields).filter((key) => key.startsWith(item.id));

    itemKeys.forEach((key) => {
      const field = key.split('_')[1];
      corrections[field as keyof PrescriptionItem] = editedFields[key];
    });

    if (Object.keys(corrections).length > 0) {
      onItemCorrect(item.id, corrections);
    }

    setEditingItem(null);
  };

  const renderFieldEditor = (
    item: PrescriptionItem,
    field: keyof PrescriptionItem,
    label: string,
    confidence: number | null,
    multiline = false
  ) => {
    const value = editedFields[`${item.id}_${field}`] || item[field] || '';
    const isLowConfidence = confidence !== null && confidence < 80;
    const isEditing = editingItem === item.id;

    return (
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {confidence !== null && (
            <ConfidenceWarning
              confidence={confidence}
              fieldName={label}
              value={String(value)}
              showInline={true}
            />
          )}
        </View>

        <View
          style={[
            styles.fieldInputContainer,
            isLowConfidence && styles.lowConfidenceField,
            isEditing && styles.activeField,
          ]}
        >
          <TextInput
            style={[
              styles.fieldInput,
              multiline && styles.multilineInput,
              readOnly && styles.readOnlyInput,
            ]}
            value={String(value)}
            onChangeText={(text) => handleFieldEdit(item.id, field as string, text)}
            editable={!readOnly && isEditing}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          {isLowConfidence && !readOnly && (
            <View style={styles.verifyBadge}>
              <Icon name="eye-check" size={14} color="#D97706" />
              <Text style={styles.verifyText}>VERIFY</Text>
            </View>
          )}
        </View>

        {item.pharmacist_corrected &&
          item.original_ai_value &&
          item.original_ai_value[field] && (
            <View style={styles.originalValue}>
              <Icon name="history" size={12} color="#6B7280" />
              <Text style={styles.originalValueText}>
                Original AI: {item.original_ai_value[field]}
              </Text>
            </View>
          )}
      </View>
    );
  };

  const renderItem = (item: PrescriptionItem, index: number) => {
    const isEditing = editingItem === item.id;
    const hasLowConfidence =
      (item.medication_confidence !== null && item.medication_confidence < 80) ||
      (item.dosage_confidence !== null && item.dosage_confidence < 80) ||
      (item.frequency_confidence !== null && item.frequency_confidence < 80);

    return (
      <View
        key={item.id}
        style={[styles.itemCard, hasLowConfidence && styles.lowConfidenceCard]}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemHeaderLeft}>
            <Text style={styles.itemNumber}>#{index + 1}</Text>
            {item.pharmacist_corrected && (
              <View style={styles.correctedBadge}>
                <Icon name="pencil-circle" size={16} color="#10B981" />
                <Text style={styles.correctedText}>Corrected</Text>
              </View>
            )}
            {hasLowConfidence && !item.pharmacist_corrected && (
              <View style={styles.needsVerificationBadge}>
                <Icon name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.needsVerificationText}>Needs Verification</Text>
              </View>
            )}
          </View>

          {!readOnly && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                if (isEditing) {
                  handleSaveCorrections(item);
                } else {
                  setEditingItem(item.id);
                }
              }}
            >
              <Icon
                name={isEditing ? 'check-circle' : 'pencil'}
                size={20}
                color={isEditing ? '#10B981' : '#3B82F6'}
              />
              <Text
                style={[
                  styles.editButtonText,
                  isEditing && styles.saveButtonText,
                ]}
              >
                {isEditing ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.itemBody}>
          {renderFieldEditor(
            item,
            'medication_name',
            'Medication Name',
            item.medication_confidence
          )}
          {renderFieldEditor(item, 'dosage', 'Dosage', item.dosage_confidence)}
          {renderFieldEditor(
            item,
            'frequency',
            'Frequency',
            item.frequency_confidence
          )}
          {renderFieldEditor(item, 'duration', 'Duration', null)}
          {renderFieldEditor(item, 'quantity', 'Quantity', null)}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="file-document-edit-outline" size={24} color="#1F2937" />
        <Text style={styles.headerTitle}>Prescription Items ({items.length})</Text>
      </View>

      {items.some(
        (item) =>
          (item.medication_confidence !== null && item.medication_confidence < 80) ||
          (item.dosage_confidence !== null && item.dosage_confidence < 80) ||
          (item.frequency_confidence !== null && item.frequency_confidence < 80)
      ) && (
        <View style={styles.warningBanner}>
          <Icon name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.warningBannerText}>
            Some fields have low AI confidence (&lt;80%). Please verify before approval.
          </Text>
        </View>
      )}

      <ScrollView style={styles.itemsList}>
        {items.map((item, index) => renderItem(item, index))}
      </ScrollView>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 6,
  },
  warningBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
  },
  itemsList: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  lowConfidenceCard: {
    borderColor: '#FCA5A5',
    borderWidth: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  correctedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  correctedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
    marginLeft: 4,
  },
  needsVerificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  needsVerificationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 6,
  },
  saveButtonText: {
    color: '#10B981',
  },
  itemBody: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
  },
  fieldInputContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  lowConfidenceField: {
    borderColor: '#FCA5A5',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  activeField: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  fieldInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  verifyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verifyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 4,
  },
  originalValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  originalValueText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginLeft: 6,
  },
});

export default TranscriptionEditor;
