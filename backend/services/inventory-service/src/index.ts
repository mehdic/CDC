/**
 * Inventory Service
 * Real-Time Inventory Management with QR Traceability and AI Forecasting
 *
 * Features:
 * - QR code scanning for stock updates (GS1 DataMatrix format)
 * - Real-time inventory tracking with multi-tenant isolation
 * - AI-powered low stock and expiration alerts
 * - AWS Forecast integration for demand prediction
 * - Controlled substance tracking with enhanced audit trails
 *
 * Port: 4004
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { InventoryItem } from '../../../shared/models/InventoryItem';
import { InventoryTransaction } from '../../../shared/models/InventoryTransaction';
import { InventoryAlert } from '../../../shared/models/InventoryAlert';

// Routes
import { scanRouter } from './routes/scan';
import { itemsRouter } from './routes/items';
import { alertsRouter } from './routes/alerts';
import { analyticsRouter } from './routes/analytics';

// Workers
import { startAlertWorkers } from './workers/alertWorker';

// Load environment variables
dotenv.config();

const PORT = process.env.INVENTORY_SERVICE_PORT || 4004;
const app: Application = express();

// ============================================================================
// Middleware
// ============================================================================

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Database Connection
// ============================================================================

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm',
  entities: [InventoryItem, InventoryTransaction, InventoryAlert],
  synchronize: false, // Use migrations instead
  logging: process.env.NODE_ENV === 'development',
});

// ============================================================================
// Routes
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'inventory-service', timestamp: new Date().toISOString() });
});

app.use('/inventory/scan', scanRouter);
app.use('/inventory/items', itemsRouter);
app.use('/inventory/alerts', alertsRouter);
app.use('/inventory/analytics', analyticsRouter);

// ============================================================================
// Error Handling
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Start background workers for alerts
    startAlertWorkers();
    console.log('✅ Alert workers started');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Inventory Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start Inventory Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await AppDataSource.destroy();
  process.exit(0);
});

// Start the service
if (require.main === module) {
  startServer();
}

export default app;
