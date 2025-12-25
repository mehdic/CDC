/**
 * User Management Component
 * CRUD interface for managing all 5 user types
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
  Tooltip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '../hooks/useAdmin';
import type {
  PlatformUser,
  CreateUserPayload,
  UpdateUserPayload,
  UserType,
  UserStatus,
} from '../types/admin.types';
import { USER_TYPE_LABELS, USER_STATUS_LABELS } from '../types/admin.types';

/**
 * Get color for user status chip
 */
const getStatusColor = (status: UserStatus): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'default';
    case 'suspended':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};

/**
 * Get color for user type chip
 */
const getUserTypeColor = (
  type: UserType
): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' => {
  switch (type) {
    case 'admin':
      return 'error';
    case 'pharmacist':
      return 'primary';
    case 'doctor':
      return 'secondary';
    case 'nurse':
      return 'success';
    case 'patient':
      return 'info';
    case 'delivery_person':
      return 'warning';
    default:
      return 'primary';
  }
};

/**
 * Default permissions by user type
 */
const DEFAULT_PERMISSIONS: Record<UserType, string[]> = {
  admin: ['all'],
  pharmacist: ['prescriptions', 'inventory', 'consultations', 'deliveries', 'analytics', 'settings'],
  doctor: ['consultations', 'prescriptions', 'messages'],
  nurse: ['inventory', 'deliveries', 'consultations', 'messages'],
  patient: ['orders', 'consultations', 'messages', 'profile'],
  delivery_person: ['deliveries', 'messages'],
};

export const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<UserType | ''>('');
  const [filterStatus, setFilterStatus] = useState<UserStatus | ''>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [formData, setFormData] = useState<CreateUserPayload>({
    email: '',
    firstName: '',
    lastName: '',
    userType: 'patient',
    permissions: [],
  });

  const {
    data: users = [],
    isLoading,
    error,
    refetch,
  } = useUsers({
    userType: filterType || undefined,
    status: filterStatus || undefined,
    search: searchTerm || undefined,
  });

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Filter users client-side for better UX
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || user.userType === filterType;
    const matchesStatus = !filterStatus || user.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      userType: 'patient',
      permissions: DEFAULT_PERMISSIONS.patient,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: PlatformUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      permissions: user.permissions,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (user: PlatformUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      userType: 'patient',
      permissions: [],
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleUserTypeChange = (type: UserType) => {
    setFormData({
      ...formData,
      userType: type,
      permissions: DEFAULT_PERMISSIONS[type],
    });
  };

  const handleSave = async () => {
    try {
      if (selectedUser) {
        const updateData: UpdateUserPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          permissions: formData.permissions,
        };
        await updateUserMutation.mutateAsync({
          userId: selectedUser.id,
          userData: updateData,
        });
      } else {
        await createUserMutation.mutateAsync(formData);
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save user:', err);
    }
  };

  const handleDelete = async () => {
    if (selectedUser) {
      try {
        await deleteUserMutation.mutateAsync(selectedUser.id);
        handleCloseDeleteDialog();
      } catch (err) {
        console.error('Failed to delete user:', err);
      }
    }
  };

  return (
    <Card data-testid="user-management">
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Gestion des Utilisateurs
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Actualiser
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Ajouter
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            size="small"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
            data-testid="search-input"
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value as UserType | '')}
              data-testid="filter-type"
            >
              <MenuItem value="">Tous</MenuItem>
              {Object.entries(USER_TYPE_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={filterStatus}
              label="Statut"
              onChange={(e) => setFilterStatus(e.target.value as UserStatus | '')}
              data-testid="filter-status"
            >
              <MenuItem value="">Tous</MenuItem>
              {Object.entries(USER_STATUS_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Erreur lors du chargement des utilisateurs
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Users Table */}
        {!isLoading && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>MFA</TableCell>
                  <TableCell>Derniere connexion</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {user.firstName} {user.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={USER_TYPE_LABELS[user.userType]}
                        color={getUserTypeColor(user.userType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={USER_STATUS_LABELS[user.status]}
                        color={getStatusColor(user.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {user.mfaEnabled ? (
                        <Chip label="Active" color="success" size="small" />
                      ) : (
                        <Chip label="Inactive" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString('fr-FR')
                        : 'Jamais'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(user)}
                          data-testid={`edit-user-${user.id}`}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDelete(user)}
                          data-testid={`delete-user-${user.id}`}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        Aucun utilisateur trouve
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Summary */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {filteredUsers.length} utilisateur(s) affiche(s)
          </Typography>
        </Box>
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!selectedUser}
              fullWidth
              required
              data-testid="user-email-input"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Prenom"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                fullWidth
                required
                data-testid="user-firstname-input"
              />
              <TextField
                label="Nom"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                fullWidth
                required
                data-testid="user-lastname-input"
              />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Type d'utilisateur</InputLabel>
              <Select
                value={formData.userType}
                label="Type d'utilisateur"
                onChange={(e) => handleUserTypeChange(e.target.value as UserType)}
                disabled={!!selectedUser}
                data-testid="user-type-select"
              >
                {Object.entries(USER_TYPE_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Permissions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {formData.permissions.map((perm) => (
                  <Chip key={perm} label={perm} size="small" />
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              createUserMutation.isPending ||
              updateUserMutation.isPending ||
              !formData.email ||
              !formData.firstName ||
              !formData.lastName
            }
          >
            {createUserMutation.isPending || updateUserMutation.isPending
              ? 'Enregistrement...'
              : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Etes-vous sur de vouloir supprimer l'utilisateur{' '}
            <strong>
              {selectedUser?.firstName} {selectedUser?.lastName}
            </strong>{' '}
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irreversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default UserManagement;
