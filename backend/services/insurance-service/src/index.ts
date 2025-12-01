/**
 * MetaPharm Connect - Insurance Service
 * Port: 4014
 *
 * Swiss insurance and third-party payment integration
 * HIPAA/GDPR compliant with audit logging
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import insuranceRoutes from './routes/insurance.routes';
import { initializeDatabase } from './config/database';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.INSURANCE_SERVICE_PORT || 4014;
const SERVICE_NAME = 'insurance-service';

// ============================================================================
// Security Middleware
// ============================================================================

// Helmet: Security headers
app.use(helmet());

// CORS: Restrict to trusted origins only
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================================================
// Request Logging Middleware
// ============================================================================

app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Health Check Endpoints
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  const health = {
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    compliance: {
      hipaa: true,
      gdpr: true,
    },
  };

  res.status(200).json(health);
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    description: 'MetaPharm Connect Insurance & Third-Party Payment Service',
    compliance: {
      hipaa: true,
      gdpr: true,
      swiss_regulations: true,
    },
    endpoints: {
      health: '/health',
      providers: {
        list: 'GET /api/insurance/providers',
        get: 'GET /api/insurance/providers/:id',
      },
      coverage: {
        verify: 'POST /api/insurance/verify',
      },
      claims: {
        submit: 'POST /api/insurance/claims',
        getStatus: 'GET /api/insurance/claims/:id',
        list: 'GET /api/insurance/claims',
      },
      statistics: 'GET /api/insurance/statistics',
    },
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/api/insurance', insuranceRoutes);

// ============================================================================
// Error Handling Middleware
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    service: SERVICE_NAME,
  });
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGTERM', async () => {
  console.log(`[${SERVICE_NAME}] SIGTERM received, shutting down gracefully...`);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log(`[${SERVICE_NAME}] SIGINT received, shutting down gracefully...`);
  process.exit(0);
});

// ============================================================================
// Start Server
// ============================================================================

async function startServer(): Promise<void> {
  try {
    // Initialize database first
    await initializeDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║  MetaPharm Connect - Insurance Service                ║
║  Port: ${PORT}                                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║  Compliance: HIPAA/GDPR/Swiss Regulations             ║
║  Status: Running                                       ║
╚════════════════════════════════════════════════════════╝
      `);
      console.log(`[${SERVICE_NAME}] Ready to process insurance claims`);
      console.log(`[${SERVICE_NAME}] Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Failed to start:`, error);
    process.exit(1);
  }
}

// Export for testing
export { app };

// Start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
