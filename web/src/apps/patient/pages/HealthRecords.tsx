/**
 * Health Records Page - Patient View
 * Full access to own medical records with upload, view, and export capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';

interface MedicalRecord {
  id: string;
  patientId: string;
  recordType: string;
  title: string;
  description?: string;
  data?: any;
  source: string;
  recordedAt?: string;
  consentGiven: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AccessLog {
  id: string;
  userId: string;
  userRole: string;
  action: string;
  accessedAt: string;
  ipAddress?: string;
  reason?: string;
}

const recordTypes = [
  'allergy',
  'medication',
  'condition',
  'procedure',
  'immunization',
  'lab_result',
  'vital_signs',
  'diagnosis',
  'prescription',
  'consultation',
  'hospitalization',
  'imaging',
  'other',
];

export default function HealthRecords() {
  const [currentTab, setCurrentTab] = useState(0);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    recordType: 'other',
    title: '',
    description: '',
  });

  // Mock patient ID (would come from auth context in production)
  const patientId = 'patient-123';

  useEffect(() => {
    if (currentTab === 0) {
      fetchRecords();
    } else if (currentTab === 1) {
      fetchAccessLogs();
    }
  }, [currentTab]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3003/api/records/patient/${patientId}?activeOnly=true`,
        {
          headers: {
            'x-user-id': patientId,
            'x-user-role': 'patient',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch medical records');
      }

      const data = await response.json();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3003/api/records/patient/${patientId}/access-logs`,
        {
          headers: {
            'x-user-id': patientId,
            'x-user-role': 'patient',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch access logs');
      }

      const data = await response.json();
      setAccessLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadRecord = async () => {
    if (!newRecord.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3003/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': patientId,
          'x-user-role': 'patient',
        },
        body: JSON.stringify({
          patientId,
          ...newRecord,
          source: 'patient_reported',
          consentGiven: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload record');
      }

      setUploadOpen(false);
      setNewRecord({ recordType: 'other', title: '', description: '' });
      fetchRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExportRecords = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medical-records-${new Date().toISOString()}.json`;
    link.click();
  };

  const getRecordTypeColor = (type: string): any => {
    const colors: Record<string, string> = {
      allergy: 'error',
      medication: 'primary',
      condition: 'warning',
      procedure: 'info',
      immunization: 'success',
      lab_result: 'secondary',
    };
    return colors[type] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Health Records</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportRecords}
            disabled={records.length === 0}
          >
            Export Records
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadOpen(true)}
          >
            Upload Record
          </Button>
        </Box>
      </Box>

      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mb: 3 }}>
        <Tab label="My Records" />
        <Tab label="Access History" icon={<HistoryIcon />} iconPosition="end" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Records Tab */}
      {currentTab === 0 && !loading && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Medical Records ({records.length})
            </Typography>

            {records.length === 0 ? (
              <Alert severity="info">
                No medical records found. Upload your first record to get started.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Consent</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          <Chip
                            label={record.recordType.toUpperCase()}
                            color={getRecordTypeColor(record.recordType)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {record.title}
                          </Typography>
                          {record.description && (
                            <Typography variant="caption" color="text.secondary">
                              {record.description.substring(0, 60)}
                              {record.description.length > 60 ? '...' : ''}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={record.source} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          {record.recordedAt
                            ? new Date(record.recordedAt).toLocaleDateString()
                            : new Date(record.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.consentGiven ? 'Shared' : 'Private'}
                            color={record.consentGiven ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedRecord(record);
                              setDetailsOpen(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Access History Tab */}
      {currentTab === 1 && !loading && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Access History ({accessLogs.length})
            </Typography>

            {accessLogs.length === 0 ? (
              <Alert severity="info">No access logs found.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Date/Time</TableCell>
                      <TableCell>IP Address</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accessLogs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>{log.userId}</TableCell>
                        <TableCell>
                          <Chip label={log.userRole} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={log.action.toUpperCase()} size="small" color="primary" />
                        </TableCell>
                        <TableCell>
                          {new Date(log.accessedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New Medical Record</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Record Type"
                value={newRecord.recordType}
                onChange={(e) => setNewRecord({ ...newRecord, recordType: e.target.value })}
              >
                {recordTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.toUpperCase().replace('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newRecord.title}
                onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUploadRecord} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Medical Record Details
          {selectedRecord && (
            <Chip
              label={selectedRecord.recordType.toUpperCase()}
              color={getRecordTypeColor(selectedRecord.recordType)}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedRecord.title}
              </Typography>

              {selectedRecord.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedRecord.description}
                </Typography>
              )}

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Source:
                  </Typography>
                  <Typography variant="body2">{selectedRecord.source}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Consent Given:
                  </Typography>
                  <Chip
                    label={selectedRecord.consentGiven ? 'Yes' : 'No'}
                    color={selectedRecord.consentGiven ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Recorded Date:
                  </Typography>
                  <Typography variant="body2">
                    {selectedRecord.recordedAt
                      ? new Date(selectedRecord.recordedAt).toLocaleString()
                      : new Date(selectedRecord.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedRecord.updatedAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              {selectedRecord.data && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Additional Data:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(selectedRecord.data, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
