/**
 * API Gateway (T052)
 * Main entry point for MetaPharm Connect API Gateway
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Features:
 * - Request routing to microservices
 * - Rate limiting
 * - JWT authentication
 * - CORS configuration
 * - Request logging
 * - Health checks
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import and initialize tracing BEFORE other imports
import { initializeTracing, tracingMiddleware } from '../../../shared/middleware/tracing';

// Initialize tracing
initializeTracing({
  serviceName: 'api-gateway',
  environment: process.env['NODE_ENV'] || 'development',
  exporterUrl: process.env['OTLP_EXPORTER_URL'] || 'http://localhost:4318/v1/traces',
  enableConsoleExporter: (process.env['NODE_ENV'] || 'development') === 'development'
});

// Middleware imports
import { corsMiddleware, additionalCorsHeaders } from './middleware/cors';
import { requestLoggerWithSkip } from './middleware/logger';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';
import { authenticateJWT } from '../../../shared/middleware/auth';
// Security middleware (T8-012, T8-013, T8-014)
import {
  configureSecurityHeaders,
  configureCSP,
  addCustomSecurityHeaders
} from '../../../shared/middleware/securityHeaders';
import { sanitizeInput, blockXSSPayloads } from './middleware/inputSanitizer';

// Route imports
import healthRouter from './routes/health';
import {
  authProxy,
  prescriptionProxy,
  teleconsultationProxy,
  inventoryProxy,
  notificationProxy,
  orderProxy,
  analyticsProxy,
  dashboardProxy,
  productsProxy,
} from './routes/proxy';

// Configuration
const PORT = process.env['API_GATEWAY_PORT'] || process.env['PORT'] || 4000;
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const AUTH_SERVICE_URL = process.env['AUTH_SERVICE_URL'] || 'http://localhost:4001';

// ============================================================================
// Express App Setup
// ============================================================================

const app = express();

// Trust proxy (for rate limiting by IP when behind a reverse proxy)
app.set('trust proxy', 1);

// ============================================================================
// Middleware Stack (ORDER MATTERS!)
// ============================================================================

// 1. Security Headers (Helmet.js) - T8-013: Must be early in stack
app.use(configureSecurityHeaders());

// 2. CSP (Content Security Policy) - T8-012: Defense in depth
app.use(configureCSP());

// 3. Custom Security Headers - T8-012: Additional security controls
app.use(addCustomSecurityHeaders);

// 4. CORS - Must be early to handle preflight requests
app.use(corsMiddleware);
app.use(additionalCorsHeaders);

// 5. Tracing - Create spans for all requests
app.use(tracingMiddleware);

// 6. Request Logging - Log all incoming requests
app.use(requestLoggerWithSkip);

// 7. General Rate Limiting - T8-016: Apply to all routes
app.use(generalLimiter);

// 8. Body Parsing - Must be BEFORE routes that need it
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 9. Input Sanitization - T8-014: XSS Protection (AFTER body parsing)
app.use(blockXSSPayloads);
app.use(sanitizeInput);

// 10. JSON Parsing Error Handler - Must come AFTER body parser
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    // Invalid JSON payload
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON payload',
      code: 'INVALID_JSON',
    });
  }
  next(err);
});

// ============================================================================
// Public Routes (No Authentication Required)
// ============================================================================

// Health check endpoints (public, no JWT required)
app.use('/', healthRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'MetaPharm Connect API Gateway',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Authentication Routes (Stricter Rate Limiting, No JWT)
// NOTE: Proxy routes should not have body parsing middleware
// ============================================================================

// Auth routes: login, register, MFA - stricter rate limiting
console.log('Registering /api/auth and /auth proxies to', AUTH_SERVICE_URL);

// TEMPORARY: Direct forwarding instead of proxy middleware
// TODO: Fix http-proxy-middleware configuration issue
// Support both /api/auth and /auth patterns
const authForwardHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const axios = require('axios');
    // Strip /api prefix before forwarding to auth-service
    const pathWithoutApi = req.path.replace(/^\/api/, '');
    const targetUrl = `${AUTH_SERVICE_URL}/auth${pathWithoutApi}`;
    console.log('[AUTH FORWARD] Forwarding', req.method, req.url, 'to', targetUrl);

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: new URL(AUTH_SERVICE_URL).host,
      },
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error('[AUTH FORWARD] Error:', error.message);
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'The auth service is temporarily unavailable',
      });
    }
  }
};

app.use('/api/auth', authForwardHandler);
app.use('/auth', authForwardHandler);

// ============================================================================
// Protected Routes (JWT Authentication Required)
// ============================================================================

// Apply JWT authentication middleware ONLY to protected routes
// Support both /api/X and /X patterns for backward compatibility

// Prescription Service - Direct forwarding for PUT/POST requests (body parsing issue with http-proxy-middleware)
const PRESCRIPTION_SERVICE_URL = process.env['PRESCRIPTION_SERVICE_URL'] || 'http://localhost:4002';
const prescriptionForwardHandler = async (req: Request, res: Response, next: NextFunction) => {
  // Only handle PUT and POST requests with body - proxy works fine for GET
  if (req.method !== 'PUT' && req.method !== 'POST') {
    return next();
  }

  try {
    const axios = require('axios');
    const targetUrl = `${PRESCRIPTION_SERVICE_URL}/prescriptions${req.path}`;
    console.log('[PRESCRIPTION FORWARD] Forwarding', req.method, req.url, 'to', targetUrl);

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        'X-User-ID': (req as any).user?.userId,
        'X-User-Role': (req as any).user?.role,
        'X-Pharmacy-ID': (req as any).user?.pharmacyId,
      },
      timeout: 30000, // 30 second timeout
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      console.log('[PRESCRIPTION FORWARD] Error response:', error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('[PRESCRIPTION FORWARD] Timeout:', error.message);
      res.status(504).json({
        error: 'Gateway Timeout',
        message: 'The prescription service did not respond in time',
      });
    } else {
      console.error('[PRESCRIPTION FORWARD] Error:', error.message);
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'The prescription service is temporarily unavailable',
      });
    }
  }
};

// Prescription routes - use forwarding for PUT/POST, proxy for GET
app.use('/api/prescriptions', authenticateJWT, prescriptionForwardHandler, prescriptionProxy);
app.use('/prescriptions', authenticateJWT, prescriptionForwardHandler, prescriptionProxy);

// Teleconsultation Service
app.use('/api/teleconsultations', authenticateJWT, teleconsultationProxy);
app.use('/teleconsultations', authenticateJWT, teleconsultationProxy);

// Inventory Service
app.use('/api/inventory', authenticateJWT, inventoryProxy);
app.use('/inventory', authenticateJWT, inventoryProxy);

// Notification Service
app.use('/api/notifications', authenticateJWT, notificationProxy);
app.use('/notifications', authenticateJWT, notificationProxy);

// Order & Cart Service
app.use('/api/orders', authenticateJWT, orderProxy);
app.use('/orders', authenticateJWT, orderProxy);
app.use('/api/cart', authenticateJWT, orderProxy);
app.use('/cart', authenticateJWT, orderProxy);

// Analytics Service
app.use('/api/analytics', authenticateJWT, analyticsProxy);
app.use('/analytics', authenticateJWT, analyticsProxy);

// Dashboard Service (routes to Analytics)
app.use('/api/dashboard', authenticateJWT, dashboardProxy);
app.use('/dashboard', authenticateJWT, dashboardProxy);

// Products Service (routes to Prescription Service for medication autocomplete)
app.use('/api/products', authenticateJWT, productsProxy);
app.use('/products', authenticateJWT, productsProxy);

// ============================================================================
// Error Handling
// ============================================================================

/**
 * 404 Not Found Handler
 * IMPORTANT: Must come AFTER all route definitions but BEFORE global error handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
});

/**
 * Global Error Handler
 */
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'CORS policy does not allow access from this origin',
      code: 'CORS_ERROR',
    });
    return;
  }

  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    code: 'INTERNAL_ERROR',
  });
});

