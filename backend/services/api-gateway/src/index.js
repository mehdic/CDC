"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
exports.stopServer = stopServer;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = require("./middleware/cors");
const logger_1 = require("./middleware/logger");
const rateLimiter_1 = require("./middleware/rateLimiter");
const auth_1 = require("../../../shared/middleware/auth");
const health_1 = __importDefault(require("./routes/health"));
const proxy_1 = require("./routes/proxy");
const PORT = process.env['PORT'] || 4000;
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use(cors_1.corsMiddleware);
app.use(cors_1.additionalCorsHeaders);
app.use(logger_1.requestLoggerWithSkip);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter_1.generalLimiter);
app.use('/', health_1.default);
app.get('/', (_req, res) => {
    res.json({
        service: 'MetaPharm Connect API Gateway',
        version: '1.0.0',
        status: 'running',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});
app.use('/auth', rateLimiter_1.authLimiter, proxy_1.authProxy);
app.use(auth_1.authenticateJWT);
app.use('/prescriptions', proxy_1.prescriptionProxy);
app.use('/teleconsultations', proxy_1.teleconsultationProxy);
app.use('/inventory', proxy_1.inventoryProxy);
app.use('/notifications', proxy_1.notificationProxy);
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        code: 'ROUTE_NOT_FOUND',
    });
});
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    if (err.message === 'Not allowed by CORS') {
        res.status(403).json({
            error: 'Forbidden',
            message: 'CORS policy does not allow access from this origin',
            code: 'CORS_ERROR',
        });
        return;
    }
    res.status(500).json({
        error: 'Internal Server Error',
        message: NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
        code: 'INTERNAL_ERROR',
    });
});
let server;
function startServer() {
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
                console.info('='.repeat(60));
                console.info('Health Check: http://localhost:' + PORT + '/health');
                console.info('='.repeat(60));
                resolve();
            });
            server.on('error', (error) => {
                console.error('Server failed to start:', error);
                reject(error);
            });
        }
        catch (error) {
            console.error('Failed to start server:', error);
            reject(error);
        }
    });
}
function stopServer() {
    return new Promise((resolve) => {
        if (server) {
            console.info('Shutting down API Gateway...');
            server.close(() => {
                console.info('API Gateway stopped');
                resolve();
            });
            setTimeout(() => {
                console.warn('Forcing shutdown...');
                process.exit(0);
            }, 10000);
        }
        else {
            resolve();
        }
    });
}
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
process.on('unhandledRejection', (reason, _promise) => {
    console.error('Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
if (require.main === module) {
    startServer().catch((error) => {
        console.error('Failed to start API Gateway:', error);
        process.exit(1);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map