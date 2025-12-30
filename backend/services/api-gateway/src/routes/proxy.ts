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
const ORDER_SERVICE_URL = process.env['ORDER_SERVICE_URL'] || 'http://localhost:4007';
const ANALYTICS_SERVICE_URL = process.env['ANALYTICS_SERVICE_URL'] || 'http://localhost:4006';

console.info('Proxy Configuration:', {
  authService: AUTH_SERVICE_URL,
  prescriptionService: PRESCRIPTION_SERVICE_URL,
  teleconsultationService: TELECONSULTATION_SERVICE_URL,
  inventoryService: INVENTORY_SERVICE_URL,
  notificationService: NOTIFICATION_SERVICE_URL,
  orderService: ORDER_SERVICE_URL,
  analyticsService: ANALYTICS_SERVICE_URL,
});

/**
 * Common proxy event handlers (http-proxy-middleware v3 API)
 */
const commonProxyEvents = {
  proxyReq: (proxyReq: any, req: any) => {
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

  error: (err: Error, req: Request, res: Response) => {
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

  proxyRes: (proxyRes: any, req: any) => {
    console.debug('Proxy response:', {
      path: req.path,
      method: req.method,
      statusCode: proxyRes.statusCode,
      userId: (req as any).user?.userId || 'anonymous',
    });
  },
};

/**
 * Common proxy options (http-proxy-middleware v3 API)
 */
const commonProxyOptions = {
  changeOrigin: true,
  on: commonProxyEvents,
};

/**
 * Auth Service Proxy
 * Routes: /auth/*
 * Note: Express app.use('/auth', authProxy) strips /auth prefix before passing to middleware
 * So: Request /auth/login becomes /login in middleware
 * We need to add /auth back for the auth service
 */
// http-proxy-middleware v3 for auth service
export const authProxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path: string) => {
    const newPath = path.replace(/^\//, '/auth/');
    console.log('[AUTH PROXY] Path rewrite:', path, '→', newPath);
    return newPath;
  },
} as any);

/**
 * Prescription Service Proxy
 * Routes: /api/prescriptions/*
 * Note: Express app.use strips the prefix, so we add /prescriptions back
 */
export const prescriptionProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: PRESCRIPTION_SERVICE_URL,
  pathRewrite: (path: string) => {
    const newPath = '/prescriptions' + path;
    console.log('[PRESCRIPTION PROXY] Path rewrite:', path, '→', newPath);
    return newPath;
  },
});

/**
 * Teleconsultation Service Proxy
 * Routes: /api/teleconsultations/*
 * Note: Teleconsultation service uses /api/teleconsultation (singular) internally
 */
export const teleconsultationProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: TELECONSULTATION_SERVICE_URL,
  pathRewrite: (path: string) => {
    // Service expects /api/teleconsultation/... (singular)
    const newPath = '/api/teleconsultation' + path;
    console.log('[TELECONSULTATION PROXY] Path rewrite:', path, '→', newPath);
    return newPath;
  },
});

/**
 * Inventory Service Proxy
 * Routes: /api/inventory/*
 * Note: Express app.use strips the prefix, so we add /inventory back
 */
export const inventoryProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: INVENTORY_SERVICE_URL,
  pathRewrite: (path: string) => {
    const newPath = '/inventory' + path;
    console.log('[INVENTORY PROXY] Path rewrite:', path, '→', newPath);
    return newPath;
  },
});

/**
 * Notification Service Proxy
 * Routes: /api/notifications/*
 * Note: Express app.use strips the prefix, so we add /notifications back
 */
export const notificationProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: NOTIFICATION_SERVICE_URL,
  pathRewrite: (path: string) => {
    const newPath = '/notifications' + path;
    console.log('[NOTIFICATION PROXY] Path rewrite:', path, '→', newPath);
    return newPath;
  },
});

/**
 * Order & Cart Service Proxy
 * Routes: /api/orders/* and /api/cart/*
 * Note: Express app.use strips the prefix, so we add it back
 */
export const orderProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: ORDER_SERVICE_URL,
  pathRewrite: (path: string, req: any) => {
    // Determine the base path from the original URL
    const originalUrl = req.originalUrl || '';
    const basePath = originalUrl.includes('/cart') ? '/cart' : '/orders';
    const newPath = basePath + path;
    console.log('[ORDER PROXY] Path rewrite:', path, '→', newPath);
    return newPath;
  },
});

/**
 * Analytics Service Proxy
 * Routes: /api/analytics/*
 * Note: Express app.use strips the prefix, so we add /api/analytics back
 */
export const analyticsProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: ANALYTICS_SERVICE_URL,
  pathRewrite: (path: string) => {
    const newPath = '/api/analytics' + path;
    console.log('[ANALYTICS PROXY] Path rewrite:', path, '→', newPath);
    return newPath;
  },
});

/**
 * Dashboard Proxy (routes to Analytics Service)
 * Routes: /api/dashboard/*
 * Note: Express app.use('/api/dashboard', ...) strips the /api/dashboard prefix
 * So we need to add it back for the analytics service
 */
export const dashboardProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: ANALYTICS_SERVICE_URL,
  pathRewrite: (path: string) => {
    const newPath = '/api/dashboard' + path;
    console.log('[DASHBOARD PROXY] Path rewrite:', path, '→', newPath);
    return newPath;
  },
});

/**
 * Products Proxy (routes to Prescription Service for medication autocomplete)
 * Routes: /products/*
 * Note: Express app.use strips the prefix, so we add /products back
 */
export const productsProxy = createProxyMiddleware({
  ...commonProxyOptions,
  target: PRESCRIPTION_SERVICE_URL,
  pathRewrite: (path: string) => {
    const newPath = '/products' + path;
    console.log('[PRODUCTS PROXY] Path rewrite:', path, '→', newPath);
    return newPath;
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
  { name: 'order', url: ORDER_SERVICE_URL },
  { name: 'analytics', url: ANALYTICS_SERVICE_URL },
];
