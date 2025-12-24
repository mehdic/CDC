/**
 * Patient Detail Component (T4-003)
 * Displays comprehensive patient information including medical history,
 * current medications, order history, and contact info
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocalPharmacy as PharmacyIcon,
  Warning as WarningIcon,
  Phone as PhoneIcon,
  WarningAmber as EmergencyIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { usePatient } from '../hooks/usePatients';
import { exportPatientSummaryToPDF } from '../services/nurseApi';

export const PatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { patient, loading, error } = usePatient(patientId);
  const [exporting, setExporting] = React.useState(false);

  const handleExportPDF = async () => {
    if (!patientId) return;

    try {
      setExporting(true);
      const blob = await exportPatientSummaryToPDF(patientId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patient-${patient?.firstName}-${patient?.lastName}-summary.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !patient) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Patient non trouvé'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/nurse/patients')} sx={{ mt: 2 }}>
          Retour à la liste
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} data-testid="patient-details-view">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/nurse/patients')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4">
              {patient.firstName} {patient.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chambre {patient.room} • {patient.ward}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handleExportPDF}
            disabled={exporting}
            sx={{ mr: 1 }}
          >
            {exporting ? 'Export...' : 'Exporter PDF'}
          </Button>
          <Button
            variant="contained"
            startIcon={<PharmacyIcon />}
            onClick={() => navigate(`/nurse/orders/new?patientId=${patient.id}`)}
          >
            Nouvelle commande
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Allergies Warning */}
          {patient.allergies && patient.allergies.length > 0 && (
            <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Allergies ({patient.allergies.length})
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {patient.allergies.map((allergy, idx) => (
                  <Chip key={idx} label={allergy} color="error" size="small" />
                ))}
              </Box>
            </Alert>
          )}

          {/* Chronic Conditions */}
          {patient.chronicConditions && patient.chronicConditions.length > 0 && (
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Conditions chroniques
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {patient.chronicConditions.map((condition, idx) => (
                  <Chip key={idx} label={condition} variant="outlined" />
                ))}
              </Box>
            </Paper>
          )}

          {/* Current Medications */}
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Médicaments actuels
            </Typography>
            {patient.currentMedications && patient.currentMedications.length > 0 ? (
              <List>
                {patient.currentMedications.map((med, idx) => (
                  <React.Fragment key={med.id}>
                    {idx > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="medium">
                            {med.drugName}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {med.dosage} • {med.frequency} • {med.route}
                            </Typography>
                            <br />
                            <Typography variant="body2" color="text.secondary">
                              Prescrit par: {med.prescribedBy}
                            </Typography>
                            {med.instructions && (
                              <>
                                <br />
                                <Typography variant="body2" color="text.secondary">
                                  {med.instructions}
                                </Typography>
                              </>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">Aucun médicament actuel</Typography>
            )}
          </Paper>

          {/* Nurse Notes */}
          {patient.nurseNotes && patient.nurseNotes.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notes infirmières
              </Typography>
              <List>
                {patient.nurseNotes.map((note, idx) => (
                  <ListItem key={idx}>
                    <ListItemText
                      primary={note}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Patient Info Card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations patient
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Date de naissance
                </Typography>
                <Typography variant="body1">
                  {new Date(patient.dateOfBirth).toLocaleDateString('fr-CH')}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Chambre
                </Typography>
                <Typography variant="body1">
                  {patient.room} ({patient.ward})
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Téléphone
                </Typography>
                <Box display="flex" alignItems="center">
                  <PhoneIcon sx={{ fontSize: 18, mr: 1 }} />
                  <Typography variant="body1">{patient.contactNumber}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Emergency Contact Card */}
          {patient.emergencyContact && (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <EmergencyIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6">Contact d&apos;urgence</Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Nom
                  </Typography>
                  <Typography variant="body1">{patient.emergencyContact.name}</Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Relation
                  </Typography>
                  <Typography variant="body1">{patient.emergencyContact.relationship}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Téléphone
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <PhoneIcon sx={{ fontSize: 18, mr: 1 }} />
                    <Typography variant="body1">{patient.emergencyContact.phone}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default PatientDetail;
