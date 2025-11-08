/**
 * Drug Interaction Warnings Display Component
 * Shows drug interactions, allergy warnings, and contraindications with severity levels
 * T110 - FR-011, FR-012: Display safety warnings prominently
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  DrugInteraction,
  AllergyWarning,
  Contraindication,
} from '../services/prescriptionService';

// ============================================================================
// Types
// ============================================================================

export interface InteractionWarningsProps {
  drugInteractions?: DrugInteraction[] | null;
  allergyWarnings?: AllergyWarning[] | null;
  contraindications?: Contraindication[] | null;
  showDetailsModal?: boolean;
}

type Severity = 'critical' | 'major' | 'moderate' | 'minor';

// ============================================================================
// Component
// ============================================================================

export const InteractionWarnings: React.FC<InteractionWarningsProps> = ({
  drugInteractions = [],
  allergyWarnings = [],
  contraindications = [],
  showDetailsModal = false,
}) => {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<any>(null);

  const hasCriticalIssues = [
    ...(drugInteractions || []),
    ...(allergyWarnings || []),
    ...(contraindications || []),
  ].some((w) => w.severity === 'critical');

  const totalWarnings =
    (drugInteractions?.length || 0) +
    (allergyWarnings?.length || 0) +
    (contraindications?.length || 0);

  if (totalWarnings === 0) {
    return (
      <View style={styles.safeContainer}>
        <Icon name="check-circle" size={20} color="#10B981" />
        <Text style={styles.safeText}>No safety warnings detected</Text>
      </View>
    );
  }

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return '#DC2626'; // Red
      case 'major':
        return '#D97706'; // Orange
      case 'moderate':
        return '#F59E0B'; // Yellow
      case 'minor':
        return '#3B82F6'; // Blue
      default:
        return '#6B7280';
    }
  };

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return 'alert-octagon';
      case 'major':
        return 'alert-circle';
      case 'moderate':
        return 'alert';
      case 'minor':
        return 'information';
      default:
        return 'alert';
    }
  };

  const openDetails = (warning: any, type: string) => {
    setSelectedWarning({ ...warning, type });
    setDetailsVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={[styles.header, hasCriticalIssues && styles.criticalHeader]}>
        <Icon
          name={hasCriticalIssues ? 'alert-octagon' : 'alert-circle-outline'}
          size={24}
          color={hasCriticalIssues ? '#DC2626' : '#D97706'}
        />
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, hasCriticalIssues && styles.criticalText]}>
            {hasCriticalIssues ? 'CRITICAL: ' : ''}Safety Warnings Detected
          </Text>
          <Text style={styles.headerSubtitle}>
            {totalWarnings} warning{totalWarnings > 1 ? 's' : ''} found
          </Text>
        </View>
      </View>

      {/* Drug Interactions */}
      {drugInteractions && drugInteractions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="pill" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>
              Drug Interactions ({drugInteractions.length})
            </Text>
          </View>
          {drugInteractions.map((interaction, index) => (
            <TouchableOpacity
              key={index}
              style={styles.warningCard}
              onPress={() => openDetails(interaction, 'Drug Interaction')}
            >
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(interaction.severity) },
                ]}
              >
                <Icon
                  name={getSeverityIcon(interaction.severity)}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.severityText}>
                  {interaction.severity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>
                  {interaction.drug1} + {interaction.drug2}
                </Text>
                <Text style={styles.warningDescription} numberOfLines={2}>
                  {interaction.description}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Allergy Warnings */}
      {allergyWarnings && allergyWarnings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="alert-circle-outline" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>
              Allergy Warnings ({allergyWarnings.length})
            </Text>
          </View>
          {allergyWarnings.map((allergy, index) => (
            <TouchableOpacity
              key={index}
              style={styles.warningCard}
              onPress={() => openDetails(allergy, 'Allergy Warning')}
            >
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(allergy.severity) },
                ]}
              >
                <Icon name={getSeverityIcon(allergy.severity)} size={16} color="#fff" />
                <Text style={styles.severityText}>
                  {allergy.severity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>{allergy.allergen}</Text>
                <Text style={styles.warningDescription}>
                  Reaction: {allergy.reaction_type}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Contraindications */}
      {contraindications && contraindications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="close-circle-outline" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>
              Contraindications ({contraindications.length})
            </Text>
          </View>
          {contraindications.map((contra, index) => (
            <TouchableOpacity
              key={index}
              style={styles.warningCard}
              onPress={() => openDetails(contra, 'Contraindication')}
            >
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(contra.severity) },
                ]}
              >
                <Icon name={getSeverityIcon(contra.severity)} size={16} color="#fff" />
                <Text style={styles.severityText}>
                  {contra.severity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>{contra.condition}</Text>
                <Text style={styles.warningDescription} numberOfLines={2}>
                  {contra.reason}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Critical Warning Footer */}
      {hasCriticalIssues && (
        <View style={styles.criticalFooter}>
          <Icon name="alert-octagon" size={16} color="#DC2626" />
          <Text style={styles.criticalFooterText}>
            CRITICAL issues detected - Approval blocked until resolved
          </Text>
        </View>
      )}

      {/* Details Modal */}
      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedWarning?.type}</Text>
              <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedWarning && (
                <>
                  <View
                    style={[
                      styles.modalSeverityBadge,
                      { backgroundColor: getSeverityColor(selectedWarning.severity) },
                    ]}
                  >
                    <Text style={styles.modalSeverityText}>
                      {selectedWarning.severity.toUpperCase()} SEVERITY
                    </Text>
                  </View>

                  {selectedWarning.type === 'Drug Interaction' && (
                    <>
                      <Text style={styles.modalLabel}>Medications</Text>
                      <Text style={styles.modalValue}>
                        {selectedWarning.drug1} + {selectedWarning.drug2}
                      </Text>
                      <Text style={styles.modalLabel}>Description</Text>
                      <Text style={styles.modalValue}>
                        {selectedWarning.description}
                      </Text>
                    </>
                  )}

                  {selectedWarning.type === 'Allergy Warning' && (
                    <>
                      <Text style={styles.modalLabel}>Allergen</Text>
                      <Text style={styles.modalValue}>{selectedWarning.allergen}</Text>
                      <Text style={styles.modalLabel}>Reaction Type</Text>
                      <Text style={styles.modalValue}>
                        {selectedWarning.reaction_type}
                      </Text>
                    </>
                  )}

                  {selectedWarning.type === 'Contraindication' && (
                    <>
                      <Text style={styles.modalLabel}>Condition</Text>
                      <Text style={styles.modalValue}>{selectedWarning.condition}</Text>
                      <Text style={styles.modalLabel}>Reason</Text>
                      <Text style={styles.modalValue}>{selectedWarning.reason}</Text>
                    </>
                  )}

                  <View style={styles.modalFooter}>
                    <Text style={styles.modalFooterText}>
                      Review patient history and consult with prescribing doctor if needed
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
  },
  safeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  safeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  criticalHeader: {
    borderBottomColor: '#DC2626',
  },
  headerContent: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
  },
  criticalText: {
    color: '#DC2626',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  warningDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  criticalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  criticalFooterText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  modalSeverityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 20,
  },
  modalSeverityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  modalFooter: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  modalFooterText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default InteractionWarnings;
