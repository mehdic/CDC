/**
 * Order History Component
 * Display list of patient/user orders with filtering and pagination
 * Task T3-044: Create order history frontend
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
  TextField,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
} from '@mui/icons-material';
import { useOrders, Order, OrderStatus } from '../hooks/useOrders';

// ============================================================================
// Component
// ============================================================================

export const OrderHistory: React.FC = () => {
  // State for filtering
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 10;

  // Fetch orders
  const filters = {
    ...(statusFilter && { status: [statusFilter as OrderStatus] }),
    limit,
    offset: (page - 1) * limit,
  };

  const { data: ordersData, isLoading, error } = useOrders(filters);

  // Handle pagination change
  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  // Calculate total pages
  const totalPages = ordersData ? Math.ceil(ordersData.total / limit) : 1;

  // Filter orders by search query if provided
  const filteredOrders =
    ordersData && searchQuery
      ? ordersData.orders.filter(
          (order) =>
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.items.some((item) =>
              item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
      : ordersData?.orders || [];

  // Get status color
  const getStatusColor = (status: OrderStatus): 'success' | 'error' | 'warning' | 'info' | 'default' => {
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

  // Get status icon
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return <CompletedIcon sx={{ fontSize: 20 }} />;
      case OrderStatus.OUT_FOR_DELIVERY:
        return <ShippingIcon sx={{ fontSize: 20 }} />;
      case OrderStatus.CANCELLED:
        return <CancelledIcon sx={{ fontSize: 20 }} />;
      default:
        return <OrderIcon sx={{ fontSize: 20 }} />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Mon historique de commandes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consultez vos commandes passées et suivez votre livraison
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher une commande..."
              size="small"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              data-testid="search-input"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              placeholder="Filtrer par statut"
              size="small"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderStatus | '');
                setPage(1); // Reset to first page on filter change
              }}
              SelectProps={{
                native: true,
              }}
              data-testid="status-filter"
            >
              <option value="">Tous les statuts</option>
              <option value={OrderStatus.PENDING}>En attente</option>
              <option value={OrderStatus.CONFIRMED}>Confirmée</option>
              <option value={OrderStatus.PROCESSING}>En traitement</option>
              <option value={OrderStatus.READY_FOR_PICKUP}>Prête à retirer</option>
              <option value={OrderStatus.OUT_FOR_DELIVERY}>En livraison</option>
              <option value={OrderStatus.COMPLETED}>Livrée</option>
              <option value={OrderStatus.CANCELLED}>Annulée</option>
              <option value={OrderStatus.REFUNDED}>Remboursée</option>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erreur lors du chargement des commandes: {error.message}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Orders List */}
      {!isLoading && filteredOrders.length > 0 && (
        <Box data-testid="orders-list">
          <Stack spacing={2}>
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                data-testid={`order-${order.id}`}
                sx={{
                  '&:hover': {
                    boxShadow: 3,
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    {/* Order Number and Date */}
                    <Grid item xs={12} md={3}>
                      <Typography variant="h6" data-testid={`order-date-${order.id}`}>
                        Commande #{order.id.substring(0, 8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.created_at).toLocaleDateString('fr-CH')}
                      </Typography>
                    </Grid>

                    {/* Status Badge */}
                    <Grid item xs={12} md={3}>
                      <Chip
                        icon={getStatusIcon(order.status)}
                        label={order.status.replace(/_/g, ' ')}
                        color={getStatusColor(order.status)}
                        data-testid={`order-status-${order.id}`}
                      />
                    </Grid>

                    {/* Items Summary */}
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        {order.items.length} article(s)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.items.map((item) => item.product_name).join(', ').substring(0, 30)}
                        {order.items.map((item) => item.product_name).join(', ').length > 30
                          ? '...'
                          : ''}
                      </Typography>
                    </Grid>

                    {/* Total Amount */}
                    <Grid item xs={12} md={3}>
                      <Typography
                        variant="h6"
                        data-testid={`order-total-${order.id}`}
                        sx={{ fontWeight: 'bold' }}
                      >
                        {order.total_amount.toFixed(2)} CHF
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} unité(s)
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button
                    href={`/orders/${order.id}`}
                    data-testid={`order-link-${order.id}`}
                    size="small"
                  >
                    Voir détails
                  </Button>
                  {order.status === OrderStatus.COMPLETED && (
                    <>
                      <Button size="small" href={`/orders/${order.id}/invoice`}>
                        Télécharger facture
                      </Button>
                      <Button size="small">Recomander</Button>
                    </>
                  )}
                </CardActions>
              </Card>
            ))}
          </Stack>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && filteredOrders.length === 0 && (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <OrderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery || statusFilter ? 'Aucune commande trouvée' : 'Pas encore de commande'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || statusFilter
              ? 'Essayez de modifier vos critères de recherche'
              : 'Vos commandes apparaîtront ici'}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default OrderHistory;
