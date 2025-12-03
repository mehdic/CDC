/**
 * Digital Twin Service
 * Main server entry point
 *
 * Purpose: AI-powered patient health profile service
 * - Comprehensive health data aggregation
 * - Risk assessment and predictions
 * - Personalized health recommendations
 * - Health trajectory tracking
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase } from './config/database';
import { createDigitalTwinRouter } from './routes/digitalTwin';

const app = express();
const PORT = process.env.PORT || 3024;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Larger limit for complex health data
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'digital-twin-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'AI-powered patient profiles',
      'Health risk assessment',
      'Personalized recommendations',
      'What-if scenario modeling',
      'Health trajectory tracking',
    ],
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    statusCode: 500,
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database connection
    const dataSource = await initializeDatabase();

    // Mount digital twin routes
    app.use('/api', createDigitalTwinRouter(dataSource));

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        statusCode: 404,
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Digital Twin Service running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   API base URL: http://localhost:${PORT}/api`);
      console.log('');
      console.log('📊 Available endpoints:');
      console.log('   GET    /api/digital-twin/:patientId');
      console.log('   POST   /api/digital-twin');
      console.log('   PUT    /api/digital-twin/:patientId');
      console.log('   POST   /api/digital-twin/:patientId/recalculate');
      console.log('   POST   /api/digital-twin/:patientId/recommendations');
      console.log('   POST   /api/digital-twin/:patientId/what-if');
      console.log('   GET    /api/digital-twin/:patientId/trajectory');
      console.log('   GET    /api/digital-twin/:patientId/risk-factors');
    });
  } catch (error) {
    console.error('❌ Failed to start Digital Twin Service:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
