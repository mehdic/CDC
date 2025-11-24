/**
 * Delivery Service (TypeORM Version)
 * Main Express server for delivery management with proper database integration
 *
 * API Endpoints:
 * - POST /deliveries - Create new delivery
 * - GET /deliveries - List all deliveries (with pagination)
 * - GET /deliveries/:id - Get delivery by ID
 * - PUT /deliveries/:id - Update delivery (status, location, etc.)
 * - GET /health - Health check
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DataSource, Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from '@models/Delivery';
import { User } from '@models/User';
import { Pharmacy } from '@models/Pharmacy';
import { AuditTrailEntry } from '@models/AuditTrailEntry';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.DELIVERY_SERVICE_PORT || 4005;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// ============================================================================
// Database Configuration (TypeORM with SQLite)
// ============================================================================

export const dataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DATABASE_PATH || ':memory:', // Use in-memory for tests
  entities: [Delivery, User, Pharmacy, AuditTrailEntry],
  synchronize: true, // Auto-create schema in development/test
  logging: process.env.NODE_ENV === 'development',
});

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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
// Repository Helper
// ============================================================================

function getDeliveryRepo(): Repository<Delivery> {
  return dataSource.getRepository(Delivery);
}

// ============================================================================
// Validation Functions
// ============================================================================

function isValidDeliveryStatus(status: string): status is DeliveryStatus {
  return Object.values(DeliveryStatus).includes(status as DeliveryStatus);
}

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'delivery-service',
    port: typeof PORT === 'number' ? PORT : parseInt(PORT as string, 10),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================================
// API Routes
// ============================================================================

/**
 * POST /deliveries - Create new delivery
 */
app.post('/deliveries', async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      order_id,
      delivery_address_encrypted,
      delivery_notes_encrypted,
      scheduled_at,
    } = req.body;

    // Validate required fields
    if (!user_id) {
      return res.status(400).json({
        error: 'user_id is required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!delivery_address_encrypted) {
      return res.status(400).json({
        error: 'delivery_address_encrypted is required',
        timestamp: new Date().toISOString(),
      });
    }

    const deliveryRepo = getDeliveryRepo();

    // Convert encrypted address from string to Buffer if necessary
    const addressBuffer = typeof delivery_address_encrypted === 'string'
      ? Buffer.from(delivery_address_encrypted, 'base64')
      : delivery_address_encrypted;

    const notesBuffer = delivery_notes_encrypted
      ? (typeof delivery_notes_encrypted === 'string'
          ? Buffer.from(delivery_notes_encrypted, 'base64')
          : delivery_notes_encrypted)
      : null;

    // Create new delivery
    const newDelivery = deliveryRepo.create({
      user_id,
      order_id: order_id || null,
      delivery_address_encrypted: addressBuffer,
      delivery_notes_encrypted: notesBuffer,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
      status: DeliveryStatus.PENDING,
      delivery_personnel_id: null,
      tracking_info: null,
      tracking_number: null,
      picked_up_at: null,
      delivered_at: null,
      failed_at: null,
      failure_reason: null,
    });

    await deliveryRepo.save(newDelivery);

    console.log(`✅ Created delivery: ${newDelivery.id}`);

    // Exclude sensitive encrypted fields from response
    const { delivery_address_encrypted: _addr, delivery_notes_encrypted: _notes, ...safeDelivery } = newDelivery;

    return res.status(201).json(safeDelivery);
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
 * GET /deliveries - List all deliveries (with pagination)
 */
app.get('/deliveries', async (req: Request, res: Response) => {
  try {
    const deliveryRepo = getDeliveryRepo();

    // Get query parameters for pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Get total count
    const totalItems = await deliveryRepo.count();

    // Get paginated deliveries
    const deliveries = await deliveryRepo.find({
      skip: offset,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return res.status(200).json({
      pagination: {
        total_items: totalItems,
        page,
        limit,
        total_pages: Math.ceil(totalItems / limit),
      },
      deliveries,
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
 * GET /deliveries/:id - Get delivery by ID
 */
app.get('/deliveries/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deliveryRepo = getDeliveryRepo();
    const delivery = await deliveryRepo.findOne({ where: { id } });

    if (!delivery) {
      return res.status(404).json({
        error: `Delivery ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json(delivery);
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
 * PUT /deliveries/:id - Update delivery (status, personnel, location, etc.)
 */
app.put('/deliveries/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      delivery_personnel_id,
      tracking_info,
      tracking_number,
      failure_reason,
    } = req.body;

    const deliveryRepo = getDeliveryRepo();
    const delivery = await deliveryRepo.findOne({ where: { id } });

    if (!delivery) {
      return res.status(404).json({
        error: `Delivery ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    // Update status if provided
    if (status && isValidDeliveryStatus(status)) {
      delivery.status = status as DeliveryStatus;

      // Update timestamps based on status transitions
      if (status === DeliveryStatus.IN_TRANSIT && !delivery.picked_up_at) {
        delivery.picked_up_at = new Date();
      } else if (status === DeliveryStatus.DELIVERED && !delivery.delivered_at) {
        delivery.delivered_at = new Date();
      } else if (status === DeliveryStatus.FAILED && !delivery.failed_at) {
        delivery.failed_at = new Date();
        if (failure_reason) {
          delivery.failure_reason = failure_reason;
        }
      }
    }

    // Update delivery personnel if provided
    if (delivery_personnel_id !== undefined) {
      delivery.delivery_personnel_id = delivery_personnel_id;
    }

    // Update tracking info if provided
    if (tracking_info !== undefined) {
      delivery.tracking_info = tracking_info;
    }

    // Update tracking number if provided
    if (tracking_number !== undefined) {
      delivery.tracking_number = tracking_number;
    }

    // Update failure reason if provided
    if (failure_reason !== undefined) {
      delivery.failure_reason = failure_reason;
    }

    await deliveryRepo.save(delivery);

    console.log(`✅ Updated delivery ${id}`);

    return res.status(200).json(delivery);
  } catch (error) {
    console.error('Error updating delivery:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update delivery',
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
    // Initialize database
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log('[Delivery Service] ✓ Database connected');
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Delivery Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');

      server.close(() => {
        console.log('✅ HTTP server closed');
      });

      if (dataSource.isInitialized) {
        await dataSource.destroy();
        console.log('✅ Database connection closed');
      }

      process.exit(0);
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

// Export app and dataSource for testing
export { app };
export default app;
