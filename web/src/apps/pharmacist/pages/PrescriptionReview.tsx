/**
 * Prescription Review Page
 * Detailed prescription review interface with AI transcription editing,
 * safety warnings, and approve/reject actions
 * Task: T116 - Create Prescription Review page
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserData } from '../../../shared/services/authService';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as ValidateIcon,
  Person as PersonIcon,
  MedicalServices as DoctorIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

import {
  usePrescription,
  useValidatePrescription,
  useApprovePrescription,
  useRejectPrescription,
  PrescriptionStatus,
  PrescriptionItem,
} from '../../../shared/hooks/usePrescriptions';
import { TranscriptionEditor } from '../components/TranscriptionEditor';
import { SafetyWarnings } from '../components/SafetyWarnings';

// ============================================================================
// Component
// ============================================================================

export const PrescriptionReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('prescriptions');

  // State
  const [editedItems, setEditedItems] = useState<PrescriptionItem[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Queries and mutations
  const { data: prescription, isLoading, error } = usePrescription(id || '');
  const validateMutation = useValidatePrescription();
  const approveMutation = useApprovePrescription();
  const rejectMutation = useRejectPrescription();

  // Initialize edited items when prescription loads
  React.useEffect(() => {
    if (prescription && prescription.items) {
      setEditedItems(prescription.items);
    }
  }, [prescription]);

  /**
   * Handle validate prescription
   */
  const handleValidate = async () => {
    if (!id) return;

    try {
      await validateMutation.mutateAsync(id);
      alert(t('messages.validation_success'));
    } catch (error: unknown) {
      // Parse the error response to show user-friendly messages
      const axiosError = error as { response?: { data?: { error?: string; code?: string } } };
      const errorData = axiosError?.response?.data;

      if (errorData?.error) {
        alert(t('messages.validation_failed', { error: errorData.error }));
      } else {
        alert(t('messages.validation_failed', { error: String(error) }));
      }
    }
  };

  /**
   * Handle approve prescription
   */
  const handleApprove = async () => {
    if (!id) return;

    // Get pharmacist ID from stored user data
    const userData = getUserData();
    const pharmacistId = userData?.id;

    if (!pharmacistId) {
      alert(t('messages.session_expired'));
      navigate('/login');
      return;
    }

    try {
      await approveMutation.mutateAsync({ prescriptionId: id, pharmacistId });
      alert(t('messages.approval_success'));
      navigate('/prescriptions');
    } catch (error: unknown) {
      // Parse the error response to show user-friendly messages
      const axiosError = error as { response?: { data?: { error?: string; code?: string }; status?: number } };
      const errorData = axiosError?.response?.data;
      const status = axiosError?.response?.status;

      // Handle token expiration - redirect to login
      if (status === 401 || errorData?.code === 'TOKEN_EXPIRED') {
        alert(t('messages.session_expired'));
        navigate('/login');
        return;
      }

      if (errorData?.code === 'CANNOT_APPROVE' || errorData?.error?.includes('in_review')) {
        alert(t('messages.approval_needs_validation'));
      } else if (errorData?.error) {
        alert(t('messages.approval_failed', { error: errorData.error }));
      } else {
        alert(t('messages.approval_failed', { error: String(error) }));
      }
    }
  };

  /**
   * Handle reject prescription
   */
  const handleReject = async () => {
    if (!id || !rejectReason.trim()) {
      alert(t('messages.rejection_reason_required'));
      return;
    }

    // Get pharmacist ID from stored user data
    const userData = getUserData();
    const pharmacistId = userData?.id;

    if (!pharmacistId) {
      alert(t('messages.session_expired'));
      navigate('/login');
      return;
    }

    try {
      await rejectMutation.mutateAsync({ prescriptionId: id, pharmacistId, reason: rejectReason });
      alert(t('messages.rejection_success'));
      setRejectDialogOpen(false);
      navigate('/prescriptions');
    } catch (error: unknown) {
      // Parse the error response to show user-friendly messages
      const axiosError = error as { response?: { data?: { error?: string; code?: string } } };
      const errorData = axiosError?.response?.data;

      if (errorData?.error) {
        alert(t('messages.rejection_failed', { error: errorData.error }));
      } else {
        alert(t('messages.rejection_failed', { error: String(error) }));
      }
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate('/prescriptions');
  };

  /**
   * Get translated status label
   */
  const getStatusLabel = (status: string): string => {
    const statusKey = status.toLowerCase().replace('_', '_');
    return t(`status.${statusKey}`, { defaultValue: status.replace('_', ' ').toUpperCase() });
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error || !prescription) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          <Typography variant="body2">
            {t('messages.loading_error')}: {error?.message || t('messages.not_found')}
          </Typography>
        </Alert>
        <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          {t('back_to_dashboard')}
        </Button>
      </Container>
    );
  }

  const canApprove =
    prescription.status === PrescriptionStatus.PENDING ||
    prescription.status === PrescriptionStatus.IN_REVIEW;

  const canReject =
    prescription.status === PrescriptionStatus.PENDING ||
    prescription.status === PrescriptionStatus.IN_REVIEW;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <IconButton onClick={handleBack}>
            <BackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              {t('title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('id_label')}: {prescription.id}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(prescription.status)}
            color={
              prescription.status === PrescriptionStatus.APPROVED
                ? 'success'
                : prescription.status === PrescriptionStatus.REJECTED
                ? 'error'
                : 'warning'
            }
          />
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Patient & Prescription Info */}
        <Grid item xs={12} md={4}>
          {/* Patient Information */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <PersonIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                {t('patient_info.title')}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('patient_info.name')}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {prescription.patient
                    ? `${prescription.patient.first_name} ${prescription.patient.last_name}`
                    : t('messages.unknown_patient')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('patient_info.patient_id')}
                </Typography>
                <Typography variant="body2">{prescription.patient_id}</Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Doctor Information */}
          {prescription.prescribing_doctor && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <DoctorIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  {t('doctor_info.title')}
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('doctor_info.name')}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {`${prescription.prescribing_doctor.first_name} ${prescription.prescribing_doctor.last_name}`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('doctor_info.doctor_id')}
                  </Typography>
                  <Typography variant="body2">{prescription.prescribing_doctor_id}</Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Prescription Metadata */}
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <CalendarIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                {t('details.title')}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('details.source')}
                </Typography>
                <Typography variant="body2">{prescription.source}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('details.prescribed_date')}
                </Typography>
                <Typography variant="body2">
                  {prescription.prescribed_date
                    ? new Date(prescription.prescribed_date).toLocaleDateString()
                    : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('details.expiry_date')}
                </Typography>
                <Typography variant="body2">
                  {prescription.expiry_date
                    ? new Date(prescription.expiry_date).toLocaleDateString()
                    : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('details.submitted')}
                </Typography>
                <Typography variant="body2">
                  {new Date(prescription.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column - Transcription & Safety Warnings */}
        <Grid item xs={12} md={8}>
          {/* Safety Warnings */}
          <Box sx={{ mb: 3 }}>
            <SafetyWarnings
              drugInteractions={prescription.drug_interactions}
              allergyWarnings={prescription.allergy_warnings}
              contraindications={prescription.contraindications}
            />
          </Box>

          {/* AI Transcription Editor */}
          <Box sx={{ mb: 3 }}>
            <TranscriptionEditor
              items={editedItems}
              imageUrl={prescription.image_url}
              aiConfidenceScore={prescription.ai_confidence_score}
              onItemsChange={setEditedItems}
              readonly={!canApprove}
            />
          </Box>

          {/* Action Buttons */}
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Button
                variant="outlined"
                startIcon={<ValidateIcon />}
                onClick={handleValidate}
                disabled={validateMutation.isPending}
              >
                {validateMutation.isPending ? t('actions.validating') : t('actions.run_safety_checks')}
              </Button>

              <Stack direction="row" spacing={2}>
                {canReject && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RejectIcon />}
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={rejectMutation.isPending}
                  >
                    {t('actions.reject')}
                  </Button>
                )}

                {canApprove && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? t('actions.approving') : t('actions.approve')}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('reject_dialog.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('reject_dialog.description')}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('reject_dialog.reason_label')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('reject_dialog.reason_placeholder')}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>{t('reject_dialog.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectReason.trim() || rejectMutation.isPending}
          >
            {rejectMutation.isPending ? t('reject_dialog.rejecting') : t('reject_dialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PrescriptionReview;
