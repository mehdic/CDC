/**
 * Request Routing & Proxying (T054)
 * Routes requests to appropriate microservices
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Microservices:
 * - Auth Service: /auth/* → http://localhost:4001
 * - Prescription Service: /prescriptions/* → http://localhost:4002
 * - Teleconsultation Service: /teleconsultations/* → http://localhost:4003
 * - Inventory Service: /inventory/* → http://localhost:4004
 * - Notification Service: /notifications/* → http://localhost:4005
 */

import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Request, Response } from 'express';

// Service URLs from environment
const AUTH_SERVICE_URL = process.env['AUTH_SERVICE_URL'] || 'http://localhost:4001';
const PRESCRIPTION_SERVICE_URL = process.env['PRESCRIPTION_SERVICE_URL'] || 'http://localhost:4002';
const TELECONSULTATION_SERVICE_URL = process.env['TELECONSULTATION_SERVICE_URL'] || 'http://localhost:4003';
const INVENTORY_SERVICE_URL = process.env['INVENTORY_SERVICE_URL'] || 'http://localhost:4004';
const NOTIFICATION_SERVICE_URL = process.env['NOTIFICATION_SERVICE_URL'] || 'http://localhost:4005';

console.info('Proxy Configuration:', {
  authService: AUTH_SERVICE_URL,
  prescriptionService: PRESCRIPTION_SERVICE_URL,
  teleconsultationService: TELECONSULTATION_SERVICE_URL,
  inventoryService: INVENTORY_SERVICE_URL,
  notificationService: NOTIFICATION_SERVICE_URL,
});

/**
 * Common proxy options
 */
const commonProxyOptions = {
  changeOrigin: true,
  // logLevel removed - not available in current http-proxy-middleware version

  /**
   * Preserve original headers (Authorization, etc.)
   */
  onProxyReq: (proxyReq: any, req: any) => {
    // Forward authentication header
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }

    // Forward user context headers
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.userId);
      proxyReq.setHeader('X-User-Role', req.user.role);
      if (req.user.pharmacyId) {
        proxyReq.setHeader('X-Pharmacy-ID', req.user.pharmacyId);
      }
    }

    // Forward request ID for tracing
    if (req.headers['x-request-id']) {
      proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
    }

    console.debug('Proxying request:', {
      path: req.path,
      method: req.method,
      target: proxyReq.path,
      userId: req.user?.userId || 'anonymous',
    });
  },

  /**
   * Handle proxy errors gracefully
   */
  onError: (err: Error, req: Request, res: Response) => {
    console.error('Proxy error:', {
      error: err.message,
      path: req.path,
      method: req.method,
      stack: err.stack,
    });

    res.status(503).json({
      error: 'Service Unavailable',
      message: 'The requested service is temporarily unavailable. Please try again later.',
      code: 'SERVICE_UNAVAILABLE',
    });
  },

  /**
   * Log proxy responses
   */
  onProxyRes: (proxyRes: any, req: any) => {
    console.debug('Proxy response:', {
      path: req.path,
      method: req.method,
      statusCode: proxyRes.statusCode,
      userId: (req as any).user?.userId || 'anonymous',
    });
  },
};

/**
 * Auth Service Proxy
 * Routes: /auth/*
 * Note: Express app.use('/auth', authProxy) strips /auth prefix before passing to middleware
 * So: Request /auth/login becomes /login in middleware
 * We need to add /auth back for the auth service
 */
// http-proxy-middleware v2 for auth service
export const authProxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path: string) => {
    const newPath = path.replace(/^\//, '/auth/');
    console.log('[AUTH PROXY] Path rewrite:', path, '→', newPath);
    return newPath;
  },
  onProxyReq: (proxyReq: any, req: any) => {
    console.log('[AUTH PROXY] Proxying:', req.method, req.url, '→', proxyReq.path);

    // Forward authentication header
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }

    // Forward user context headers
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.userId);
      proxyReq.setHeader('X-User-Role', req.user.role);
      if (req.user.pharmacyId) {
        proxyReq.setHeader('X-Pharmacy-ID', req.user.pharmacyId);
      }
    }

    // Forward request ID for tracing
    if (req.headers['x-request-id']) {
      proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
    }
  },
  onError: (err: Error, req: any, res: any) => {
    console.error('[AUTH PROXY] Error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'The auth service is temporarily unavailable',
      });
    }
  },
});

/**
 * Prescription Service Proxy
 * Routes: /api/prescriptions/*
 */
export const prescriptionProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: PRESCRIPTION_SERVICE_URL,
  pathRewrite: {
    '^/api/prescriptions': '/prescriptions', // Strip /api, keep /prescriptions for backend
  },
});

/**
 * Teleconsultation Service Proxy
 * Routes: /api/teleconsultations/*
 */
export const teleconsultationProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: TELECONSULTATION_SERVICE_URL,
  pathRewrite: {
    '^/api/teleconsultations': '/teleconsultations', // Strip /api, keep /teleconsultations for backend
  },
});

/**
 * Inventory Service Proxy
 * Routes: /api/inventory/*
 */
export const inventoryProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: INVENTORY_SERVICE_URL,
  pathRewrite: {
    '^/api/inventory': '/inventory', // Strip /api, keep /inventory for backend
  },
});

/**
 * Notification Service Proxy
 * Routes: /api/notifications/*
 */
export const notificationProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: NOTIFICATION_SERVICE_URL,
  pathRewrite: {
    '^/api/notifications': '/notifications', // Strip /api, keep /notifications for backend
  },
});

/**
 * Service health status cache
 * Used by health check endpoint
 */
export const serviceEndpoints = [
  { name: 'auth', url: AUTH_SERVICE_URL },
  { name: 'prescription', url: PRESCRIPTION_SERVICE_URL },
  { name: 'teleconsultation', url: TELECONSULTATION_SERVICE_URL },
  { name: 'inventory', url: INVENTORY_SERVICE_URL },
  { name: 'notification', url: NOTIFICATION_SERVICE_URL },
];
