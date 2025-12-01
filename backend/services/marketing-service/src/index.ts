/**
 * Marketing Service
 * Campaign management, promotions, templates, and analytics
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import 'reflect-metadata';

import { initializeDatabase } from './config/database';
import marketingRoutes from './routes/marketing.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4010;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// Middleware
// ============================================================================

app.use(helmet());
app.use(cors());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    service: 'Marketing Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({
    service: 'MetaPharm Connect - Marketing Service',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    endpoints: {
      campaigns: '/campaigns',
      promotions: '/promotions',
      templates: '/templates',
      health: '/health',
    },
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/', marketingRoutes);

// ============================================================================
// Error Handling
// ============================================================================

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Start HTTP server
    app.listen(PORT, () => {
      console.info('='.repeat(60));
      console.info('MetaPharm Connect - Marketing Service');
      console.info('='.repeat(60));
      console.info(`Environment: ${NODE_ENV}`);
      console.info(`Port: ${PORT}`);
      console.info(`Service URL: http://localhost:${PORT}`);
      console.info('='.repeat(60));
      console.info('Endpoints:');
      console.info(`  POST /pharmacies/:id/campaigns          - Create campaign`);
      console.info(`  GET  /campaigns/:id                    - Get campaign`);
      console.info(`  GET  /pharmacies/:id/campaigns         - List campaigns`);
      console.info(`  PUT  /campaigns/:id                    - Update campaign`);
      console.info(`  DELETE /campaigns/:id                  - Delete campaign`);
      console.info(`  POST /campaigns/:id/execute            - Execute campaign`);
      console.info(`  GET  /campaigns/:id/analytics          - Get campaign analytics`);
      console.info(`  POST /pharmacies/:id/promotions        - Create promotion`);
      console.info(`  GET  /promotions/:id                   - Get promotion`);
      console.info(`  GET  /pharmacies/:id/promotions        - List promotions`);
      console.info(`  POST /promotions/validate/:code        - Validate promo code`);
      console.info(`  POST /pharmacies/:id/templates         - Create template`);
      console.info(`  GET  /templates/:id                    - Get template`);
      console.info(`  GET  /pharmacies/:id/templates         - List templates`);
      console.info(`  POST /templates/:id/render             - Render template`);
      console.info('='.repeat(60));
      console.info('Health Check: http://localhost:' + PORT + '/health');
      console.info('='.repeat(60));
    });
  } catch (error) {
    console.error('Failed to start Marketing Service:', error);
    process.exit(1);
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGTERM', () => {
  console.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// ============================================================================
// Start
// ============================================================================

if (require.main === module) {
  startServer();
}

export default app;
