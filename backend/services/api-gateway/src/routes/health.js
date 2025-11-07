"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const proxy_1 = require("./proxy");
const router = (0, express_1.Router)();
const HEALTH_CHECK_TIMEOUT = parseInt(process.env['HEALTH_CHECK_TIMEOUT_MS'] || '2000', 10);
async function checkServiceHealth(serviceName, serviceUrl) {
    const startTime = Date.now();
    try {
        await axios_1.default.get(`${serviceUrl}/health`, {
            timeout: HEALTH_CHECK_TIMEOUT,
            validateStatus: (status) => status === 200,
        });
        const responseTime = Date.now() - startTime;
        return {
            name: serviceName,
            status: 'healthy',
            responseTime,
        };
    }
    catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            name: serviceName,
            status: 'unhealthy',
            responseTime,
            error: error.message || 'Unknown error',
        };
    }
}
router.get('/health', async (_req, res) => {
    try {
        const serviceHealthChecks = await Promise.all(proxy_1.serviceEndpoints.map((service) => checkServiceHealth(service.name, service.url)));
        const services = {};
        let unhealthyCount = 0;
        for (const check of serviceHealthChecks) {
            services[check.name] = {
                name: check.name,
                status: check.status,
                responseTime: check.responseTime,
                error: check.error,
            };
            if (check.status === 'unhealthy') {
                unhealthyCount++;
            }
        }
        let overallStatus;
        if (unhealthyCount === 0) {
            overallStatus = 'healthy';
        }
        else if (unhealthyCount < proxy_1.serviceEndpoints.length) {
            overallStatus = 'degraded';
        }
        else {
            overallStatus = 'unhealthy';
        }
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        const healthResponse = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            gateway: {
                status: 'healthy',
                uptime: Math.floor(uptime),
                memoryUsage: {
                    heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
                    rss: Math.floor(memoryUsage.rss / 1024 / 1024),
                },
            },
            services,
        };
        const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
        res.status(statusCode).json(healthResponse);
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            message: error.message,
        });
    }
});
router.get('/health/live', (_req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
    });
});
router.get('/health/ready', async (_req, res) => {
    try {
        const authService = proxy_1.serviceEndpoints.find(s => s.name === 'auth');
        if (!authService) {
            res.status(503).json({
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                reason: 'Auth service configuration not found',
            });
            return;
        }
        const authHealth = await checkServiceHealth('auth', authService.url);
        if (authHealth.status === 'healthy') {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString(),
            });
        }
        else {
            res.status(503).json({
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                reason: 'Critical services unavailable',
            });
        }
    }
    catch (error) {
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map