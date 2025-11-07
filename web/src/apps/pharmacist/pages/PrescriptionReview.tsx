/**
 * Prescription Review Page
 * Detailed prescription review interface with AI transcription editing,
 * safety warnings, and approve/reject actions
 * Task: T116 - Create Prescription Review page
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Help as ClarificationIcon,
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
      alert('Prescription validated successfully! Safety checks updated.');
    } catch (error) {
      alert(`Validation failed: ${error}`);
    }
  };

  /**
   * Handle approve prescription
   */
  const handleApprove = async () => {
    if (!id) return;

    // Get pharmacist ID from auth context (hardcoded for demo)
    const pharmacistId = localStorage.getItem('user_id') || 'pharmacist-123';

    try {
      await approveMutation.mutateAsync({ prescriptionId: id, pharmacistId });
      alert('Prescription approved successfully!');
      navigate('/pharmacist/prescriptions');
    } catch (error) {
      alert(`Approval failed: ${error}`);
    }
  };

  /**
   * Handle reject prescription
   */
  const handleReject = async () => {
    if (!id || !rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await rejectMutation.mutateAsync({ prescriptionId: id, reason: rejectReason });
      alert('Prescription rejected successfully!');
      setRejectDialogOpen(false);
      navigate('/pharmacist/prescriptions');
    } catch (error) {
      alert(`Rejection failed: ${error}`);
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate('/pharmacist/prescriptions');
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
            Error loading prescription: {error?.message || 'Prescription not found'}
          </Typography>
        </Alert>
        <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Dashboard
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
              Prescription Review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {prescription.id}
            </Typography>
          </Box>
          <Chip
            label={prescription.status.replace('_', ' ').toUpperCase()}
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
                Patient Information
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {prescription.patient
                    ? `${prescription.patient.first_name} ${prescription.patient.last_name}`
                    : 'Unknown Patient'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Patient ID
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
                  Prescribing Doctor
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {`${prescription.prescribing_doctor.first_name} ${prescription.prescribing_doctor.last_name}`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Doctor ID
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
                Prescription Details
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Source
                </Typography>
                <Typography variant="body2">{prescription.source}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Prescribed Date
                </Typography>
                <Typography variant="body2">
                  {prescription.prescribed_date
                    ? new Date(prescription.prescribed_date).toLocaleDateString()
                    : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Expiry Date
                </Typography>
                <Typography variant="body2">
                  {prescription.expiry_date
                    ? new Date(prescription.expiry_date).toLocaleDateString()
                    : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Submitted
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
                {validateMutation.isPending ? 'Validating...' : 'Run Safety Checks'}
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
                    Reject
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
                    {approveMutation.isPending ? 'Approving...' : 'Approve Prescription'}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Prescription</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Please provide a reason for rejecting this prescription. The patient and doctor will be
            notified.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Illegible prescription, missing dosage information, drug interaction concerns..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectReason.trim() || rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PrescriptionReview;
