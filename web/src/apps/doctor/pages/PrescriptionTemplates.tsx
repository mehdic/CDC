/**
 * Prescription Templates Page
 * Doctor manages prescription templates for quick reuse
 * Task: T3-102 - Implement prescription templates
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Button,
  Box,
  Typography,
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
  TextField,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FileCopy as FileCopyIcon,
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

interface Template {
  id: string;
  doctorId: string;
  name: string;
  description?: string;
  medications: Medication[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Component
// ============================================================================

export const PrescriptionTemplates: React.FC = () => {
  // State for templates list
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for create/edit dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    medications: [] as Medication[],
  });

  // State for new medication in dialog
  const [newMedication, setNewMedication] = useState<Medication>({
    drugName: '',
    dosage: '',
    quantity: 1,
    instructions: '',
  });

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load templates from API
  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const doctorId = localStorage.getItem('doctorId');
      const response = await fetch(`/api/doctor/templates/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create template
  const handleOpenCreateDialog = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      medications: [],
    });
    setNewMedication({
      drugName: '',
      dosage: '',
      quantity: 1,
      instructions: '',
    });
    setOpenDialog(true);
  };

  // Handle edit template
  const handleOpenEditDialog = (template: Template) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      description: template.description || '',
      medications: template.medications,
    });
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Add medication to form
  const handleAddMedication = () => {
    if (!newMedication.drugName || !newMedication.dosage) {
      setError('Please fill all medication fields');
      return;
    }

    setFormData({
      ...formData,
      medications: [...formData.medications, newMedication],
    });

    setNewMedication({
      drugName: '',
      dosage: '',
      quantity: 1,
      instructions: '',
    });
  };

  // Remove medication from form
  const handleRemoveMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    });
  };

  // Save template
  const handleSaveTemplate = async () => {
    if (!formData.name || formData.medications.length === 0) {
      setError('Please enter a template name and add at least one medication');
      return;
    }

    try {
      const doctorId = localStorage.getItem('doctorId');
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/doctor/templates/${doctorId}/${editingId}`
        : '/api/doctor/templates';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          doctorId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save template');
      }

      setError(null);
      handleCloseDialog();
      loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const doctorId = localStorage.getItem('doctorId');
      const response = await fetch(`/api/doctor/templates/${doctorId}/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      setError(null);
      loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Use template to create prescription
  const handleUseTemplate = (template: Template) => {
    // Store template in session storage for quick-fill
    sessionStorage.setItem('prescriptionTemplate', JSON.stringify(template));
    window.location.href = '/doctor/prescriptions/create?templateId=' + template.id;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Prescription Templates</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            disabled={isLoading}
          >
            Create Template
          </Button>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Templates Table */}
        {!isLoading && templates.length > 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Medications</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{template.name}</TableCell>
                    <TableCell>{template.description || '-'}</TableCell>
                    <TableCell align="center">{template.medications.length}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        title="Use Template"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <FileCopyIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Edit"
                        onClick={() => handleOpenEditDialog(template)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        title="Delete"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Empty State */}
        {!isLoading && templates.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="textSecondary" sx={{ mb: 2 }}>
              No templates yet. Create your first template to save time on repeated prescriptions.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              Create First Template
            </Button>
          </Box>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Template Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            multiline
            rows={2}
            fullWidth
            sx={{ mb: 3 }}
          />

          {/* Medications List */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Medications ({formData.medications.length})
          </Typography>

          {formData.medications.length > 0 && (
            <List sx={{ mb: 2, border: '1px solid #eee', borderRadius: 1 }}>
              {formData.medications.map((med, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleRemoveMedication(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${med.drugName} - ${med.dosage}`}
                    secondary={`Qty: ${med.quantity} | ${med.instructions}`}
                  />
                </ListItem>
              ))}
            </List>
          )}

          {/* Add Medication Fields */}
          <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
              Add Medication
            </Typography>
            <TextField
              label="Drug Name"
              value={newMedication.drugName}
              onChange={(e) =>
                setNewMedication({ ...newMedication, drugName: e.target.value })
              }
              size="small"
              fullWidth
              sx={{ mb: 1 }}
            />
            <TextField
              label="Dosage"
              value={newMedication.dosage}
              onChange={(e) =>
                setNewMedication({ ...newMedication, dosage: e.target.value })
              }
              size="small"
              fullWidth
              sx={{ mb: 1 }}
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
              size="small"
              fullWidth
              sx={{ mb: 1 }}
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
              size="small"
              fullWidth
              sx={{ mb: 1 }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddMedication}
              fullWidth
            >
              Add to Template
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            disabled={formData.medications.length === 0}
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PrescriptionTemplates;
