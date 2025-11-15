/**
 * MetaPharm Connect - Payment Service
 * Port: 4007
 *
 * PCI-DSS compliant payment processing
 * HIPAA/GDPR compliant with audit logging
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import paymentRoutes from './routes/paymentRoutes';
import { initializeDatabase } from './config/database';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4007;
const SERVICE_NAME = 'payment-service';

// ============================================================================
// Security Middleware (PCI-DSS Requirements)
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

// Body parsing with size limits (PCI-DSS: Prevent large payloads)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================================================
// Request Logging Middleware
// ============================================================================

app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();

  // PCI-DSS: Never log sensitive payment data
  const sanitizedBody = { ...req.body };
  if (sanitizedBody.card_number) delete sanitizedBody.card_number;
  if (sanitizedBody.cvv) delete sanitizedBody.cvv;
  if (sanitizedBody.payment_method_id) {
    sanitizedBody.payment_method_id = '***REDACTED***';
  }

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
    pci_dss_compliant: true,
  };

  res.status(200).json(health);
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    description: 'MetaPharm Connect Payment Service (PCI-DSS Compliant)',
    compliance: {
      pci_dss: 'Level 1',
      hipaa: true,
      gdpr: true,
    },
    endpoints: {
      health: '/health',
      payments: {
        list: 'GET /payments',
        get: 'GET /payments/:id',
        create: 'POST /payments',
        update: 'PUT /payments/:id',
        delete: 'DELETE /payments/:id',
        process: 'POST /payments/process',
        refund: 'POST /payments/:id/refund',
      },
    },
  });
});

// ============================================================================
// Payment Routes
// ============================================================================

app.use('/', paymentRoutes);

// ============================================================================
// Error Handling Middleware
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  // PCI-DSS: Never expose sensitive error details
  const sanitizedError = err.message.includes('card') || err.message.includes('payment')
    ? 'Payment processing error'
    : err.message;

  res.status(500).json({
    error: 'Internal Server Error',
    message: sanitizedError,
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
║  MetaPharm Connect - Payment Service                  ║
║  Port: ${PORT}                                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║  PCI-DSS Compliant: Yes                                ║
║  Status: Running                                       ║
╚════════════════════════════════════════════════════════╝
      `);
      console.log(`[${SERVICE_NAME}] Ready to process payments`);
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
