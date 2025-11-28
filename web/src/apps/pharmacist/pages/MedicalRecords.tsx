/**
 * Medical Records Page (Pharmacist View)
 * View patient medical records with consent
 * Limited to prescription-related data: allergies, medications, conditions
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  LocalPharmacy as PharmacyIcon,
  HealthAndSafety as HealthIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';

// ============================================================================
// Types
// ============================================================================

interface MedicalRecord {
  id: string;
  recordType: 'allergy' | 'medication' | 'condition';
  title: string;
  description?: string;
  data?: Record<string, any>;
  source: 'manual' | 'e-sante' | 'import' | 'prescription';
  recordedAt?: string;
  createdAt: string;
}

interface PatientRecordsResponse {
  patientId: string;
  recordCount: number;
  records: MedicalRecord[];
  timestamp: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const MedicalRecordsPage: React.FC = () => {
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Pharmacist user info (from auth context in production)
  const userId = 'pharmacist-123';
  const hinToken = 'stub_hin_token_123456';

  /**
   * Fetch patient medical records
   */
  const fetchRecords = async () => {
    if (!patientId.trim()) {
      setError('Please enter a patient ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:4010/medical-records/patient/${patientId}`,
        {
          headers: {
            'X-User-Id': userId,
            'X-User-Role': 'pharmacist',
            'X-Hin-Token': hinToken,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch records');
      }

      const data: PatientRecordsResponse = await response.json();
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync records from Swiss e-santé
   */
  const syncESante = async () => {
    if (!patientId.trim()) {
      setError('Please enter a patient ID');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const response = await fetch(
        'http://localhost:4010/medical-records/sync-esante',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
            'X-User-Role': 'pharmacist',
            'X-Hin-Token': hinToken,
          },
          body: JSON.stringify({ patientId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sync records');
      }

      const data = await response.json();
      alert(`Synced ${data.syncedCount} new records from e-santé`);

      // Refresh records after sync
      await fetchRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Group records by type
   */
  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.recordType]) {
      acc[record.recordType] = [];
    }
    acc[record.recordType].push(record);
    return acc;
  }, {} as Record<string, MedicalRecord[]>);

  const allergies = groupedRecords['allergy'] || [];
  const medications = groupedRecords['medication'] || [];
  const conditions = groupedRecords['condition'] || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Patient Medical Records
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View prescription-related medical data with patient consent
        </Typography>
      </Box>

      {/* Search Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            label="Patient ID"
            placeholder="Enter patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') fetchRecords();
            }}
          />
          <Button
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            onClick={fetchRecords}
            disabled={loading || !patientId.trim()}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
            onClick={syncESante}
            disabled={syncing || loading || !patientId.trim()}
          >
            Sync e-santé
          </Button>
        </Stack>

        <Box mt={2}>
          <Alert severity="info" icon={<HealthIcon />}>
            As a pharmacist, you can view allergies, medications, and conditions.
            All access is logged for GDPR compliance.
          </Alert>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Records Display */}
      {!loading && records.length > 0 && (
        <Grid container spacing={3}>
          {/* Allergies */}
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <WarningIcon color="error" />
                  <Typography variant="h6" fontWeight="bold">
                    Allergies ({allergies.length})
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {allergies.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No allergies recorded
                  </Typography>
                ) : (
                  <List dense>
                    {allergies.map((record) => (
                      <ListItem
                        key={record.id}
                        button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDetails(true);
                        }}
                      >
                        <ListItemText
                          primary={record.title}
                          secondary={
                            <>
                              <Chip
                                label={record.source}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Medications */}
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <PharmacyIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Medications ({medications.length})
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {medications.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No medications recorded
                  </Typography>
                ) : (
                  <List dense>
                    {medications.map((record) => (
                      <ListItem
                        key={record.id}
                        button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDetails(true);
                        }}
                      >
                        <ListItemText
                          primary={record.title}
                          secondary={
                            <>
                              <Chip
                                label={record.source}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Conditions */}
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <HealthIcon color="warning" />
                  <Typography variant="h6" fontWeight="bold">
                    Conditions ({conditions.length})
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {conditions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No conditions recorded
                  </Typography>
                ) : (
                  <List dense>
                    {conditions.map((record) => (
                      <ListItem
                        key={record.id}
                        button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDetails(true);
                        }}
                      >
                        <ListItemText
                          primary={record.title}
                          secondary={
                            <>
                              <Chip
                                label={record.source}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* No Records Message */}
      {!loading && records.length === 0 && patientId && (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No medical records found for this patient
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Try syncing from e-santé or check patient consent
          </Typography>
        </Paper>
      )}

      {/* Record Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedRecord?.title}
          <Chip
            label={selectedRecord?.recordType}
            size="small"
            sx={{ ml: 2 }}
          />
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedRecord.description || 'No description'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Source
              </Typography>
              <Chip label={selectedRecord.source} size="small" sx={{ mb: 2 }} />

              {selectedRecord.data && Object.keys(selectedRecord.data).length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Additional Data
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ margin: 0, fontSize: '0.85rem' }}>
                      {JSON.stringify(selectedRecord.data, null, 2)}
                    </pre>
                  </Paper>
                </>
              )}

              <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                Recorded: {selectedRecord.recordedAt
                  ? new Date(selectedRecord.recordedAt).toLocaleString()
                  : new Date(selectedRecord.createdAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MedicalRecordsPage;
