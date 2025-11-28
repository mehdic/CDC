/**
 * Patient Delivery Tracking Page
 * T3-054: Create Patient Tracking View
 * Real-time GPS tracking of delivery with interactive map, ETA, and driver info
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Chat as ChatIcon,
  LocalShipping as TruckIcon,
  Home as HomeIcon,
  CheckCircle as CheckIcon,
  AccessTime as ClockIcon,
  MyLocation as LocationIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * Interfaces
 */
interface Coordinates {
  latitude: number;
  longitude: number;
  timestamp?: string;
}

interface DriverInfo {
  id: string;
  name: string;
  photo_url?: string;
}

interface DeliveryTracking {
  delivery_id: string;
  status: string;
  current_location: Coordinates | null;
  eta_minutes: number | null;
  distance_remaining_km: number | null;
  location_history: Coordinates[];
  driver_info: DriverInfo | null;
  last_updated: string | null;
}

/**
 * Map Auto-Center Component
 */
const MapAutoCenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
};

/**
 * Patient Delivery Tracking Page Component
 */
const PatientDeliveryTracking: React.FC = () => {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();

  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Placeholder patient location (in production, get from user profile)
  const patientLocation: Coordinates = {
    latitude: 46.8182,
    longitude: 8.2275,
  };

  /**
   * Fetch Delivery Tracking Data
   */
  const fetchTracking = async () => {
    if (!deliveryId) return;

    try {
      const response = await fetch(`http://localhost:4005/tracking/${deliveryId}`, {
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth token
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tracking data');
      }

      const data: DeliveryTracking = await response.json();
      setTracking(data);
      setError(null);
    } catch (err: any) {
      console.error('Fetch tracking error:', err);
      setError(err.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-refresh tracking data every 10 seconds
   */
  useEffect(() => {
    fetchTracking();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchTracking();
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [deliveryId, autoRefresh]);

  /**
   * Format ETA Minutes to Human-Readable String
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
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'assigned':
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
        <Alert severity="error">
          {error || 'Delivery not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/orders')}
          sx={{ mt: 2 }}
        >
          Back to Orders
        </Button>
      </Container>
    );
  }

  // Calculate map center (between driver and patient, or just patient if no driver location)
  const mapCenter: [number, number] = tracking.current_location
    ? [
        (tracking.current_location.latitude + patientLocation.latitude) / 2,
        (tracking.current_location.longitude + patientLocation.longitude) / 2,
      ]
    : [patientLocation.latitude, patientLocation.longitude];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Delivery Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Delivery ID: {tracking.delivery_id}
          </Typography>
        </Box>
        <IconButton onClick={() => navigate('/orders')}>
          <BackIcon />
        </IconButton>
      </Box>

      {/* Status & ETA Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                Status
              </Typography>
              <Chip
                label={tracking.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(tracking.status)}
                sx={{ mt: 1 }}
              />
            </Box>

            {tracking.eta_minutes !== null && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {formatETA(tracking.eta_minutes)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                  Estimated Time of Arrival
                </Typography>
              </Box>
            )}

            {tracking.distance_remaining_km !== null && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {tracking.distance_remaining_km} km
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                  Distance Remaining
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Map */}
      <Paper elevation={3} sx={{ height: 500, mb: 3, overflow: 'hidden' }}>
        {tracking.current_location ? (
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapAutoCenter center={mapCenter} />

            {/* Driver Marker */}
            <Marker
              position={[tracking.current_location.latitude, tracking.current_location.longitude]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              })}
            >
              <Popup>
                <strong>Driver Location</strong>
                <br />
                {tracking.driver_info?.name || 'Delivery Personnel'}
              </Popup>
            </Marker>

            {/* Patient Marker */}
            <Marker
              position={[patientLocation.latitude, patientLocation.longitude]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              })}
            >
              <Popup>
                <strong>Your Location</strong>
                <br />
                Delivery destination
              </Popup>
            </Marker>

            {/* Route Line */}
            <Polyline
              positions={[
                [tracking.current_location.latitude, tracking.current_location.longitude],
                [patientLocation.latitude, patientLocation.longitude],
              ]}
              color="#667eea"
              weight={3}
              opacity={0.7}
              dashArray="10, 10"
            />
          </MapContainer>
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Waiting for driver location...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Driver Info Card */}
      {tracking.driver_info && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={tracking.driver_info.photo_url}
                  alt={tracking.driver_info.name}
                  sx={{ width: 64, height: 64 }}
                />
                <Box>
                  <Typography variant="h6">{tracking.driver_info.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your Delivery Personnel
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<PhoneIcon />}>
                  Call
                </Button>
                <Button variant="outlined" startIcon={<ChatIcon />}>
                  Chat
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Delivery Timeline */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Delivery Timeline
        </Typography>
        <Timeline position="alternate">
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {tracking.last_updated
                ? new Date(tracking.last_updated).toLocaleString()
                : 'Not started'}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color="success">
                <CheckIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6">Order Placed</Typography>
              <Typography>Your order has been confirmed</Typography>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {tracking.status === 'assigned' || tracking.status === 'in_transit'
                ? 'Assigned'
                : 'Pending'}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={tracking.status !== 'pending' ? 'primary' : 'grey'}>
                <TruckIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6">Assigned to Driver</Typography>
              <Typography>Driver has accepted your delivery</Typography>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {tracking.status === 'in_transit' ? 'In Progress' : 'Pending'}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={tracking.status === 'in_transit' ? 'secondary' : 'grey'}>
                <LocationIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6">Out for Delivery</Typography>
              <Typography>Driver is on the way</Typography>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {tracking.status === 'delivered' ? 'Completed' : 'Pending'}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={tracking.status === 'delivered' ? 'success' : 'grey'}>
                <HomeIcon />
              </TimelineDot>
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6">Delivered</Typography>
              <Typography>Order has been delivered successfully</Typography>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </Paper>
    </Container>
  );
};

export default PatientDeliveryTracking;
