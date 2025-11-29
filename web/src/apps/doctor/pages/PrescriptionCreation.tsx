/**
 * Prescription Creation Page
 * Doctor creates new prescriptions with patient, medications, and pharmacy selection
 * Task: T3-100 - Complete doctor prescription creation
 */

import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
} from '@mui/icons-material';

// ============================================================================
// Types
// ============================================================================

interface Medication {
  drugName: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

interface PrescriptionFormState {
  patientId: string;
  patientName: string;
  pharmacyId: string;
  pharmacyName: string;
  medications: Medication[];
  notes?: string;
}

// ============================================================================
// Component
// ============================================================================

export const PrescriptionCreation: React.FC = () => {
  // State for prescription form
  const [form, setForm] = useState<PrescriptionFormState>({
    patientId: '',
    patientName: '',
    pharmacyId: '',
    pharmacyName: '',
    medications: [],
    notes: '',
  });

  // State for medication dialog
  const [openMedDialog, setOpenMedDialog] = useState(false);
  const [newMedication, setNewMedication] = useState<Medication>({
    drugName: '',
    dosage: '',
    quantity: 1,
    instructions: '',
  });

  // State for submission
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle medication add dialog open
  const handleOpenMedDialog = () => {
    setNewMedication({
      drugName: '',
      dosage: '',
      quantity: 1,
      instructions: '',
    });
    setOpenMedDialog(true);
  };

  // Handle medication add dialog close
  const handleCloseMedDialog = () => {
    setOpenMedDialog(false);
  };

  // Add medication to list
  const handleAddMedication = () => {
    if (!newMedication.drugName || !newMedication.dosage || newMedication.quantity <= 0) {
      setError('Please fill all medication fields with valid values');
      return;
    }

    setForm({
      ...form,
      medications: [...form.medications, newMedication],
    });

    handleCloseMedDialog();
    setError(null);
  };

  // Remove medication from list
  const handleRemoveMedication = (index: number) => {
    setForm({
      ...form,
      medications: form.medications.filter((_, i) => i !== index),
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!form.patientId || !form.pharmacyId || form.medications.length === 0) {
      setError('Please select a patient, pharmacy, and add at least one medication');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call backend API
      const response = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          patientId: form.patientId,
          doctorId: localStorage.getItem('doctorId'),
          pharmacyId: form.pharmacyId,
          medications: form.medications,
          notes: form.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create prescription');
      }

      setSuccess(true);
      // Reset form
      setForm({
        patientId: '',
        patientName: '',
        pharmacyId: '',
        pharmacyName: '',
        medications: [],
        notes: '',
      });

      // Redirect after success
      setTimeout(() => {
        window.location.href = '/doctor/prescriptions';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Prescription
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Prescription created successfully! Redirecting...
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          {/* Patient Selection */}
          <TextField
            label="Patient Name"
            value={form.patientName}
            onChange={(e) => {
              setForm({ ...form, patientName: e.target.value, patientId: e.target.value });
            }}
            placeholder="Select or enter patient"
            fullWidth
            disabled={isLoading}
          />

          {/* Pharmacy Selection */}
          <TextField
            label="Pharmacy"
            value={form.pharmacyName}
            onChange={(e) => {
              setForm({ ...form, pharmacyName: e.target.value, pharmacyId: e.target.value });
            }}
            placeholder="Select pharmacy"
            fullWidth
            disabled={isLoading}
          />
        </Box>

        {/* Medications Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Medications</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenMedDialog}
              disabled={isLoading}
            >
              Add Medication
            </Button>
          </Box>

          {form.medications.length === 0 ? (
            <Typography color="textSecondary">No medications added yet</Typography>
          ) : (
            <List>
              {form.medications.map((med, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveMedication(index)}
                      disabled={isLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${med.drugName} - ${med.dosage}`}
                    secondary={`Quantity: ${med.quantity} | ${med.instructions}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Notes Section */}
        <TextField
          label="Additional Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Any special instructions or notes for the pharmacist"
          multiline
          rows={3}
          fullWidth
          disabled={isLoading}
          sx={{ mb: 3 }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={isLoading || form.medications.length === 0}
          >
            {isLoading ? 'Creating...' : 'Create & Send to Pharmacy'}
          </Button>
        </Box>
      </Paper>

      {/* Medication Dialog */}
      <Dialog open={openMedDialog} onClose={handleCloseMedDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Medication</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Drug Name"
            value={newMedication.drugName}
            onChange={(e) =>
              setNewMedication({ ...newMedication, drugName: e.target.value })
            }
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Dosage"
            value={newMedication.dosage}
            onChange={(e) =>
              setNewMedication({ ...newMedication, dosage: e.target.value })
            }
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Quantity"
            type="number"
            value={newMedication.quantity}
            onChange={(e) =>
              setNewMedication({
                ...newMedication,
                quantity: parseInt(e.target.value) || 1,
              })
            }
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Instructions"
            value={newMedication.instructions}
            onChange={(e) =>
              setNewMedication({
                ...newMedication,
                instructions: e.target.value,
              })
            }
            placeholder="e.g., Take twice daily with food"
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMedDialog}>Cancel</Button>
          <Button onClick={handleAddMedication} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PrescriptionCreation;
