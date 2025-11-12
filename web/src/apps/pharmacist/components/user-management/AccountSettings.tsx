/**
 * AccountSettings Component
 *
 * Account settings form
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';

interface AccountSettingsProps {
  onSave: (settings: any) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onSave }) => {
  const [pharmacyName, setPharmacyName] = useState('Pharmacie Centrale Genève');
  const [phone, setPhone] = useState('+41 22 123 45 67');
  const [email, setEmail] = useState('contact@pharmacie.ch');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave({
      'Nom de la pharmacie': pharmacyName,
      'Téléphone': phone,
      'Email': email,
    });

    // Show success toast
    const successToast = document.createElement('div');
    successToast.setAttribute('data-testid', 'success-toast');
    successToast.style.cssText = 'position:fixed;top:20px;right:20px;background:#4caf50;color:white;padding:16px;border-radius:4px;z-index:9999';
    successToast.textContent = 'Paramètres sauvegardés avec succès';
    document.body.appendChild(successToast);
    setTimeout(() => successToast.remove(), 3000);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Paramètres sauvegardés avec succès
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
        <TextField
          label="Nom de la pharmacie"
          value={pharmacyName}
          onChange={(e) => setPharmacyName(e.target.value)}
          fullWidth
        />

        <TextField
          label="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
        />

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />

        <Button variant="contained" onClick={handleSave}>
          Enregistrer
        </Button>
      </Box>
    </Box>
  );
};
