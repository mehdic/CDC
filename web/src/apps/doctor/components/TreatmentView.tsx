/**
 * Treatment View Component
 * Display and manage patient treatments
 * Task: T4-031 - Treatment View
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Snackbar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { usePatientTreatments, useRenewPrescription } from '../hooks/useDoctor';
import type { Treatment, Prescription } from '../types/doctor';

// ============================================================================
// Tab Panel Component
// ============================================================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} role="tabpanel" data-testid={`tabpanel-${index}`}>
    {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
  </div>
);

// ============================================================================
// Prescription Row Component
// ============================================================================

interface PrescriptionRowProps {
  prescription: Prescription;
  onRenew?: (prescriptionId: string) => void;
  isRenewing?: boolean;
}

const PrescriptionRow: React.FC<PrescriptionRowProps> = ({ prescription, onRenew, isRenewing }) => {
  const statusColor: Record<string, string> = {
    active: '#4caf50',
    pending: '#ff9800',
    completed: '#9e9e9e',
    draft: '#2196f3',
    rejected: '#f44336',
  };

  const canRenew = prescription.renewalCount < prescription.maxRenewals && prescription.status === 'active';

  return (
    <TableRow data-testid={`prescription-row-${prescription.id}`}>
      <TableCell>{prescription.medication}</TableCell>
      <TableCell>{prescription.dosage}</TableCell>
      <TableCell>{prescription.frequency}</TableCell>
      <TableCell align="center">{prescription.quantity}</TableCell>
      <TableCell>
        <Box
          sx={{
            display: 'inline-block',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: `${statusColor[prescription.status]}20`,
            color: statusColor[prescription.status],
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
          data-testid="prescription-status"
        >
          {prescription.status === 'active' ? 'Active' : prescription.status === 'pending' ? 'En attente' : prescription.status}
        </Box>
      </TableCell>
      <TableCell align="right">
        {canRenew && (
          <Button
            size="small"
            onClick={() => onRenew?.(prescription.id)}
            disabled={isRenewing}
            startIcon={isRenewing ? <CircularProgress size={16} /> : <RefreshIcon />}
            data-testid="renew-button"
          >
            Renouveler
          </Button>
        )}
        {prescription.renewalCount >= prescription.maxRenewals && (
          <Typography variant="caption" color="text.secondary">
            Renouvellements épuisés
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
};

// ============================================================================
// Treatment Card Component
// ============================================================================

interface TreatmentCardProps {
  treatment: Treatment;
}

const TreatmentCard: React.FC<TreatmentCardProps> = ({ treatment }) => (
  <Card
    sx={{
      mb: 2,
      borderLeft: `4px solid ${treatment.status === 'active' ? '#4caf50' : '#9e9e9e'}`,
    }}
    data-testid={`treatment-card-${treatment.id}`}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold" data-testid="treatment-name">
            {treatment.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {treatment.description}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: treatment.status === 'active' ? '#e8f5e9' : '#eeeeee',
            color: treatment.status === 'active' ? '#2e7d32' : '#666',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
          data-testid="treatment-status"
        >
          {treatment.status === 'active' ? 'Actif' : 'Terminé'}
        </Box>
      </Box>

      <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="body2" color="text.secondary">
          Période: {new Date(treatment.startDate).toLocaleDateString('fr-CH')}
          {treatment.endDate && ` - ${new Date(treatment.endDate).toLocaleDateString('fr-CH')}`}
        </Typography>
      </Box>

      {treatment.notes && (
        <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Notes:
          </Typography>
          <Typography variant="body2">{treatment.notes}</Typography>
        </Box>
      )}

      {treatment.medications.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Médicaments ({treatment.medications.length})
          </Typography>
          <Stack spacing={1}>
            {treatment.medications.map((med, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  p: 1,
                  backgroundColor: '#f9f9f9',
                  borderRadius: 1,
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="500">
                    {med.medication}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {med.dosage} • {med.frequency}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight="500" color="primary">
                  x{med.quantity}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </CardContent>
  </Card>
);

// ============================================================================
// Main Treatment View Component
// ============================================================================

interface TreatmentViewProps {
  patientId: string;
}

export const TreatmentView: React.FC<TreatmentViewProps> = ({ patientId }) => {
  const [tabValue, setTabValue] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: treatmentData, isLoading, error } = usePatientTreatments(patientId);
  const renewMutation = useRenewPrescription();

  const currentTreatments = treatmentData?.data.currentTreatments || [];
  const treatmentHistory = treatmentData?.data.treatmentHistory || [];

  const handleRenewPrescription = async (prescriptionId: string) => {
    try {
      await renewMutation.mutateAsync(prescriptionId);
    } catch (err) {
      setErrorMessage('Erreur lors du renouvellement de l\'ordonnance');
    }
  };

  const handleCloseSnackbar = () => {
    setErrorMessage(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Erreur lors du chargement des traitements</Alert>;
  }

  return (
    <Box data-testid="treatment-view">
      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={(_, value) => setTabValue(value)}
        sx={{ borderBottom: '1px solid #e0e0e0', mb: 3 }}
        data-testid="treatment-tabs"
      >
        <Tab label="Traitements Actuels" data-testid="current-treatments-tab" />
        <Tab label="Historique" data-testid="history-tab" />
      </Tabs>

      {/* Current Treatments Tab */}
      <TabPanel value={tabValue} index={0}>
        {currentTreatments.length > 0 ? (
          <Stack spacing={2}>
            {currentTreatments.map((treatment) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))}
          </Stack>
        ) : (
          <Alert severity="info">Aucun traitement actif</Alert>
        )}

        {/* Current Medications Table */}
        {currentTreatments.some((t) => t.medications.length > 0) && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Ordonnances Actives
            </Typography>
            <TableContainer component={Paper}>
              <Table data-testid="prescriptions-table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Médicament</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Dosage</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Fréquence</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Quantité
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentTreatments.flatMap((treatment) => treatment.medications).map((prescription) => (
                    <PrescriptionRow
                      key={prescription.id}
                      prescription={prescription}
                      onRenew={handleRenewPrescription}
                      isRenewing={renewMutation.isPending}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </TabPanel>

      {/* Treatment History Tab */}
      <TabPanel value={tabValue} index={1}>
        {treatmentHistory.length > 0 ? (
          <TableContainer component={Paper}>
            <Table data-testid="history-table">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Traitement</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Période</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Médicaments</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Résultat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {treatmentHistory.map((item) => (
                  <TableRow key={item.id} data-testid={`history-row-${item.id}`}>
                    <TableCell>{item.treatmentName}</TableCell>
                    <TableCell>
                      {new Date(item.startDate).toLocaleDateString('fr-CH')} -
                      {new Date(item.endDate).toLocaleDateString('fr-CH')}
                    </TableCell>
                    <TableCell>{item.medications.join(', ')}</TableCell>
                    <TableCell>{item.outcome}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">Aucun historique de traitement</Alert>
        )}
      </TabPanel>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={errorMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default TreatmentView;
