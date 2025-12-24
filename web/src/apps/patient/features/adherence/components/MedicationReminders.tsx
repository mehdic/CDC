/**
 * Medication Reminders Component
 * Displays upcoming medication reminders and allows acknowledgment
 * T8-043: Patient Adherence Tracking
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Box,
  Alert,
  CircularProgress,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Typography,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Medication as MedicationIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAdherence } from '../hooks/useAdherence';

interface MedicationRemindersProps {
  patientId: string;
}

/**
 * Component for reminder settings dialog
 */
interface ReminderSettingsDialogProps {
  open: boolean;
  reminderId: string;
  medicationName: string;
  currentEnabled: boolean;
  currentTimes: string[];
  onClose: () => void;
  onSave: (enabled: boolean, times: string[]) => Promise<void>;
  isLoading: boolean;
}

const ReminderSettingsDialog: React.FC<ReminderSettingsDialogProps> = ({
  open,
  medicationName,
  currentEnabled,
  currentTimes,
  onClose,
  onSave,
  isLoading,
}) => {
  const [enabled, setEnabled] = useState(currentEnabled);
  const [times, setTimes] = useState<string[]>(currentTimes);

  const handleAddTime = () => {
    setTimes([...times, '08:00']);
  };

  const handleRemoveTime = (index: number) => {
    setTimes(times.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSave = async () => {
    await onSave(enabled, times);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Paramètres de rappel - {medicationName}</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
          label="Activer les rappels"
          sx={{ display: 'block', mb: 2 }}
        />

        {enabled && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Heures de rappel
            </Typography>
            {times.map((time, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(index, e.target.value)}
                  size="small"
                  inputProps={{ step: 300 }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemoveTime(index)}
                  disabled={times.length === 1}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button size="small" onClick={handleAddTime} sx={{ mt: 1 }}>
              Ajouter une heure
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading}>
          {isLoading ? <CircularProgress size={20} /> : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Main medication reminders component
 */
export const MedicationReminders: React.FC<MedicationRemindersProps> = ({ patientId }) => {
  const [settingsDialog, setSettingsDialog] = useState<{
    open: boolean;
    reminderId?: string;
  }>({ open: false });
  const [settingsSaving, setSettingsSaving] = useState(false);

  const { reminders, isLoading, error, clearError, updateReminderSettings } =
    useAdherence({
      patientId,
    });

  const handleOpenSettings = (reminderId: string) => {
    setSettingsDialog({ open: true, reminderId });
  };

  const handleCloseSettings = () => {
    setSettingsDialog({ open: false });
  };

  const handleSaveSettings = async (enabled: boolean, times: string[]) => {
    if (!settingsDialog.reminderId) return;

    try {
      setSettingsSaving(true);
      await updateReminderSettings(settingsDialog.reminderId, enabled, times);
    } finally {
      setSettingsSaving(false);
    }
  };

  const currentReminder = settingsDialog.reminderId
    ? reminders.find((r) => r.id === settingsDialog.reminderId)
    : undefined;

  if (isLoading && reminders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Rappels de médicaments"
          subheader={`${reminders.length} rappels configurés`}
        />
        <CardContent>
          {reminders.length > 0 ? (
            <List>
              {reminders.map((reminder) => (
                <ListItem
                  key={reminder.id}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        edge="end"
                        aria-label="settings"
                        onClick={() => handleOpenSettings(reminder.id)}
                        title="Paramètres"
                      >
                        <SettingsIcon />
                      </IconButton>
                    </Box>
                  }
                  sx={{ borderBottom: '1px solid #eee', pb: 2 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <MedicationIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={reminder.medicationName}
                    secondary={
                      <Box component="span" sx={{ display: 'block' }}>
                        <Typography variant="body2" color="textSecondary">
                          {reminder.dosage} - {reminder.frequency}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {reminder.reminderTimes.map((time, idx) => (
                            <Chip
                              key={idx}
                              icon={<ScheduleIcon />}
                              label={time}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                        {!reminder.notificationEnabled && (
                          <Chip
                            label="Rappels désactivés"
                            size="small"
                            color="warning"
                            variant="filled"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">Aucun rappel configuré pour le moment.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      {currentReminder && (
        <ReminderSettingsDialog
          open={settingsDialog.open && settingsDialog.reminderId === currentReminder.id}
          reminderId={currentReminder.id}
          medicationName={currentReminder.medicationName}
          currentEnabled={currentReminder.notificationEnabled}
          currentTimes={currentReminder.reminderTimes}
          onClose={handleCloseSettings}
          onSave={handleSaveSettings}
          isLoading={settingsSaving}
        />
      )}
    </>
  );
};

export default MedicationReminders;
