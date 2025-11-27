/**
 * Order Detail Component
 * Display detailed information about a single order with status tracking
 * Task T3-045: Implement order status tracking
 */

import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  Download as DownloadIcon,
  Repeat as ReorderIcon,
} from '@mui/icons-material';
import { useOrder, Order, OrderStatus } from '../hooks/useOrders';

interface OrderDetailProps {
  orderId: string;
}

// ============================================================================
// Component
// ============================================================================

export const OrderDetail: React.FC<OrderDetailProps> = ({ orderId }) => {
  const [openReorderDialog, setOpenReorderDialog] = useState(false);

  // Fetch order
  const { data: orderData, isLoading, error } = useOrder(orderId);
  const order = orderData?.order;

  // Define order status timeline
  const statusTimeline = [
    {
      status: OrderStatus.PENDING,
      label: 'Commande créée',
      completed: order ? order.status !== OrderStatus.PENDING : false,
    },
    {
      status: OrderStatus.CONFIRMED,
      label: 'Confirmée',
      completed: order ? [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.COMPLETED].includes(order.status) : false,
    },
    {
      status: OrderStatus.PROCESSING,
      label: 'En traitement',
      completed: order ? [OrderStatus.PROCESSING, OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.COMPLETED].includes(order.status) : false,
    },
    {
      status: OrderStatus.READY_FOR_PICKUP,
      label: 'Prête à retirer',
      completed: order ? [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.COMPLETED].includes(order.status) : false,
    },
    {
      status: OrderStatus.OUT_FOR_DELIVERY,
      label: 'En livraison',
      completed: order ? [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.COMPLETED].includes(order.status) : false,
    },
    {
      status: OrderStatus.COMPLETED,
      label: 'Livrée',
      completed: order ? order.status === OrderStatus.COMPLETED : false,
    },
  ];

  // Get status color
  const getStatusColor = (status: OrderStatus) => {
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

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error ? `Erreur: ${error.message}` : 'Commande introuvable'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" fontWeight="bold" data-testid="order-number">
              Commande #{order.id.substring(0, 8)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Créée le {new Date(order.created_at).toLocaleDateString('fr-CH')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Chip
              label={order.status.replace(/_/g, ' ')}
              color={getStatusColor(order.status) as any}
              size="medium"
              data-testid="order-status"
            />
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Order Details */}
        <Grid item xs={12} md={8}>
          {/* Order Items */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Articles commandés
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {order.items.map((item, idx) => (
                <ListItem key={idx} data-testid={`order-item-${item.product_id}`}>
                  <ListItemText
                    primary={
                      <Typography data-testid={`item-name-${item.product_id}`}>
                        {item.product_name}
                      </Typography>
                    }
                    secondary={`Quantité: ${item.quantity} × ${item.unit_price.toFixed(2)} CHF`}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {item.total_price.toFixed(2)} CHF
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Order Summary */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Résumé de la commande
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} md={4}>
                <Typography color="text.secondary" variant="body2">
                  Sous-total
                </Typography>
                <Typography data-testid="order-subtotal" variant="body1" sx={{ fontWeight: 'bold' }}>
                  {order.subtotal.toFixed(2)} CHF
                </Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography color="text.secondary" variant="body2">
                  Taxes
                </Typography>
                <Typography data-testid="order-tax" variant="body1" sx={{ fontWeight: 'bold' }}>
                  {order.tax_amount.toFixed(2)} CHF
                </Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography color="text.secondary" variant="body2">
                  Livraison
                </Typography>
                <Typography data-testid="order-shipping" variant="body1" sx={{ fontWeight: 'bold' }}>
                  {order.shipping_cost.toFixed(2)} CHF
                </Typography>
              </Grid>
              {order.discount_amount > 0 && (
                <Grid item xs={6} md={4}>
                  <Typography color="text.secondary" variant="body2">
                    Réduction
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    -{order.discount_amount.toFixed(2)} CHF
                  </Typography>
                </Grid>
              )}
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Total
              </Typography>
              <Typography
                data-testid="order-total"
                variant="h5"
                sx={{ fontWeight: 'bold', color: 'primary.main' }}
              >
                {order.total_amount.toFixed(2)} CHF
              </Typography>
            </Box>
          </Paper>

          {/* Delivery Address */}
          {order.delivery_method && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Livraison
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Méthode: {order.delivery_method}
              </Typography>
              <Typography data-testid="delivery-address" variant="body2">
                Adresse de livraison stockée de manière sécurisée
              </Typography>
            </Paper>
          )}

          {/* Status Timeline */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Suivi de la commande
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stepper orientation="vertical" data-testid="status-timeline">
              {statusTimeline
                .filter((step) => step.status !== OrderStatus.CANCELLED && step.status !== OrderStatus.REFUNDED)
                .map((step, index) => (
                  <Step key={step.status} active={order.status === step.status} completed={step.completed}>
                    <StepLabel>{step.label}</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {step.completed
                          ? `Complété le ${new Date(order.created_at).toLocaleDateString('fr-CH')}`
                          : 'En attente'}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Right Column: Actions and Info */}
        <Grid item xs={12} md={4}>
          {/* Payment Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Paiement
              </Typography>
              <Chip
                label={order.payment_status}
                color={order.payment_status === 'paid' ? 'success' : 'warning'}
                fullWidth
                sx={{ mb: 2 }}
              />
              {order.payment_method && (
                <Typography variant="body2" color="text.secondary">
                  Méthode: {order.payment_method}
                </Typography>
              )}
              {order.paid_at && (
                <Typography variant="body2" color="text.secondary">
                  Payé le {new Date(order.paid_at).toLocaleDateString('fr-CH')}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Order Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Actions
              </Typography>
            </CardContent>
            <CardActions sx={{ flexDirection: 'column', gap: 1 }}>
              {order.status === OrderStatus.COMPLETED && (
                <>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    href={`/orders/${order.id}/invoice`}
                    data-testid="download-invoice-btn"
                  >
                    Télécharger facture
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ReorderIcon />}
                    onClick={() => setOpenReorderDialog(true)}
                    data-testid="reorder-btn"
                  >
                    Recomander
                  </Button>
                </>
              )}
              {[OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status) && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  data-testid="cancel-btn"
                >
                  Annuler la commande
                </Button>
              )}
              {[OrderStatus.OUT_FOR_DELIVERY, OrderStatus.COMPLETED].includes(order.status) && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  data-testid="return-btn"
                >
                  Retourner
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Reorder Dialog */}
      <Dialog open={openReorderDialog} onClose={() => setOpenReorderDialog(false)}>
        <DialogTitle>Recomander</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 2 }}>
            {order.items.length} article(s) seront ajoutés à votre panier
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReorderDialog(false)}>Annuler</Button>
          <Button variant="contained" href="/cart">
            Continuer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderDetail;
