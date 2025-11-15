"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const requestLogger_1 = require("../requestLogger");
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'generated-uuid-123'),
}));
jest.mock('../../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        child: jest.fn().mockReturnValue({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        }),
    },
}));
describe('Request Logger Middleware', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest = {
            method: 'GET',
            path: '/api/users',
            originalUrl: '/api/users?page=1',
            hostname: 'localhost',
            headers: {
                'user-agent': 'Mozilla/5.0 (Linux)',
            },
            query: { page: '1' },
            socket: {
                remoteAddress: '192.168.1.100',
            },
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            statusCode: 200,
        };
        mockNext = jest.fn();
    });
    describe('requestLogger middleware', () => {
        it('should attach requestId to request object', () => {
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(mockRequest.requestId).toBeDefined();
            expect(typeof mockRequest.requestId).toBe('string');
        });
        it('should generate UUID v4 for requestId', () => {
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(uuid_1.v4).toHaveBeenCalled();
        });
        it('should use existing X-Request-ID header if provided', () => {
            const customId = 'custom-req-id-456';
            mockRequest.headers = {
                'x-request-id': customId,
            };
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(mockRequest.requestId).toBe(customId);
        });
        it('should set correlation ID', () => {
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(mockRequest.correlationId).toBeDefined();
        });
        it('should use X-Correlation-ID header if provided', () => {
            const customCorrelation = 'correlation-789';
            mockRequest.headers = {
                'x-correlation-id': customCorrelation,
            };
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(mockRequest.correlationId).toBe(customCorrelation);
        });
        it('should set response headers with request ID', () => {
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
            expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Correlation-ID', expect.any(String));
        });
        it('should call next middleware', () => {
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should log incoming request', () => {
            const { logger } = require('../../utils/logger');
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(logger.info).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
                method: 'GET',
                path: '/api/users',
            }));
        });
        it('should skip logging for health check paths', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.path = '/health';
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(logger.info).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
        it('should skip logging for metrics paths', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.path = '/metrics';
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(logger.info).not.toHaveBeenCalled();
        });
        it('should extract user ID from user object', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.user = { id: 'user-123' };
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(logger.info).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
                userId: 'user-123',
            }));
        });
        it('should include IP address in request log', () => {
            const { logger } = require('../../utils/logger');
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(logger.info).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
                ip: expect.any(String),
            }));
        });
        it('should include user agent in request log', () => {
            const { logger } = require('../../utils/logger');
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(logger.info).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
                userAgent: 'Mozilla/5.0 (Linux)',
            }));
        });
        it('should redact sensitive query parameters', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.query = {
                password: 'secret123',
                apiKey: 'key-456',
                regularParam: 'value',
            };
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            const call = logger.info.mock.calls[0][1];
            expect(call.query).toEqual({
                password: '[REDACTED]',
                apiKey: '[REDACTED]',
                regularParam: 'value',
            });
        });
    });
    describe('Response logging', () => {
        it('should log response via json method', () => {
            const { logger } = require('../../utils/logger');
            const originalJson = jest.fn();
            mockResponse.json = originalJson;
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            const json = mockResponse.json;
            json({ data: 'test' });
            expect(logger.info).toHaveBeenCalledWith('Request completed', expect.objectContaining({
                statusCode: 200,
                duration: expect.any(Number),
            }));
        });
        it('should measure request duration', () => {
            const { logger } = require('../../utils/logger');
            jest.useFakeTimers();
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            jest.advanceTimersByTime(150);
            const json = mockResponse.json;
            json({ data: 'test' });
            const call = logger.info.mock.calls.find((c) => c[0] === 'Request completed');
            expect(call[1]).toHaveProperty('duration', expect.any(Number));
            jest.useRealTimers();
        });
        it('should log responses with 4xx status as warnings', () => {
            const { logger } = require('../../utils/logger');
            mockResponse.statusCode = 404;
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            const json = mockResponse.json;
            json({ error: 'Not found' });
            expect(logger.warn).toHaveBeenCalledWith('Request completed with error', expect.objectContaining({
                statusCode: 404,
            }));
        });
        it('should log responses with 5xx status as warnings', () => {
            const { logger } = require('../../utils/logger');
            mockResponse.statusCode = 500;
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            const json = mockResponse.json;
            json({ error: 'Internal error' });
            expect(logger.warn).toHaveBeenCalledWith('Request completed with error', expect.objectContaining({
                statusCode: 500,
            }));
        });
        it('should log successful responses as info', () => {
            const { logger } = require('../../utils/logger');
            mockResponse.statusCode = 200;
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            const json = mockResponse.json;
            json({ data: 'success' });
            expect(logger.info).toHaveBeenCalledWith('Request completed', expect.objectContaining({
                statusCode: 200,
            }));
        });
        it('should log response via send method', () => {
            const { logger } = require('../../utils/logger');
            mockResponse.statusCode = 200;
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            const send = mockResponse.send;
            send('text response');
            expect(logger.info).toHaveBeenCalledWith('Request completed', expect.any(Object));
        });
    });
    describe('attachRequestIdToLogs middleware', () => {
        it('should attach logger to request object', () => {
            mockRequest.requestId = 'req-123';
            (0, requestLogger_1.attachRequestIdToLogs)(mockRequest, mockResponse, mockNext);
            expect(mockRequest.logger).toBeDefined();
        });
        it('should create child logger with request context', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.requestId = 'req-123';
            mockRequest.userId = 'user-456';
            mockRequest.correlationId = 'corr-789';
            (0, requestLogger_1.attachRequestIdToLogs)(mockRequest, mockResponse, mockNext);
            expect(logger.child).toHaveBeenCalledWith(expect.objectContaining({
                requestId: 'req-123',
                userId: 'user-456',
                correlationId: 'corr-789',
            }));
        });
        it('should call next middleware', () => {
            (0, requestLogger_1.attachRequestIdToLogs)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
    });
    describe('IP address extraction', () => {
        it('should use X-Forwarded-For header if present', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.headers = {
                'x-forwarded-for': '10.0.0.1, 10.0.0.2',
            };
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(logger.info).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
                ip: '10.0.0.1',
            }));
        });
        it('should use socket remote address as fallback', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.headers = {};
            mockRequest.socket = { remoteAddress: '192.168.1.1' };
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(logger.info).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
                ip: '192.168.1.1',
            }));
        });
        it('should use unknown if no IP available', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.headers = {};
            mockRequest.socket = {};
            mockRequest.ip = undefined;
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            expect(logger.info).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
                ip: 'unknown',
            }));
        });
    });
    describe('Sensitive data handling', () => {
        it('should redact password fields', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.query = { password: 'secret' };
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            const call = logger.info.mock.calls[0][1];
            expect(call.query.password).toBe('[REDACTED]');
        });
        it('should redact token fields', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.query = { token: 'secret-token-123' };
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            const call = logger.info.mock.calls[0][1];
            expect(call.query.token).toBe('[REDACTED]');
        });
        it('should redact credit card fields', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.query = { creditCard: '4111-1111-1111-1111' };
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            const call = logger.info.mock.calls[0][1];
            expect(call.query.creditCard).toBe('[REDACTED]');
        });
        it('should not redact non-sensitive fields', () => {
            const { logger } = require('../../utils/logger');
            mockRequest.query = {
                name: 'John Doe',
                page: '1',
                search: 'test',
            };
            (0, requestLogger_1.requestLogger)(mockRequest, mockResponse, mockNext);
            const call = logger.info.mock.calls[0][1];
            expect(call.query.name).toBe('John Doe');
            expect(call.query.page).toBe('1');
        });
    });
});
//# sourceMappingURL=requestLogger.test.js.map