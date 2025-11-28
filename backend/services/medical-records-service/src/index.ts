/**
 * Medical Records Service
 * Main Express server for medical records management with Swiss e-santé integration
 *
 * Features:
 * - Patient medical records CRUD
 * - Swiss e-santé API integration (stub)
 * - HIN e-ID authentication for healthcare professionals
 * - Role-based access control (patient, pharmacist, doctor, nurse)
 * - GDPR-compliant access logging
 * - Consent management
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase, closeDatabase, AppDataSource } from './config/database';
import { MedicalRecordRepository } from './repository/MedicalRecordRepository';
import { MedicalRecordsController } from './controllers/MedicalRecordsController';
import { createMedicalRecordsRoutes } from './routes/medicalRecords';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.MEDICAL_RECORDS_SERVICE_PORT || 4010;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

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
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Role', 'X-Hin-Token'],
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
// Repository Initialization
// ============================================================================

let medicalRecordRepository: MedicalRecordRepository;
let medicalRecordsController: MedicalRecordsController;

// Initialize repository for tests
if (NODE_ENV === 'test') {
  medicalRecordRepository = new MedicalRecordRepository(AppDataSource);
  medicalRecordsController = new MedicalRecordsController(medicalRecordRepository);
  app.locals.dataSource = AppDataSource;
}

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbHealthy = AppDataSource.isInitialized;

    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      service: 'medical-records-service',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      features: {
        'e-sante-integration': 'stub',
        'hin-auth': 'stub',
        'rbac': 'enabled',
        'access-logging': 'enabled',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'medical-records-service',
      database: 'error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  }
});

// ============================================================================
// Mount Routes
// ============================================================================

// Medical records routes will be mounted after server starts
// (when repository is initialized)

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
    // Initialize database connection
    const dataSource = await initializeDatabase();

    // Initialize repository and controller
    medicalRecordRepository = new MedicalRecordRepository(dataSource);
    medicalRecordsController = new MedicalRecordsController(medicalRecordRepository);

    // Make dataSource available to controllers via app.locals
    app.locals.dataSource = dataSource;

    // Mount routes
    const medicalRecordsRoutes = createMedicalRecordsRoutes(medicalRecordsController);
    app.use('/medical-records', medicalRecordsRoutes);

    console.log('✅ Routes mounted: /medical-records');

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Medical Records Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🏥 e-santé Integration: STUB MODE`);
      console.log(`🔐 HIN e-ID Auth: STUB MODE`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');

      server.close(async () => {
        console.log('✅ HTTP server closed');
        await closeDatabase();
        process.exit(0);
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

// Export app and repository for testing
export default app;
export { medicalRecordRepository, initializeDatabase, closeDatabase };
