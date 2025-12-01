/**
 * Patient List Component
 * Display patients with search, filter, and pagination
 * Task: T4-030 - Patient List View
 */

import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Pagination,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Calendar as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDoctorPatients } from '../hooks/useDoctor';
import type { PatientListFilters, DoctorPatient } from '../types/doctor';
import { Paper } from '@mui/material';

// ============================================================================
// Patient Card Component
// ============================================================================

interface PatientCardProps {
  patient: DoctorPatient;
  onViewDetails: (patientId: string) => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onViewDetails }) => (
  <Card
    data-testid={`patient-card-${patient.id}`}
    sx={{
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4,
      },
    }}
    onClick={() => onViewDetails(patient.id)}
  >
    <CardContent>
      {/* Patient Name and Status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold" data-testid="patient-name">
            {patient.firstName} {patient.lastName}
          </Typography>
          {patient.chronicPatient && (
            <Box
              sx={{
                display: 'inline-block',
                mt: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                backgroundColor: '#fff3e0',
                color: '#e65100',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
              data-testid="chronic-badge"
            >
              Patient Chronique
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#e0e0e0',
            color: '#666',
          }}
        >
          <PersonIcon fontSize="small" />
        </Box>
      </Box>

      {/* Contact Information */}
      <Stack spacing={1} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" data-testid="patient-email">
            {patient.email}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" data-testid="patient-phone">
            {patient.phone}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" data-testid="patient-age">
            Age: {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} ans
          </Typography>
        </Box>
      </Stack>

      {/* Last Visit */}
      {patient.lastVisit && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Dernière visite:
          </Typography>
          <Typography variant="body2" data-testid="patient-last-visit">
            {new Date(patient.lastVisit).toLocaleDateString('fr-CH')}
          </Typography>
        </Box>
      )}

      {/* Active Conditions */}
      {patient.activeConditions.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Conditions actives:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
            {patient.activeConditions.slice(0, 2).map((condition, idx) => (
              <Box
                key={idx}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor: '#f0f0f0',
                  fontSize: '0.75rem',
                }}
                data-testid="active-condition"
              >
                {condition}
              </Box>
            ))}
            {patient.activeConditions.length > 2 && (
              <Typography variant="caption" color="text.secondary">
                +{patient.activeConditions.length - 2} autre(s)
              </Typography>
            )}
          </Stack>
        </Box>
      )}
    </CardContent>
  </Card>
);

// ============================================================================
// Main Patient List Component
// ============================================================================

export const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PatientListFilters>({
    search: '',
    chronicOnly: false,
    sortBy: 'name',
    page: 1,
    pageSize: 9,
  });

  const { data: patientsData, isLoading, error } = useDoctorPatients(filters);
  const patients = patientsData?.data.patients || [];
  const total = patientsData?.data.total || 0;
  const totalPages = Math.ceil(total / (filters.pageSize || 9));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value,
      page: 1, // Reset to first page
    });
  };

  const handleChronicToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      chronicOnly: e.target.checked,
      page: 1,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
    const value = e.target.value as string;
    setFilters({
      ...filters,
      sortBy: value as 'name' | 'lastVisit' | 'recent',
      page: 1,
    });
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setFilters({
      ...filters,
      page,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewPatient = (patientId: string) => {
    navigate(`/doctor/patients/${patientId}`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom data-testid="page-title">
          Liste des Patients
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez et consultez vos patients
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }} data-testid="filters-panel">
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Rechercher patients"
              placeholder="Nom ou email..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              data-testid="search-input"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Select
              fullWidth
              label="Trier par"
              value={filters.sortBy || 'name'}
              onChange={handleSortChange}
              data-testid="sort-select"
            >
              <MenuItem value="name">Nom</MenuItem>
              <MenuItem value="lastVisit">Dernière visite</MenuItem>
              <MenuItem value="recent">Récemment ajouté</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <FormControlLabel
              control={<Checkbox checked={filters.chronicOnly || false} onChange={handleChronicToggle} />}
              label="Patients chroniques uniquement"
              data-testid="chronic-filter"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} data-testid="error-alert">
          Erreur lors du chargement de la liste des patients
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress data-testid="loading-spinner" />
        </Box>
      )}

      {/* Patient Cards Grid */}
      {!isLoading && patients.length > 0 && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {patients.map((patient) => (
              <Grid item xs={12} sm={6} md={4} key={patient.id}>
                <PatientCard patient={patient} onViewDetails={handleViewPatient} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={filters.page || 1}
                onChange={handlePageChange}
                color="primary"
                data-testid="pagination"
              />
            </Box>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && patients.length === 0 && (
        <Alert severity="info" data-testid="empty-state">
          Aucun patient trouvé avec les filtres appliqués
        </Alert>
      )}
    </Container>
  );
};

export default PatientList;
