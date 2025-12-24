/**
 * Delivery Map Component
 * T8-042: Patient Delivery Tracking
 * Interactive map showing driver location and route
 */

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { Box, Paper, Typography, Chip } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinates } from '../types/tracking';

// Fix Leaflet default icon issue with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/**
 * Custom Icons
 */
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Props
 */
export interface DeliveryMapProps {
  driverLocation: Coordinates | null;
  destinationLocation: Coordinates;
  locationHistory?: Coordinates[];
  driverName?: string;
  etaMinutes?: number | null;
}

/**
 * Map Auto-Center Component
 */
const MapAutoCenter: React.FC<{ center: [number, number]; zoom?: number }> = ({
  center,
  zoom = 13,
}) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

/**
 * Delivery Map Component
 */
export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  driverLocation,
  destinationLocation,
  locationHistory = [],
  driverName = 'Driver',
  etaMinutes,
}) => {
  const mapRef = useRef<L.Map | null>(null);

  // Calculate map center (between driver and destination, or just destination)
  const mapCenter: [number, number] = driverLocation
    ? [
        (driverLocation.latitude + destinationLocation.latitude) / 2,
        (driverLocation.longitude + destinationLocation.longitude) / 2,
      ]
    : [destinationLocation.latitude, destinationLocation.longitude];

  // Convert location history to polyline coordinates
  const routeCoordinates: [number, number][] = locationHistory.map((loc) => [
    loc.latitude,
    loc.longitude,
  ]);

  // Add current location to route if available
  if (driverLocation) {
    routeCoordinates.push([driverLocation.latitude, driverLocation.longitude]);
  }

  return (
    <Paper elevation={3} sx={{ height: 500, overflow: 'hidden', position: 'relative' }}>
      {/* Connection Status Badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Chip
          label={driverLocation ? 'Live Tracking' : 'Waiting for location...'}
          color={driverLocation ? 'success' : 'default'}
          size="small"
        />
      </Box>

      {driverLocation ? (
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={(ref) => {
            if (ref) mapRef.current = ref;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Auto-center map */}
          <MapAutoCenter center={mapCenter} />

          {/* Driver Marker */}
          <Marker position={[driverLocation.latitude, driverLocation.longitude]} icon={driverIcon}>
            <Popup>
              <Typography variant="subtitle2">{driverName}</Typography>
              <Typography variant="caption">
                {etaMinutes !== null
                  ? `ETA: ${etaMinutes} min`
                  : 'Calculating ETA...'}
              </Typography>
            </Popup>
          </Marker>

          {/* Destination Marker */}
          <Marker
            position={[destinationLocation.latitude, destinationLocation.longitude]}
            icon={destinationIcon}
          >
            <Popup>
              <Typography variant="subtitle2">Your Location</Typography>
              <Typography variant="caption">Delivery destination</Typography>
            </Popup>
          </Marker>

          {/* Route Polyline */}
          {routeCoordinates.length > 1 && (
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: '#1976d2',
                weight: 4,
                opacity: 0.7,
              }}
            />
          )}
        </MapContainer>
      ) : (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Waiting for driver location...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live tracking will appear once the driver starts the delivery
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
