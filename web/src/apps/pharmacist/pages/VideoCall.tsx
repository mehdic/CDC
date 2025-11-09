/**
 * Video Call Page
 * Main teleconsultation video call interface with patient records and notes
 * Task: T170 - Create Video Call page
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
  Drawer,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Note,
  Add,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import {
  useTeleconsultation,
  useJoinConsultation,
  useUpdateConsultationStatus,
  TeleconsultationStatus,
} from '../../../shared/hooks/useTeleconsultation';
import TwilioVideoRoom from '../../../shared/components/TwilioVideoRoom';
import PatientRecordPanel from '../components/PatientRecordPanel';
import NotesEditor from '../components/NotesEditor';

// ============================================================================
// VideoCall Component
// ============================================================================

const VideoCall: React.FC = () => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();

  const [twilioToken, setTwilioToken] = useState<string | null>(null);
  const [twilioRoomName, setTwilioRoomName] = useState<string | null>(null);
  const [showPatientRecords, setShowPatientRecords] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [isCallStarted, setIsCallStarted] = useState(false);

  // Fetch consultation details
  const {
    data: consultation,
    isLoading: isLoadingConsultation,
    error: consultationError,
  } = useTeleconsultation(consultationId || '');

  // Join consultation mutation
  const joinConsultationMutation = useJoinConsultation();

  // Update status mutation
  const updateStatusMutation = useUpdateConsultationStatus();

  /**
   * Join the video call and get Twilio token
   */
  const handleJoinCall = async () => {
    if (!consultationId) return;

    try {
      const response = await joinConsultationMutation.mutateAsync(consultationId);
      setTwilioToken(response.twilio_token);
      setTwilioRoomName(response.twilio_room_name);
      setIsCallStarted(true);

      // Update consultation status to IN_PROGRESS
      await updateStatusMutation.mutateAsync({
        consultation_id: consultationId,
        status: TeleconsultationStatus.IN_PROGRESS,
      });
    } catch (error) {
      console.error('Error joining consultation:', error);
    }
  };

  /**
   * End the call and navigate back
   */
  const handleEndCall = async () => {
    if (!consultationId) return;

    try {
      // Update consultation status to COMPLETED
      await updateStatusMutation.mutateAsync({
        consultation_id: consultationId,
        status: TeleconsultationStatus.COMPLETED,
      });

      // Navigate back to calendar
      navigate('/pharmacist/consultations');
    } catch (error) {
      console.error('Error ending consultation:', error);
      // Navigate anyway
      navigate('/pharmacist/consultations');
    }
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
  }, [consultation, isCallStarted]);

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
          onClick={() => navigate('/pharmacist/consultations')}
          sx={{ mt: 2 }}
        >
          Back to Calendar
        </Button>
      </Box>
    );
  }

  const patient = consultation.patient;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }} elevation={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/pharmacist/consultations')}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Teleconsultation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patient?.first_name} {patient?.last_name} •{' '}
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

            <Tooltip title={showPatientRecords ? 'Hide patient records' : 'Show patient records'}>
              <IconButton
                color={showPatientRecords ? 'primary' : 'default'}
                onClick={() => setShowPatientRecords(!showPatientRecords)}
              >
                <Person />
              </IconButton>
            </Tooltip>

            <Tooltip title={showNotes ? 'Hide notes' : 'Show notes'}>
              <IconButton
                color={showNotes ? 'primary' : 'default'}
                onClick={() => setShowNotes(!showNotes)}
              >
                <Note />
              </IconButton>
            </Tooltip>

            {consultation.status === TeleconsultationStatus.IN_PROGRESS && (
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate(`/pharmacist/prescriptions/create?consultation=${consultationId}`)}
              >
                Create Prescription
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar - Patient Records */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={showPatientRecords}
          sx={{
            width: 350,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 350,
              position: 'relative',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
            {patient && <PatientRecordPanel patient={patient} />}
          </Box>
        </Drawer>

        {/* Center - Video */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
                Ready to start consultation?
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={500}>
                You are about to join a video call with {patient?.first_name} {patient?.last_name}.
                {consultation.recording_consent
                  ? ' This session will be recorded with patient consent.'
                  : ' This session will NOT be recorded.'}
              </Typography>

              <Alert severity="info" sx={{ maxWidth: 500 }}>
                <Typography variant="body2">
                  • Ensure your camera and microphone are working
                  <br />
                  • Connection is end-to-end encrypted
                  <br />
                  • Patient records are available in the sidebar
                  <br />• You can create prescriptions during the call
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
              displayName={localStorage.getItem('user_name') || 'Pharmacist'}
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

        {/* Right Sidebar - Notes */}
        <Drawer
          variant="persistent"
          anchor="right"
          open={showNotes}
          sx={{
            width: 400,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 400,
              position: 'relative',
              borderLeft: 1,
              borderColor: 'divider',
            },
          }}
        >
          <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
            <NotesEditor
              consultationId={consultationId}
              notes={consultation.notes}
              aiTranscript=""
              isRecording={consultation.recording_consent && isCallStarted}
            />
          </Box>
        </Drawer>
      </Box>
    </Box>
  );
};

export default VideoCall;
