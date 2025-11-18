/**
 * Delivery Service (Database-Backed Version)
 * Main Express server for delivery management
 *
 * Endpoints:
 * - POST /api/deliveries - Create new delivery
 * - GET /api/deliveries - List all deliveries
 * - GET /api/deliveries/:id - Get delivery by ID
 * - PATCH /api/deliveries/:id/status - Update delivery status
 * - PATCH /api/deliveries/:id/location - Update delivery location
 * - GET /health - Health check
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase, clearDatabase } from './database';
import deliveryRepository from './repository/DeliveryRepository';
import { DeliveryStatus, Location } from './models/Delivery';

// Initialize database
initializeDatabase();

// Clear database in test mode (for test isolation)
if (process.env.NODE_ENV === 'test') {
  clearDatabase();
}

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.DELIVERY_SERVICE_PORT || 4005;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// ============================================================================
// Status Transition Validation
// ============================================================================

const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  'pending': ['assigned', 'failed'],
  'assigned': ['picked_up', 'failed'],
  'picked_up': ['in_transit', 'failed'],
  'in_transit': ['delivered', 'failed'],
  'delivered': [],
  'failed': []
};

function isValidStatusTransition(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return validTransitions[from]?.includes(to) || false;
}

// ============================================================================
// Validation Functions
// ============================================================================

function isValidStatus(status: string): status is DeliveryStatus {
  return ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'].includes(status);
}

function isValidAddress(address: string): boolean {
  // Basic address validation - must have some content
  return typeof address === 'string' && address.trim().length >= 5;
}

function isValidLocation(location: any): location is Location {
  return (
    location &&
    typeof location === 'object' &&
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    location.lng >= -180 &&
    location.lng <= 180
  );
}

// ============================================================================
// Express App Setup
// ============================================================================

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'delivery-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================================
// API Routes
// ============================================================================

/**
 * POST /api/deliveries - Create new delivery
 */
app.post('/api/deliveries', (req: Request, res: Response) => {
  try {
    const {
      orderId,
      pharmacyId,
      patientId,
      driverId,
      pickupAddress,
      deliveryAddress,
      estimatedDeliveryTime
    } = req.body;

    // Validate required fields
    if (!orderId || !pharmacyId || !patientId || !pickupAddress || !deliveryAddress || !estimatedDeliveryTime) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: orderId, pharmacyId, patientId, pickupAddress, deliveryAddress, estimatedDeliveryTime',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate addresses
    if (!isValidAddress(pickupAddress)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid pickupAddress format. Address must be at least 5 characters',
        timestamp: new Date().toISOString(),
      });
    }

    if (!isValidAddress(deliveryAddress)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid deliveryAddress format. Address must be at least 5 characters',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate estimatedDeliveryTime is a valid ISO date string
    const estimatedDate = new Date(estimatedDeliveryTime);
    if (isNaN(estimatedDate.getTime())) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid estimatedDeliveryTime format. Expected ISO 8601 date string',
        timestamp: new Date().toISOString(),
      });
    }

    // Create new delivery using repository
    const newDelivery = deliveryRepository.create({
      orderId,
      pharmacyId,
      patientId,
      driverId,
      pickupAddress,
      deliveryAddress,
      estimatedDeliveryTime,
    });

    console.log(`✅ Created delivery: ${newDelivery.id} (Order: ${orderId})`);

    return res.status(201).json({
      message: 'Delivery created successfully',
      delivery: newDelivery,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating delivery:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create delivery',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/deliveries - List all deliveries
 */
app.get('/api/deliveries', (_req: Request, res: Response) => {
  try {
    const allDeliveries = deliveryRepository.findAll();

    return res.status(200).json({
      count: allDeliveries.length,
      deliveries: allDeliveries,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch deliveries',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/deliveries/:id - Get delivery by ID
 */
app.get('/api/deliveries/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const delivery = deliveryRepository.findById(id);

    if (!delivery) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Delivery with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      delivery,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching delivery:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch delivery',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PATCH /api/deliveries/:id/status - Update delivery status
 */
app.patch('/api/deliveries/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, driverId, actualDeliveryTime } = req.body;

    const delivery = deliveryRepository.findById(id);

    if (!delivery) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Delivery with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    // Validate status is provided
    if (!status) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required field: status',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate status value
    if (!isValidStatus(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid status. Must be one of: pending, assigned, picked_up, in_transit, delivered, failed',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate status transition
    if (!isValidStatusTransition(delivery.status, status)) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Invalid status transition from ${delivery.status} to ${status}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Validate actualDeliveryTime if provided
    if (actualDeliveryTime !== undefined) {
      const actualDate = new Date(actualDeliveryTime);
      if (isNaN(actualDate.getTime())) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid actualDeliveryTime format. Expected ISO 8601 date string',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update status using repository
    const updatedDelivery = deliveryRepository.updateStatus(
      id,
      status,
      driverId,
      actualDeliveryTime
    );

    if (!updatedDelivery) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update delivery status',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`✅ Updated delivery ${id} status to ${status}`);

    return res.status(200).json({
      message: 'Delivery status updated successfully',
      delivery: updatedDelivery,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update delivery status',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PATCH /api/deliveries/:id/location - Update delivery location
 */
app.patch('/api/deliveries/:id/location', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { location } = req.body;

    const delivery = deliveryRepository.findById(id);

    if (!delivery) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Delivery with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    // Location updates only allowed when status is in_transit
    if (delivery.status !== 'in_transit') {
      return res.status(409).json({
        error: 'Conflict',
        message: `Location updates only allowed when delivery status is in_transit. Current status: ${delivery.status}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Validate location is provided
    if (!location) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required field: location',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate location format
    if (!isValidLocation(location)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid location format. Expected object with lat and lng numbers (lat: -90 to 90, lng: -180 to 180)',
        timestamp: new Date().toISOString(),
      });
    }

    // Update location using repository
    const updatedDelivery = deliveryRepository.updateLocation(id, location);

    if (!updatedDelivery) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update delivery location',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`✅ Updated delivery ${id} location to (${location.lat}, ${location.lng})`);

    return res.status(200).json({
      message: 'Delivery location updated successfully',
      delivery: updatedDelivery,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating delivery location:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update delivery location',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Don't expose internal errors in production
  const message = NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return res.status(500).json({
    error: 'Internal Server Error',
    message,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Server Initialization
// ============================================================================

async function startServer() {
  try {
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Delivery Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down gracefully...');

      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if this file is executed directly AND not in test mode
if (require.main === module && process.env.NODE_ENV !== 'test') {
  startServer();
}

// Export app for testing
export default app;
