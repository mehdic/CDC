/**
 * Order Status Tracker Component
 * Real-time tracking of order status with timeline visualization
 * Task T3-045: Implement order status tracking
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  CheckCircle as CompletedIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as PendingIcon,
  Build as ProcessingIcon,
} from '@mui/icons-material';
import { Order, OrderStatus } from '../hooks/useOrders';

interface OrderStatusTrackerProps {
  order: Order;
}

// ============================================================================
// Component
// ============================================================================

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ order }) => {
  // Define order status timeline
  const statusSteps = [
    {
      status: OrderStatus.PENDING,
      label: 'Commande créée',
      description: 'Votre commande a été reçue',
      icon: PendingIcon,
    },
    {
      status: OrderStatus.CONFIRMED,
      label: 'Confirmée',
      description: 'Votre commande a été confirmée',
      icon: CheckCircleIcon,
    },
    {
      status: OrderStatus.PROCESSING,
      label: 'En traitement',
      description: 'Votre commande est en préparation',
      icon: ProcessingIcon,
    },
    {
      status: OrderStatus.READY_FOR_PICKUP,
      label: 'Prête à retirer',
      description: 'Votre commande est prête à être retirée',
      icon: CheckCircleIcon,
    },
    {
      status: OrderStatus.OUT_FOR_DELIVERY,
      label: 'En livraison',
      description: 'Votre commande est en route',
      icon: ShippingIcon,
    },
    {
      status: OrderStatus.COMPLETED,
      label: 'Livrée',
      description: 'Votre commande a été livrée',
      icon: CompletedIcon,
    },
  ];

  // Get the current step index
  const currentStepIndex = statusSteps.findIndex((step) => step.status === order.status);

  // Determine completed steps
  const completedSteps = statusSteps.slice(0, currentStepIndex + 1);

  // Get status color
  const getStatusColor = (status: OrderStatus): 'success' | 'warning' | 'info' | 'error' | 'default' => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'success';
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return 'error';
      case OrderStatus.OUT_FOR_DELIVERY:
      case OrderStatus.PROCESSING:
        return 'warning';
      case OrderStatus.CONFIRMED:
        return 'info';
      default:
        return 'default';
    }
  };

  // Format timestamp
  const getFormattedDate = (dateString: string | undefined): string => {
    if (!dateString) return 'En attente';
    return new Date(dateString).toLocaleDateString('fr-CH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Suivi de votre commande
      </Typography>

      {/* Current Status Overview */}
      <Card sx={{ mb: 3, backgroundColor: 'primary.light' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                Statut actuel: {order.status.replace(/_/g, ' ')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dernière mise à jour: {getFormattedDate(order.updated_at)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Chip
                label={order.status.replace(/_/g, ' ')}
                color={getStatusColor(order.status)}
                size="medium"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Timeline Stepper */}
      <Stepper orientation="vertical" data-testid="order-status-timeline">
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <Step key={step.status} active={isCurrent} completed={isCompleted}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '1rem',
                    fontWeight: isCurrent ? 'bold' : 'normal',
                  },
                }}
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Box sx={{ pb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {step.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isCurrent
                      ? 'En cours'
                      : isCompleted
                      ? `Complété le ${getFormattedDate(
                          step.status === OrderStatus.CONFIRMED
                            ? order.confirmed_at
                            : step.status === OrderStatus.COMPLETED
                            ? order.completed_at
                            : order.updated_at
                        )}`
                      : 'En attente'}
                  </Typography>
                </Box>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>

      <Divider sx={{ my: 3 }} />

      {/* Delivery Information */}
      {order.delivery_method && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
            Informations de livraison
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Méthode de livraison
              </Typography>
              <Typography variant="body1">{order.delivery_method}</Typography>
            </Grid>
            {order.delivery_id && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  ID de livraison
                </Typography>
                <Typography variant="body1">{order.delivery_id}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Payment Information */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
          Paiement
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Statut du paiement
            </Typography>
            <Chip
              label={order.payment_status}
              color={order.payment_status === 'paid' ? 'success' : 'warning'}
              size="small"
            />
          </Grid>
          {order.paid_at && (
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Date de paiement
              </Typography>
              <Typography variant="body1">{getFormattedDate(order.paid_at)}</Typography>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Cancellation Reason */}
      {order.status === OrderStatus.CANCELLED && order.cancellation_reason && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'error.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Raison de l'annulation
          </Typography>
          <Typography variant="body2">{order.cancellation_reason}</Typography>
        </Box>
      )}

      {/* Notes */}
      {order.notes && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Notes
          </Typography>
          <Typography variant="body2">{order.notes}</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default OrderStatusTracker;
