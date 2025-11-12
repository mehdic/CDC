"use strict";
/**
 * Health Check Endpoints (T252)
 * Implements liveness, readiness, and metrics endpoints
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Endpoints:
 * - GET /health: Liveness check (is the service running?)
 * - GET /health/ready: Readiness check (are all dependencies healthy?)
 * - GET /health/metrics: Prometheus metrics endpoint
 *
 * Dependencies checked:
 * - PostgreSQL database connectivity
 * - Redis cache connectivity
 * - System memory and CPU
 *
 * Usage:
 * import { healthRouter } from '@shared/routes/health';
 * app.use('/health', healthRouter);
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
exports.initializeHealthCheck = initializeHealthCheck;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const metrics_1 = require("../utils/metrics");
// ============================================================================
// Configuration
// ============================================================================
let appDataSource = null;
let redisClient = null;
const startTime = Date.now();
/**
 * Initialize health check service with dependencies
 */
function initializeHealthCheck(dataSource, redis) {
    appDataSource = dataSource;
    redisClient = redis || null;
    logger_1.logger.info('Health check service initialized');
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Check database connectivity
 */
async function checkDatabase() {
    if (!appDataSource) {
        return { status: 'disconnected', error: 'DataSource not initialized' };
    }
    const startCheck = Date.now();
    try {
        // Execute a simple query to verify connectivity
        const query = appDataSource.createQueryRunner();
        await query.connect();
        await query.query('SELECT NOW()');
        await query.release();
        const latency = Date.now() - startCheck;
        return { status: 'connected', latency };
    }
    catch (error) {
        const latency = Date.now() - startCheck;
        logger_1.logger.error('Database health check failed', error);
        return {
            status: 'disconnected',
            latency,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Check Redis connectivity
 */
async function checkRedis() {
    if (!redisClient) {
        return { status: 'disconnected', error: 'Redis not initialized' };
    }
    const startCheck = Date.now();
    try {
        // Execute PING command
        const pong = await redisClient.ping();
        const latency = Date.now() - startCheck;
        if (pong === 'PONG') {
            return { status: 'connected', latency };
        }
        else {
            return {
                status: 'disconnected',
                latency,
                error: `Unexpected PING response: ${pong}`,
            };
        }
    }
    catch (error) {
        const latency = Date.now() - startCheck;
        logger_1.logger.error('Redis health check failed', error);
        return {
            status: 'disconnected',
            latency,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Get current memory usage
 */
function getMemoryUsage() {
    const mem = process.memoryUsage();
    return {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024), // MB
        external: Math.round(mem.external / 1024 / 1024), // MB
        rss: Math.round(mem.rss / 1024 / 1024), // MB
    };
}
/**
 * Determine overall health status
 */
function determineHealthStatus(dbStatus, redisStatus) {
    if (dbStatus === 'disconnected') {
        return 'unhealthy'; // Critical - cannot serve requests without DB
    }
    if (redisStatus === 'disconnected') {
        return 'degraded'; // Warning - can function with reduced cache performance
    }
    return 'healthy';
}
// ============================================================================
// Routes
// ============================================================================
exports.healthRouter = (0, express_1.Router)();
/**
 * GET /health
 * Liveness check - is the service running?
 * Returns 200 OK immediately if the process is alive
 */
exports.healthRouter.get('/', (req, res) => {
    const uptime = Math.round((Date.now() - startTime) / 1000);
    res.status(200).json({
        status: 'alive',
        uptime,
        timestamp: new Date().toISOString(),
    });
});
/**
 * GET /health/ready
 * Readiness check - are all dependencies healthy?
 * Checks database and Redis connectivity
 * Returns 200 if ready, 503 if degraded or unhealthy
 */
exports.healthRouter.get('/ready', async (req, res) => {
    try {
        const uptime = Math.round((Date.now() - startTime) / 1000);
        const dbResult = await checkDatabase();
        const redisResult = await checkRedis();
        const memory = getMemoryUsage();
        const status = determineHealthStatus(dbResult.status, redisResult.status);
        const result = {
            status,
            timestamp: new Date().toISOString(),
            uptime,
            database: dbResult,
            redis: redisResult,
            memory,
        };
        const statusCode = status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(result);
    }
    catch (error) {
        logger_1.logger.error('Readiness check failed', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * GET /health/metrics
 * Prometheus metrics endpoint
 * Returns metrics in Prometheus text format
 */
exports.healthRouter.get('/metrics', async (req, res) => {
    try {
        const uptime = Math.round((Date.now() - startTime) / 1000);
        const memory = process.memoryUsage();
        const metrics = (0, metrics_1.getMetrics)();
        const metricsResponse = {
            timestamp: new Date().toISOString(),
            uptime,
            memory,
        };
        // Try to get CPU metrics
        if (process.cpuUsage) {
            const cpuUsage = process.cpuUsage();
            metricsResponse.cpu = {
                user: cpuUsage.user,
                system: cpuUsage.system,
            };
        }
        res.type('application/json').json({
            ...metricsResponse,
            prometheus: metrics, // Will contain Prometheus registry metrics
        });
    }
    catch (error) {
        logger_1.logger.error('Metrics collection failed', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to collect metrics',
        });
    }
});
exports.default = exports.healthRouter;
//# sourceMappingURL=health.js.map