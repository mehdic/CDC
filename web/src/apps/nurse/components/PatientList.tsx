/**
 * Patient List Component (T4-002)
 * Displays list of patients with search, filter, sort, and pagination
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { usePatients } from '../hooks/usePatients';

const ITEMS_PER_PAGE = 12;

export const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);

  const { patients, loading, error } = usePatients({
    search: searchTerm,
    ward: wardFilter,
    sortBy,
  });

  // Pagination
  const totalPages = Math.ceil(patients.length / ITEMS_PER_PAGE);
  const paginatedPatients = patients.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Mes Patients
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {patients.length} patient{patients.length !== 1 ? 's' : ''} au total
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Rechercher par nom, chambre..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Service</InputLabel>
              <Select
                value={wardFilter}
                label="Service"
                onChange={(e) => {
                  setWardFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">Tous les services</MenuItem>
                <MenuItem value="Cardiologie">Cardiologie</MenuItem>
                <MenuItem value="Oncologie">Oncologie</MenuItem>
                <MenuItem value="Pédiatrie">Pédiatrie</MenuItem>
                <MenuItem value="Urgences">Urgences</MenuItem>
                <MenuItem value="Chirurgie">Chirurgie</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Trier par</InputLabel>
              <Select
                value={sortBy}
                label="Trier par"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Nom (A-Z)</MenuItem>
                <MenuItem value="room">Chambre</MenuItem>
                <MenuItem value="urgency">Urgence</MenuItem>
                <MenuItem value="recent">Plus récent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Patient Cards */}
      {!loading && (
        <>
          {paginatedPatients.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Aucun patient trouvé
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {paginatedPatients.map((patient) => (
                <Grid item xs={12} sm={6} md={4} key={patient.id}>
                  <Card>
                    <CardActionArea
                      onClick={() => navigate(`/nurse/patients/${patient.id}`)}
                    >
                      <CardContent>
                        {/* Patient Name */}
                        <Box display="flex" alignItems="center" mb={1}>
                          <PersonIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">
                            {patient.firstName} {patient.lastName}
                          </Typography>
                        </Box>

                        {/* Room & Ward */}
                        <Box display="flex" alignItems="center" mb={2}>
                          <HospitalIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Chambre {patient.room} • {patient.ward}
                          </Typography>
                        </Box>

                        {/* Allergies Warning */}
                        {patient.allergies && patient.allergies.length > 0 && (
                          <Box display="flex" alignItems="center" mb={1}>
                            <WarningIcon sx={{ fontSize: 18, mr: 1, color: 'error.main' }} />
                            <Typography variant="body2" color="error">
                              {patient.allergies.length} allergie{patient.allergies.length !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        )}

                        {/* Chronic Conditions */}
                        {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                          <Box mb={1}>
                            <Typography variant="caption" color="text.secondary">
                              Conditions chroniques:
                            </Typography>
                            <Box mt={0.5}>
                              {patient.chronicConditions.slice(0, 2).map((condition, idx) => (
                                <Chip
                                  key={idx}
                                  label={condition}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                              {patient.chronicConditions.length > 2 && (
                                <Chip
                                  label={`+${patient.chronicConditions.length - 2}`}
                                  size="small"
                                />
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* Current Medications Count */}
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          {patient.currentMedications?.length || 0} médicament{patient.currentMedications?.length !== 1 ? 's' : ''} actuel{patient.currentMedications?.length !== 1 ? 's' : ''}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default PatientList;
