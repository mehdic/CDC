/**
 * Order Detail Component (T4-006)
 * Displays full order information including medications,
 * status history, and delivery tracking
 */

import React, { useState } from 'react';
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
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useOrder } from '../hooks/useOrders';
import { exportOrderToPDF } from '../services/nurseApi';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  in_transit: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { order, loading, error } = useOrder(orderId);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!orderId) return;

    try {
      setExporting(true);
      const blob = await exportOrderToPDF(orderId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-${orderId}.pdf`;
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

  if (error || !order) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Commande non trouvée'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/nurse/orders')} sx={{ mt: 2 }}>
          Retour aux commandes
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/nurse/orders')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4">Commande #{order.id.slice(0, 8)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {order.patientName} • Chambre {order.room}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? 'Export...' : 'Exporter PDF'}
          </Button>
          {order.deliveryId && (
            <Button
              variant="contained"
              startIcon={<ShippingIcon />}
              onClick={() => navigate(`/nurse/tracking/${order.deliveryId}`)}
            >
              Suivre la livraison
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Status Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Statut de la commande</Typography>
                <Chip
                  label={STATUS_LABELS[order.status]}
                  color={
                    order.status === 'delivered'
                      ? 'success'
                      : order.status === 'cancelled'
                      ? 'error'
                      : order.status === 'in_transit'
                      ? 'info'
                      : 'warning'
                  }
                  size="medium"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Medications */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Médicaments commandés
            </Typography>
            <List>
              {order.medications.map((med, idx) => (
                <React.Fragment key={idx}>
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
                            Dosage: {med.dosage} • Quantité: {med.quantity}
                          </Typography>
                          {med.instructions && (
                            <>
                              <br />
                              <Typography variant="body2" color="text.secondary">
                                Instructions: {med.instructions}
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
          </Paper>

          {/* Status History */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Historique
            </Typography>
            <Timeline>
              <TimelineItem>
                <TimelineOppositeContent color="text.secondary">
                  {new Date(order.createdAt).toLocaleString('fr-CH')}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color="primary">
                    <CheckIcon />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6" component="span">
                    Commande créée
                  </Typography>
                  <Typography>Par {order.createdBy}</Typography>
                </TimelineContent>
              </TimelineItem>

              {order.status !== 'pending' && (
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {new Date(order.updatedAt).toLocaleString('fr-CH')}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="success">
                      <CheckIcon />
                    </TimelineDot>
                    {order.status !== 'confirmed' && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      Confirmée par la pharmacie
                    </Typography>
                    <Typography>{order.pharmacyName}</Typography>
                  </TimelineContent>
                </TimelineItem>
              )}

              {['preparing', 'ready', 'in_transit', 'delivered'].includes(order.status) && (
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {new Date(order.updatedAt).toLocaleString('fr-CH')}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="info">
                      <ShippingIcon />
                    </TimelineDot>
                    {order.status !== 'preparing' && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      En préparation
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              )}

              {['ready', 'in_transit', 'delivered'].includes(order.status) && (
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {new Date(order.updatedAt).toLocaleString('fr-CH')}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="secondary">
                      <CheckIcon />
                    </TimelineDot>
                    {order.status !== 'ready' && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      Prête pour livraison
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              )}

              {order.status === 'delivered' && (
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {new Date(order.updatedAt).toLocaleString('fr-CH')}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="success">
                      <CheckIcon />
                    </TimelineDot>
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      Livrée
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              )}
            </Timeline>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Order Info Card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1">{order.patientName}</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Chambre
                </Typography>
                <Typography variant="body1">{order.room}</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Pharmacie
                </Typography>
                <Typography variant="body1">{order.pharmacyName}</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Urgence
                </Typography>
                <Chip
                  label={order.urgency.toUpperCase()}
                  size="small"
                  color={
                    order.urgency === 'stat'
                      ? 'error'
                      : order.urgency === 'urgent'
                      ? 'warning'
                      : 'default'
                  }
                />
              </Box>
              {order.estimatedDelivery && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Livraison estimée
                  </Typography>
                  <Typography variant="body1">
                    {new Date(order.estimatedDelivery).toLocaleString('fr-CH')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          {order.notes && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2">{order.notes}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrderDetail;
