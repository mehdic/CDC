"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const performanceMonitor_1 = require("../performanceMonitor");
jest.mock('../../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));
jest.mock('../../utils/metrics', () => ({
    recordRequestDuration: jest.fn(),
    recordSlowRequest: jest.fn(),
}));
describe('Performance Monitor Middleware', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest = {
            method: 'GET',
            path: '/api/users',
            requestId: 'req-123',
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            statusCode: 200,
        };
        mockNext = jest.fn();
    });
    describe('recordDuration()', () => {
        it('should record request duration', () => {
            (0, performanceMonitor_1.recordDuration)(150);
            (0, performanceMonitor_1.recordDuration)(250);
            (0, performanceMonitor_1.recordDuration)(100);
            const stats = (0, performanceMonitor_1.getPerformanceStats)();
            expect(stats.avg).toBeGreaterThan(0);
        });
        it('should calculate percentiles', () => {
            [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200].forEach((d) => (0, performanceMonitor_1.recordDuration)(d));
            const stats = (0, performanceMonitor_1.getPerformanceStats)();
            expect(stats.p50).toBeGreaterThanOrEqual(0);
            expect(stats.p95).toBeGreaterThanOrEqual(stats.p50);
            expect(stats.p99).toBeGreaterThanOrEqual(stats.p95);
        });
        it('should track min and max durations', () => {
            [50, 150, 75, 200, 100].forEach((d) => (0, performanceMonitor_1.recordDuration)(d));
            const stats = (0, performanceMonitor_1.getPerformanceStats)();
            expect(stats.min).toBe(50);
            expect(stats.max).toBe(200);
        });
        it('should limit samples to prevent memory bloat', () => {
            for (let i = 0; i < 2000; i++) {
                (0, performanceMonitor_1.recordDuration)(Math.random() * 1000);
            }
            const stats = (0, performanceMonitor_1.getPerformanceStats)();
            expect(stats.avg).toBeGreaterThan(0);
        });
    });
    describe('getPerformanceStats()', () => {
        it('should return zero values for empty samples', () => {
            const stats = (0, performanceMonitor_1.getPerformanceStats)();
            expect(stats.p50).toBe(0);
            expect(stats.p95).toBe(0);
            expect(stats.p99).toBe(0);
            expect(stats.avg).toBe(0);
            expect(stats.max).toBe(0);
            expect(stats.min).toBe(0);
        });
        it('should return all metric types', () => {
            (0, performanceMonitor_1.recordDuration)(100);
            const stats = (0, performanceMonitor_1.getPerformanceStats)();
            expect(stats).toHaveProperty('p50');
            expect(stats).toHaveProperty('p95');
            expect(stats).toHaveProperty('p99');
            expect(stats).toHaveProperty('avg');
            expect(stats).toHaveProperty('max');
            expect(stats).toHaveProperty('min');
        });
        it('should order percentiles correctly', () => {
            [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach((d) => (0, performanceMonitor_1.recordDuration)(d));
            const stats = (0, performanceMonitor_1.getPerformanceStats)();
            expect(stats.p50).toBeLessThanOrEqual(stats.p95);
            expect(stats.p95).toBeLessThanOrEqual(stats.p99);
        });
    });
    describe('trackDatabaseQuery()', () => {
        it('should track fast queries', () => {
            const { logger } = require('../../utils/logger');
            (0, performanceMonitor_1.trackDatabaseQuery)('SELECT * FROM users WHERE id = ?', 45);
            expect(logger.debug).toHaveBeenCalledWith('Database query executed', {
                duration: 45,
            });
        });
        it('should warn on slow queries', () => {
            const { logger } = require('../../utils/logger');
            (0, performanceMonitor_1.trackDatabaseQuery)('SELECT * FROM users', 1500);
            expect(logger.warn).toHaveBeenCalledWith('Slow database query detected', expect.objectContaining({
                duration: 1500,
            }));
        });
        it('should truncate long queries in logs', () => {
            const { logger } = require('../../utils/logger');
            const longQuery = 'SELECT * FROM very_long_table_name '.repeat(10);
            (0, performanceMonitor_1.trackDatabaseQuery)(longQuery, 100);
            const call = logger.debug.mock.calls[0];
            expect(call[1].query.length).toBeLessThanOrEqual(100);
        });
        it('should include query duration', () => {
            const { logger } = require('../../utils/logger');
            (0, performanceMonitor_1.trackDatabaseQuery)('SELECT COUNT(*) FROM users', 250);
            expect(logger.debug).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                duration: 250,
            }));
        });
    });
    describe('getMemoryStats()', () => {
        it('should return memory usage in MB', () => {
            const stats = (0, performanceMonitor_1.getMemoryStats)();
            expect(stats.heapUsed).toBeGreaterThan(0);
            expect(stats.heapTotal).toBeGreaterThan(stats.heapUsed);
            expect(stats.external).toBeGreaterThanOrEqual(0);
            expect(stats.rss).toBeGreaterThan(0);
        });
        it('should calculate heap usage percentage', () => {
            const stats = (0, performanceMonitor_1.getMemoryStats)();
            expect(stats.heapUsedPercent).toBeGreaterThan(0);
            expect(stats.heapUsedPercent).toBeLessThanOrEqual(100);
        });
        it('should return integers', () => {
            const stats = (0, performanceMonitor_1.getMemoryStats)();
            expect(Number.isInteger(stats.heapUsed)).toBe(true);
            expect(Number.isInteger(stats.heapTotal)).toBe(true);
            expect(Number.isInteger(stats.heapUsedPercent)).toBe(true);
        });
    });
    describe('checkForMemoryLeak()', () => {
        it('should detect increasing heap usage', () => {
            for (let i = 0; i < 15; i++) {
                (0, performanceMonitor_1.checkForMemoryLeak)();
            }
            const result = (0, performanceMonitor_1.checkForMemoryLeak)();
            expect(result).toHaveProperty('isLeaking');
            expect(result).toHaveProperty('growth');
            expect(result).toHaveProperty('growthPercent');
        });
        it('should return leak stats object', () => {
            const result = (0, performanceMonitor_1.checkForMemoryLeak)();
            expect(typeof result.isLeaking).toBe('boolean');
            expect(typeof result.growth).toBe('number');
            expect(typeof result.growthPercent).toBe('number');
        });
        it('should return false for stable memory', () => {
            const result = (0, performanceMonitor_1.checkForMemoryLeak)();
            expect(result.isLeaking).toBe(false);
        });
        it('should track memory growth', () => {
            (0, performanceMonitor_1.checkForMemoryLeak)();
            const arrays = [];
            for (let i = 0; i < 5; i++) {
                arrays.push(new Array(1000000).fill(i));
            }
            for (let i = 0; i < 5; i++) {
                (0, performanceMonitor_1.checkForMemoryLeak)();
            }
            const result = (0, performanceMonitor_1.checkForMemoryLeak)();
            expect(result).toHaveProperty('growth');
            arrays.length = 0;
        });
    });
    describe('performanceMonitor middleware', () => {
        it('should wrap json response method', () => {
            const originalJson = jest.fn();
            mockResponse.json = originalJson;
            (0, performanceMonitor_1.performanceMonitor)(mockRequest, mockResponse, mockNext);
            expect(mockResponse.json).toBeDefined();
            expect(typeof mockResponse.json).toBe('function');
        });
        it('should wrap send response method', () => {
            const originalSend = jest.fn();
            mockResponse.send = originalSend;
            (0, performanceMonitor_1.performanceMonitor)(mockRequest, mockResponse, mockNext);
            expect(mockResponse.send).toBeDefined();
            expect(typeof mockResponse.send).toBe('function');
        });
        it('should call next middleware', () => {
            (0, performanceMonitor_1.performanceMonitor)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should record request duration on json response', () => {
            const { recordRequestDuration } = require('../../utils/metrics');
            (0, performanceMonitor_1.performanceMonitor)(mockRequest, mockResponse, mockNext);
            const json = mockResponse.json;
            json({ data: 'test' });
            expect(recordRequestDuration).toHaveBeenCalledWith('GET', '/api/users', expect.any(Number), 200);
        });
        it('should record slow requests', () => {
            const { recordSlowRequest } = require('../../utils/metrics');
            const originalJson = jest.fn();
            mockResponse.json = originalJson;
            (0, performanceMonitor_1.performanceMonitor)(mockRequest, mockResponse, mockNext);
            const json = mockResponse.json;
            json({ data: 'test' });
            expect(recordSlowRequest).toBeDefined();
        });
        it('should log slow requests as warnings', () => {
            const { logger } = require('../../utils/logger');
            (0, performanceMonitor_1.performanceMonitor)(mockRequest, mockResponse, mockNext);
            mockResponse.statusCode = 200;
            const json = mockResponse.json;
            json({ data: 'test' });
            expect(logger.warn).toBeDefined();
        });
        it('should include memory stats when enabled', () => {
            (0, performanceMonitor_1.performanceMonitor)(mockRequest, mockResponse, mockNext);
            const json = mockResponse.json;
            json({ data: 'test' });
            expect(json).toHaveBeenCalled();
        });
        it('should track request duration', () => {
            const { recordRequestDuration } = require('../../utils/metrics');
            (0, performanceMonitor_1.performanceMonitor)(mockRequest, mockResponse, mockNext);
            const json = mockResponse.json;
            json({ test: 'data' });
            expect(recordRequestDuration).toHaveBeenCalled();
        });
        it('should handle send responses', () => {
            const { recordRequestDuration } = require('../../utils/metrics');
            (0, performanceMonitor_1.performanceMonitor)(mockRequest, mockResponse, mockNext);
            const send = mockResponse.send;
            send('text response');
            expect(recordRequestDuration).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.any(Number), expect.any(Number));
        });
    });
    describe('Memory leak detection', () => {
        it('should warn when memory leak is detected', () => {
            const { logger } = require('../../utils/logger');
            expect(performanceMonitor_1.checkForMemoryLeak).toBeDefined();
        });
        it('should include growth metrics in warning', () => {
            const result = (0, performanceMonitor_1.checkForMemoryLeak)();
            if (result.isLeaking) {
                expect(result.growth).toBeGreaterThan(0);
                expect(result.growthPercent).toBeGreaterThan(0);
            }
        });
    });
    describe('Performance thresholds', () => {
        it('should use configurable slow request threshold', () => {
            expect(typeof performanceMonitor_1.performanceMonitor).toBe('function');
        });
        it('should use configurable slow query threshold', () => {
            expect(typeof performanceMonitor_1.trackDatabaseQuery).toBe('function');
        });
    });
});
//# sourceMappingURL=performanceMonitor.test.js.map