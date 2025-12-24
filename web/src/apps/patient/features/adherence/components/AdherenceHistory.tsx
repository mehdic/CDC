/**
 * Adherence History Component
 * Displays medication adherence history with ability to log adherence
 * T8-043: Patient Adherence Tracking
 */

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAdherence } from '../hooks/useAdherence';

interface AdherenceHistoryProps {
  patientId: string;
}

interface LogAdherenceDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (medicationId: string, status: 'taken' | 'missed', notes?: string) => Promise<void>;
  isLoading: boolean;
  medications: Array<{ id: string; medicationName: string }>;
}

const LogAdherenceDialog: React.FC<LogAdherenceDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  medications,
}) => {
  const [medicationId, setMedicationId] = useState('');
  const [status, setStatus] = useState<'taken' | 'missed'>('taken');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!medicationId) {
      alert('Veuillez sélectionner un médicament');
      return;
    }

    try {
      await onSubmit(medicationId, status, notes);
      setMedicationId('');
      setStatus('taken');
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Error logging adherence:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Enregistrer une prise de médicament</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Médicament</InputLabel>
          <Select
            value={medicationId}
            onChange={(e) => setMedicationId(e.target.value)}
            label="Médicament"
          >
            {medications.map((med) => (
              <MenuItem key={med.id} value={med.id}>
                {med.medicationName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Statut
        </Typography>
        <RadioGroup
          value={status}
          onChange={(e) => setStatus(e.target.value as 'taken' | 'missed')}
          sx={{ mb: 2 }}
        >
          <FormControlLabel value="taken" control={<Radio />} label="Prise" />
          <FormControlLabel value="missed" control={<Radio />} label="Oubliée" />
        </RadioGroup>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Notes (optionnel)"
          placeholder="Ajoutez des notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isLoading || !medicationId}>
          {isLoading ? <CircularProgress size={20} /> : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Main adherence history component
 */
export const AdherenceHistory: React.FC<AdherenceHistoryProps> = ({ patientId }) => {
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [isLoggingAdherence, setIsLoggingAdherence] = useState(false);

  const { history, medications, isLoading, error, clearError, logAdherence } = useAdherence({
    patientId,
  });

  const handleLogAdherenceSubmit = async (
    medicationId: string,
    status: 'taken' | 'missed',
    notes?: string
  ) => {
    try {
      setIsLoggingAdherence(true);
      await logAdherence(medicationId, status, notes);
      setLogDialogOpen(false);
    } finally {
      setIsLoggingAdherence(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'taken':
        return 'success';
      case 'missed':
        return 'error';
      case 'scheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircleIcon />;
      case 'missed':
        return <CancelIcon />;
      case 'scheduled':
        return <ScheduleIcon />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'taken':
        return 'Prise';
      case 'missed':
        return 'Oubliée';
      case 'scheduled':
        return 'Programmée';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  if (isLoading && history.length === 0) {
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
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => setLogDialogOpen(true)}
        >
          Enregistrer une prise
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Médicament</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Heure programmée</TableCell>
              <TableCell>Heure réelle</TableCell>
              <TableCell align="center">Statut</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.length > 0 ? (
              history.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{entry.medicationName}</TableCell>
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString('fr-CH')}
                  </TableCell>
                  <TableCell>{entry.scheduledTime}</TableCell>
                  <TableCell>
                    {entry.actualTime || (entry.status === 'pending' ? '-' : 'N/A')}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={getStatusIcon(entry.status)}
                      label={getStatusLabel(entry.status)}
                      color={getStatusColor(entry.status)}
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {entry.notes || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Alert severity="info" sx={{ display: 'inline-block' }}>
                    Aucun enregistrement d'adhésion trouvé. Commencez à enregistrer vos prises de
                    médicaments!
                  </Alert>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <LogAdherenceDialog
        open={logDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        onSubmit={handleLogAdherenceSubmit}
        isLoading={isLoggingAdherence}
        medications={medications}
      />
    </>
  );
};

export default AdherenceHistory;
