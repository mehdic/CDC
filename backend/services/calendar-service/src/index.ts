/**
 * Calendar Service
 * Microservice for calendar integration with Google/Apple calendars
 * Handles OAuth flows, event syncing, and conflict resolution
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { CalendarEvent } from './entities/CalendarEvent';
import { CalendarIntegration } from './entities/CalendarIntegration';
import { User } from '@shared/models/User';
import { Cart } from '@shared/models/Cart';
import { CartItem } from '@shared/models/CartItem';
import { Pharmacy } from '@shared/models/Pharmacy';
import { AuditTrailEntry } from '@shared/models/AuditTrailEntry';
import { VipMembership } from '@shared/models/VipMembership';
import { PointsTransaction } from '@shared/models/PointsTransaction';
import { createSyncRoutes } from './routes/syncRoutes';
import { GoogleSyncService } from './services/googleSyncService';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PORT || process.env.CALENDAR_SERVICE_PORT || 4015;
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
  entities: [CalendarEvent, CalendarIntegration, User, Cart, CartItem, Pharmacy, AuditTrailEntry, VipMembership, PointsTransaction],
  synchronize: NODE_ENV === 'development',
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
        service: 'calendar-service',
        database: 'initializing',
        timestamp: new Date().toISOString(),
      });
    }

    await AppDataSource.query('SELECT 1');

    res.status(200).json({
      status: 'healthy',
      service: 'calendar-service',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'calendar-service',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// API Routes
// ============================================================================

// Calendar sync routes (mounted after DB is initialized)
const mountRoutes = () => {
  const eventRepo = AppDataSource.getRepository(CalendarEvent);
  const integrationRepo = AppDataSource.getRepository(CalendarIntegration);

  // Initialize GoogleSyncService with OAuth2 credentials
  const googleSyncService = new GoogleSyncService(
    eventRepo,
    integrationRepo,
    process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/calendar/google/callback`
  );

  app.use('/api/calendar', createSyncRoutes(googleSyncService, integrationRepo, eventRepo));
};

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

    // Mount routes after DB is initialized
    mountRoutes();

    app.listen(PORT, () => {
      console.log(`🚀 Calendar Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');

      try {
        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing connections:', error);
        process.exit(1);
      }
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

// Re-export for library usage
export { CalendarEvent, CalendarIntegration };
export * from './types/calendar.types';
