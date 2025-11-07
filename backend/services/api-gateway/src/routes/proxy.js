"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceEndpoints = exports.notificationProxy = exports.inventoryProxy = exports.teleconsultationProxy = exports.prescriptionProxy = exports.authProxy = void 0;
const http_proxy_middleware_1 = require("http-proxy-middleware");
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
const commonProxyOptions = {
    changeOrigin: true,
    logLevel: process.env['NODE_ENV'] === 'production' ? 'warn' : 'info',
    onProxyReq: (proxyReq, req) => {
        if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
        }
        if (req.user) {
            proxyReq.setHeader('X-User-ID', req.user.userId);
            proxyReq.setHeader('X-User-Role', req.user.role);
            if (req.user.pharmacyId) {
                proxyReq.setHeader('X-Pharmacy-ID', req.user.pharmacyId);
            }
        }
        if (req.headers['x-request-id']) {
            proxyReq.setHeader('X-Request-ID', req.headers['x-request-id']);
        }
        console.debug('Proxying request:', {
            path: req.path,
            method: req.method,
            target: proxyReq.path,
            userId: req.user?.userId || 'anonymous',
        });
    },
    onError: (err, req, res) => {
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
    onProxyRes: (proxyRes, req) => {
        console.debug('Proxy response:', {
            path: req.path,
            method: req.method,
            statusCode: proxyRes.statusCode,
            userId: req.user?.userId || 'anonymous',
        });
    },
};
exports.authProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    ...commonProxyOptions,
    target: AUTH_SERVICE_URL,
    pathRewrite: {
        '^/auth': '',
    },
});
exports.prescriptionProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    ...commonProxyOptions,
    target: PRESCRIPTION_SERVICE_URL,
    pathRewrite: {
        '^/prescriptions': '',
    },
});
exports.teleconsultationProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    ...commonProxyOptions,
    target: TELECONSULTATION_SERVICE_URL,
    pathRewrite: {
        '^/teleconsultations': '',
    },
});
exports.inventoryProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    ...commonProxyOptions,
    target: INVENTORY_SERVICE_URL,
    pathRewrite: {
        '^/inventory': '',
    },
});
exports.notificationProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    ...commonProxyOptions,
    target: NOTIFICATION_SERVICE_URL,
    pathRewrite: {
        '^/notifications': '',
    },
});
exports.serviceEndpoints = [
    { name: 'auth', url: AUTH_SERVICE_URL },
    { name: 'prescription', url: PRESCRIPTION_SERVICE_URL },
    { name: 'teleconsultation', url: TELECONSULTATION_SERVICE_URL },
    { name: 'inventory', url: INVENTORY_SERVICE_URL },
    { name: 'notification', url: NOTIFICATION_SERVICE_URL },
];
//# sourceMappingURL=proxy.js.map