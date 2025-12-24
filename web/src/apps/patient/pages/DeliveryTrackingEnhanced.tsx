/**
 * Enhanced Patient Delivery Tracking Page
 * T8-042: Patient Delivery Tracking (Uber-style)
 * Complete real-time delivery tracking with map, timeline, notifications, and rating
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Grid,
} from '@mui/material';
import { ArrowBack as BackIcon, Refresh as RefreshIcon } from '@mui/icons-material';

// Feature components
import { DeliveryMap } from '../features/delivery-tracking/components/DeliveryMap';
import { DeliveryStatusTimeline } from '../features/delivery-tracking/components/DeliveryStatusTimeline';
import { DriverContactCard } from '../features/delivery-tracking/components/DriverContactCard';
import { DeliveryProofViewer } from '../features/delivery-tracking/components/DeliveryProofViewer';
import { DeliveryRating } from '../features/delivery-tracking/components/DeliveryRating';
import {
  NotificationBanner,
  requestNotificationPermission,
} from '../features/delivery-tracking/components/NotificationBanner';

// Hooks
import { useDeliveryTracking } from '../features/delivery-tracking/hooks/useDeliveryTracking';

// Types
import type { Coordinates } from '../features/delivery-tracking/types/tracking';

/**
 * Enhanced Patient Delivery Tracking Page
 */
const DeliveryTrackingEnhanced: React.FC = () => {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();

  // Placeholder patient location (in production, get from user profile)
  const patientLocation: Coordinates = {
    latitude: 46.8182,
    longitude: 8.2275,
  };

  // Delivery tracking hook
  const {
    tracking,
    loading,
    error,
    connected,
    isUsingPolling,
    notifications,
    refetch,
    markNotificationRead,
  } = useDeliveryTracking({
    deliveryId: deliveryId || '',
    onNotification: (notification) => {
      console.log('[Page] New notification:', notification);
    },
  });

  /**
   * Request Notification Permission on Mount
   */
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  /**
   * Handle Driver Call
   */
  const handleDriverCall = () => {
    if (tracking?.driver_info?.phone) {
      window.location.href = `tel:${tracking.driver_info.phone}`;
    } else {
      alert('Driver phone number not available');
    }
  };

  /**
   * Handle Driver Chat
   */
  const handleDriverChat = () => {
    // Navigate to messaging interface (to be implemented)
    alert('Chat feature coming soon!');
  };

  /**
   * Handle Rating Submit
   */
  const handleRatingSubmit = async (rating: { rating: number; comment?: string }) => {
    if (!deliveryId || !tracking?.driver_info) {
      throw new Error('Missing delivery or driver information');
    }

    // In production, send to backend API
    console.log('[Page] Submitting rating:', {
      delivery_id: deliveryId,
      driver_id: tracking.driver_info.id,
      ...rating,
    });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    alert('Thank you for your rating!');
  };

  /**
   * Format ETA
   */
  const formatETA = (minutes: number | null): string => {
    if (!minutes) return 'Calculating...';
    if (minutes < 1) return 'Arriving now!';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  /**
   * Get Status Color
   */
  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'assigned':
      case 'accepted':
        return 'primary';
      case 'in_transit':
        return 'secondary';
      case 'delivered':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  /**
   * Render Loading State
   */
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading delivery tracking...
        </Typography>
      </Container>
    );
  }

  /**
   * Render Error State
   */
  if (error || !tracking) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error?.message || 'Delivery not found'}</Alert>
        <Box sx={{ mt: 2 }}>
          <IconButton onClick={() => navigate('/orders')}>
            <BackIcon />
          </IconButton>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Notification Banner */}
      <NotificationBanner
        notifications={notifications}
        onNotificationRead={markNotificationRead}
      />

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Delivery Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Delivery ID: {tracking.delivery_id}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={refetch} title="Refresh">
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={() => navigate('/orders')}>
            <BackIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Connection Status */}
      <Box sx={{ mb: 2 }}>
        <Chip
          label={
            connected
              ? 'Live Updates'
              : isUsingPolling
              ? 'Polling Updates (10s)'
              : 'Disconnected'
          }
          color={connected ? 'success' : isUsingPolling ? 'warning' : 'error'}
          size="small"
        />
      </Box>

      {/* Status & ETA Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                Status
              </Typography>
              <Chip
                label={tracking.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(tracking.status)}
                sx={{ mt: 1 }}
              />
            </Grid>

            {tracking.eta_minutes !== null && (
              <Grid item xs={12} sm={4} textAlign="center">
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatETA(tracking.eta_minutes)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                  Estimated Time of Arrival
                </Typography>
              </Grid>
            )}

            {tracking.distance_remaining_km !== null && (
              <Grid item xs={12} sm={4} textAlign="right">
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {tracking.distance_remaining_km} km
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                  Distance Remaining
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Map */}
      <DeliveryMap
        driverLocation={tracking.current_location}
        destinationLocation={tracking.destination_location || patientLocation}
        locationHistory={tracking.location_history}
        driverName={tracking.driver_info?.name}
        etaMinutes={tracking.eta_minutes}
      />

      {/* Driver Contact Card */}
      <Box sx={{ mt: 3 }}>
        <DriverContactCard
          driver={tracking.driver_info}
          onCall={handleDriverCall}
          onChat={handleDriverChat}
        />
      </Box>

      {/* Delivery Proof (only if delivered) */}
      {tracking.status === 'delivered' && tracking.delivery_proof && (
        <DeliveryProofViewer proof={tracking.delivery_proof} />
      )}

      {/* Rating (only if delivered and no rating yet) */}
      {tracking.status === 'delivered' && tracking.driver_info && (
        <DeliveryRating
          deliveryId={tracking.delivery_id}
          driverId={tracking.driver_info.id}
          existingRating={tracking.rating}
          onSubmit={handleRatingSubmit}
        />
      )}

      {/* Timeline */}
      <DeliveryStatusTimeline
        status={tracking.status}
        createdAt={tracking.created_at}
        pickedUpAt={tracking.picked_up_at}
        deliveredAt={tracking.delivered_at}
      />
    </Container>
  );
};

export default DeliveryTrackingEnhanced;
