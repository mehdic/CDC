/**
 * Medication Order Form Component (T4-004)
 * Form for creating medication orders with drug selection,
 * dosage input, urgency level, and notes
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { createMedicationOrder } from '../services/nurseApi';
import { usePatient } from '../hooks/usePatients';
import type { OrderMedication } from '../types/nurse';

// Mock drug database for autocomplete
const COMMON_DRUGS = [
  'Paracétamol',
  'Ibuprofène',
  'Amoxicilline',
  'Aspirine',
  'Oméprazole',
  'Metformine',
  'Atorvastatine',
  'Lisinopril',
  'Levothyroxine',
  'Amlodipine',
];

export const MedicationOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  const { patient } = usePatient(patientIdParam || undefined);

  const [patientId, setPatientId] = useState(patientIdParam || '');
  const [pharmacyId, setPharmacyId] = useState('');
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState<OrderMedication[]>([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [newMed, setNewMed] = useState<OrderMedication>({
    drugName: '',
    dosage: '',
    quantity: 1,
    instructions: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleOpenDialog = () => {
    setNewMed({
      drugName: '',
      dosage: '',
      quantity: 1,
      instructions: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddMedication = () => {
    if (!newMed.drugName || !newMed.dosage || newMed.quantity <= 0) {
      setError('Veuillez remplir tous les champs du médicament');
      return;
    }

    setMedications([...medications, newMed]);
    handleCloseDialog();
    setError(null);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!patientId || !pharmacyId || medications.length === 0) {
      setError('Veuillez sélectionner un patient, une pharmacie et ajouter au moins un médicament');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createMedicationOrder({
        patientId,
        medications,
        urgency,
        pharmacyId,
        notes,
      });

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate('/nurse/orders');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de création de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/nurse/orders')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4">Nouvelle commande de médicaments</Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Commande créée avec succès ! Redirection...
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Patient Info */}
        {patient && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Patient: {patient.firstName} {patient.lastName} &bull; Chambre {patient.room}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Patient Selection */}
          <Grid item xs={12} md={6}>
            <TextField
              label="ID Patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              fullWidth
              required
              disabled={!!patientIdParam || submitting}
            />
          </Grid>

          {/* Pharmacy Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Pharmacie</InputLabel>
              <Select
                value={pharmacyId}
                label="Pharmacie"
                onChange={(e) => setPharmacyId(e.target.value)}
                disabled={submitting}
              >
                <MenuItem value="pharmacy-1">Pharmacie Centrale</MenuItem>
                <MenuItem value="pharmacy-2">Pharmacie du Centre</MenuItem>
                <MenuItem value="pharmacy-3">Pharmacie de l&apos;Hôpital</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Urgency Level */}
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Niveau d&apos;urgence</InputLabel>
              <Select
                value={urgency}
                label="Niveau d'urgence"
                onChange={(e) => setUrgency(e.target.value as 'routine' | 'urgent' | 'stat')}
                disabled={submitting}
              >
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="stat">STAT (Immédiat)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Medications Section */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Médicaments</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                disabled={submitting}
              >
                Ajouter
              </Button>
            </Box>

            {medications.length === 0 ? (
              <Alert severity="warning">Aucun médicament ajouté</Alert>
            ) : (
              <List>
                {medications.map((med, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveMedication(index)}
                        disabled={submitting}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={`${med.drugName} - ${med.dosage}`}
                      secondary={`Quantité: ${med.quantity} | ${med.instructions}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              label="Notes additionnelles"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions spéciales pour la pharmacie"
              multiline
              rows={3}
              fullWidth
              disabled={submitting}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/nurse/orders')}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={submitting || medications.length === 0}
              >
                {submitting ? 'Envoi...' : 'Envoyer la commande'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Add Medication Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un médicament</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Autocomplete
            options={COMMON_DRUGS}
            freeSolo
            value={newMed.drugName}
            onChange={(_, value) => setNewMed({ ...newMed, drugName: value || '' })}
            renderInput={(params) => (
              <TextField {...params} label="Nom du médicament" required sx={{ mb: 2 }} />
            )}
          />

          <TextField
            label="Dosage"
            value={newMed.dosage}
            onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
            placeholder="ex: 500mg, 10ml"
            fullWidth
            required
            sx={{ mb: 2 }}
          />

          <TextField
            label="Quantité"
            type="number"
            value={newMed.quantity}
            onChange={(e) =>
              setNewMed({ ...newMed, quantity: parseInt(e.target.value) || 1 })
            }
            fullWidth
            required
            sx={{ mb: 2 }}
            inputProps={{ min: 1 }}
          />

          <TextField
            label="Instructions"
            value={newMed.instructions}
            onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
            placeholder="ex: Prendre 2 fois par jour avec nourriture"
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleAddMedication} variant="contained">
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MedicationOrderForm;
