"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const emailController_1 = require("./controllers/emailController");
const smsController_1 = require("./controllers/smsController");
require("./workers/pushWorker");
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 4005;
const SERVICE_NAME = 'notification-service';
let redisClient;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});
app.get('/health', (req, res) => {
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
app.get('/', (req, res) => {
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
app.post('/notifications/email', emailController_1.sendEmail);
app.post('/notifications/email/bulk', emailController_1.sendBulkEmail);
app.get('/notifications/email/status', emailController_1.getEmailStatus);
app.post('/notifications/sms', smsController_1.sendSMS);
app.post('/notifications/sms/bulk', smsController_1.sendBulkSMS);
app.get('/notifications/sms/status/:messageId', smsController_1.getSMSStatus);
app.get('/notifications/sms/health', smsController_1.getSMSHealth);
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`, err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        service: SERVICE_NAME,
        timestamp: new Date().toISOString(),
    });
});
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        service: SERVICE_NAME,
    });
});
async function connectRedis() {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        console.log(`[${SERVICE_NAME}] Connecting to Redis: ${redisUrl}`);
        exports.redisClient = redisClient = (0, redis_1.createClient)({
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
    }
    catch (error) {
        console.error('[Redis] Failed to connect:', error);
    }
}
process.on('SIGTERM', async () => {
    console.log(`[${SERVICE_NAME}] SIGTERM received, shutting down gracefully...`);
    if (redisClient?.isOpen) {
        await redisClient.quit();
        console.log('[Redis] Connection closed');
    }
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log(`[${SERVICE_NAME}] SIGINT received, shutting down gracefully...`);
    if (redisClient?.isOpen) {
        await redisClient.quit();
        console.log('[Redis] Connection closed');
    }
    process.exit(0);
});
async function startServer() {
    try {
        await connectRedis();
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
    }
    catch (error) {
        console.error(`[${SERVICE_NAME}] Failed to start:`, error);
        process.exit(1);
    }
}
if (process.env.NODE_ENV !== 'test') {
    startServer();
}
//# sourceMappingURL=index.js.map