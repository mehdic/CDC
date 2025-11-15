"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const requestLogger_1 = require("../../middleware/requestLogger");
const performanceMonitor_1 = require("../../middleware/performanceMonitor");
const errorHandler_1 = require("../../middleware/errorHandler");
const health_1 = require("../../routes/health");
const metrics_1 = require("../../utils/metrics");
describe('Monitoring & Observability Integration Tests', () => {
    let app;
    beforeAll(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use(requestLogger_1.requestLogger);
        app.use(requestLogger_1.attachRequestIdToLogs);
        app.use(performanceMonitor_1.performanceMonitor);
        app.get('/test/success', (req, res) => {
            res.json({ message: 'Success', requestId: req.requestId });
        });
        app.get('/test/slow', async (req, res) => {
            await new Promise(resolve => setTimeout(resolve, 1100));
            res.json({ message: 'Slow response' });
        });
        app.get('/test/error', (req, res) => {
            throw new Error('Test error');
        });
        app.use('/health', health_1.healthRouter);
        app.use(errorHandler_1.errorHandler);
    });
    describe('Request Logger Integration (T254)', () => {
        it('should add requestId to responses', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/test/success')
                .expect(200);
            expect(response.headers['x-request-id']).toBeDefined();
            expect(response.headers['x-correlation-id']).toBeDefined();
            expect(response.body.requestId).toBeDefined();
        });
        it('should accept custom request ID from header', async () => {
            const customId = 'custom-request-123';
            const response = await (0, supertest_1.default)(app)
                .get('/test/success')
                .set('X-Request-ID', customId)
                .expect(200);
            expect(response.headers['x-request-id']).toBe(customId);
            expect(response.body.requestId).toBe(customId);
        });
        it('should propagate correlation ID', async () => {
            const correlationId = 'correlation-456';
            const response = await (0, supertest_1.default)(app)
                .get('/test/success')
                .set('X-Correlation-ID', correlationId)
                .expect(200);
            expect(response.headers['x-correlation-id']).toBe(correlationId);
        });
    });
    describe('Performance Monitor Integration (T255)', () => {
        it('should track fast requests', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/test/success')
                .expect(200);
            expect(response.headers['x-request-id']).toBeDefined();
        });
        it('should detect slow requests', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/test/slow')
                .expect(200);
            expect(response.body.message).toBe('Slow response');
        }, 10000);
    });
    describe('Error Handler Integration (T253)', () => {
        it('should return error response with requestId', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/test/error')
                .expect(500);
            expect(response.body.error).toBeDefined();
            expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
            expect(response.body.error.requestId).toBeDefined();
        });
    });
    describe('Health Check Integration (T252)', () => {
        it('GET /health should return alive status', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/health')
                .expect(200);
            expect(response.body.status).toBe('alive');
            expect(response.body.uptime).toBeGreaterThanOrEqual(0);
            expect(response.body.timestamp).toBeDefined();
        });
        it('GET /health/metrics should return metrics', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/health/metrics')
                .expect(200);
            expect(response.body.timestamp).toBeDefined();
            expect(response.body.uptime).toBeGreaterThanOrEqual(0);
            expect(response.body.memory).toBeDefined();
            expect(response.body.prometheus).toBeDefined();
        });
    });
    describe('Metrics Integration (T256)', () => {
        it('should collect Prometheus metrics', () => {
            const metrics = (0, metrics_1.getMetrics)();
            expect(metrics).toBeDefined();
            expect(typeof metrics).toBe('string');
            expect(metrics).toContain('# TYPE');
            expect(metrics).toContain('http_requests_total');
        });
    });
    describe('Full Middleware Chain', () => {
        it('should process request through complete chain', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/test/success')
                .expect(200);
            expect(response.headers['x-request-id']).toBeDefined();
            expect(response.headers['x-correlation-id']).toBeDefined();
            expect(response.body.requestId).toBeDefined();
        });
        it('should handle errors through complete chain', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/test/error')
                .expect(500);
            expect(response.headers['x-request-id']).toBeDefined();
            expect(response.body.error.requestId).toBeDefined();
            expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
        });
    });
});
//# sourceMappingURL=monitoring-integration.test.js.map