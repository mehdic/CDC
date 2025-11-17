/**
 * MetaPharm Connect - Notification Service
 * Port: 4005
 *
 * Handles all notification delivery:
 * - Email (Twilio SendGrid)
 * - SMS (Twilio)
 * - Push notifications (Firebase Cloud Messaging)
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import controllers
import { sendEmail, sendBulkEmail, getEmailStatus } from './controllers/emailController';
import { sendSMS, sendBulkSMS, getSMSStatus, getSMSHealth } from './controllers/smsController';

// Import push worker (auto-starts via module initialization)
import './workers/pushWorker';

const app: Application = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 4005;
const SERVICE_NAME = 'notification-service';

// Redis client for queue management
let redisClient: RedisClientType;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const health = {
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: redisClient?.isOpen ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
  };

  res.status(200).json(health);
});

// Service info endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    description: 'MetaPharm Connect Notification Service',
    endpoints: {
      health: '/health',
      email: 'POST /notifications/email',
      sms: 'POST /notifications/sms',
      push: 'POST /notifications/push',
    },
  });
});

// ============================================================================
// Notification Routes
// ============================================================================

// Email routes
app.post('/notifications/email', sendEmail);
app.post('/notifications/email/bulk', sendBulkEmail);
app.get('/notifications/email/status', getEmailStatus);

// SMS routes
app.post('/notifications/sms', sendSMS);
app.post('/notifications/sms/bulk', sendBulkSMS);
app.get('/notifications/sms/status/:messageId', getSMSStatus);
app.get('/notifications/sms/health', getSMSHealth);

// Push notification routes (queue-based)
// Note: Push notifications are queued via Redis, no direct HTTP endpoint needed
// The pushWorker processes the queue asynchronously

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    service: SERVICE_NAME,
  });
});

// Initialize Redis connection
async function connectRedis(): Promise<void> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log(`[${SERVICE_NAME}] Connecting to Redis: ${redisUrl}`);

    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    await redisClient.connect();
    console.log('[Redis] Client ready');
  } catch (error) {
    console.error('[Redis] Failed to connect:', error);
    // Don't exit - service can still handle direct notifications
    // Queue-based notifications will fail gracefully
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log(`[${SERVICE_NAME}] SIGTERM received, shutting down gracefully...`);

  // Close Redis connection
  if (redisClient?.isOpen) {
    await redisClient.quit();
    console.log('[Redis] Connection closed');
  }

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log(`[${SERVICE_NAME}] SIGINT received, shutting down gracefully...`);

  // Close Redis connection
  if (redisClient?.isOpen) {
    await redisClient.quit();
    console.log('[Redis] Connection closed');
  }

  process.exit(0);
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to Redis first
    await connectRedis();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║  MetaPharm Connect - Notification Service             ║
║  Port: ${PORT}                                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║  Status: Running                                       ║
╚════════════════════════════════════════════════════════╝
      `);
      console.log(`[${SERVICE_NAME}] Ready to process notifications`);
      console.log(`[${SERVICE_NAME}] Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Failed to start:`, error);
    process.exit(1);
  }
}

// Export for testing
export { app, redisClient };

// Start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
