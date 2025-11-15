/**
 * Pharmacy Service
 * Microservice for pharmacy operations and master account management
 *
 * Endpoints:
 * - POST /master-accounts/sub-accounts - Create sub-account
 * - GET /master-accounts/sub-accounts - List sub-accounts
 * - GET /master-accounts/sub-accounts/:id - Get sub-account
 * - PUT /master-accounts/sub-accounts/:id/permissions - Update permissions
 * - PUT /master-accounts/sub-accounts/:id/status - Update status
 * - DELETE /master-accounts/sub-accounts/:id - Delete sub-account
 * - GET /health - Health check
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { User } from '@shared/models/User';
import { Pharmacy } from '@shared/models/Pharmacy';
import masterAccountRouter from './routes/masterAccounts';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PHARMACY_SERVICE_PORT || 4008;
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
  entities: [User, Pharmacy],
  synchronize: false,
  logging: NODE_ENV === 'development',
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ============================================================================
// Express App Setup
// ============================================================================

const app: Express = express();

app.use(helmet());

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    const isConnected = AppDataSource.isInitialized;

    if (!isConnected) {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'pharmacy-service',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }

    await AppDataSource.query('SELECT 1');

    res.status(200).json({
      status: 'healthy',
      service: 'pharmacy-service',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'pharmacy-service',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/master-accounts', masterAccountRouter);

// ============================================================================
// Error Handling
// ============================================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

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

    const server = app.listen(PORT, () => {
      console.log(`🚀 Pharmacy Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

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
