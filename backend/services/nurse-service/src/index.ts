/**
 * Nurse Service
 * Microservice for nurse order management, profiles, and credentials
 * HIPAA/GDPR Compliant - Healthcare professional data
 *
 * Order Management Endpoints:
 * - POST /api/nurse/orders - Create medication order
 * - GET /api/nurse/orders - List orders (with filters)
 * - GET /api/nurse/orders/:id - Get order by ID
 * - PATCH /api/nurse/orders/:id - Update order status
 * - DELETE /api/nurse/orders/:id - Cancel order
 *
 * Patient Management Endpoints:
 * - GET /api/nurse/patients - List assigned patients
 * - GET /api/nurse/patients/:id - Get patient details
 *
 * Profile Management Endpoints:
 * - GET /nurses - List all nurses (paginated)
 * - GET /nurses/search - Search nurses by specialization
 * - GET /nurses/certifications/expiring - Get nurses with expiring certifications
 * - GET /nurses/:id - Get nurse by ID
 * - GET /nurses/user/:userId - Get nurse by user ID
 * - POST /nurses - Create nurse profile
 * - PUT /nurses/:id - Update nurse profile
 * - POST /nurses/:id/verify - Verify nurse credentials
 * - DELETE /nurses/:id - Soft delete nurse profile
 *
 * WebSocket Events:
 * - order:created - New order created
 * - order:status_updated - Order status changed
 * - delivery:notification - Delivery created/updated
 * - patient:assigned - Patient assigned to nurse
 *
 * - GET /health - Health check
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { Nurse } from './models/Nurse';
import { NurseOrder } from './models/NurseOrder';
import { User } from '@shared/models/User';
import { Cart } from '@shared/models/Cart';
import { CartItem } from '@shared/models/CartItem';
import { Pharmacy } from '@shared/models/Pharmacy';
import { AuditTrailEntry } from '@shared/models/AuditTrailEntry';
import { VipMembership } from '@shared/models/VipMembership';
import { PointsTransaction } from '@shared/models/PointsTransaction';
import nurseRouter from './routes/nurses';
import orderRouter from './routes/orders';
import patientRouter from './routes/patients';
import pdfRouter from './routes/pdf';
import { initializeSocketEvents } from './websocket/events';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PORT || process.env.NURSE_SERVICE_PORT || 4012;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

// ============================================================================
// Database Connection (TypeORM)
// ============================================================================

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'metapharm',
  password: process.env.DATABASE_PASSWORD || 'metapharm_dev_password',
  database: process.env.DATABASE_NAME || 'metapharm',
  entities: [Nurse, NurseOrder, User, Cart, CartItem, Pharmacy, AuditTrailEntry, VipMembership, PointsTransaction],
  synchronize: NODE_ENV === 'development', // Auto-sync in development only
  logging: NODE_ENV === 'development',
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ============================================================================
// Express App Setup
// ============================================================================

const app: Express = express();
const httpServer = createServer(app);

// ============================================================================
// Socket.IO Setup
// ============================================================================

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Initialize Socket.IO event handlers
initializeSocketEvents(io);

// Make Socket.IO available to routes
app.locals.io = io;

// ============================================================================
// Middleware
// ============================================================================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development only)
if (NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Inject dataSource into app.locals
app.use((req: Request, res: Response, next: NextFunction) => {
  req.app.locals.dataSource = AppDataSource;
  next();
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', async (req: Request, res: Response) => {
  try {
    const isConnected = AppDataSource.isInitialized;

    if (!isConnected) {
      // Return 200 with 'starting' status during initialization
      return res.status(200).json({
        status: 'starting',
        service: 'nurse-service',
        database: 'initializing',
        websocket: 'active',
        timestamp: new Date().toISOString(),
      });
    }

    // Test database query
    await AppDataSource.query('SELECT 1');

    res.status(200).json({
      status: 'healthy',
      service: 'nurse-service',
      database: 'connected',
      websocket: 'active',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'nurse-service',
      error: 'Database connection failed',
      websocket: 'active',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// API Routes
// ============================================================================

// Nurse profile management routes
app.use('/nurses', nurseRouter);

// Nurse order management routes
app.use('/api/nurse/orders', orderRouter);

// Nurse patient management routes
app.use('/api/nurse/patients', patientRouter);

// Nurse PDF export routes
app.use('/api/nurse/pdf', pdfRouter);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  const message =
    NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(500).json({
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
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    httpServer.listen(PORT, () => {
      console.log(`🚀 Nurse Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server active`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');

      httpServer.close(async () => {
        console.log('✅ HTTP server closed');

        try {
          await AppDataSource.destroy();
          console.log('✅ Database connection closed');

          io.close(() => {
            console.log('✅ WebSocket server closed');
            process.exit(0);
          });
        } catch (error) {
          console.error('❌ Error closing connections:', error);
          process.exit(1);
        }
      });

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

if (require.main === module) {
  startServer();
}

export default app;
export { io };
