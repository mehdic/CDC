/**
 * Order Management Page
 * E-commerce order processing, returns, refunds, and reporting
 * Task Group D - E-commerce & Order Management
 */

import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  ShoppingBag as OrdersIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import {
  useOrders,
  useProcessOrder,
  useReturnOrder,
  useRefundOrder,
  useSalesReport,
} from '../../../shared/hooks/useOrders';
import { OrderCard } from '../components/ecommerce/OrderCard';
import { useSnackbar } from 'notistack';

// ============================================================================
// Component
// ============================================================================

export const OrderManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [processDialog, setProcessDialog] = useState<{
    open: boolean;
    orderId: string | null;
  }>({
    open: false,
    orderId: null,
  });
  const [returnDialog, setReturnDialog] = useState<{
    open: boolean;
    orderId: string | null;
    reason: string;
  }>({
    open: false,
    orderId: null,
    reason: '',
  });
  const [refundDialog, setRefundDialog] = useState<{
    open: boolean;
    orderId: string | null;
  }>({
    open: false,
    orderId: null,
  });
  const [reportDateRange, setReportDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  // Fetch orders
  const { data: ordersData, isLoading, error, refetch } = useOrders();

  // Fetch sales report
  const { data: reportData, isLoading: reportLoading } = useSalesReport(reportDateRange);

  // Mutations
  const processOrderMutation = useProcessOrder();
  const returnOrderMutation = useReturnOrder();
  const refundOrderMutation = useRefundOrder();

  // Handlers
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleProcessOrder = (orderId: string) => {
    setProcessDialog({ open: true, orderId });
  };

  const handleProcessConfirm = async () => {
    if (!processDialog.orderId) return;

    try {
      await processOrderMutation.mutateAsync({
        orderId: processDialog.orderId,
      });

      enqueueSnackbar('Commande traitée avec succès', {
        variant: 'success',
        'data-testid': 'order-processed-toast',
      } as object);

      setProcessDialog({ open: false, orderId: null });
      refetch();
    } catch (err) {
      enqueueSnackbar('Erreur lors du traitement de la commande', { variant: 'error' });
    }
  };

  const handleReturn = (orderId: string) => {
    setReturnDialog({ open: true, orderId, reason: '' });
  };

  const handleReturnConfirm = async () => {
    if (!returnDialog.orderId || !returnDialog.reason) {
      enqueueSnackbar('Veuillez indiquer une raison pour le retour', {
        variant: 'warning',
      });
      return;
    }

    try {
      await returnOrderMutation.mutateAsync({
        orderId: returnDialog.orderId,
        reason: returnDialog.reason,
      });

      enqueueSnackbar('Retour enregistré', {
        variant: 'success',
        'data-testid': 'return-processed-toast',
      } as object);

      setReturnDialog({ open: false, orderId: null, reason: '' });
      refetch();
    } catch (err) {
      enqueueSnackbar('Erreur lors de l\'enregistrement du retour', {
        variant: 'error',
      });
    }
  };

  const handleRefund = (orderId: string) => {
    setRefundDialog({ open: true, orderId });
  };

  const handleRefundConfirm = async () => {
    if (!refundDialog.orderId) return;

    try {
      await refundOrderMutation.mutateAsync({
        orderId: refundDialog.orderId,
      });

      enqueueSnackbar('Remboursement traité', {
        variant: 'success',
        'data-testid': 'refund-processed-toast',
      } as object);

      setRefundDialog({ open: false, orderId: null });
      refetch();
    } catch (err) {
      enqueueSnackbar('Erreur lors du remboursement', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Gestion des commandes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Traitez les commandes, retours et générez des rapports
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Commandes" icon={<OrdersIcon />} iconPosition="start" />
          <Tab label="Rapports" icon={<ReportIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Panel: Orders */}
      {activeTab === 0 && (
        <Box>
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
          {!isLoading && ordersData && (
            <Box data-testid="orders-list">
              <Typography variant="h6" sx={{ mb: 2 }}>
                {ordersData.total} commande(s) trouvée(s)
              </Typography>
              <Grid container spacing={2}>
                {ordersData.orders.map((order) => (
                  <Grid item xs={12} key={order.id}>
                    <OrderCard
                      order={order}
                      onProcess={handleProcessOrder}
                      onReturn={handleReturn}
                      onRefund={handleRefund}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Empty State */}
          {!isLoading && ordersData && ordersData.orders.length === 0 && (
            <Paper sx={{ p: 8, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucune commande trouvée
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Les commandes apparaîtront ici lorsqu&apos;elles seront créées
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Tab Panel: Reports */}
      {activeTab === 1 && (
        <Box>
          {/* Date Range Picker */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Rapport ventes
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de début"
                  value={reportDateRange.start}
                  onChange={(e) =>
                    setReportDateRange({ ...reportDateRange, start: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de fin"
                  value={reportDateRange.end}
                  onChange={(e) =>
                    setReportDateRange({ ...reportDateRange, end: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Report Loading */}
          {reportLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Report Viewer */}
          {!reportLoading && reportData && (
            <Box data-testid="report-viewer">
              <Grid container spacing={3}>
                {/* Total Revenue */}
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Chiffre d&apos;affaires total
                      </Typography>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {reportData.report.totalRevenue.toFixed(2)} CHF
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Total Orders */}
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Total des commandes
                      </Typography>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {reportData.report.totalOrders}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Average Order Value */}
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Valeur moyenne de commande
                      </Typography>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {reportData.report.averageOrderValue.toFixed(2)} CHF
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Top Products */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Produits les plus vendus
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 2 }}>
                        {reportData.report.topProducts.map((product, idx) => (
                          <Box
                            key={idx}
                            display="flex"
                            justifyContent="space-between"
                            sx={{ p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}
                          >
                            <Typography variant="body1">{product.name}</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {product.revenue.toFixed(2)} CHF
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      )}

      {/* Process Order Dialog */}
      <Dialog
        open={processDialog.open}
        onClose={() => setProcessDialog({ open: false, orderId: null })}
      >
        <DialogTitle>Traiter la commande</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir traiter cette commande ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessDialog({ open: false, orderId: null })}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleProcessConfirm}
            disabled={processOrderMutation.isPending}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Order Dialog */}
      <Dialog
        open={returnDialog.open}
        onClose={() => setReturnDialog({ open: false, orderId: null, reason: '' })}
      >
        <DialogTitle>Retourner la commande</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2, minWidth: 400 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Raison du retour"
              value={returnDialog.reason}
              onChange={(e) =>
                setReturnDialog({ ...returnDialog, reason: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setReturnDialog({ open: false, orderId: null, reason: '' })}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleReturnConfirm}
            disabled={returnOrderMutation.isPending}
          >
            Confirmer retour
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refund Order Dialog */}
      <Dialog
        open={refundDialog.open}
        onClose={() => setRefundDialog({ open: false, orderId: null })}
      >
        <DialogTitle>Rembourser la commande</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir rembourser cette commande ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialog({ open: false, orderId: null })}>
            Annuler
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRefundConfirm}
            disabled={refundOrderMutation.isPending}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderManagement;
