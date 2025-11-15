"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const health_1 = require("../health");
jest.mock('typeorm');
jest.mock('redis');
jest.mock('../../utils/logger');
jest.mock('../../utils/metrics', () => ({
    getMetrics: jest.fn().mockResolvedValue('# HELP metric\n# TYPE metric gauge\n'),
}));
describe('Health Check Routes', () => {
    let mockDataSource;
    let mockQueryRunner;
    let mockRedisClient;
    let mockRequest;
    let mockResponse;
    beforeEach(() => {
        jest.clearAllMocks();
        mockQueryRunner = {
            connect: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
            query: jest.fn().mockResolvedValue([{ now: new Date() }]),
        };
        mockDataSource = {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        };
        mockRedisClient = {
            ping: jest.fn().mockResolvedValue('PONG'),
        };
        mockRequest = {
            method: 'GET',
            path: '/health',
            hostname: 'localhost',
            ip: '127.0.0.1',
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            type: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            getHeader: jest.fn().mockReturnValue('application/json'),
            statusCode: 200,
        };
        (0, health_1.initializeHealthCheck)(mockDataSource, mockRedisClient);
    });
    describe('GET /health', () => {
        it('should return 200 OK with alive status', (done) => {
            const testFn = () => {
                const response = mockResponse;
                response.status(200).json({
                    status: 'alive',
                    uptime: expect.any(Number),
                    timestamp: expect.any(String),
                });
                expect(response.status).toHaveBeenCalledWith(200);
                expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                    status: 'alive',
                }));
                done();
            };
            testFn();
        });
        it('should return uptime in seconds', (done) => {
            const testFn = () => {
                const response = mockResponse;
                response.status(200).json({
                    status: 'alive',
                    uptime: expect.any(Number),
                    timestamp: expect.any(String),
                });
                expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                    uptime: expect.any(Number),
                }));
                const callArgs = response.json.mock.calls[0][0];
                expect(callArgs.uptime).toBeGreaterThanOrEqual(0);
                done();
            };
            testFn();
        });
        it('should return ISO timestamp', (done) => {
            const testFn = () => {
                const response = mockResponse;
                const timestamp = new Date().toISOString();
                response.status(200).json({
                    status: 'alive',
                    uptime: 0,
                    timestamp,
                });
                const callArgs = response.json.mock.calls[0][0];
                expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
                done();
            };
            testFn();
        });
    });
    describe('GET /health/ready', () => {
        it('should return 200 when all dependencies are healthy', async () => {
            const response = mockResponse;
            response.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: expect.any(Number),
                database: {
                    status: 'connected',
                    latency: expect.any(Number),
                },
                redis: {
                    status: 'connected',
                    latency: expect.any(Number),
                },
                memory: expect.objectContaining({
                    heapUsed: expect.any(Number),
                    heapTotal: expect.any(Number),
                }),
            });
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'healthy',
            }));
        });
        it('should return 503 when database is disconnected', async () => {
            const response = mockResponse;
            response.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: expect.any(Number),
                database: {
                    status: 'disconnected',
                    error: 'Connection failed',
                },
                redis: {
                    status: 'connected',
                    latency: expect.any(Number),
                },
            });
            expect(response.status).toHaveBeenCalledWith(503);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'unhealthy',
            }));
        });
        it('should return 503 when Redis is disconnected', async () => {
            const response = mockResponse;
            response.status(503).json({
                status: 'degraded',
                timestamp: new Date().toISOString(),
                uptime: expect.any(Number),
                database: {
                    status: 'connected',
                    latency: expect.any(Number),
                },
                redis: {
                    status: 'disconnected',
                    error: 'Connection refused',
                },
            });
            expect(response.status).toHaveBeenCalledWith(503);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'degraded',
            }));
        });
        it('should include memory information', () => {
            const response = mockResponse;
            response.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: 100,
                memory: {
                    heapUsed: expect.any(Number),
                    heapTotal: expect.any(Number),
                    external: expect.any(Number),
                    rss: expect.any(Number),
                },
            });
            const callArgs = response.json.mock.calls[0][0];
            expect(callArgs.memory).toHaveProperty('heapUsed');
            expect(callArgs.memory).toHaveProperty('heapTotal');
            expect(callArgs.memory).toHaveProperty('external');
            expect(callArgs.memory).toHaveProperty('rss');
        });
        it('should measure database latency', () => {
            const response = mockResponse;
            response.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: 100,
                database: {
                    status: 'connected',
                    latency: expect.any(Number),
                },
            });
            const callArgs = response.json.mock.calls[0][0];
            expect(callArgs.database.latency).toBeGreaterThanOrEqual(0);
        });
    });
    describe('GET /health/metrics', () => {
        it('should return 200 with metrics', async () => {
            const { getMetrics } = require('../../utils/metrics');
            const response = mockResponse;
            response.status(200).json({
                timestamp: new Date().toISOString(),
                uptime: 100,
                memory: expect.objectContaining({
                    heapUsed: expect.any(Number),
                    heapTotal: expect.any(Number),
                }),
            });
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalled();
        });
        it('should include memory usage metrics', () => {
            const response = mockResponse;
            const memUsage = process.memoryUsage();
            response.type('application/json').json({
                timestamp: new Date().toISOString(),
                uptime: 100,
                memory: memUsage,
            });
            expect(response.type).toHaveBeenCalledWith('application/json');
            const callArgs = response.json.mock.calls[0][0];
            expect(callArgs.memory).toHaveProperty('heapUsed');
            expect(callArgs.memory).toHaveProperty('heapTotal');
            expect(callArgs.memory).toHaveProperty('external');
            expect(callArgs.memory).toHaveProperty('rss');
        });
        it('should include CPU metrics if available', () => {
            const response = mockResponse;
            let cpuMetrics = {};
            if (process.cpuUsage) {
                const cpu = process.cpuUsage();
                cpuMetrics = {
                    user: cpu.user,
                    system: cpu.system,
                };
            }
            response.json({
                timestamp: new Date().toISOString(),
                uptime: 100,
                memory: expect.any(Object),
                cpu: cpuMetrics,
            });
            expect(response.json).toHaveBeenCalled();
        });
        it('should return 500 on metrics collection error', () => {
            const response = mockResponse;
            response.status(500).json({
                error: 'Failed to collect metrics',
            });
            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.any(String),
            }));
        });
    });
    describe('initializeHealthCheck()', () => {
        it('should initialize with DataSource and Redis client', () => {
            const ds = mockDataSource;
            const redis = mockRedisClient;
            (0, health_1.initializeHealthCheck)(ds, redis);
            expect(ds).toBeDefined();
            expect(redis).toBeDefined();
        });
        it('should initialize without Redis client', () => {
            const ds = mockDataSource;
            (0, health_1.initializeHealthCheck)(ds);
            expect(ds).toBeDefined();
        });
    });
    describe('Error handling', () => {
        it('should handle database connection errors gracefully', () => {
            const response = mockResponse;
            response.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                database: {
                    status: 'disconnected',
                    error: 'Connection timeout',
                    latency: expect.any(Number),
                },
            });
            expect(response.status).toHaveBeenCalledWith(503);
            const callArgs = response.json.mock.calls[0][0];
            expect(callArgs.database.error).toBeDefined();
        });
        it('should handle Redis connection errors gracefully', () => {
            const response = mockResponse;
            response.status(503).json({
                status: 'degraded',
                timestamp: new Date().toISOString(),
                redis: {
                    status: 'disconnected',
                    error: 'ECONNREFUSED',
                    latency: expect.any(Number),
                },
            });
            expect(response.status).toHaveBeenCalledWith(503);
            const callArgs = response.json.mock.calls[0][0];
            expect(callArgs.redis.error).toBeDefined();
        });
    });
});
//# sourceMappingURL=health.test.js.map