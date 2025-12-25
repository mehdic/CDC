/**
 * Order Tracking Component (T4-005)
 * Real-time tracking of medication orders with status updates,
 * filtering, and timeline view
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  CheckCircle as CheckIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { useOrders } from '../hooks/useOrders';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  in_transit: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_COLORS: Record<
  string,
  'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
> = {
  pending: 'info' as any,
  confirmed: 'info' as any,
  preparing: 'warning',
  ready: 'success',
  in_transit: 'info' as any,
  delivered: 'success',
  cancelled: 'error',
};

export const OrderTracking: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { orders, loading, error } = useOrders({
    status: statusFilter,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon />;
      case 'confirmed':
      case 'preparing':
        return <InventoryIcon />;
      case 'ready':
      case 'in_transit':
        return <ShippingIcon />;
      case 'delivered':
        return <CheckIcon />;
      default:
        return <PendingIcon />;
    }
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
          Suivi des commandes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Suivez vos commandes de médicaments en temps réel
        </Typography>
      </Box>

      {/* Filter */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Filtrer par statut</InputLabel>
          <Select
            value={statusFilter}
            label="Filtrer par statut"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">Tous les statuts</MenuItem>
            <MenuItem value="pending">En attente</MenuItem>
            <MenuItem value="confirmed">Confirmée</MenuItem>
            <MenuItem value="preparing">En préparation</MenuItem>
            <MenuItem value="ready">Prête</MenuItem>
            <MenuItem value="in_transit">En livraison</MenuItem>
            <MenuItem value="delivered">Livrée</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress aria-label="Chargement des commandes" />
        </Box>
      )}

      {/* Order Cards */}
      {!loading && (
        <>
          {orders.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Aucune commande trouvée</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {orders.map((order) => (
                <Grid item xs={12} key={order.id}>
                  <Card>
                    <CardActionArea onClick={() => navigate(`/nurse/orders/${order.id}`)}>
                      <CardContent>
                        <Grid container spacing={2}>
                          {/* Left: Order Info */}
                          <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center" mb={1}>
                              <Typography variant="h6">{order.patientName}</Typography>
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
                                sx={{ ml: 2 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Chambre {order.room} • {order.medications.length} médicament
                              {order.medications.length !== 1 ? 's' : ''}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {order.pharmacyName}
                            </Typography>
                          </Grid>

                          {/* Right: Status & Timeline */}
                          <Grid item xs={12} md={6}>
                            <Box display="flex" justifyContent="flex-end" mb={2}>
                              <Chip
                                icon={getStatusIcon(order.status)}
                                label={STATUS_LABELS[order.status]}
                                color={STATUS_COLORS[order.status]}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Créée: {new Date(order.createdAt).toLocaleString('fr-CH')}
                            </Typography>
                            {order.estimatedDelivery && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Livraison estimée:{' '}
                                {new Date(order.estimatedDelivery).toLocaleString('fr-CH')}
                              </Typography>
                            )}
                          </Grid>
                        </Grid>

                        {/* Progress Timeline */}
                        <Box mt={2}>
                          <Timeline
                            position="alternate"
                            sx={{
                              '& .MuiTimelineItem-root:before': {
                                flex: 0,
                                padding: 0,
                              },
                            }}
                          >
                            <TimelineItem>
                              <TimelineSeparator>
                                <TimelineDot color="success">
                                  <CheckIcon sx={{ fontSize: 16 }} />
                                </TimelineDot>
                                <TimelineConnector />
                              </TimelineSeparator>
                              <TimelineContent>
                                <Typography variant="caption">En attente</Typography>
                              </TimelineContent>
                            </TimelineItem>

                            <TimelineItem>
                              <TimelineSeparator>
                                <TimelineDot
                                  color={
                                    ['confirmed', 'preparing', 'ready', 'in_transit', 'delivered'].includes(
                                      order.status
                                    )
                                      ? 'success'
                                      : 'grey'
                                  }
                                >
                                  {['confirmed', 'preparing', 'ready', 'in_transit', 'delivered'].includes(
                                    order.status
                                  ) && <CheckIcon sx={{ fontSize: 16 }} />}
                                </TimelineDot>
                                <TimelineConnector />
                              </TimelineSeparator>
                              <TimelineContent>
                                <Typography variant="caption">Confirmée</Typography>
                              </TimelineContent>
                            </TimelineItem>

                            <TimelineItem>
                              <TimelineSeparator>
                                <TimelineDot
                                  color={
                                    ['ready', 'in_transit', 'delivered'].includes(order.status)
                                      ? 'success'
                                      : 'grey'
                                  }
                                >
                                  {['ready', 'in_transit', 'delivered'].includes(order.status) && (
                                    <CheckIcon sx={{ fontSize: 16 }} />
                                  )}
                                </TimelineDot>
                                <TimelineConnector />
                              </TimelineSeparator>
                              <TimelineContent>
                                <Typography variant="caption">Prête</Typography>
                              </TimelineContent>
                            </TimelineItem>

                            <TimelineItem>
                              <TimelineSeparator>
                                <TimelineDot color={order.status === 'delivered' ? 'success' : 'grey'}>
                                  {order.status === 'delivered' && <CheckIcon sx={{ fontSize: 16 }} />}
                                </TimelineDot>
                              </TimelineSeparator>
                              <TimelineContent>
                                <Typography variant="caption">Livrée</Typography>
                              </TimelineContent>
                            </TimelineItem>
                          </Timeline>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
};

export default OrderTracking;
