/**
 * Auth Service (T043)
 * Main Express server for authentication and session management
 *
 * Endpoints:
 * - POST /auth/login - Email/password login with MFA support
 * - POST /auth/mfa/verify - Verify TOTP MFA code
 * - POST /auth/mfa/setup - Generate MFA secret and QR code
 * - POST /auth/mfa/enable - Enable MFA after verification
 * - DELETE /auth/mfa/disable - Disable MFA
 * - GET /auth/hin/authorize - Initiate HIN e-ID OAuth flow
 * - GET /auth/hin/callback - Handle HIN e-ID callback
 * - GET /auth/sessions - List active sessions
 * - DELETE /auth/logout - Logout and invalidate session
 * - GET /health - Health check
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { User } from '@models/User';
import { Pharmacy } from '@models/Pharmacy';
import { AuditTrailEntry } from '@models/AuditTrailEntry';
import loginRouter from './routes/login';
import mfaRouter from './routes/mfa';
import sessionsRouter from './routes/sessions';
import logoutRouter from './routes/logout';
import hinRouter from './integrations/hin-eid';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PORT || 4001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

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
  entities: [User, Pharmacy, AuditTrailEntry],
  synchronize: false, // Never auto-sync in production - use migrations
  logging: NODE_ENV === 'development',
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const isConnected = AppDataSource.isInitialized;

    if (!isConnected) {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'auth-service',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }

    // Test database query
    await AppDataSource.query('SELECT 1');

    res.status(200).json({
      status: 'healthy',
      service: 'auth-service',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'auth-service',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// API Routes
// ============================================================================

// Mount routers
app.use('/auth', loginRouter);
app.use('/auth/mfa', mfaRouter);
app.use('/auth/sessions', sessionsRouter);
app.use('/auth', logoutRouter);
app.use('/auth/hin', hinRouter);

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

  // Don't expose internal errors in production
  const message = NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

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
    // Initialize database connection
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Auth Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');

      server.close(async () => {
        console.log('✅ HTTP server closed');

        try {
          await AppDataSource.destroy();
          console.log('✅ Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error closing database:', error);
          process.exit(1);
        }
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

// Start server if this file is executed directly
if (require.main === module) {
  startServer();
}

// Export app for testing
export default app;
