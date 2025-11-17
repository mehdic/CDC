/**
 * Doctor Service
 * Microservice for doctor profile management
 * HIPAA/GDPR Compliant - Healthcare professional data
 *
 * Endpoints:
 * - GET /doctors - List all doctors (paginated)
 * - GET /doctors/search - Search doctors by specialization
 * - GET /doctors/:id - Get doctor by ID
 * - GET /doctors/user/:userId - Get doctor by user ID
 * - POST /doctors - Create doctor profile
 * - PUT /doctors/:id - Update doctor profile
 * - POST /doctors/:id/verify - Verify doctor credentials
 * - DELETE /doctors/:id - Soft delete doctor profile
 * - GET /health - Health check
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { Doctor } from './models/Doctor';
import { User } from '@shared/models/User';
import doctorRouter from './routes/doctors';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.DOCTOR_SERVICE_PORT || 4011;
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
  entities: [Doctor, User],
  synchronize: false, // Never auto-sync - use migrations
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
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', async (req: Request, res: Response) => {
  try {
    const isConnected = AppDataSource.isInitialized;

    if (!isConnected) {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'doctor-service',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }

    // Test database query
    await AppDataSource.query('SELECT 1');

    res.status(200).json({
      status: 'healthy',
      service: 'doctor-service',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'doctor-service',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/doctors', doctorRouter);

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

    const server = app.listen(PORT, () => {
      console.log(`🚀 Doctor Service running on port ${PORT}`);
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
