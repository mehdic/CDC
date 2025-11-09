/**
 * Teleconsultation Calendar Page
 * Calendar view for pharmacists to manage teleconsultation schedule
 * Task: T169 - Create Teleconsultation Calendar
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  VideoCall,
  Add,
  Schedule,
} from '@mui/icons-material';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import {
  useAvailability,
  useTeleconsultations,
  useBookConsultation,
  TeleconsultationStatus,
  AvailabilitySlot,
  Teleconsultation,
} from '../../../shared/hooks/useTeleconsultation';

/**
 * ConsultationCalendar Component
 * Displays weekly calendar view with availability and scheduled consultations
 */
const ConsultationCalendar: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get pharmacy and pharmacist from context/store (mock for now)
  const pharmacyId = localStorage.getItem('pharmacy_id') || '';
  const pharmacistId = localStorage.getItem('user_id') || '';

  // Calculate week boundaries
  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek]);
  const weekEnd = useMemo(() => endOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek]);

  // Fetch availability for current week
  const {
    data: availability,
    isLoading: isLoadingAvailability,
    error: availabilityError,
  } = useAvailability({
    start_date: format(weekStart, 'yyyy-MM-dd'),
    end_date: format(weekEnd, 'yyyy-MM-dd'),
    pharmacist_id: pharmacistId,
    pharmacy_id: pharmacyId,
  });

  // Fetch scheduled consultations for current week
  const {
    data: consultationsData,
    isLoading: isLoadingConsultations,
    error: consultationsError,
  } = useTeleconsultations({
    pharmacist_id: pharmacistId,
    scheduled_after: format(weekStart, 'yyyy-MM-dd'),
    scheduled_before: format(weekEnd, 'yyyy-MM-dd'),
    status: [TeleconsultationStatus.SCHEDULED, TeleconsultationStatus.IN_PROGRESS],
  });

  const consultations = consultationsData?.teleconsultations || [];

  // Generate array of 7 days for the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Navigation handlers
  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleToday = () => {
    setCurrentWeek(new Date());
  };

  // Get consultations for a specific date
  const getConsultationsForDate = (date: Date): Teleconsultation[] => {
    return consultations.filter((consultation) =>
      isSameDay(parseISO(consultation.scheduled_start), date)
    );
  };

  // Get availability slots for a specific date
  const getAvailabilityForDate = (date: Date): AvailabilitySlot[] => {
    if (!availability || availability.length === 0) return [];

    const pharmacistAvailability = availability[0]; // Assuming single pharmacist view
    return pharmacistAvailability.available_slots.filter((slot) =>
      isSameDay(parseISO(slot.start_time), date)
    );
  };

  // Handle slot click for booking
  const handleSlotClick = (slot: AvailabilitySlot, date: Date) => {
    if (slot.is_available) {
      setSelectedSlot(slot);
      setSelectedDate(date);
      setBookingDialogOpen(true);
    }
  };

  // Status chip color mapping
  const getStatusColor = (status: TeleconsultationStatus): 'default' | 'primary' | 'success' | 'error' => {
    switch (status) {
      case TeleconsultationStatus.SCHEDULED:
        return 'primary';
      case TeleconsultationStatus.IN_PROGRESS:
        return 'success';
      case TeleconsultationStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  // Format time slot
  const formatTimeSlot = (slot: AvailabilitySlot): string => {
    const start = format(parseISO(slot.start_time), 'HH:mm');
    const end = format(parseISO(slot.end_time), 'HH:mm');
    return `${start} - ${end}`;
  };

  if (isLoadingAvailability || isLoadingConsultations) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (availabilityError || consultationsError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading calendar data. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
          Teleconsultation Calendar
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setBookingDialogOpen(true)}
          >
            Add Availability
          </Button>
          <Button variant="outlined" onClick={handleToday}>
            Today
          </Button>
        </Box>
      </Box>

      {/* Week Navigation */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <IconButton onClick={handlePreviousWeek}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6">
            {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
          </Typography>
          <IconButton onClick={handleNextWeek}>
            <ChevronRight />
          </IconButton>
        </Box>
      </Paper>

      {/* Calendar Grid */}
      <Grid container spacing={2}>
        {weekDays.map((date) => {
          const dayConsultations = getConsultationsForDate(date);
          const dayAvailability = getAvailabilityForDate(date);
          const isToday = isSameDay(date, new Date());

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={date.toISOString()}>
              <Card
                sx={{
                  border: isToday ? '2px solid' : '1px solid',
                  borderColor: isToday ? 'primary.main' : 'divider',
                  minHeight: '300px',
                }}
              >
                <CardContent>
                  {/* Date Header */}
                  <Box mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                      {format(date, 'EEEE')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(date, 'MMMM d, yyyy')}
                    </Typography>
                    {isToday && (
                      <Chip label="Today" color="primary" size="small" sx={{ mt: 0.5 }} />
                    )}
                  </Box>

                  {/* Scheduled Consultations */}
                  {dayConsultations.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Scheduled ({dayConsultations.length})
                      </Typography>
                      {dayConsultations.map((consultation) => (
                        <Card
                          key={consultation.id}
                          variant="outlined"
                          sx={{ mb: 1, bgcolor: 'action.hover', cursor: 'pointer' }}
                          onClick={() => {
                            // Navigate to video call page
                            window.location.href = `/pharmacist/video-call/${consultation.id}`;
                          }}
                        >
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {format(parseISO(consultation.scheduled_start), 'HH:mm')} -{' '}
                                  {format(parseISO(consultation.scheduled_end), 'HH:mm')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {consultation.patient?.first_name} {consultation.patient?.last_name}
                                </Typography>
                              </Box>
                              <Chip
                                label={consultation.status}
                                size="small"
                                color={getStatusColor(consultation.status)}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}

                  {/* Available Slots */}
                  {dayAvailability.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Available Slots
                      </Typography>
                      {dayAvailability.map((slot, index) => (
                        <Button
                          key={index}
                          fullWidth
                          size="small"
                          variant={slot.is_available ? 'outlined' : 'text'}
                          color="primary"
                          disabled={!slot.is_available}
                          onClick={() => handleSlotClick(slot, date)}
                          sx={{ mb: 0.5, justifyContent: 'flex-start' }}
                          startIcon={<Schedule />}
                        >
                          {formatTimeSlot(slot)}
                          {slot.is_vip_only && (
                            <Chip label="VIP" size="small" sx={{ ml: 1 }} />
                          )}
                        </Button>
                      ))}
                    </Box>
                  )}

                  {/* No availability */}
                  {dayConsultations.length === 0 && dayAvailability.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
                      No consultations scheduled
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingDialogOpen}
        onClose={() => {
          setBookingDialogOpen(false);
          setSelectedSlot(null);
          setSelectedDate(null);
        }}
        slot={selectedSlot}
        date={selectedDate}
      />
    </Box>
  );
};

/**
 * BookingDialog Component
 * Dialog for booking a new teleconsultation
 */
interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  slot: AvailabilitySlot | null;
  date: Date | null;
}

const BookingDialog: React.FC<BookingDialogProps> = ({ open, onClose, slot, date }) => {
  const [patientId, setPatientId] = useState('');
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [notes, setNotes] = useState('');

  const bookConsultation = useBookConsultation();
  const pharmacistId = localStorage.getItem('user_id') || '';

  const handleBook = async () => {
    if (!slot || !date) return;

    try {
      await bookConsultation.mutateAsync({
        patient_id: patientId,
        pharmacist_id: pharmacistId,
        scheduled_start: slot.start_time,
        scheduled_end: slot.end_time,
        recording_consent: recordingConsent,
        notes,
      });

      // Reset form and close
      setPatientId('');
      setRecordingConsent(false);
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error booking consultation:', error);
    }
  };

  if (!slot || !date) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <VideoCall sx={{ mr: 1, verticalAlign: 'middle' }} />
        Book Teleconsultation
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {format(date, 'EEEE, MMMM d, yyyy')}
            <br />
            {format(parseISO(slot.start_time), 'HH:mm')} - {format(parseISO(slot.end_time), 'HH:mm')}
          </Alert>

          <TextField
            fullWidth
            label="Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
            margin="normal"
            helperText="Enter patient ID or search by name"
          />

          <TextField
            fullWidth
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            margin="normal"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={recordingConsent}
                onChange={(e) => setRecordingConsent(e.target.checked)}
              />
            }
            label="Patient consents to session recording"
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleBook}
          disabled={!patientId || bookConsultation.isPending}
          startIcon={bookConsultation.isPending ? <CircularProgress size={20} /> : <VideoCall />}
        >
          Book Consultation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConsultationCalendar;
