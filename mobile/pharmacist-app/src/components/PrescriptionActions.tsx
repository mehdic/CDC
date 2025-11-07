/**
 * Prescription Approve/Reject Action Buttons
 * Handles prescription approval and rejection workflows with validation
 * T111 - FR-014: Approve/reject with mandatory reason codes for rejection (FR-029)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ============================================================================
// Types
// ============================================================================

export interface PrescriptionActionsProps {
  prescriptionId: string;
  pharmacistId: string;
  hasCriticalIssues?: boolean;
  hasLowConfidenceFields?: boolean;
  onApprove: (prescriptionId: string, pharmacistId: string, notes?: string) => Promise<void>;
  onReject: (
    prescriptionId: string,
    pharmacistId: string,
    reason: string,
    notifyDoctor?: boolean,
    notifyPatient?: boolean
  ) => Promise<void>;
  onMessageDoctor?: () => void;
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const PrescriptionActions: React.FC<PrescriptionActionsProps> = ({
  prescriptionId,
  pharmacistId,
  hasCriticalIssues = false,
  hasLowConfidenceFields = false,
  onApprove,
  onReject,
  onMessageDoctor,
  disabled = false,
}) => {
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notifyDoctor, setNotifyDoctor] = useState(true);
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [loading, setLoading] = useState(false);

  // Predefined rejection reasons (FR-029)
  const rejectionReasons = [
    'Illegible handwriting / unclear prescription',
    'Missing critical information (dosage, frequency, duration)',
    'Suspected drug interaction - requires doctor clarification',
    'Patient allergy conflict detected',
    'Contraindication with patient medical history',
    'Prescription validity expired',
    'Medication out of stock - alternative needed',
    'Dosage exceeds safe limits',
    'Other (specify below)',
  ];

  const handleApprovePress = () => {
    // Block approval if critical issues exist
    if (hasCriticalIssues) {
      Alert.alert(
        'Cannot Approve',
        'Critical safety issues detected. Please resolve or reject this prescription.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Warn if low confidence fields exist
    if (hasLowConfidenceFields) {
      Alert.alert(
        'Low Confidence Fields',
        'Some fields have low AI confidence (<80%). Have you verified all flagged fields?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Continue', onPress: () => setApproveModalVisible(true) },
        ]
      );
    } else {
      setApproveModalVisible(true);
    }
  };

  const handleApproveConfirm = async () => {
    try {
      setLoading(true);
      await onApprove(prescriptionId, pharmacistId, approvalNotes || undefined);
      setApproveModalVisible(false);
      setApprovalNotes('');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    // Validate rejection reason is provided (FR-029 mandatory)
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      Alert.alert(
        'Rejection Reason Required',
        'You must provide a reason for rejection (FR-029).'
      );
      return;
    }

    try {
      setLoading(true);
      await onReject(
        prescriptionId,
        pharmacistId,
        rejectionReason,
        notifyDoctor,
        notifyPatient
      );
      setRejectModalVisible(false);
      setRejectionReason('');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {/* Message Doctor Button */}
        {onMessageDoctor && (
          <TouchableOpacity
            style={styles.messageDoctorButton}
            onPress={onMessageDoctor}
            disabled={disabled}
          >
            <Icon name="message-text-outline" size={20} color="#3B82F6" />
            <Text style={styles.messageDoctorText}>Message Doctor</Text>
          </TouchableOpacity>
        )}

        {/* Reject Button */}
        <TouchableOpacity
          style={[styles.rejectButton, disabled && styles.disabledButton]}
          onPress={() => setRejectModalVisible(true)}
          disabled={disabled}
        >
          <Icon name="close-circle-outline" size={22} color="#fff" />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>

        {/* Approve Button */}
        <TouchableOpacity
          style={[
            styles.approveButton,
            (disabled || hasCriticalIssues) && styles.disabledButton,
          ]}
          onPress={handleApprovePress}
          disabled={disabled || hasCriticalIssues}
        >
          <Icon name="check-circle-outline" size={22} color="#fff" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>

      {/* Critical Warning */}
      {hasCriticalIssues && (
        <View style={styles.criticalWarning}>
          <Icon name="alert-octagon" size={16} color="#DC2626" />
          <Text style={styles.criticalWarningText}>
            Approval blocked - Critical safety issues must be resolved
          </Text>
        </View>
      )}

      {/* ====================================================================== */}
      {/* Approve Modal */}
      {/* ====================================================================== */}
      <Modal
        visible={approveModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !loading && setApproveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="check-circle" size={32} color="#10B981" />
              <Text style={styles.modalTitle}>Approve Prescription</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                You are about to approve this prescription. A treatment plan will be
                automatically generated and added to the patient's medical record.
              </Text>

              <Text style={styles.inputLabel}>
                Notes (Optional)
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Add any approval notes for audit trail..."
                multiline
                numberOfLines={4}
                value={approvalNotes}
                onChangeText={setApprovalNotes}
                editable={!loading}
              />

              <View style={styles.confirmationInfo}>
                <Icon name="information-outline" size={18} color="#3B82F6" />
                <Text style={styles.confirmationInfoText}>
                  Patient and prescribing doctor will be notified
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setApproveModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmApproveButton}
                onPress={handleApproveConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="check-circle" size={20} color="#fff" />
                    <Text style={styles.confirmApproveButtonText}>Confirm Approval</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====================================================================== */}
      {/* Reject Modal */}
      {/* ====================================================================== */}
      <Modal
        visible={rejectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !loading && setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="close-circle" size={32} color="#DC2626" />
              <Text style={[styles.modalTitle, styles.rejectTitle]}>
                Reject Prescription
              </Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                FR-029 requires a mandatory rejection reason. Select from predefined reasons
                or provide a custom reason.
              </Text>

              <Text style={[styles.inputLabel, styles.requiredLabel]}>
                Rejection Reason *
              </Text>
              {rejectionReasons.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.reasonOption}
                  onPress={() => setRejectionReason(reason)}
                  disabled={loading}
                >
                  <Icon
                    name={
                      rejectionReason === reason
                        ? 'radiobox-marked'
                        : 'radiobox-blank'
                    }
                    size={20}
                    color={rejectionReason === reason ? '#DC2626' : '#9CA3AF'}
                  />
                  <Text style={styles.reasonOptionText}>{reason}</Text>
                </TouchableOpacity>
              ))}

              {rejectionReason === 'Other (specify below)' && (
                <TextInput
                  style={styles.textArea}
                  placeholder="Specify rejection reason..."
                  multiline
                  numberOfLines={3}
                  value={rejectionReason === 'Other (specify below)' ? '' : rejectionReason}
                  onChangeText={setRejectionReason}
                  editable={!loading}
                />
              )}

              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setNotifyDoctor(!notifyDoctor)}
                  disabled={loading}
                >
                  <Icon
                    name={notifyDoctor ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={notifyDoctor ? '#3B82F6' : '#9CA3AF'}
                  />
                  <Text style={styles.checkboxLabel}>Notify prescribing doctor</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setNotifyPatient(!notifyPatient)}
                  disabled={loading}
                >
                  <Icon
                    name={notifyPatient ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={notifyPatient ? '#3B82F6' : '#9CA3AF'}
                  />
                  <Text style={styles.checkboxLabel}>Notify patient</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRejectModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmRejectButton,
                  !rejectionReason && styles.disabledButton,
                ]}
                onPress={handleRejectConfirm}
                disabled={loading || !rejectionReason}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="close-circle" size={20} color="#fff" />
                    <Text style={styles.confirmRejectButtonText}>Confirm Rejection</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  messageDoctorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  messageDoctorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#DC2626',
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  approveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  criticalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  criticalWarningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  rejectTitle: {
    color: '#DC2626',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requiredLabel: {
    color: '#DC2626',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  confirmationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  confirmationInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1F2937',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reasonOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
  },
  checkboxRow: {
    marginVertical: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmApproveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  confirmApproveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  confirmRejectButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#DC2626',
  },
  confirmRejectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
});

export default PrescriptionActions;
