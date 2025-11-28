/**
 * VIP Service
 * "Golden MetaPharm" Loyalty Program
 * T3-095 to T3-099: VIP program implementation
 * Features:
 *  - Points system (earn on purchases, double on prescriptions)
 *  - Tier benefits (Bronze/Silver/Gold/Platinum)
 *  - Points expiry (12 months)
 *  - Birthday bonus
 *  - Free delivery for qualifying tiers
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import 'reflect-metadata';

import { initializeDatabase } from './config/database';
import vipRoutes from './routes/vip';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4015;
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
    service: 'VIP Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({
    service: 'MetaPharm Connect - VIP Service',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    description: 'Golden MetaPharm Loyalty Program',
    endpoints: {
      membership: '/vip/membership',
      points: '/vip/points',
      discount: '/vip/discount',
      health: '/health',
    },
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/vip', vipRoutes);

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
      console.info('MetaPharm Connect - VIP Service');
      console.info('Golden MetaPharm Loyalty Program');
      console.info('='.repeat(60));
      console.info(`Environment: ${NODE_ENV}`);
      console.info(`Port: ${PORT}`);
      console.info(`Service URL: http://localhost:${PORT}`);
      console.info('='.repeat(60));
      console.info('Endpoints:');
      console.info(`  GET  /vip/membership              - Get membership with benefits`);
      console.info(`  GET  /vip/summary                 - Get membership summary`);
      console.info(`  GET  /vip/points/history          - Get points history`);
      console.info(`  POST /vip/points/earn             - Earn points from purchase`);
      console.info(`  POST /vip/points/redeem           - Redeem points`);
      console.info(`  POST /vip/points/birthday         - Award birthday bonus`);
      console.info(`  GET  /vip/discount                - Get discount percentage`);
      console.info(`  GET  /vip/delivery/eligible       - Check free delivery eligibility`);
      console.info(`  GET  /vip/tier/thresholds         - Get tier thresholds`);
      console.info('='.repeat(60));
      console.info('VIP Tier Structure:');
      console.info(`  BRONZE:    0-999 points    (0% discount)`);
      console.info(`  SILVER:    1000-4999 points (5% discount)`);
      console.info(`  GOLD:      5000-19999 points (10% discount)`);
      console.info(`  PLATINUM:  20000+ points   (15% discount)`);
      console.info('='.repeat(60));
      console.info('Health Check: http://localhost:' + PORT + '/health');
      console.info('='.repeat(60));
    });
  } catch (error) {
    console.error('Failed to start VIP Service:', error);
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
