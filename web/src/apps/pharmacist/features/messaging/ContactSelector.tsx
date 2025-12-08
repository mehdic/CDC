/**
 * ContactSelector Component
 * Allows selection of patients/professionals for new conversations
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Box,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useFetchList } from '@shared/hooks/useApi';

export interface ContactOption {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email?: string;
  phone?: string;
  type: 'patient' | 'professional';
}

interface ContactSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contact: ContactOption) => void;
  selectedContacts?: string[];
  multiSelect?: boolean;
  contactType?: 'patient' | 'professional' | 'all';
}

export const ContactSelector: React.FC<ContactSelectorProps> = ({
  open,
  onClose,
  onSelect,
  selectedContacts = [],
  multiSelect = false,
  contactType = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<string[]>(selectedContacts);

  // Fetch patients and professionals (simplified - would need actual endpoints)
  const { data: patients = [], isLoading: patientsLoading } = useFetchList<ContactOption[]>(
    'patients',
    { limit: 100 },
    { enabled: open && (contactType === 'patient' || contactType === 'all') }
  );

  const { data: professionals = [], isLoading: professionalsLoading } = useFetchList<
    ContactOption[]
  >('professionals', { limit: 100 }, {
    enabled: open && (contactType === 'professional' || contactType === 'all'),
  });

  const allContacts = useMemo(() => {
    const contacts = [...(patients || []), ...(professionals || [])];
    if (!searchQuery) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.includes(query)
    );
  }, [patients, professionals, searchQuery]);

  const isLoading = patientsLoading || professionalsLoading;

  const handleSelect = (contact: ContactOption) => {
    if (multiSelect) {
      setSelected((prev) =>
        prev.includes(contact.id) ? prev.filter((id) => id !== contact.id) : [...prev, contact.id]
      );
    } else {
      onSelect(contact);
      handleClose();
    }
  };

  const handleConfirm = () => {
    const selectedContactsList = allContacts.filter((c) => selected.includes(c.id));
    selectedContactsList.forEach((contact) => onSelect(contact));
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelected([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="contact-selector-dialog"
    >
      <DialogTitle>
        {multiSelect ? 'Sélectionner les contacts' : 'Sélectionner un contact'}
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Search Field */}
          <TextField
            fullWidth
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
            size="small"
            data-testid="contact-search-input"
          />

          {/* Selected Chips */}
          {multiSelect && selected.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {selected.map((contactId) => {
                const contact = allContacts.find((c) => c.id === contactId);
                return (
                  contact && (
                    <Chip
                      key={contactId}
                      label={contact.name}
                      onDelete={() => setSelected((prev) => prev.filter((id) => id !== contactId))}
                      size="small"
                    />
                  )
                );
              })}
            </Stack>
          )}

          {/* Contacts List */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : allContacts.length === 0 ? (
            <Typography color="textSecondary" align="center" py={3}>
              Aucun contact trouvé
            </Typography>
          ) : (
            <List
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                maxHeight: 400,
                overflow: 'auto',
              }}
            >
              {allContacts.map((contact) => (
                <ListItem
                  key={contact.id}
                  disablePadding
                  data-testid={`contact-item-${contact.id}`}
                >
                  <ListItemButton
                    onClick={() => handleSelect(contact)}
                    selected={selected.includes(contact.id)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={contact.avatar}
                        sx={{
                          bgcolor: contact.type === 'patient' ? 'primary.main' : 'secondary.main',
                        }}
                      >
                        {contact.type === 'patient' ? <PersonIcon /> : <GroupIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.name}
                      secondary={contact.email || contact.phone}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        {multiSelect && <Button onClick={handleConfirm} variant="contained">
          Confirmer ({selected.length})
        </Button>}
      </DialogActions>
    </Dialog>
  );
};