// ============================================================================
// Server Startup
// ============================================================================

let server: any;

/**
 * Start the API Gateway server
 */
export function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(PORT, () => {
        console.info('='.repeat(60));
        console.info('MetaPharm Connect API Gateway');
        console.info('='.repeat(60));
        console.info(`Environment: ${NODE_ENV}`);
        console.info(`Port: ${PORT}`);
        console.info(`Gateway URL: http://localhost:${PORT}`);
        console.info('='.repeat(60));
        console.info('Microservices:');
        console.info(`  - Auth Service: ${process.env['AUTH_SERVICE_URL'] || 'http://localhost:4001'}`);
        console.info(`  - Prescription Service: ${process.env['PRESCRIPTION_SERVICE_URL'] || 'http://localhost:4002'}`);
        console.info(`  - Teleconsultation Service: ${process.env['TELECONSULTATION_SERVICE_URL'] || 'http://localhost:4003'}`);
        console.info(`  - Inventory Service: ${process.env['INVENTORY_SERVICE_URL'] || 'http://localhost:4004'}`);
        console.info(`  - Notification Service: ${process.env['NOTIFICATION_SERVICE_URL'] || 'http://localhost:4005'}`);
        console.info(`  - Order Service: ${process.env['ORDER_SERVICE_URL'] || 'http://localhost:4007'}`);
        console.info('='.repeat(60));
        console.info('Health Check: http://localhost:' + PORT + '/health');
        console.info('='.repeat(60));

        resolve();
      });

      server.on('error', (error: Error) => {
        console.error('Server failed to start:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      reject(error);
    }
  });
}

/**
 * Graceful shutdown
 */
export function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      console.info('Shutting down API Gateway...');
      server.close(() => {
        console.info('API Gateway stopped');
        resolve();
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.warn('Forcing shutdown...');
        process.exit(0);
      }, 10000);
    } else {
      resolve();
    }
  });
}

// ============================================================================
// Graceful Shutdown Handlers
// ============================================================================

process.on('SIGTERM', async () => {
  console.info('SIGTERM received, shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.info('SIGINT received, shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, _promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// ============================================================================
// Start Server (if not in test environment)
// ============================================================================

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start API Gateway:', error);
    process.exit(1);
  });
}

// Export app for testing
export default app;
