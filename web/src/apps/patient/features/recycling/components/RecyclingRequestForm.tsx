/**
 * Recycling Request Form Component
 * Patient form to submit unused medications for recycling
 * T5-052: Medication Return/Recycling Feature
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Medication, RecyclingRequest } from '../types/recycling.types';
import { createRecyclingRequest } from '../services/recyclingApi';

interface RecyclingRequestFormProps {
  patientId: string;
  pharmacyId: string;
  onSuccess?: (request: RecyclingRequest) => void;
  isLoading?: boolean;
}

interface MedicationFormData extends Medication {
  id: string;
}

export const RecyclingRequestForm: React.FC<RecyclingRequestFormProps> = ({
  patientId,
  pharmacyId,
  onSuccess,
  isLoading: externalLoading = false,
}) => {
  const [medications, setMedications] = useState<MedicationFormData[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [openMedicationDialog, setOpenMedicationDialog] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationFormData | null>(null);

  // Medication form fields
  const [medicationName, setMedicationName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('tablets');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [storageConditions, setStorageConditions] = useState('');

  const resetMedicationForm = () => {
    setMedicationName('');
    setQuantity('');
    setUnit('tablets');
    setExpiryDate('');
    setBatchNumber('');
    setStorageConditions('');
    setEditingMedication(null);
  };

  const handleOpenMedicationDialog = (med?: MedicationFormData) => {
    if (med) {
      setEditingMedication(med);
      setMedicationName(med.name);
      setQuantity(med.quantity.toString());
      setUnit(med.unit);
      setExpiryDate(med.expiryDate);
      setBatchNumber(med.batchNumber || '');
      setStorageConditions(med.storageConditions || '');
    } else {
      resetMedicationForm();
    }
    setOpenMedicationDialog(true);
  };

  const handleCloseMedicationDialog = () => {
    setOpenMedicationDialog(false);
    resetMedicationForm();
  };

  const handleAddMedication = () => {
    if (!medicationName.trim() || !quantity || !expiryDate) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const newMedication: MedicationFormData = {
      id: editingMedication?.id || `med-${Date.now()}`,
      name: medicationName.trim(),
      quantity: parseInt(quantity),
      unit,
      expiryDate,
      batchNumber: batchNumber || undefined,
      storageConditions: storageConditions || undefined,
    };

    if (editingMedication) {
      // Update existing medication
      setMedications(medications.map((m) => (m.id === editingMedication.id ? newMedication : m)));
    } else {
      // Add new medication
      setMedications([...medications, newMedication]);
    }

    handleCloseMedicationDialog();
    setError(null);
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (medications.length === 0) {
      setError('Veuillez ajouter au moins un médicament');
      return;
    }

    try {
      setIsLoading(true);
      const { id, ...medicationsWithoutId } = medications[0];
      const medicationsData = medications.map(({ id: _, ...med }) => med);

      const request = await createRecyclingRequest({
        patientId,
        pharmacyId,
        medications: medicationsData,
        notes: notes || undefined,
      });

      setSuccess(true);
      setMedications([]);
      setNotes('');

      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) {
          onSuccess(request);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission du formulaire');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = medications.length > 0;

  return (
    <>
      <Card>
        <CardHeader
          title="Recycler vos médicaments"
          subheader="Remplissez le formulaire ci-dessous pour soumettre vos médicaments non utilisés"
        />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                severity="success"
                icon={<CheckCircleIcon />}
                sx={{ mb: 2 }}
              >
                Demande de recyclage créée avec succès! Nous vous contacterons bientôt.
              </Alert>
            )}

            {/* Medications Table */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Médicaments à recycler
              </Typography>
              {medications.length > 0 ? (
                <TableContainer sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell>Nom</TableCell>
                        <TableCell align="right">Quantité</TableCell>
                        <TableCell>Date d'expiration</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {medications.map((med) => (
                        <TableRow key={med.id}>
                          <TableCell>{med.name}</TableCell>
                          <TableCell align="right">
                            {med.quantity} {med.unit}
                          </TableCell>
                          <TableCell>
                            {new Date(med.expiryDate).toLocaleDateString('fr-CH')}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenMedicationDialog(med)}
                              title="Modifier"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveMedication(med.id)}
                              title="Supprimer"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Aucun médicament ajouté. Cliquez sur le bouton ci-dessous pour en ajouter.
                </Alert>
              )}
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleOpenMedicationDialog()}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                Ajouter un médicament
              </Button>
            </Box>

            {/* Notes */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes supplémentaires (optionnel)"
              placeholder="Ajoutez des informations supplémentaires sur les médicaments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading || externalLoading}
              sx={{ mb: 2 }}
            />

            {/* Submit Button */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!isFormValid || isLoading || externalLoading}
                sx={{ minWidth: 200 }}
              >
                {isLoading || externalLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Envoi en cours...
                  </>
                ) : (
                  'Soumettre la demande'
                )}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Medication Dialog */}
      <Dialog
        open={openMedicationDialog}
        onClose={handleCloseMedicationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingMedication ? 'Modifier le médicament' : 'Ajouter un médicament'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du médicament"
                placeholder="ex: Paracétamol"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantité"
                inputProps={{ min: '1' }}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Unité</InputLabel>
                <Select value={unit} onChange={(e) => setUnit(e.target.value)} label="Unité">
                  <MenuItem value="tablets">Comprimés</MenuItem>
                  <MenuItem value="capsules">Gélules</MenuItem>
                  <MenuItem value="ml">ml</MenuItem>
                  <MenuItem value="g">g</MenuItem>
                  <MenuItem value="boxes">Boîtes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Date d'expiration"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Numéro de lot (optionnel)"
                placeholder="ex: ABC123"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Conditions de stockage (optionnel)"
                placeholder="ex: À température ambiante"
                value={storageConditions}
                onChange={(e) => setStorageConditions(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseMedicationDialog}>Annuler</Button>
          <Button
            onClick={handleAddMedication}
            variant="contained"
          >
            {editingMedication ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecyclingRequestForm;
