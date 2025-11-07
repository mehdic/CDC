"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const typeorm_1 = require("typeorm");
const User_1 = require("../../shared/models/User");
const Pharmacy_1 = require("../../shared/models/Pharmacy");
const AuditTrailEntry_1 = require("../../shared/models/AuditTrailEntry");
const login_1 = __importDefault(require("./routes/login"));
const mfa_1 = __importDefault(require("./routes/mfa"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const logout_1 = __importDefault(require("./routes/logout"));
const hin_eid_1 = __importDefault(require("./integrations/hin-eid"));
dotenv_1.default.config();
const PORT = process.env.PORT || 4001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'metapharm',
    password: process.env.DATABASE_PASSWORD || 'metapharm_dev_password',
    database: process.env.DATABASE_NAME || 'metapharm',
    entities: [User_1.User, Pharmacy_1.Pharmacy, AuditTrailEntry_1.AuditTrailEntry],
    synchronize: false,
    logging: NODE_ENV === 'development',
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}
app.get('/health', async (req, res) => {
    try {
        const isConnected = exports.AppDataSource.isInitialized;
        if (!isConnected) {
            return res.status(503).json({
                status: 'unhealthy',
                service: 'auth-service',
                database: 'disconnected',
                timestamp: new Date().toISOString(),
            });
        }
        await exports.AppDataSource.query('SELECT 1');
        res.status(200).json({
            status: 'healthy',
            service: 'auth-service',
            database: 'connected',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            service: 'auth-service',
            error: 'Database connection failed',
            timestamp: new Date().toISOString(),
        });
    }
});
app.use('/auth', login_1.default);
app.use('/auth/mfa', mfa_1.default);
app.use('/auth/sessions', sessions_1.default);
app.use('/auth', logout_1.default);
app.use('/auth/hin', hin_eid_1.default);
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString(),
    });
});
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    const message = NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
    res.status(500).json({
        error: 'Internal Server Error',
        message,
        timestamp: new Date().toISOString(),
    });
});
async function startServer() {
    try {
        console.log('Connecting to database...');
        await exports.AppDataSource.initialize();
        console.log('✅ Database connected successfully');
        const server = app.listen(PORT, () => {
            console.log(`🚀 Auth Service running on port ${PORT}`);
            console.log(`📊 Environment: ${NODE_ENV}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });
        const shutdown = async () => {
            console.log('\n🛑 Shutting down gracefully...');
            server.close(async () => {
                console.log('✅ HTTP server closed');
                try {
                    await exports.AppDataSource.destroy();
                    console.log('✅ Database connection closed');
                    process.exit(0);
                }
                catch (error) {
                    console.error('❌ Error closing database:', error);
                    process.exit(1);
                }
            });
            setTimeout(() => {
                console.error('❌ Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=index.js.map