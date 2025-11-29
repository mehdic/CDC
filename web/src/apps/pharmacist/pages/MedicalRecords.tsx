/**
 * Medical Records Page - Pharmacist View
 * Limited access to patient medical records (allergies, medications, conditions only)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
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
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import MedicationIcon from '@mui/icons-material/Medication';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

interface MedicalRecord {
  id: string;
  patientId: string;
  recordType: 'allergy' | 'medication' | 'condition';
  title: string;
  description?: string;
  data?: any;
  source: string;
  recordedAt?: string;
  createdAt: string;
}

export default function MedicalRecords() {
  const [patientId, setPatientId] = useState('');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleSearch = async () => {
    if (!patientId.trim()) {
      setError('Please enter a patient ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock API call - replace with actual API integration
      const response = await fetch(
        `http://localhost:3003/api/records/patient/${patientId}`,
        {
          headers: {
            'x-user-id': 'pharmacist-123',
            'x-user-role': 'pharmacist',
            'x-pharmacy-id': 'pharmacy-456',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch medical records');
      }

      const data = await response.json();
      setRecords(data);

      if (data.length === 0) {
        setError('No medical records found for this patient');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'allergy':
        return <WarningIcon color="error" />;
      case 'medication':
        return <MedicationIcon color="primary" />;
      case 'condition':
        return <LocalHospitalIcon color="warning" />;
      default:
        return null;
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'allergy':
        return 'error';
      case 'medication':
        return 'primary';
      case 'condition':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Medical Records Access
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        As a pharmacist, you have limited access to patient medical records. You can view:
        <strong> Allergies, Current Medications, and Current Conditions</strong>. All access is logged for GDPR compliance.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search Patient Records
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              label="Patient ID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Enter patient ID to search"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {records.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Medical Records ({records.length})
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Recorded Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRecordTypeIcon(record.recordType)}
                          <Chip
                            label={record.recordType.toUpperCase()}
                            color={getRecordTypeColor(record.recordType) as any}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {record.title}
                        </Typography>
                        {record.description && (
                          <Typography variant="caption" color="text.secondary">
                            {record.description.substring(0, 80)}
                            {record.description.length > 80 ? '...' : ''}
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
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetails(record)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

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
              color={getRecordTypeColor(selectedRecord.recordType) as any}
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

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Source:
                </Typography>
                <Typography variant="body2">{selectedRecord.source}</Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Recorded Date:
                </Typography>
                <Typography variant="body2">
                  {selectedRecord.recordedAt
                    ? new Date(selectedRecord.recordedAt).toLocaleString()
                    : new Date(selectedRecord.createdAt).toLocaleString()}
                </Typography>
              </Box>

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

              <Alert severity="warning" sx={{ mt: 3 }}>
                This access has been logged for compliance purposes.
              </Alert>
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
