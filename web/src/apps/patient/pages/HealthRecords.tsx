/**
 * Health Records Page (Patient View)
 * View and manage personal health records
 * Full access to all record types with export functionality
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  HealthAndSafety as HealthIcon,
  Warning as WarningIcon,
  LocalPharmacy as PharmacyIcon,
  Science as ScienceIcon,
  Vaccines as VaccinesIcon,
  MedicalServices as MedicalIcon,
} from '@mui/icons-material';

// ============================================================================
// Types
// ============================================================================

type RecordType = 'diagnosis' | 'allergy' | 'medication' | 'procedure' | 'lab_result' | 'immunization' | 'condition';

interface MedicalRecord {
  id: string;
  recordType: RecordType;
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
// Record Type Icons
// ============================================================================

const recordTypeIcons: Record<RecordType, React.ReactElement> = {
  diagnosis: <MedicalIcon color="primary" />,
  allergy: <WarningIcon color="error" />,
  medication: <PharmacyIcon color="primary" />,
  procedure: <MedicalIcon color="secondary" />,
  lab_result: <ScienceIcon color="info" />,
  immunization: <VaccinesIcon color="success" />,
  condition: <HealthIcon color="warning" />,
};

const recordTypeLabels: Record<RecordType, string> = {
  diagnosis: 'Diagnoses',
  allergy: 'Allergies',
  medication: 'Medications',
  procedure: 'Procedures',
  lab_result: 'Lab Results',
  immunization: 'Immunizations',
  condition: 'Conditions',
};

// ============================================================================
// Main Component
// ============================================================================

export const HealthRecordsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<RecordType | 'all'>('all');

  // Patient user info (from auth context in production)
  const patientId = 'patient-123';
  const userId = patientId;

  /**
   * Fetch patient health records
   */
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:4010/medical-records/patient/${patientId}`,
        {
          headers: {
            'X-User-Id': userId,
            'X-User-Role': 'patient',
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
   * Export health records as JSON
   */
  const exportRecords = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-records-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
  }, {} as Record<RecordType, MedicalRecord[]>);

  /**
   * Filter records based on active tab
   */
  const displayedRecords = activeTab === 'all'
    ? records
    : groupedRecords[activeTab] || [];

  // Load records on mount
  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              My Health Records
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage your complete medical history
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh records">
              <IconButton
                color="primary"
                onClick={fetchRecords}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportRecords}
              disabled={records.length === 0}
            >
              Export
            </Button>
          </Stack>
        </Stack>
      </Box>

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
      {!loading && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} mb={4}>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {(groupedRecords['allergy'] || []).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Allergies
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {(groupedRecords['medication'] || []).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Medications
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {(groupedRecords['condition'] || []).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Conditions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {(groupedRecords['lab_result'] || []).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lab Results
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {(groupedRecords['immunization'] || []).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vaccines
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="secondary.main">
                    {records.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filter Tabs */}
          <Paper elevation={2} sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="All Records" value="all" />
              <Tab label="Allergies" value="allergy" />
              <Tab label="Medications" value="medication" />
              <Tab label="Conditions" value="condition" />
              <Tab label="Lab Results" value="lab_result" />
              <Tab label="Immunizations" value="immunization" />
              <Tab label="Diagnoses" value="diagnosis" />
              <Tab label="Procedures" value="procedure" />
            </Tabs>
          </Paper>

          {/* Records List */}
          <Paper elevation={2}>
            <List>
              {displayedRecords.length === 0 ? (
                <Box p={4} textAlign="center">
                  <Typography variant="body1" color="text.secondary">
                    No records found in this category
                  </Typography>
                </Box>
              ) : (
                displayedRecords.map((record, index) => (
                  <React.Fragment key={record.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      button
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowDetails(true);
                      }}
                    >
                      <Box mr={2}>
                        {recordTypeIcons[record.recordType]}
                      </Box>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body1" fontWeight="medium">
                              {record.title}
                            </Typography>
                            <Chip
                              label={recordTypeLabels[record.recordType]}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={record.source}
                              size="small"
                            />
                          </Stack>
                        }
                        secondary={
                          <>
                            {record.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                {record.description.substring(0, 100)}
                                {record.description.length > 100 && '...'}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" display="block">
                              {record.recordedAt
                                ? new Date(record.recordedAt).toLocaleDateString()
                                : new Date(record.createdAt).toLocaleDateString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </>
      )}

      {/* No Records Message */}
      {!loading && records.length === 0 && (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No health records found
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Your medical records will appear here
          </Typography>
        </Paper>
      )}

      {/* Record Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            {selectedRecord && recordTypeIcons[selectedRecord.recordType]}
            <Box>
              {selectedRecord?.title}
              <Box mt={0.5}>
                <Chip
                  label={selectedRecord?.recordType}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={selectedRecord?.source}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            </Box>
          </Stack>
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

              {selectedRecord.data && Object.keys(selectedRecord.data).length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Details
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                    <pre style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedRecord.data, null, 2)}
                    </pre>
                  </Paper>
                </>
              )}

              <Typography variant="caption" color="text.secondary" display="block">
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

export default HealthRecordsPage;
