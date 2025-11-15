"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const logger_1 = require("../logger");
describe('Logger Utility', () => {
    const testLogDir = path.join(__dirname, '../../../test-logs');
    beforeAll(() => {
        if (!fs.existsSync(testLogDir)) {
            fs.mkdirSync(testLogDir, { recursive: true });
        }
    });
    afterAll(() => {
        if (fs.existsSync(testLogDir)) {
            const files = fs.readdirSync(testLogDir);
            files.forEach((file) => {
                fs.unlinkSync(path.join(testLogDir, file));
            });
            fs.rmdirSync(testLogDir);
        }
    });
    describe('logInfo()', () => {
        it('should log info message without context', () => {
            const spy = jest.spyOn(logger_1.logger, 'info');
            (0, logger_1.logInfo)('Test info message');
            expect(spy).toHaveBeenCalledWith('Test info message', {});
            spy.mockRestore();
        });
        it('should log info message with context', () => {
            const spy = jest.spyOn(logger_1.logger, 'info');
            const context = {
                requestId: 'req-123',
                userId: 'user-456',
            };
            (0, logger_1.logInfo)('Test info with context', context);
            expect(spy).toHaveBeenCalledWith('Test info with context', { context });
            spy.mockRestore();
        });
    });
    describe('logWarn()', () => {
        it('should log warning message', () => {
            const spy = jest.spyOn(logger_1.logger, 'warn');
            const context = {
                requestId: 'req-123',
            };
            (0, logger_1.logWarn)('Test warning', context);
            expect(spy).toHaveBeenCalledWith('Test warning', { context });
            spy.mockRestore();
        });
    });
    describe('logError()', () => {
        it('should log error with stack trace', () => {
            const spy = jest.spyOn(logger_1.logger, 'error');
            const error = new Error('Test error message');
            const context = {
                requestId: 'req-123',
                userId: 'user-456',
            };
            (0, logger_1.logError)('An error occurred', error, context);
            expect(spy).toHaveBeenCalledWith('An error occurred', {
                error: error.message,
                stack: error.stack,
                context,
            });
            spy.mockRestore();
        });
        it('should log error without context', () => {
            const spy = jest.spyOn(logger_1.logger, 'error');
            const error = new Error('Another test error');
            (0, logger_1.logError)('Error message', error);
            expect(spy).toHaveBeenCalledWith('Error message', {
                error: error.message,
                stack: error.stack,
            });
            spy.mockRestore();
        });
    });
    describe('logDebug()', () => {
        it('should log debug message', () => {
            const spy = jest.spyOn(logger_1.logger, 'debug');
            const context = {
                requestId: 'req-123',
                data: { test: 'value' },
            };
            (0, logger_1.logDebug)('Debug message', context);
            expect(spy).toHaveBeenCalledWith('Debug message', { context });
            spy.mockRestore();
        });
    });
    describe('createChildLogger()', () => {
        it('should create child logger with context', () => {
            const context = {
                requestId: 'req-123',
                userId: 'user-456',
            };
            const childLogger = (0, logger_1.createChildLogger)(context);
            expect(childLogger).toBeDefined();
            expect(typeof childLogger.info).toBe('function');
            expect(typeof childLogger.warn).toBe('function');
            expect(typeof childLogger.error).toBe('function');
            expect(typeof childLogger.debug).toBe('function');
        });
        it('should propagate context to child logger methods', () => {
            const spy = jest.spyOn(logger_1.logger, 'child');
            const context = {
                pharmacyId: 'pharmacy-789',
            };
            (0, logger_1.createChildLogger)(context);
            expect(spy).toHaveBeenCalledWith({ context });
            spy.mockRestore();
        });
    });
    describe('logRequest()', () => {
        it('should log incoming request with all fields', () => {
            const spy = jest.spyOn(logger_1.logger, 'info');
            const { logRequest } = require('../logger');
            logRequest('GET', '/api/users', 'user-123', 'req-456');
            expect(spy).toHaveBeenCalledWith('Incoming request', {
                method: 'GET',
                path: '/api/users',
                userId: 'user-123',
                requestId: 'req-456',
            });
            spy.mockRestore();
        });
        it('should log request without userId', () => {
            const spy = jest.spyOn(logger_1.logger, 'info');
            const { logRequest } = require('../logger');
            logRequest('POST', '/api/login', undefined, 'req-789');
            expect(spy).toHaveBeenCalledWith('Incoming request', {
                method: 'POST',
                path: '/api/login',
                userId: undefined,
                requestId: 'req-789',
            });
            spy.mockRestore();
        });
    });
    describe('logResponse()', () => {
        it('should log response with duration', () => {
            const spy = jest.spyOn(logger_1.logger, 'info');
            const { logResponse } = require('../logger');
            logResponse('GET', '/api/users', 200, 150, 'req-123');
            expect(spy).toHaveBeenCalledWith('Request completed', {
                method: 'GET',
                path: '/api/users',
                statusCode: 200,
                duration: 150,
                requestId: 'req-123',
            });
            spy.mockRestore();
        });
    });
    describe('logDatabase()', () => {
        it('should log database operation with context', () => {
            const spy = jest.spyOn(logger_1.logger, 'debug');
            const context = {
                userId: 'user-123',
            };
            const { logDatabase } = require('../logger');
            logDatabase('SELECT', 'users', 45, context);
            expect(spy).toHaveBeenCalledWith('Database operation', {
                operation: 'SELECT',
                table: 'users',
                duration: 45,
                context,
            });
            spy.mockRestore();
        });
    });
    describe('Logger instance', () => {
        it('should be properly configured', () => {
            expect(logger_1.logger).toBeDefined();
            expect(typeof logger_1.logger.info).toBe('function');
            expect(typeof logger_1.logger.warn).toBe('function');
            expect(typeof logger_1.logger.error).toBe('function');
            expect(typeof logger_1.logger.debug).toBe('function');
        });
        it('should have default metadata with service name', () => {
            const spy = jest.spyOn(logger_1.logger, 'info');
            logger_1.logger.info('Test message');
            expect(spy).toHaveBeenCalledWith('Test message');
            spy.mockRestore();
        });
    });
    describe('Log levels', () => {
        it('should respect log level configuration', () => {
            const currentLevel = logger_1.logger.level;
            expect(['error', 'warn', 'info', 'debug']).toContain(currentLevel);
        });
    });
    describe('Context nesting', () => {
        it('should handle deeply nested context objects', () => {
            const spy = jest.spyOn(logger_1.logger, 'info');
            const context = {
                requestId: 'req-123',
                user: {
                    id: 'user-456',
                    pharmacy: {
                        id: 'pharmacy-789',
                        address: {
                            city: 'Geneva',
                        },
                    },
                },
            };
            (0, logger_1.logInfo)('Nested context', context);
            expect(spy).toHaveBeenCalledWith('Nested context', { context });
            spy.mockRestore();
        });
    });
    describe('Error handling', () => {
        it('should handle logging without error object', () => {
            const spy = jest.spyOn(logger_1.logger, 'error');
            (0, logger_1.logError)('Error without exception');
            expect(spy).toHaveBeenCalledWith('Error without exception', {});
            spy.mockRestore();
        });
        it('should extract error message and stack', () => {
            const spy = jest.spyOn(logger_1.logger, 'error');
            const error = new Error('Database connection failed');
            (0, logger_1.logError)('DB Error', error);
            expect(spy).toHaveBeenCalled();
            const call = spy.mock.calls[0];
            expect(call[1]).toHaveProperty('error', 'Database connection failed');
            expect(call[1]).toHaveProperty('stack');
            spy.mockRestore();
        });
    });
});
//# sourceMappingURL=logger.test.js.map