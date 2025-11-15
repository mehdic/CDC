/**
 * Order Service - Main Entry Point
 * Handles e-commerce orders for pharmacy products
 * Port: 4007
 * Batch 3 Phase 4 - Delivery & Order Services
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { DataSource } from 'typeorm';
import { Order } from '../../../shared/models/Order';
import { User } from '../../../shared/models/User';
import { Pharmacy } from '../../../shared/models/Pharmacy';
import { AuditTrailEntry } from '../../../shared/models/AuditTrailEntry';
import { authenticateJWT } from '../../../shared/middleware/auth';
import ordersRouter from './routes/orders';

const app = express();
const PORT = process.env.PORT || 4007;

// ============================================================================
// Middleware
// ============================================================================

app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================================================
// Database Connection
// ============================================================================

const dataSource = new DataSource(
  process.env.NODE_ENV === 'test'
    ? {
        // Use SQLite in-memory database for testing
        type: 'better-sqlite3',
        database: ':memory:',
        entities: [Order, User, Pharmacy, AuditTrailEntry],
        synchronize: true, // Auto-create tables in test mode
        logging: false,
        dropSchema: true, // Clean database for each test run
      }
    : {
        // Use PostgreSQL for development/production
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [Order, User, Pharmacy, AuditTrailEntry],
        synchronize: false, // Use migrations instead in production
        logging: process.env.NODE_ENV === 'development',
      }
);

// ============================================================================
// Initialize Database
// ============================================================================

dataSource
  .initialize()
  .then(() => {
    console.log('[Order Service] ✓ Database connected');
  })
  .catch((error) => {
    console.error('[Order Service] ✗ Database connection error:', error);
    process.exit(1);
  });

// Make dataSource available to routes
app.locals.dataSource = dataSource;

// ============================================================================
// Routes
// ============================================================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'order-service',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Order Routes with Authentication
// ============================================================================

app.use('/orders', authenticateJWT as RequestHandler, ordersRouter);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// ============================================================================
// Start Server (conditionally - not in test mode)
// ============================================================================

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`[Order Service] 🚀 Running on port ${PORT}`);
    console.log(`[Order Service] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Order Service] Health check: http://localhost:${PORT}/health`);
  });

  // ============================================================================
  // Graceful Shutdown
  // ============================================================================

  process.on('SIGTERM', async () => {
    console.log('[Order Service] SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('[Order Service] HTTP server closed');
    });
    await dataSource.destroy();
    console.log('[Order Service] Database connection closed');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[Order Service] SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('[Order Service] HTTP server closed');
    });
    await dataSource.destroy();
    console.log('[Order Service] Database connection closed');
    process.exit(0);
  });
}

// Export app and dataSource for testing
export { app, dataSource };
