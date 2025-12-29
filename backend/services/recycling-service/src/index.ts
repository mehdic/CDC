/**
 * Recycling Service
 * Microservice for medication return/recycling
 * T5-052: Medication Return/Recycling Feature
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  createRecyclingRequest,
  getRecyclingRequest,
  getPatientRequests,
  getPharmacyRequests,
  getDriverPendingPickups,
  assignDriver,
  recordCollection,
  processCollection,
  cancelRequest,
  getPharmacyReports,
} from './controllers/recycling.controller';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PORT || process.env.RECYCLING_SERVICE_PORT || 4016;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

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

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'recycling-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================================
// API Routes
// ============================================================================

// Create recycling request
app.post('/api/recycling/request', createRecyclingRequest);

// Get recycling request by ID
app.get('/api/recycling/:id', getRecyclingRequest);

// Get patient's recycling requests
app.get('/api/recycling/patient/:patientId', getPatientRequests);

// Get pharmacy's recycling requests
app.get('/api/recycling/pharmacy/:pharmacyId', getPharmacyRequests);

// Get driver's pending pickups
app.get('/api/recycling/driver/:driverId/pending', getDriverPendingPickups);

// Assign driver to request
app.patch('/api/recycling/:id/assign-driver', assignDriver);

// Record collection by driver
app.patch('/api/recycling/:id/collect', recordCollection);

// Process collected medications
app.patch('/api/recycling/:id/process', processCollection);

// Cancel recycling request
app.patch('/api/recycling/:id/cancel', cancelRequest);

// Get pharmacy reports
app.get('/api/recycling/report/pharmacy/:pharmacyId', getPharmacyReports);

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

function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Recycling Service running on port ${PORT}`);
    console.log(`📊 Environment: ${NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (require.main === module) {
  startServer();
}

export default app;

// Re-export for library usage
export { default as recyclingService } from './services/recycling.service';
export { default as recyclingReportService } from './services/recycling-report.service';
export { default as recyclingRepository } from './repositories/RecyclingRepository';
export * from './controllers/recycling.controller';
export * from './types/recycling';
export { RecyclingRequestModel } from './models/RecyclingRequest';
