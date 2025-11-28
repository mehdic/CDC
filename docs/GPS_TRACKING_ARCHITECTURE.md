# GPS Tracking Architecture
**Task: T3-051 - Design Delivery Tracking Architecture**
**Session:** bazinga_20251127_171232
**Group:** P1-GPS
**Author:** Senior Software Engineer

## Executive Summary

This document outlines the architecture for implementing real-time GPS tracking for the delivery system. The solution balances user privacy, battery efficiency, and real-time tracking requirements while integrating with existing delivery infrastructure.

## Current State Audit

### Existing Infrastructure ✅

**Backend Components:**
- **Delivery Service** (`backend/services/delivery-service/`)
  - TypeORM-based delivery entity with status tracking
  - REST API for delivery CRUD operations
  - Route optimizer service with TSP algorithm
  - Supports `tracking_info` JSON field (currently unused)

**Mobile Components:**
- **Geolocation Hook** (`mobile/delivery-app/src/hooks/useGeolocation.ts`)
  - React Native Geolocation integration
  - Permission handling (iOS/Android)
  - Background tracking support
  - 30-second update intervals with 50m distance filter
  - Redux integration for state management

**Frontend Components:**
- **DeliveryTracking.tsx** (Pharmacist view)
  - Timeline-based status display
  - No live GPS tracking
  - Shows static status updates only

**Mobile API Client:**
- **deliveryApi.ts** has stubs:
  ```typescript
  async updateLocation(location: Coordinates)
  async getLocationHistory(startDate, endDate)
  ```

### What's Missing ❌

1. **Backend WebSocket Server** - No real-time location broadcast
2. **Location History Storage** - `tracking_info` field exists but unused
3. **Patient Tracking View** - No patient-facing map interface
4. **Backend Location API** - Endpoints defined in mobile API but not implemented
5. **ETA Calculation** - No dynamic ETA based on real GPS data

## Architecture Design

### 1. **Real-Time Location Updates**

#### 1.1 Mobile Location Service
**Component:** `mobile/delivery-app/src/services/location-service.ts`

```typescript
class LocationService {
  // Background tracking modes
  - NORMAL: 30s intervals, 50m distance filter
  - BATTERY_SAVER: 60s intervals, 100m distance filter
  - HIGH_ACCURACY: 15s intervals, 20m distance filter

  // Batching strategy
  - Batch updates locally (SQLite)
  - Send every 30s OR when batch size reaches 5
  - Offline queue with retry logic

  // Privacy controls
  - Start tracking only when delivery accepted
  - Stop tracking when shift ends
  - Clear location history older than 24 hours
}
```

**Battery Optimization:**
- Use geofencing when near delivery zones (reduces GPS polling)
- Switch to BATTERY_SAVER mode when battery < 20%
- Adaptive tracking: HIGH_ACCURACY near destination, NORMAL in transit

#### 1.2 Backend Location API
**Endpoints:** `POST /api/deliveries/:id/location`

```typescript
interface LocationUpdate {
  delivery_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number; // m/s
  heading?: number; // degrees
  timestamp: string; // ISO 8601
  battery_level?: number; // percentage
}

// Validation:
// - GPS accuracy < 100m (reject low-quality updates)
// - Rate limit: Max 1 update per 10 seconds per delivery
// - Geofence validation: Location within reasonable delivery area
```

**Storage Strategy:**
```sql
-- Time-series table for location history
CREATE TABLE delivery_location_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_id VARCHAR(36) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  accuracy DECIMAL(6, 2),
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  timestamp DATETIME NOT NULL,
  INDEX idx_delivery_timestamp (delivery_id, timestamp)
);

-- Materialized view for latest location (fast queries)
CREATE TABLE delivery_current_location (
  delivery_id VARCHAR(36) PRIMARY KEY,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  accuracy DECIMAL(6, 2),
  last_updated DATETIME NOT NULL
);
```

