"use strict";
/**
 * Appointment Service
 * Microservice for appointment scheduling and availability management
 * HIPAA/GDPR Compliant - Healthcare appointment data
 *
 * Endpoints:
 * - POST /appointments - Create appointment
 * - GET /appointments - List appointments (paginated)
 * - GET /appointments/:id - Get single appointment
 * - PUT /appointments/:id - Update appointment
 * - POST /appointments/:id/confirm - Confirm appointment
 * - POST /appointments/:id/cancel - Cancel appointment
 * - POST /appointments/:id/complete - Mark as completed
 * - DELETE /appointments/:id - Soft delete appointment
 * - GET /appointments/provider/:providerId/upcoming - Upcoming appointments
 * - POST /availability - Create availability slot
 * - GET /availability - List availability slots
 * - GET /availability/:id - Get availability slot
 * - PUT /availability/:id - Update availability slot
 * - DELETE /availability/:id - Delete availability slot
 * - GET /availability/provider/:providerId - Get provider slots
 * - GET /health - Health check
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const typeorm_1 = require("typeorm");
const Appointment_1 = require("./entities/Appointment");
const AvailabilitySlot_1 = require("./entities/AvailabilitySlot");
const AppointmentReminder_1 = require("./entities/AppointmentReminder");
const User_1 = require("@shared/models/User");
const appointment_routes_1 = __importStar(require("./routes/appointment.routes"));
const appointment_service_1 = require("./services/appointment.service");
const availability_service_1 = require("./services/availability.service");
const reminder_service_1 = require("./services/reminder.service");
const appointment_controller_1 = require("./controllers/appointment.controller");
// ============================================================================
// Configuration
// ============================================================================
const PORT = process.env.APPOINTMENT_SERVICE_PORT || 4014;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];
// ============================================================================
// Database Connection (TypeORM)
// ============================================================================
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'metapharm',
    password: process.env.DATABASE_PASSWORD || 'metapharm_dev_password',
    database: process.env.DATABASE_NAME || 'metapharm',
    entities: [Appointment_1.Appointment, AvailabilitySlot_1.AvailabilitySlot, AppointmentReminder_1.AppointmentReminder, User_1.User],
    synchronize: false, // Never auto-sync - use migrations
    logging: NODE_ENV === 'development',
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
// ============================================================================
// Express App Setup
// ============================================================================
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging (development only)
if (NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}
// ============================================================================
// Health Check
// ============================================================================
app.get('/health', async (req, res) => {
    try {
        const isConnected = exports.AppDataSource.isInitialized;
        if (!isConnected) {
            return res.status(503).json({
                status: 'unhealthy',
                service: 'appointment-service',
                database: 'disconnected',
                timestamp: new Date().toISOString(),
            });
        }
        // Test database query
        await exports.AppDataSource.query('SELECT 1');
        res.status(200).json({
            status: 'healthy',
            service: 'appointment-service',
            database: 'connected',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            service: 'appointment-service',
            error: 'Database connection failed',
            timestamp: new Date().toISOString(),
        });
    }
});
// ============================================================================
// API Routes (initialized after database connection)
// ============================================================================
async function setupRoutes() {
    // Create services
    const appointmentRepository = exports.AppDataSource.getRepository(Appointment_1.Appointment);
    const availabilityRepository = exports.AppDataSource.getRepository(AvailabilitySlot_1.AvailabilitySlot);
    const reminderRepository = exports.AppDataSource.getRepository(AppointmentReminder_1.AppointmentReminder);
    const appointmentService = new appointment_service_1.AppointmentService(appointmentRepository, availabilityRepository);
    const availabilityService = new availability_service_1.AvailabilityService(availabilityRepository);
    const reminderService = new reminder_service_1.ReminderService(reminderRepository, appointmentRepository);
    // Create controller
    const controller = new appointment_controller_1.AppointmentController(appointmentService, availabilityService, reminderService);
    // Initialize routes with controller
    (0, appointment_routes_1.initializeRoutes)(controller);
    // Mount routes
    app.use('/appointments', appointment_routes_1.default);
    app.use('/availability', appointment_routes_1.default);
}
// ============================================================================
// Error Handling
// ============================================================================
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString(),
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    const message = NODE_ENV === 'production' ? 'Internal server error' : err.message;
    res.status(500).json({
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
        console.log('Connecting to database...');
        await exports.AppDataSource.initialize();
        console.log('✅ Database connected successfully');
        // Setup routes after database is connected
        await setupRoutes();
        const server = app.listen(PORT, () => {
            console.log(`🚀 Appointment Service running on port ${PORT}`);
            console.log(`📊 Environment: ${NODE_ENV}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });
        // Graceful shutdown
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