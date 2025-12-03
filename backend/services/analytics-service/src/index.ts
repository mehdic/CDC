/**
 * Analytics Service (Phase 2)
 * Main Express server for pharmacy analytics and dashboard
 *
 * Endpoints:
 * - GET /api/analytics/dashboard/:pharmacyId - Get comprehensive dashboard data
 * - GET /api/analytics/metrics/:pharmacyId - Get metrics summary
 * - GET /api/analytics/revenue/:pharmacyId - Get revenue trends
 * - GET /api/analytics/prescriptions/:pharmacyId - Get prescription trends
 * - GET /health - Health check
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AnalyticsController } from './controllers/analytics.controller';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.ANALYTICS_SERVICE_PORT || 4009;
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
// Initialize Controller
// ============================================================================

const analyticsController = new AnalyticsController();

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', analyticsController.health);

// ============================================================================
// Analytics API Routes
// ============================================================================

/**
 * GET /api/analytics/dashboard/:pharmacyId
 * Get comprehensive dashboard data for a pharmacy
 * Query params:
 *   - startDate: YYYY-MM-DD (optional, defaults to 30 days ago)
 *   - endDate: YYYY-MM-DD (optional, defaults to today)
 *   - groupBy: 'daily' | 'weekly' | 'monthly' (optional, defaults to daily)
 */
app.get('/api/analytics/dashboard/:pharmacyId', analyticsController.getDashboard);

/**
 * GET /api/analytics/metrics/:pharmacyId
 * Get metrics summary for a pharmacy (current month)
 */
app.get('/api/analytics/metrics/:pharmacyId', analyticsController.getMetrics);

/**
 * GET /api/analytics/revenue/:pharmacyId
 * Get revenue trends for a date range
 * Query params (required):
 *   - startDate: YYYY-MM-DD
 *   - endDate: YYYY-MM-DD
 */
app.get('/api/analytics/revenue/:pharmacyId', analyticsController.getRevenueTrends);

/**
 * GET /api/analytics/prescriptions/:pharmacyId
 * Get prescription trends for a date range
 * Query params (required):
 *   - startDate: YYYY-MM-DD
 *   - endDate: YYYY-MM-DD
 */
app.get('/api/analytics/prescriptions/:pharmacyId', analyticsController.getPrescriptionTrends);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Don't expose internal errors in production
  const message = NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return res.status(500).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Server Initialization
// ============================================================================

async function startServer() {
  try {
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Analytics Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Dashboard API: http://localhost:${PORT}/api/analytics/dashboard/:pharmacyId`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down gracefully...');

      server.close(() => {
        console.log('✅ HTTP server closed');
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

// Export app for testing
export default app;