### 2. **WebSocket Real-Time Broadcast**

#### 2.1 WebSocket Server Architecture
**Technology:** Socket.IO (existing in `dashboard-v2/`)

```
delivery-service:4005 (HTTP + WebSocket)
  ├── REST API endpoints
  └── WebSocket namespaces
      ├── /deliveries (admin/pharmacist)
      └── /tracking/:delivery_id (patient-specific)
```

**Event Flow:**
```
Mobile App
  └─> POST /deliveries/:id/location
        └─> Delivery Service
              ├─> Save to DB (location history)
              ├─> Update current_location table
              └─> Broadcast via WebSocket
                    ├─> ws://deliveries → All pharmacists
                    └─> ws://tracking/:id → Specific patient
```

#### 2.2 WebSocket Events

**Server → Client:**
```typescript
// Patient receives this
event: 'location_update'
payload: {
  delivery_id: string,
  driver_location: { lat, lng },
  eta_minutes: number,
  distance_remaining_km: number,
  last_updated: string
}

// Pharmacist receives this
event: 'driver_location_update'
payload: {
  delivery_id: string,
  driver_id: string,
  location: { lat, lng },
  status: DeliveryStatus,
  active_deliveries_count: number
}
```

**Client → Server:**
```typescript
// Subscribe to delivery updates
event: 'subscribe'
payload: { delivery_id: string, auth_token: string }

// Unsubscribe
event: 'unsubscribe'
payload: { delivery_id: string }
```

### 3. **ETA Calculation Engine**

```typescript
function calculateETA(
  currentLocation: Coordinates,
  destinationLocation: Coordinates,
  averageSpeed: number = 40 // km/h (derived from historical data)
): number {
  // Haversine distance (as-the-crow-flies)
  const straightLineDistance = haversineDistance(currentLocation, destinationLocation);

  // Apply routing factor (roads aren't straight lines)
  const routingFactor = 1.3; // 30% longer than straight line
  const actualDistance = straightLineDistance * routingFactor;

  // Calculate time
  const travelTimeHours = actualDistance / averageSpeed;
  const travelTimeMinutes = Math.ceil(travelTimeHours * 60);

  // Add buffer for stops (5 min per stop)
  const stopTimeMinutes = 5;

  return travelTimeMinutes + stopTimeMinutes;
}

// Enhanced ETA with traffic (future)
function calculateETAWithTraffic(
  currentLocation: Coordinates,
  destinationLocation: Coordinates,
  historicalSpeedData: SpeedProfile[]
): number {
  // Use historical speed data for time-of-day adjustments
  // Peak hours: reduce average speed by 30%
  // Off-peak: increase average speed by 10%
}
```

### 4. **Privacy & Security**

#### 4.1 Privacy Considerations

**Data Minimization:**
- Only track location during active deliveries
- Delete location history after 24 hours (GDPR compliance)
- No tracking when driver is off-shift

