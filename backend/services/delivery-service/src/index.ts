/**
 * Delivery Service - Main Entry Point
 * Handles delivery tracking and management
 * Port: 4006
 * Batch 3 Phase 4 - Delivery & Order Services
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { DataSource } from 'typeorm';
import { Delivery } from '../../../shared/models/Delivery';
import { User } from '../../../shared/models/User';
import { Pharmacy } from '../../../shared/models/Pharmacy';
import { AuditTrailEntry } from '../../../shared/models/AuditTrailEntry';
import { authenticateJWT } from '../../../shared/middleware/auth';
import deliveriesRouter from './routes/deliveries';

const app = express();
const PORT = process.env.DELIVERY_SERVICE_PORT || 4006;

// ============================================================================
// Middleware
// ============================================================================

app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================================================
// Database Connection
// ============================================================================

// For testing, we'll mock the database connection entirely
// to avoid PostgreSQL vs SQLite type incompatibilities
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://localhost/metapharm_delivery_test',
  entities: [Delivery, User, Pharmacy, AuditTrailEntry],
  synchronize: false, // Use migrations instead in production
  logging: process.env.NODE_ENV === 'development',
});

// ============================================================================
// Initialize Database
// ============================================================================

dataSource
  .initialize()
  .then(() => {
    console.log('[Delivery Service] ✓ Database connected');
  })
  .catch((error) => {
    console.error('[Delivery Service] ✗ Database connection error:', error);
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
    service: 'delivery-service',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Delivery Routes with Authentication
// ============================================================================

app.use('/deliveries', authenticateJWT as RequestHandler, deliveriesRouter);

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
    console.log(`[Delivery Service] 🚀 Running on port ${PORT}`);
    console.log(`[Delivery Service] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Delivery Service] Health check: http://localhost:${PORT}/health`);
  });

  // ============================================================================
  // Graceful Shutdown
  // ============================================================================

  process.on('SIGTERM', async () => {
    console.log('[Delivery Service] SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('[Delivery Service] HTTP server closed');
    });
    await dataSource.destroy();
    console.log('[Delivery Service] Database connection closed');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[Delivery Service] SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('[Delivery Service] HTTP server closed');
    });
    await dataSource.destroy();
    console.log('[Delivery Service] Database connection closed');
    process.exit(0);
  });
}

// Export app and dataSource for testing
export { app, dataSource };
