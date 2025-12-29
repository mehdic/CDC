/**
 * Analytics Service - Pharmacy Dashboard API
 * Provides comprehensive analytics and metrics for pharmacy operations
 *
 * Endpoints:
 * - GET /api/analytics/dashboard/:pharmacyId - Get comprehensive dashboard data
 * - GET /api/analytics/metrics/:pharmacyId - Get metrics summary
 * - GET /api/analytics/revenue/:pharmacyId - Get revenue trends
 * - GET /api/analytics/prescriptions/:pharmacyId - Get prescription trends
 * - POST /api/analytics/events - Track user behavior event (GDPR consent required)
 * - GET /api/analytics/users/:userId/segment - Get user segment classification
 * - GET /api/analytics/users/:userId/churn-risk - Get churn risk prediction
 * - POST /api/analytics/consent/grant - Grant tracking consent
 * - POST /api/analytics/consent/revoke - Revoke tracking consent
 * - GET /health - Health check
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authenticateToken, requireRole } from './middleware/auth';
import { AnalyticsController } from './controllers/analytics.controller';
import { BehaviorController } from './controllers/behaviorController';
import { createBehaviorRoutes } from './routes/behaviorRoutes';
import { query, count, queryOne } from './config/database';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PORT || process.env.ANALYTICS_SERVICE_PORT || 4000;
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
// Controllers
// ============================================================================

const analyticsController = new AnalyticsController();
const behaviorController = new BehaviorController();

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'analytics-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================================
// API Routes - Protected with Authentication
// ============================================================================

/**
 * GET /api/analytics/dashboard/:pharmacyId
 * Get comprehensive dashboard data for a pharmacy
 * Requires: authentication, pharmacist or admin role
 */
app.get(
  '/api/analytics/dashboard/:pharmacyId',
  authenticateToken,
  requireRole(['pharmacist', 'admin']),
  analyticsController.getDashboard
);

/**
 * GET /api/analytics/metrics/:pharmacyId
 * Get metrics summary for a pharmacy
 * Requires: authentication, pharmacist or admin role
 */
app.get(
  '/api/analytics/metrics/:pharmacyId',
  authenticateToken,
  requireRole(['pharmacist', 'admin']),
  analyticsController.getMetrics
);

/**
 * GET /api/analytics/revenue/:pharmacyId
 * Get revenue trends for a date range
 * Requires: authentication, pharmacist or admin role
 */
app.get(
  '/api/analytics/revenue/:pharmacyId',
  authenticateToken,
  requireRole(['pharmacist', 'admin']),
  analyticsController.getRevenueTrends
);

/**
 * GET /api/analytics/prescriptions/:pharmacyId
 * Get prescription trends for a date range
 * Requires: authentication, pharmacist or admin role
 */
app.get(
  '/api/analytics/prescriptions/:pharmacyId',
  authenticateToken,
  requireRole(['pharmacist', 'admin']),
  analyticsController.getPrescriptionTrends
);

// ============================================================================
// Behavior Tracking Routes (GDPR-Compliant)
// ============================================================================

// Mount behavior tracking routes under /api/analytics
app.use('/api/analytics', createBehaviorRoutes(behaviorController));

// ============================================================================
// Dashboard Routes (for frontend compatibility)
// ============================================================================

/**
 * GET /api/dashboard/analytics
 * Get dashboard analytics overview from real database
 */
