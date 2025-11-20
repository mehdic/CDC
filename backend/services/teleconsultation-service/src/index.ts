/**
 * Teleconsultation Service
 * Main Express server for teleconsultation management
 *
 * Endpoints:
 * - POST /api/teleconsultation/sessions - Create new session
 * - GET /api/teleconsultation/sessions - List all sessions
 * - GET /api/teleconsultation/sessions/:id - Get session details
 * - PATCH /api/teleconsultation/sessions/:id - Update session status/notes
 * - POST /api/teleconsultation/sessions/:id/participants - Add participant
 * - DELETE /api/teleconsultation/sessions/:id/participants/:participantId - Remove participant
 * - GET /api/teleconsultation/sessions/:id/participants - Get participants
 * - POST /api/teleconsultation/sessions/:id/recordings - Start recording
 * - DELETE /api/teleconsultation/sessions/:id/recordings/:recordingId - Stop recording
 * - GET /api/teleconsultation/sessions/:id/recordings - List recordings
 * - GET /health - Health check
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase, clearDatabase } from './database';
import teleconsultationRoutes from './api/routes';

// Initialize database
initializeDatabase();

// Clear database in test mode (for test isolation)
if (process.env.NODE_ENV === 'test') {
  clearDatabase();
}

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.TELECONSULTATION_SERVICE_PORT || 4006;
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
// Health Check
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'teleconsultation-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/api/teleconsultation', teleconsultationRoutes);

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
      console.log(`🚀 Teleconsultation Service running on port ${PORT}`);
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

// Only start server if this file is executed directly AND not in test mode
if (require.main === module && process.env.NODE_ENV !== 'test') {
  startServer();
}

// Export app for testing
export default app;
