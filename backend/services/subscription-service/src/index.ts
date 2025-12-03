/**
 * Subscription Service - Main Entry Point
 * Handles recurring medication orders for chronic disease prescriptions
 * Port: 4021
 * Task T6-016 - Subscription Service Implementation
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { DataSource } from 'typeorm';
import { Subscription } from '../../../shared/models/Subscription';
import { SubscriptionItem } from '../../../shared/models/SubscriptionItem';
import { SubscriptionOrder } from '../../../shared/models/SubscriptionOrder';
import { User } from '../../../shared/models/User';
import { Pharmacy } from '../../../shared/models/Pharmacy';
import { authenticateJWT } from '../../../shared/middleware/auth';
import subscriptionsRouter from './routes/subscriptions';

const app = express();
const PORT = process.env.SUBSCRIPTION_SERVICE_PORT || 4021;

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
        entities: [Subscription, SubscriptionItem, SubscriptionOrder, User, Pharmacy],
        synchronize: true, // Auto-create tables in test mode
        logging: false,
        dropSchema: true, // Clean database for each test run
      }
    : {
        // Use PostgreSQL for development/production
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [Subscription, SubscriptionItem, SubscriptionOrder, User, Pharmacy],
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
    console.log('[Subscription Service] ✓ Database connected');
  })
  .catch((error) => {
    console.error('[Subscription Service] ✗ Database connection error:', error);
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
    service: 'subscription-service',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Subscription Routes with Authentication
// ============================================================================

app.use('/api/v1', authenticateJWT as RequestHandler, subscriptionsRouter);

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
    console.log(`[Subscription Service] 🚀 Running on port ${PORT}`);
    console.log(
      `[Subscription Service] Environment: ${process.env.NODE_ENV || 'development'}`
    );
    console.log(`[Subscription Service] Health check: http://localhost:${PORT}/health`);
  });

  // ============================================================================
  // Graceful Shutdown
  // ============================================================================

  process.on('SIGTERM', async () => {
    console.log('[Subscription Service] SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('[Subscription Service] HTTP server closed');
    });
    await dataSource.destroy();
    console.log('[Subscription Service] Database connection closed');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[Subscription Service] SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('[Subscription Service] HTTP server closed');
    });
    await dataSource.destroy();
    console.log('[Subscription Service] Database connection closed');
    process.exit(0);
  });
}

// Export app and dataSource for testing
export { app, dataSource };
