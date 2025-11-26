/**
 * UserList Component
 *
 * Displays list of users under master account with permissions management
 */

import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Badge,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
}

interface UserListProps {
  users: User[];
  onUpdatePermissions: (userId: string, permissions: string[]) => void;
}

const AVAILABLE_PERMISSIONS = [
  'prescriptions',
  'inventory',
  'consultations',
  'deliveries',
  'analytics',
  'settings',
];

export const UserList: React.FC<UserListProps> = ({ users, onUpdatePermissions }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setSelectedPermissions(user.permissions || []);
  };

  const handleCloseDialog = () => {
    setEditingUser(null);
    setSelectedPermissions([]);
  };

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSavePermissions = () => {
    if (editingUser) {
      onUpdatePermissions(editingUser.id, selectedPermissions);
      handleCloseDialog();
    }
  };

  return (
    <Box data-testid="user-list">
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} data-testid={`user-${user.id}`}>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge badgeContent={user.role} color="primary" data-testid="role-badge">
                    <Chip label={user.role} size="small" color="default" />
                  </Badge>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {user.permissions && user.permissions.length > 0 ? (
                      user.permissions.map((perm) => (
                        <Chip
                          key={perm}
                          label={perm}
                          size="small"
                          variant="outlined"
                          data-testid={`permission-${perm}`}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aucune permission
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleEditClick(user)}
                    aria-label="Modifier permissions"
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Aucun utilisateur
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editingUser} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier Permissions</DialogTitle>
        <DialogContent>
          {editingUser && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {editingUser.firstName} {editingUser.lastName} ({editingUser.email})
              </Typography>
              <FormGroup>
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <FormControlLabel
                    key={permission}
                    control={
                      <Checkbox
                        checked={selectedPermissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                        data-testid={`permission-${permission}`}
                      />
                    }
                    label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                  />
                ))}
              </FormGroup>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSavePermissions} variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