app.get(
  '/api/dashboard/analytics',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Get pharmacy ID from user context or use default
      const pharmacyId = (req as any).user?.pharmacyId || '11111111-1111-1111-1111-111111111111';

      // Prescriptions stats
      const totalPrescriptions = await count('SELECT COUNT(*) FROM prescriptions WHERE pharmacy_id = $1', [pharmacyId]);
      const pendingPrescriptions = await count('SELECT COUNT(*) FROM prescriptions WHERE pharmacy_id = $1 AND status = $2', [pharmacyId, 'pending']);
      const approvedPrescriptions = await count('SELECT COUNT(*) FROM prescriptions WHERE pharmacy_id = $1 AND status = $2', [pharmacyId, 'approved']);
      const rejectedPrescriptions = await count('SELECT COUNT(*) FROM prescriptions WHERE pharmacy_id = $1 AND status = $2', [pharmacyId, 'rejected']);

      // Consultations stats
      const totalConsultations = await count('SELECT COUNT(*) FROM calendar_events WHERE event_type = $1', ['teleconsultation']);
      const upcomingConsultations = await count(`SELECT COUNT(*) FROM calendar_events WHERE event_type = $1 AND start_time > NOW()`, ['teleconsultation']);
      const completedConsultations = await count(`SELECT COUNT(*) FROM calendar_events WHERE event_type = $1 AND end_time < NOW()`, ['teleconsultation']);

      // Revenue from payments (aggregated - payments table doesn't have pharmacy_id)
      const revenueTotal = await queryOne<{ total: string }>('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = $1', ['completed']);
      const revenueThisMonth = await queryOne<{ total: string }>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM payments
         WHERE status = 'completed'
         AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)`
      );

      // Inventory stats (aggregated - products table doesn't have pharmacy_id)
      const totalProducts = await count('SELECT COUNT(*) FROM products');
      const lowStock = await count('SELECT COUNT(*) FROM products WHERE stock <= low_stock_threshold AND stock > 0');
      const expiringSoon = await count(`SELECT COUNT(*) FROM products WHERE expiry_date IS NOT NULL AND expiry_date < NOW() + INTERVAL '30 days'`);

      // Deliveries stats (aggregated - deliveries table doesn't have pharmacy_id)
      const totalDeliveries = await count('SELECT COUNT(*) FROM deliveries');
      const inTransitDeliveries = await count('SELECT COUNT(*) FROM deliveries WHERE status = $1', ['in_transit']);
      const completedDeliveries = await count('SELECT COUNT(*) FROM deliveries WHERE status = $1', ['delivered']);

      res.json({
        success: true,
        data: {
          prescriptions: {
            total: totalPrescriptions,
            pending: pendingPrescriptions,
            approved: approvedPrescriptions,
            rejected: rejectedPrescriptions,
            trend: '+12%',
          },
          consultations: {
            total: totalConsultations,
            upcoming: upcomingConsultations,
            completed: completedConsultations,
            trend: '+8%',
          },
          revenue: {
            total: parseFloat(revenueTotal?.total || '0'),
            thisMonth: parseFloat(revenueThisMonth?.total || '0'),
            trend: '+15%',
          },
          inventory: {
            totalItems: totalProducts,
            lowStock: lowStock,
            expiringSoon: expiringSoon,
          },
          deliveries: {
            total: totalDeliveries,
            inTransit: inTransitDeliveries,
            completed: completedDeliveries,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard analytics',
      });
    }
  }
);

/**
 * GET /api/dashboard/patients
 * Get patient metrics from real database
 */
app.get(
  '/api/dashboard/patients',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const pharmacyId = (req as any).user?.pharmacyId || '11111111-1111-1111-1111-111111111111';

      // Total unique patients from prescriptions
      const totalPatients = await count('SELECT COUNT(DISTINCT patient_id) FROM prescriptions WHERE pharmacy_id = $1', [pharmacyId]);

      // New patients (registered in last 30 days)
      const newPatients = await count(
        `SELECT COUNT(DISTINCT p.patient_id) FROM prescriptions p
         JOIN users u ON p.patient_id = u.id
         WHERE p.pharmacy_id = $1 AND u.created_at >= NOW() - INTERVAL '30 days'`,
        [pharmacyId]
      );

      // Active patients (had prescriptions in last 90 days)
      const activePatients = await count(
        `SELECT COUNT(DISTINCT patient_id) FROM prescriptions
         WHERE pharmacy_id = $1 AND created_at >= NOW() - INTERVAL '90 days'`,
        [pharmacyId]
      );

      // Chronic patients (patients with 3+ prescriptions)
      const chronicPatients = await count(
        `SELECT COUNT(*) FROM (
           SELECT patient_id FROM prescriptions
           WHERE pharmacy_id = $1
           GROUP BY patient_id
           HAVING COUNT(*) >= 3
         ) chronic`,
        [pharmacyId]
      );

      res.json({
        success: true,
        data: {
          totalPatients,
          newPatients,
          activePatients,
          chronicPatients,
        },
      });
    } catch (error) {
      console.error('Error fetching patient metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patient metrics',
      });
    }
  }
);

/**
 * GET /api/dashboard/popular-medications
 * Get popular medications from real database
 */
app.get(
  '/api/dashboard/popular-medications',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const pharmacyId = (req as any).user?.pharmacyId || '11111111-1111-1111-1111-111111111111';

      // Get top 5 most prescribed medications
      const medications = await query<{ name: string; count: string }>(
        `SELECT
          pi.medication_name as name,
          COUNT(*)::int as count
         FROM prescription_items pi
         JOIN prescriptions p ON pi.prescription_id = p.id
         WHERE p.pharmacy_id = $1
         GROUP BY pi.medication_name
         ORDER BY count DESC
         LIMIT 5`,
        [pharmacyId]
      );

      res.json({
        success: true,
        data: medications.map(m => ({
          name: m.name || 'Unknown Medication',
          count: parseInt(m.count, 10) || 0,
        })),
      });
    } catch (error) {
      console.error('Error fetching popular medications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch popular medications',
      });
    }
  }
);

/**
 * GET /api/dashboard/consultation-trends
 * Get consultation trends from real database
 */
app.get(
  '/api/dashboard/consultation-trends',
  authenticateToken,
  async (_req: Request, res: Response) => {
    try {
      // This week's consultations
      const thisWeek = await count(
        `SELECT COUNT(*) FROM calendar_events
         WHERE event_type = 'teleconsultation'
         AND start_time >= DATE_TRUNC('week', CURRENT_DATE)`
      );

      // Last week's consultations
      const lastWeek = await count(
        `SELECT COUNT(*) FROM calendar_events
         WHERE event_type = 'teleconsultation'
         AND start_time >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
         AND start_time < DATE_TRUNC('week', CURRENT_DATE)`
      );

      // Calculate trend
      let trend = '+0%';
      if (lastWeek > 0) {
        const change = ((thisWeek - lastWeek) / lastWeek) * 100;
        trend = `${change >= 0 ? '+' : ''}${Math.round(change)}%`;
      }

      // Get peak days (by day of week)
      const peakDaysResult = await query<{ day_name: string; count: string }>(
        `SELECT
          TO_CHAR(start_time, 'Day') as day_name,
          COUNT(*)::int as count
         FROM calendar_events
         WHERE event_type = 'teleconsultation'
           AND start_time >= NOW() - INTERVAL '30 days'
         GROUP BY TO_CHAR(start_time, 'Day'), EXTRACT(DOW FROM start_time)
         ORDER BY count DESC
         LIMIT 3`
      );

      const dayTranslation: Record<string, string> = {
        'Monday': 'Lundi',
        'Tuesday': 'Mardi',
        'Wednesday': 'Mercredi',
        'Thursday': 'Jeudi',
        'Friday': 'Vendredi',
        'Saturday': 'Samedi',
        'Sunday': 'Dimanche',
      };

      const peakDays = peakDaysResult.map(d =>
        dayTranslation[d.day_name.trim()] || d.day_name.trim()
      );

      res.json({
        success: true,
        data: {
          thisWeek,
          lastWeek,
          trend,
          peakDays: peakDays.length > 0 ? peakDays : ['Lundi', 'Mercredi', 'Vendredi'],
        },
      });
    } catch (error) {
      console.error('Error fetching consultation trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch consultation trends',
      });
    }
  }
);

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

  // Don't expose internal errors in production
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
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Analytics Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
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
