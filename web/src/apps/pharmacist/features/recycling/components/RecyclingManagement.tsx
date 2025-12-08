/**
 * Recycling Management Component
 * Pharmacist dashboard to manage medication recycling requests
 * T5-052: Medication Return/Recycling Feature
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  TextField,
  Collapse,
  Tab,
  Tabs,
  Paper,
  Grid,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  LocalShipping as LocalShippingIcon,
  RecyclingOutlined as RecyclingIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { RecyclingRequest, RecyclingRequestStatus } from '../types/recycling.types';
import { getPharmacyRecyclingRequests, assignDriver, recordCollection, processCollection } from '../services/recyclingApi';

interface RecyclingManagementProps {
  pharmacyId: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box hidden={value !== index} sx={{ py: 2 }}>
    {value === index && children}
  </Box>
);

const STATUS_LABELS: Record<RecyclingRequestStatus, string> = {
  pending: 'En attente',
  assigned: 'Assigné',
  collected: 'Collecté',
  processed: 'Traité',
  cancelled: 'Annulé',
};

const STATUS_COLORS: Record<RecyclingRequestStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  assigned: 'info',
  collected: 'info',
  processed: 'success',
  cancelled: 'error',
};

export const RecyclingManagement: React.FC<RecyclingManagementProps> = ({
  pharmacyId,
  onRefresh,
  isLoading: externalLoading = false,
}) => {
  const [requests, setRequests] = useState<RecyclingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'assign' | 'collect' | 'process' | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RecyclingRequest | null>(null);
  const [driverId, setDriverId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [pharmacyId]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPharmacyRecyclingRequests(pharmacyId);
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des demandes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandClick = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openActionDialog = (request: RecyclingRequest, type: 'assign' | 'collect' | 'process') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionDialogOpen(true);
    setActionError(null);
    setDriverId('');
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      setActionError(null);

      if (actionType === 'assign') {
        if (!driverId.trim()) {
          setActionError('Veuillez entrer un ID de conducteur');
          setIsProcessing(false);
          return;
        }
        await assignDriver(selectedRequest.id, driverId);
      } else if (actionType === 'collect') {
        if (!driverId.trim()) {
          setActionError('Veuillez entrer un ID de conducteur');
          setIsProcessing(false);
          return;
        }
        await recordCollection(selectedRequest.id, driverId);
      } else if (actionType === 'process') {
        await processCollection(selectedRequest.id);
      }

      await loadRequests();
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setActionType(null);
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors de l\'action');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseActionDialog = () => {
    setActionDialogOpen(false);
    setSelectedRequest(null);
    setActionType(null);
    setActionError(null);
    setDriverId('');
  };

  const getFilteredRequests = (status: RecyclingRequestStatus) => {
    return requests.filter((r) => r.status === status);
  };

  const canAssignDriver = (request: RecyclingRequest): boolean => {
    return request.status === 'pending';
  };

  const canRecordCollection = (request: RecyclingRequest): boolean => {
    return request.status === 'assigned';
  };

  const canProcess = (request: RecyclingRequest): boolean => {
    return request.status === 'collected';
  };

  const renderRequestRow = (request: RecyclingRequest) => (
    <React.Fragment key={request.id}>
      <TableRow>
        <TableCell sx={{ width: '50px' }}>
          <IconButton size="small" onClick={() => handleExpandClick(request.id)}>
            <ExpandMoreIcon
              sx={{
                transform: expandedId === request.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
              }}
            />
          </IconButton>
        </TableCell>
        <TableCell>{request.id.substring(0, 8)}</TableCell>
        <TableCell>{request.medications.length}</TableCell>
        <TableCell>{new Date(request.requestedAt).toLocaleDateString('fr-CH')}</TableCell>
        <TableCell>
          <Chip
            label={STATUS_LABELS[request.status]}
            color={STATUS_COLORS[request.status]}
            size="small"
          />
        </TableCell>
        <TableCell align="right">
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {canAssignDriver(request) && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => openActionDialog(request, 'assign')}
              >
                Assigner
              </Button>
            )}
            {canRecordCollection(request) && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => openActionDialog(request, 'collect')}
              >
                Collecte
              </Button>
            )}
            {canProcess(request) && (
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={() => openActionDialog(request, 'process')}
              >
                Traiter
              </Button>
            )}
          </Box>
        </TableCell>
      </TableRow>

      {/* Expanded Details */}
      <TableRow>
        <TableCell colSpan={6} sx={{ paddingBottom: 0, paddingTop: 0 }}>
          <Collapse in={expandedId === request.id} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom>
                Détails de la demande
              </Typography>

              {/* Timeline */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PendingIcon fontSize="small" sx={{ mr: 1, color: '#FF9800' }} />
                  <Typography variant="body2">
                    Créée: {new Date(request.requestedAt).toLocaleString('fr-CH')}
                  </Typography>
                </Box>

                {request.driverId && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocalShippingIcon fontSize="small" sx={{ mr: 1, color: '#2196F3' }} />
                    <Typography variant="body2">
                      Conducteur assigné: {request.driverId}
                    </Typography>
                  </Box>
                )}

                {request.collectedAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <RecyclingIcon fontSize="small" sx={{ mr: 1, color: '#4CAF50' }} />
                    <Typography variant="body2">
                      Collecté: {new Date(request.collectedAt).toLocaleString('fr-CH')}
                    </Typography>
                  </Box>
                )}

                {request.processedAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: '#4CAF50' }} />
                    <Typography variant="body2">
                      Traité: {new Date(request.processedAt).toLocaleString('fr-CH')}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Medications List */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Médicaments ({request.medications.length}):
              </Typography>
              <Box sx={{ ml: 2 }}>
                {request.medications.map((med, idx) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                    • {med.name} - {med.quantity} {med.unit}
                    {med.expiryDate && (
                      <Typography component="span" variant="caption" color="textSecondary">
                        {' '}
                        (Expire: {new Date(med.expiryDate).toLocaleDateString('fr-CH')})
                      </Typography>
                    )}
                    {med.batchNumber && (
                      <Typography component="span" variant="caption" color="textSecondary">
                        {' '}
                        [Lot: {med.batchNumber}]
                      </Typography>
                    )}
                  </Typography>
                ))}
              </Box>

              {/* Notes */}
              {request.notes && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Notes:
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2, whiteSpace: 'pre-wrap' }}>
                    {request.notes}
                  </Typography>
                </>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );

  if (isLoading || externalLoading) {
    return (
      <Card>
        <CardContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
          }}
        >
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = getFilteredRequests('pending');
  const assignedRequests = getFilteredRequests('assigned');
  const collectedRequests = getFilteredRequests('collected');
  const processedRequests = getFilteredRequests('processed');

  return (
    <>
      <Card>
        <CardHeader
          title="Gestion du recyclage des médicaments"
          subheader="Suivi et gestion des demandes de recyclage"
          action={
            <Button size="small" onClick={() => {
              loadRequests();
              onRefresh?.();
            }}>
              Actualiser
            </Button>
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Summary Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary" variant="body2">
                  En attente
                </Typography>
                <Typography variant="h5" sx={{ color: '#FF9800' }}>
                  {pendingRequests.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary" variant="body2">
                  Assignées
                </Typography>
                <Typography variant="h5" sx={{ color: '#2196F3' }}>
                  {assignedRequests.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary" variant="body2">
                  Collectées
                </Typography>
                <Typography variant="h5" sx={{ color: '#FF5722' }}>
                  {collectedRequests.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary" variant="body2">
                  Traitées
                </Typography>
                <Typography variant="h5" sx={{ color: '#4CAF50' }}>
                  {processedRequests.length}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              aria-label="Recycling status tabs"
            >
              <Tab label={`En attente (${pendingRequests.length})`} />
              <Tab label={`Assignées (${assignedRequests.length})`} />
              <Tab label={`Collectées (${collectedRequests.length})`} />
              <Tab label={`Traitées (${processedRequests.length})`} />
            </Tabs>
          </Box>

          {/* Pending Requests */}
          <TabPanel value={tabValue} index={0}>
            {pendingRequests.length === 0 ? (
              <Alert severity="info">Aucune demande en attente</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ width: '50px' }} />
                      <TableCell>ID</TableCell>
                      <TableCell>Médicaments</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingRequests.map((req) => renderRequestRow(req))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Assigned Requests */}
          <TabPanel value={tabValue} index={1}>
            {assignedRequests.length === 0 ? (
              <Alert severity="info">Aucune demande assignée</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ width: '50px' }} />
                      <TableCell>ID</TableCell>
                      <TableCell>Médicaments</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignedRequests.map((req) => renderRequestRow(req))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Collected Requests */}
          <TabPanel value={tabValue} index={2}>
            {collectedRequests.length === 0 ? (
              <Alert severity="info">Aucune demande collectée</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ width: '50px' }} />
                      <TableCell>ID</TableCell>
                      <TableCell>Médicaments</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collectedRequests.map((req) => renderRequestRow(req))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Processed Requests */}
          <TabPanel value={tabValue} index={3}>
            {processedRequests.length === 0 ? (
              <Alert severity="info">Aucune demande traitée</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ width: '50px' }} />
                      <TableCell>ID</TableCell>
                      <TableCell>Médicaments</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processedRequests.map((req) => renderRequestRow(req))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={handleCloseActionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === 'assign' && 'Assigner un conducteur'}
          {actionType === 'collect' && 'Enregistrer la collecte'}
          {actionType === 'process' && 'Marquer comme traité'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {actionError}
            </Alert>
          )}

          {(actionType === 'assign' || actionType === 'collect') && (
            <TextField
              fullWidth
              label="ID du conducteur"
              placeholder="Entrez l'ID du conducteur"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              disabled={isProcessing}
            />
          )}

          {actionType === 'process' && (
            <Typography>
              Êtes-vous sûr de vouloir marquer cette demande comme traitée? Cette action ne peut pas être annulée.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActionDialog} disabled={isProcessing}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            disabled={isProcessing}
          >
            {isProcessing ? <CircularProgress size={20} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecyclingManagement;
