/**
 * Patient Service
 * Manages patient-specific features including gamification achievements
 * T6-020: Achievements gamification system
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import 'reflect-metadata';

import { initializeDatabase } from './config/database';
import achievementRoutes from './routes/achievements';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4030;
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
    service: 'Patient Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({
    service: 'MetaPharm Connect - Patient Service',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    description: 'Patient-specific features and gamification',
    endpoints: {
      achievements: '/achievements',
      health: '/health',
    },
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/achievements', achievementRoutes);

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
      console.info('MetaPharm Connect - Patient Service');
      console.info('Gamification & Patient Features');
      console.info('='.repeat(60));
      console.info(`Environment: ${NODE_ENV}`);
      console.info(`Port: ${PORT}`);
      console.info(`Service URL: http://localhost:${PORT}`);
      console.info('='.repeat(60));
      console.info('Endpoints:');
      console.info(`  GET  /achievements                    - Get all achievements`);
      console.info(`  GET  /achievements/:achievementId     - Get achievement details`);
      console.info(`  GET  /achievements/patient/:patientId - Get patient achievements`);
      console.info(`  GET  /achievements/leaderboard        - Get achievement leaderboard`);
      console.info(`  POST /achievements/unlock             - Unlock achievement`);
      console.info(`  POST /achievements/triggers/first-order           - Trigger first order`);
      console.info(`  POST /achievements/triggers/adherence-streak      - Trigger adherence`);
      console.info(`  POST /achievements/triggers/referral-milestone    - Trigger referral`);
      console.info(`  POST /achievements/triggers/vip-tier-upgrade      - Trigger VIP tier`);
      console.info(`  POST /achievements/triggers/health-goal           - Trigger health goal`);
      console.info('='.repeat(60));
      console.info('Achievement Categories:');
      console.info(`  - health (Medication & wellness)`);
      console.info(`  - loyalty (VIP & points)`);
      console.info(`  - social (Referrals & community)`);
      console.info(`  - milestone (Milestones & badges)`);
      console.info('='.repeat(60));
      console.info('Achievement Tiers:');
      console.info(`  BRONZE:    Common (10 points)`);
      console.info(`  SILVER:    Uncommon (25 points)`);
      console.info(`  GOLD:      Rare (50+ points)`);
      console.info(`  PLATINUM:  Legendary (100+ points)`);
      console.info('='.repeat(60));
      console.info('Health Check: http://localhost:' + PORT + '/health');
      console.info('='.repeat(60));
    });
  } catch (error) {
    console.error('Failed to start Patient Service:', error);
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
