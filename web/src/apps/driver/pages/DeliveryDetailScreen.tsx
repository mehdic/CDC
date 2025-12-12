/**
 * Delivery Detail Screen
 * Shows comprehensive information about a single delivery
 * Part of T8-020: Delivery Request List & Detail
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocalShipping as DeliveryIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { useDeliveryData, Delivery, DeliveryStatus } from '../../../shared/hooks/useDelivery';
import { PriorityBadge } from '../components/delivery/PriorityBadge';

export interface DeliveryDetailScreenProps {
  deliveryId: string;
  onBack?: () => void;
}

const getStatusIcon = (status: DeliveryStatus) => {
  switch (status) {
    case DeliveryStatus.DELIVERED:
      return <CheckIcon sx={{ color: '#4caf50' }} />;
    case DeliveryStatus.FAILED:
      return <ErrorIcon sx={{ color: '#d32f2f' }} />;
    case DeliveryStatus.IN_TRANSIT:
      return <DeliveryIcon sx={{ color: '#ff9800' }} />;
    default:
      return <WarningIcon sx={{ color: '#2196f3' }} />;
  }
};

const getStatusColor = (status: DeliveryStatus): 'default' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case DeliveryStatus.DELIVERED:
      return 'success';
    case DeliveryStatus.FAILED:
      return 'error';
    case DeliveryStatus.IN_TRANSIT:
      return 'warning';
    case DeliveryStatus.ASSIGNED:
    case DeliveryStatus.PENDING:
      return 'info';
    default:
      return 'default';
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getDeliveryAddress = (delivery: Delivery): string => {
  if (delivery.tracking_info?.address) {
    return String(delivery.tracking_info.address);
  }
  return 'Address not available';
};

export const DeliveryDetailScreen: React.FC<DeliveryDetailScreenProps> = ({
  deliveryId,
  onBack,
}) => {
  const { fetchDelivery } = useDeliveryData();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDelivery = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDelivery(deliveryId);
        if (data) {
          setDelivery(data);
        } else {
          setError('Failed to load delivery details');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load delivery';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadDelivery();
  }, [deliveryId, fetchDelivery]);

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !delivery) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={onBack}
          sx={{ mb: 2 }}
          data-testid="delivery-detail-back-button"
        >
          Back
        </Button>
        <Alert severity="error">{error || 'Delivery not found'}</Alert>
      </Box>
    );
  }

  const address = getDeliveryAddress(delivery);
  const statusColor = getStatusColor(delivery.status);
  const statusIcon = getStatusIcon(delivery.status);

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Back Button */}
      <Button
        startIcon={<BackIcon />}
        onClick={onBack}
        sx={{ mb: 3 }}
        data-testid="delivery-detail-back-button"
      >
        Back to List
      </Button>

      {/* Header Card */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#fff' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {statusIcon}
              <Chip
                label={delivery.status.replace(/_/g, ' ').toUpperCase()}
                color={statusColor}
                variant="outlined"
                data-testid={`delivery-detail-status-${delivery.id}`}
              />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Delivery to {delivery.user_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {delivery.id}
            </Typography>
          </Box>
          <PriorityBadge
            isControlledSubstance={delivery.tracking_info?.contains_controlled_substance === true}
            requiresTemperatureControl={delivery.tracking_info?.requires_temperature_control === true}
            isUrgent={delivery.status === DeliveryStatus.IN_TRANSIT}
          />
        </Box>
      </Paper>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Delivery Information */}
        <Grid item xs={12} md={6}>
          <Card data-testid="delivery-detail-info-card">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Delivery Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  ADDRESS
                </Typography>
                <Typography variant="body2">{address}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  TRACKING NUMBER
                </Typography>
                <Typography variant="body2">
                  {delivery.tracking_number || 'Not assigned'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  ORDER ID
                </Typography>
                <Typography variant="body2">
                  {delivery.order_id || 'Not linked to order'}
                </Typography>
              </Box>

              {delivery.tracking_info?.special_handling_instructions && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ p: 1, backgroundColor: '#fff3cd', borderRadius: 1, borderLeft: '3px solid #ffc107' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      SPECIAL HANDLING
                    </Typography>
                    <Typography variant="body2">
                      {String(delivery.tracking_info.special_handling_instructions)}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Timeline */}
        <Grid item xs={12} md={6}>
          <Card data-testid="delivery-detail-timeline-card">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Timeline
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <TimeIcon sx={{ mt: 0.5, color: '#9e9e9e' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    CREATED
                  </Typography>
                  <Typography variant="body2">{formatDate(delivery.created_at)}</Typography>
                </Box>
              </Box>

              {delivery.scheduled_at && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <TimeIcon sx={{ mt: 0.5, color: '#2196f3' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        SCHEDULED
                      </Typography>
                      <Typography variant="body2">{formatDate(delivery.scheduled_at)}</Typography>
                    </Box>
                  </Box>
                </>
              )}

              {delivery.picked_up_at && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <TimeIcon sx={{ mt: 0.5, color: '#ff9800' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        PICKED UP
                      </Typography>
                      <Typography variant="body2">{formatDate(delivery.picked_up_at)}</Typography>
                    </Box>
                  </Box>
                </>
              )}

              {delivery.delivered_at && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <CheckIcon sx={{ mt: 0.5, color: '#4caf50' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        DELIVERED
                      </Typography>
                      <Typography variant="body2">{formatDate(delivery.delivered_at)}</Typography>
                    </Box>
                  </Box>
                </>
              )}

              {delivery.failed_at && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <ErrorIcon sx={{ mt: 0.5, color: '#d32f2f' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        FAILED
                      </Typography>
                      <Typography variant="body2">{formatDate(delivery.failed_at)}</Typography>
                      {delivery.failure_reason && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                          Reason: {delivery.failure_reason}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </>
              )}

              {!delivery.delivered_at && !delivery.failed_at && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Pending delivery completion...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Special Requirements */}
        <Grid item xs={12}>
          <Card data-testid="delivery-detail-requirements-card">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Special Requirements
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                {delivery.tracking_info?.requires_temperature_control === true && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, borderLeft: '3px solid #1976d2' }}>
                      <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        COLD CHAIN REQUIRED
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Temperature range: {String(delivery.tracking_info?.temperature_range_min || 'N/A')}°C - {String(delivery.tracking_info?.temperature_range_max || 'N/A')}°C
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Max duration: {String(delivery.tracking_info?.max_delivery_duration_minutes || 'Not specified')} minutes
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {delivery.tracking_info?.contains_controlled_substance === true && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, backgroundColor: '#fff3e0', borderRadius: 1, borderLeft: '3px solid #f57c00' }}>
                      <Typography variant="caption" sx={{ color: '#f57c00', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        CONTROLLED SUBSTANCE
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Schedule: {String(delivery.tracking_info?.substance_schedule || 'Not specified')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Requires signature: {delivery.tracking_info?.requires_signature === true ? 'Yes' : 'No'}
                      </Typography>
                      {delivery.tracking_info?.age_verification_required === true && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Age verification required
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}

                {!delivery.tracking_info?.requires_temperature_control &&
                  !delivery.tracking_info?.contains_controlled_substance && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        No special requirements for this delivery
                      </Typography>
                    </Grid>
                  )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeliveryDetailScreen;
