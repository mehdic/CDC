/**
 * Recycling History Component
 * Displays patient's past recycling requests and their status
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
  Collapse,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  LocalShipping as LocalShippingIcon,
  RecyclingOutlined as RecyclingIcon,
} from '@mui/icons-material';
import { RecyclingRequest, RecyclingRequestStatus } from '../types/recycling.types';
import { getPatientRecyclingRequests, cancelRecyclingRequest } from '../services/recyclingApi';

interface RecyclingHistoryProps {
  patientId: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

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

const STATUS_ICONS: Record<RecyclingRequestStatus, JSX.Element> = {
  pending: <PendingIcon fontSize="small" />,
  assigned: <LocalShippingIcon fontSize="small" />,
  collected: <RecyclingIcon fontSize="small" />,
  processed: <CheckCircleIcon fontSize="small" />,
  cancelled: <CancelIcon fontSize="small" />,
};

export const RecyclingHistory: React.FC<RecyclingHistoryProps> = ({
  patientId,
  onRefresh,
  isLoading: externalLoading = false,
}) => {
  const [requests, setRequests] = useState<RecyclingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RecyclingRequest | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [patientId]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPatientRecyclingRequests(patientId);
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandClick = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCancelClick = (request: RecyclingRequest) => {
    setSelectedRequest(request);
    setCancelDialogOpen(true);
    setCancelError(null);
  };

  const handleConfirmCancel = async () => {
    if (!selectedRequest) return;

    try {
      setIsCancelling(true);
      setCancelError(null);
      await cancelRecyclingRequest(selectedRequest.id);
      await loadRequests();
      setCancelDialogOpen(false);
      setSelectedRequest(null);
    } catch (err: any) {
      setCancelError(err.message || 'Erreur lors de l\'annulation');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setSelectedRequest(null);
    setCancelError(null);
  };

  const canCancelRequest = (request: RecyclingRequest): boolean => {
    return request.status === 'pending' || request.status === 'assigned';
  };

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

  return (
    <>
      <Card>
        <CardHeader
          title="Historique de recyclage"
          subheader="Suivi de vos demandes de recyclage de médicaments"
          action={
            <Button
              size="small"
              onClick={() => {
                loadRequests();
                onRefresh?.();
              }}
            >
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

          {requests.length === 0 ? (
            <Alert severity="info">
              Aucune demande de recyclage pour le moment. Commencez par soumettre une demande!
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell />
                    <TableCell>Date</TableCell>
                    <TableCell>Nombre de médicaments</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <React.Fragment key={request.id}>
                      <TableRow>
                        <TableCell sx={{ width: '50px' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleExpandClick(request.id)}
                          >
                            <ExpandMoreIcon
                              sx={{
                                transform:
                                  expandedId === request.id
                                    ? 'rotate(180deg)'
                                    : 'rotate(0deg)',
                                transition: 'transform 0.3s',
                              }}
                            />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          {new Date(request.requestedAt).toLocaleDateString('fr-CH')}
                        </TableCell>
                        <TableCell>{request.medications.length}</TableCell>
                        <TableCell>
                          <Chip
                            icon={STATUS_ICONS[request.status]}
                            label={STATUS_LABELS[request.status]}
                            color={STATUS_COLORS[request.status]}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {canCancelRequest(request) && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleCancelClick(request)}
                            >
                              Annuler
                            </Button>
                          )}
                          {!canCancelRequest(request) && (
                            <Typography variant="caption" color="textSecondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details */}
                      <TableRow>
                        <TableCell colSpan={5} sx={{ paddingBottom: 0, paddingTop: 0 }}>
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
                                    Demande créée:{' '}
                                    {new Date(request.requestedAt).toLocaleString('fr-CH')}
                                  </Typography>
                                </Box>

                                {request.collectedAt && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <RecyclingIcon fontSize="small" sx={{ mr: 1, color: '#4CAF50' }} />
                                    <Typography variant="body2">
                                      Collecté:{' '}
                                      {new Date(request.collectedAt).toLocaleString('fr-CH')}
                                    </Typography>
                                  </Box>
                                )}

                                {request.processedAt && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: '#4CAF50' }} />
                                    <Typography variant="body2">
                                      Traité:{' '}
                                      {new Date(request.processedAt).toLocaleString('fr-CH')}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>

                              {/* Medications List */}
                              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Médicaments:
                              </Typography>
                              <Box sx={{ ml: 2 }}>
                                {request.medications.map((med, idx) => (
                                  <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                                    • {med.name} - {med.quantity} {med.unit}
                                    {med.expiryDate && (
                                      <Typography
                                        component="span"
                                        variant="caption"
                                        color="textSecondary"
                                      >
                                        {' '}
                                        (Expire: {new Date(med.expiryDate).toLocaleDateString('fr-CH')})
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

                              {/* Request ID */}
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{ display: 'block', mt: 2 }}
                              >
                                ID de demande: {request.id}
                              </Typography>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCloseCancelDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer l'annulation</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {cancelError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cancelError}
            </Alert>
          )}
          <Typography>
            Êtes-vous sûr de vouloir annuler cette demande de recyclage? Cette action ne peut pas
            être annulée.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} disabled={isCancelling}>
            Garder la demande
          </Button>
          <Button
            onClick={handleConfirmCancel}
            variant="contained"
            color="error"
            disabled={isCancelling}
          >
            {isCancelling ? <CircularProgress size={20} /> : 'Annuler la demande'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecyclingHistory;
