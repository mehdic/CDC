/**
 * Doctor Video Call Page
 * Inter-professional teleconsultation video call interface for doctors
 * Task: T8-005 - Integrate Twilio Video SDK in doctor app
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import {
  useTeleconsultation,
  useJoinConsultation,
  TeleconsultationStatus,
} from '../../../shared/hooks/useTeleconsultation';
import TwilioVideoRoom from '../../../shared/components/TwilioVideoRoom';

// ============================================================================
// VideoCall Component (Doctor View - Inter-Professional)
// ============================================================================

const VideoCall: React.FC = () => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();

  const [twilioToken, setTwilioToken] = useState<string | null>(null);
  const [twilioRoomName, setTwilioRoomName] = useState<string | null>(null);
  const [isCallStarted, setIsCallStarted] = useState(false);

  // Fetch consultation details
  const {
    data: consultation,
    isLoading: isLoadingConsultation,
    error: consultationError,
  } = useTeleconsultation(consultationId || '');

  // Join consultation mutation
  const joinConsultationMutation = useJoinConsultation();

  /**
   * Join the video call and get Twilio token
   */
  const handleJoinCall = React.useCallback(async () => {
    if (!consultationId) return;

    try {
      const response = await joinConsultationMutation.mutateAsync(consultationId);
      setTwilioToken(response.twilio_token);
      setTwilioRoomName(response.twilio_room_name);
      setIsCallStarted(true);
    } catch (error) {
      console.error('Error joining consultation:', error);
    }
  }, [consultationId, joinConsultationMutation]);

  /**
   * End the call and navigate back
   */
  const handleEndCall = async () => {
    // Navigate back to doctor dashboard
    navigate('/doctor/consultations');
  };

  // Auto-start call if within scheduled time
  useEffect(() => {
    if (consultation && !isCallStarted) {
      const now = new Date();
      const scheduledStart = parseISO(consultation.scheduled_start);
      const scheduledEnd = parseISO(consultation.scheduled_end);

      // If current time is within scheduled window, auto-join
      if (now >= scheduledStart && now <= scheduledEnd) {
        handleJoinCall();
      }
    }
  }, [consultation, isCallStarted, handleJoinCall]);

  // Loading state
  if (isLoadingConsultation || !consultationId) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" ml={2}>
          Loading consultation...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (consultationError || !consultation) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <Typography variant="h6">Error Loading Consultation</Typography>
          Unable to load consultation details. Please try again.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/doctor/consultations')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const pharmacist = consultation.pharmacist;
  const patient = consultation.patient;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }} elevation={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/doctor/consultations')}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Inter-Professional Consultation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                with {pharmacist?.first_name} {pharmacist?.last_name} (Pharmacist) •{' '}
                {patient?.first_name} {patient?.last_name} (Patient) •{' '}
                {format(parseISO(consultation.scheduled_start), 'MMM d, yyyy HH:mm')}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={consultation.status}
              color={
                consultation.status === TeleconsultationStatus.IN_PROGRESS
                  ? 'success'
                  : consultation.status === TeleconsultationStatus.SCHEDULED
                  ? 'primary'
                  : 'default'
              }
            />
          </Box>
        </Box>
      </Paper>

      {/* Main Content - Video */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {!isCallStarted ? (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            flex={1}
            gap={3}
          >
            <Typography variant="h5" gutterBottom>
              Ready to join the consultation?
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={500}>
              You are about to join an inter-professional video consultation with{' '}
              {pharmacist?.first_name} {pharmacist?.last_name} regarding patient{' '}
              {patient?.first_name} {patient?.last_name}.
              {consultation.recording_consent
                ? ' This session will be recorded with patient consent.'
                : ' This session will NOT be recorded.'}
            </Typography>

            <Alert severity="info" sx={{ maxWidth: 500 }}>
              <Typography variant="body2">
                • Secure inter-professional communication
                <br />
                • End-to-end encrypted connection
                <br />
                • Discuss patient care, prescriptions, and treatment
                <br />• HIPAA/GDPR compliant video call
              </Typography>
            </Alert>

            <Button
              variant="contained"
              size="large"
              onClick={handleJoinCall}
              disabled={joinConsultationMutation.isPending}
              sx={{ minWidth: 200 }}
            >
              {joinConsultationMutation.isPending ? (
                <CircularProgress size={24} />
              ) : (
                'Join Video Call'
              )}
            </Button>
          </Box>
        ) : twilioToken && twilioRoomName ? (
          <TwilioVideoRoom
            token={twilioToken}
            roomName={twilioRoomName}
            onDisconnect={handleEndCall}
            displayName={localStorage.getItem('user_name') || 'Doctor'}
            showControls={true}
          />
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress size={60} />
            <Typography variant="h6" ml={2}>
              Connecting to video room...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default VideoCall;