**Patient Privacy:**
- Patient sees only:
  - Driver's current location (not full history)
  - ETA (not driver's route)
  - Driver info (name, photo, contact)

**Driver Privacy:**
- Location shared only with:
  - Assigned delivery's patient
  - Pharmacist who assigned delivery
  - System admins (audit trail)

#### 4.2 Security Measures

**Authentication:**
- WebSocket connections require JWT token
- Patient can only subscribe to their own deliveries
- Driver location updates require valid driver auth token

**Rate Limiting:**
```typescript
// Per delivery per driver
- Max 1 location update per 10 seconds
- Max 6 updates per minute
- Violators: 15-minute cooldown
```

**Geofence Validation:**
```typescript
// Reject updates far from delivery area
function isLocationValid(
  location: Coordinates,
  deliveryAddress: Coordinates
): boolean {
  const distance = haversineDistance(location, deliveryAddress);
  const MAX_DELIVERY_RADIUS_KM = 50; // Reasonable for metro area
  return distance <= MAX_DELIVERY_RADIUS_KM;
}
```

### 5. **Battery Optimization Strategy**

#### 5.1 Adaptive Tracking Modes

```typescript
enum TrackingMode {
  HIGH_ACCURACY,   // Near destination (<2km)
  NORMAL,          // In transit (2-10km)
  BATTERY_SAVER,   // Far from destination (>10km) OR low battery
}

function determineTrackingMode(
  distanceToDestination: number,
  batteryLevel: number
): TrackingMode {
  if (batteryLevel < 20) return TrackingMode.BATTERY_SAVER;
  if (distanceToDestination < 2) return TrackingMode.HIGH_ACCURACY;
  if (distanceToDestination < 10) return TrackingMode.NORMAL;
  return TrackingMode.BATTERY_SAVER;
}

// Tracking mode configurations
const TRACKING_CONFIGS = {
  HIGH_ACCURACY: {
    interval: 15000, // 15s
    distanceFilter: 20, // 20m
  },
  NORMAL: {
    interval: 30000, // 30s
    distanceFilter: 50, // 50m
  },
  BATTERY_SAVER: {
    interval: 60000, // 60s
    distanceFilter: 100, // 100m
  },
};
```

#### 5.2 Geofencing for Battery Savings

```typescript
// Register geofences for delivery zones
function setupGeofences(deliveries: Delivery[]) {
  deliveries.forEach(delivery => {
    Geofencing.addCircularRegion({
      latitude: delivery.address.lat,
      longitude: delivery.address.lng,
      radius: 2000, // 2km radius
      identifier: delivery.id,
      notifyOnEntry: true, // Switch to HIGH_ACCURACY mode
      notifyOnExit: true,  // Switch back to NORMAL mode
    });
  });
}
```

#### 5.3 Background Task Management

**iOS:**
```typescript
// Use Background Tasks API
BackgroundTasks.register({
  taskName: 'location-update',
  taskFn: async () => {
    const location = await getCurrentPosition();
    await sendLocationUpdate(location);
  },
});
```

**Android:**
```typescript
// Use Foreground Service with notification
ForegroundService.start({
  taskName: 'Delivery GPS Tracking',
  taskDesc: 'Tracking your location for deliveries',
  taskIcon: 'ic_location',
});
```

### 6. **Patient Tracking View Architecture**

#### 6.1 Component Structure

```
DeliveryTracking.tsx (Patient)
  ├── MapView (Google Maps / Mapbox)
  │   ├── DriverMarker (animated)
  │   ├── PatientMarker (destination)
  │   └── RoutePolyline (dotted line)
  │
  ├── ETACard
  │   ├── Countdown timer
  │   ├── Distance remaining
  │   └── Delivery status
  │
  ├── DriverInfoCard
  │   ├── Driver photo
  │   ├── Driver name
  │   ├── Call button
  │   └── Chat button
  │
  └── DeliveryTimeline
      ├── Order placed ✓
      ├── Picked up ✓
      ├── In transit (current)
      └── Delivered (pending)
```

#### 6.2 Map Integration

**Technology:** React Leaflet (web) / react-native-maps (mobile)

**Map Features:**
- **Driver Marker:** Animated icon (car/motorcycle) with rotation based on heading
- **Patient Marker:** Home icon with pulse animation
- **Route Line:** Dotted polyline from driver to patient
- **Auto-center:** Map centers on driver location
- **Zoom Controls:** Manual zoom, "Center on me" button

**Real-Time Updates:**
```typescript
useEffect(() => {
  const socket = io(`${API_URL}/tracking/${deliveryId}`, {
    auth: { token: userToken },
  });

  socket.on('location_update', (data) => {
    setDriverLocation(data.driver_location);
    setETA(data.eta_minutes);
    setDistanceRemaining(data.distance_remaining_km);
  });

  return () => socket.disconnect();
}, [deliveryId]);
```

### 7. **Location History & Analytics**

#### 7.1 Location History API

```typescript
GET /api/deliveries/:id/tracking
Response: {
  delivery_id: string,
  current_location: Coordinates,
  eta_minutes: number,
  distance_remaining_km: number,
  location_history: Coordinates[], // Last 20 points
  status: DeliveryStatus,
  driver_info: {
    id: string,
    name: string,
    photo_url: string,
  }
}
```

#### 7.2 Time-Series Format

```json
{
  "location_history": [
    {
      "latitude": 46.8182,
      "longitude": 8.2275,
      "timestamp": "2025-11-27T18:00:00Z",
      "speed": 45.5,
      "heading": 135
    },
    // ... (last 20 updates)
  ]
}
```

### 8. **System Diagram**

```
┌─────────────────┐
│  Mobile App     │
│  (Delivery)     │
└────────┬────────┘
         │ POST /deliveries/:id/location
         │ (every 30s)
         ↓
┌─────────────────────────────────────────┐
│  Delivery Service (Node.js)             │
│  ├── REST API (Express)                 │
│  ├── WebSocket Server (Socket.IO)       │
│  ├── Location Validator                 │
│  └── ETA Calculator                     │
└───────┬─────────────────────┬───────────┘
        │                     │
        ↓                     ↓
┌───────────────┐      ┌──────────────┐
│  SQLite DB    │      │  WebSocket   │
│  ├── location_│      │  Broadcasts  │
│  │   history  │      └──────┬───────┘
│  └── current_ │             │
│      location │             ↓
└───────────────┘      ┌─────────────────┐
                       │  Patient App    │
                       │  ├── Map View   │
                       │  ├── ETA Card   │
                       │  └── Timeline   │
                       └─────────────────┘
```

## Implementation Plan

### Phase 1: Backend API (T3-053)
1. Create location history table migration
2. Implement POST /deliveries/:id/location endpoint
3. Add location validation and rate limiting
4. Implement GET /deliveries/:id/tracking endpoint
5. Add ETA calculation logic

### Phase 2: WebSocket Server (T3-053)
1. Set up Socket.IO in delivery-service
2. Implement location broadcast events
3. Add authentication middleware
4. Test real-time updates

### Phase 3: Mobile Location Service (T3-052)
1. Enhance existing useGeolocation hook
2. Implement adaptive tracking modes
3. Add geofencing support
4. Implement batch upload with offline queue
5. Add battery monitoring

### Phase 4: Patient Tracking View (T3-054)
1. Create DeliveryTracking component with map
2. Integrate WebSocket for real-time updates
3. Add driver marker animation
4. Implement ETA countdown
5. Add driver info card with contact options

### Phase 5: Testing & Validation (T3-055)
1. Unit tests for ETA calculation
2. Integration tests for location API
3. WebSocket connection tests
4. Battery drain testing
5. Privacy compliance audit

## Performance Metrics

**Target Metrics:**
- Location update latency: < 2 seconds end-to-end
- Battery drain: < 5% per hour of tracking
- WebSocket connection uptime: > 99.5%
- Database query time (location history): < 100ms
- Map rendering time: < 1 second

## Compliance & Privacy

**GDPR Compliance:**
- Location data deleted after 24 hours
- Patient consent required for tracking
- Right to erasure: Immediate deletion on request

**HIPAA Compliance:**
- Location data is NOT PHI (no medical information)
- Encrypted in transit (HTTPS, WSS)
- Access logs for audit trail

## Conclusion

This architecture provides:
- ✅ Real-time location updates via WebSocket
- ✅ Battery-efficient tracking with adaptive modes
- ✅ Privacy-first design with data minimization
- ✅ Scalable time-series storage for location history
- ✅ Patient-friendly tracking interface with ETA
- ✅ GDPR/HIPAA compliant data handling

Next steps: Begin implementation with T3-052 (Location Tracking Service).
