/**
 * Appointment Service
 * Microservice for appointment scheduling and availability management
 * HIPAA/GDPR Compliant - Healthcare appointment data
 *
 * Endpoints:
 * - POST /appointments - Create appointment
 * - GET /appointments - List appointments (paginated)
 * - GET /appointments/:id - Get single appointment
 * - PUT /appointments/:id - Update appointment
 * - POST /appointments/:id/confirm - Confirm appointment
 * - POST /appointments/:id/cancel - Cancel appointment
 * - POST /appointments/:id/complete - Mark as completed
 * - DELETE /appointments/:id - Soft delete appointment
 * - GET /appointments/provider/:providerId/upcoming - Upcoming appointments
 * - POST /availability - Create availability slot
 * - GET /availability - List availability slots
 * - GET /availability/:id - Get availability slot
 * - PUT /availability/:id - Update availability slot
 * - DELETE /availability/:id - Delete availability slot
 * - GET /availability/provider/:providerId - Get provider slots
 * - GET /health - Health check
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { Appointment } from './entities/Appointment';
import { AvailabilitySlot } from './entities/AvailabilitySlot';
import { AppointmentReminder } from './entities/AppointmentReminder';
import { User } from '@shared/models/User';
import appointmentRouterModule, { initializeRoutes } from './routes/appointment.routes';
import { AppointmentService } from './services/appointment.service';
import { AvailabilityService } from './services/availability.service';
import { ReminderService } from './services/reminder.service';
import { AppointmentController } from './controllers/appointment.controller';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.APPOINTMENT_SERVICE_PORT || 4014;
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
  entities: [Appointment, AvailabilitySlot, AppointmentReminder, User],
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
        service: 'appointment-service',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }

    // Test database query
    await AppDataSource.query('SELECT 1');

    res.status(200).json({
      status: 'healthy',
      service: 'appointment-service',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'appointment-service',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// API Routes (initialized after database connection)
// ============================================================================

async function setupRoutes() {
  // Create services
  const appointmentRepository = AppDataSource.getRepository(Appointment);
  const availabilityRepository = AppDataSource.getRepository(AvailabilitySlot);
  const reminderRepository = AppDataSource.getRepository(AppointmentReminder);

  const appointmentService = new AppointmentService(
    appointmentRepository,
    availabilityRepository
  );
  const availabilityService = new AvailabilityService(availabilityRepository);
  const reminderService = new ReminderService(
    reminderRepository,
    appointmentRepository
  );

  // Create controller
  const controller = new AppointmentController(
    appointmentService,
    availabilityService,
    reminderService
  );

  // Initialize routes with controller
  initializeRoutes(controller);

  // Mount routes
  app.use('/appointments', appointmentRouterModule);
  app.use('/availability', appointmentRouterModule);
}

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

    // Setup routes after database is connected
    await setupRoutes();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Appointment Service running on port ${PORT}`);
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
