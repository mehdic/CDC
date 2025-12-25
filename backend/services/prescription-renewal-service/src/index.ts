/**
 * Prescription Renewal Service
 * Main entry point for AI-powered renewal predictions
 * Task: T8-055
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { createRenewalRoutes } from './routes/renewal.routes';
import { RenewalPrediction } from './models/RenewalPrediction';
import { RenewalReminder } from './models/RenewalReminder';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================================================
// Database Configuration
// ============================================================================

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm',
  entities: [RenewalPrediction, RenewalReminder],
  synchronize: process.env.NODE_ENV !== 'production', // Auto-create schema in dev
  logging: process.env.NODE_ENV === 'development',
});

// ============================================================================
// Express Application
// ============================================================================

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (basic - should be configured properly in production)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'prescription-renewal-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes
let renewalRoutes: ReturnType<typeof createRenewalRoutes>;

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// ============================================================================
// Server Initialization
// ============================================================================

const PORT = process.env.PORT || 3007;

async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    await dataSource.initialize();
    console.log('Database connection established');

    // Initialize routes (after database is ready)
    renewalRoutes = createRenewalRoutes(dataSource);
    app.use('/api/renewals', renewalRoutes);

    // Start server
    app.listen(PORT, () => {
      console.log(`Prescription Renewal Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await dataSource.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await dataSource.destroy();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

// Export for testing
export { app, dataSource };
