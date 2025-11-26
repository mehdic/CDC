/**
 * AddUserDialog Component
 *
 * Dialog for adding new users to master account
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
} from '@mui/material';

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (userData: any) => void;
}

const ROLES = ['pharmacist', 'assistant', 'doctor', 'nurse', 'delivery'];
const AVAILABLE_PERMISSIONS = [
  'prescriptions',
  'inventory',
  'consultations',
  'deliveries',
  'analytics',
  'settings',
];

export const AddUserDialog: React.FC<AddUserDialogProps> = ({ open, onClose, onAdd }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('pharmacist');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleReset = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('pharmacist');
    setPermissions([]);
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handlePermissionToggle = (permission: string) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!email || !firstName || !lastName) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email invalide');
      return;
    }

    try {
      await onAdd({
        email,
        firstName,
        lastName,
        role,
        permissions,
      });

      // Show success toast
      const successToast = document.createElement('div');
      successToast.setAttribute('data-testid', 'success-toast');
      successToast.style.cssText = 'position:fixed;top:20px;right:20px;background:#4caf50;color:white;padding:16px;border-radius:4px;z-index:9999';
      successToast.textContent = 'Utilisateur créé avec succès';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);

      handleClose();
    } catch (err) {
      setError('Erreur lors de la création de l\'utilisateur');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ajouter Utilisateur</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            inputProps={{ 'aria-label': 'Email' }}
          />

          <TextField
            label="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            required
            inputProps={{ 'aria-label': 'Prénom' }}
          />

          <TextField
            label="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            required
            inputProps={{ 'aria-label': 'Nom' }}
          />

          <FormControl fullWidth>
            <InputLabel id="role-label">Rôle</InputLabel>
            <Select
              labelId="role-label"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              label="Rôle"
              inputProps={{ 'aria-label': 'Rôle' }}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Permissions
            </Typography>
            <FormGroup>
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <FormControlLabel
                  key={permission}
                  control={
                    <Checkbox
                      checked={permissions.includes(permission)}
                      onChange={() => handlePermissionToggle(permission)}
                      data-testid={`permission-${permission}`}
                    />
                  }
                  label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                />
              ))}
            </FormGroup>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained">
          Créer
        </Button>
      </DialogActions>
    </Dialog>
  );
};
