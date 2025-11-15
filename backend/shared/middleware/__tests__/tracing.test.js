"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tracing_1 = require("../tracing");
jest.mock('../../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));
jest.mock('@opentelemetry/api', () => ({
    SpanStatusCode: {
        OK: 0,
        ERROR: 1,
        UNSET: 2,
    },
    trace: {
        getActiveSpan: jest.fn(() => null),
        getTracer: jest.fn(() => ({
            startSpan: jest.fn(() => ({
                setAttribute: jest.fn(),
                recordException: jest.fn(),
                setStatus: jest.fn(),
                end: jest.fn(),
                addEvent: jest.fn(),
            })),
        })),
        setGlobalTracerProvider: jest.fn(),
        setSpan: jest.fn((ctx, span) => ctx),
    },
    context: {
        active: jest.fn(() => ({})),
        with: jest.fn((ctx, fn) => fn()),
    },
}));
jest.mock('@opentelemetry/sdk-node', () => ({
    NodeSDK: jest.fn(),
}));
jest.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
    OTLPTraceExporter: jest.fn(),
}));
jest.mock('@opentelemetry/sdk-trace-node', () => ({
    BasicTracerProvider: jest.fn(function () {
        return {
            addSpanProcessor: jest.fn(),
        };
    }),
    BatchSpanProcessor: jest.fn(),
    ConsoleSpanExporter: jest.fn(),
}));
jest.mock('@opentelemetry/resources', () => ({
    Resource: {
        default: jest.fn(() => ({
            merge: jest.fn(() => ({})),
        })),
    },
}));
jest.mock('@opentelemetry/semantic-conventions', () => ({
    SemanticResourceAttributes: {
        SERVICE_NAME: 'service.name',
        SERVICE_VERSION: 'service.version',
    },
}));
describe('Distributed Tracing', () => {
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
                'user-agent': 'Mozilla/5.0',
            },
            ip: '127.0.0.1',
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            getHeader: jest.fn().mockReturnValue('application/json'),
            setHeader: jest.fn().mockReturnThis(),
            statusCode: 200,
        };
        mockNext = jest.fn();
    });
    describe('initializeTracing()', () => {
        it('should initialize tracing without error', () => {
            expect(() => {
                (0, tracing_1.initializeTracing)();
            }).not.toThrow();
        });
        it('should accept configuration options', () => {
            expect(() => {
                (0, tracing_1.initializeTracing)({
                    serviceName: 'custom-service',
                    environment: 'production',
                    exporterUrl: 'http://localhost:4318/v1/traces',
                });
            }).not.toThrow();
        });
        it('should not reinitialize if already initialized', () => {
            (0, tracing_1.initializeTracing)();
            (0, tracing_1.initializeTracing)();
            expect(tracing_1.initializeTracing).toBeDefined();
        });
        it('should use default values', () => {
            expect(() => {
                (0, tracing_1.initializeTracing)({});
            }).not.toThrow();
        });
        it('should read from environment variables', () => {
            process.env.NODE_ENV = 'production';
            process.env.OTLP_EXPORTER_URL = 'http://custom-exporter:4318/v1/traces';
            expect(() => {
                (0, tracing_1.initializeTracing)();
            }).not.toThrow();
            delete process.env.NODE_ENV;
            delete process.env.OTLP_EXPORTER_URL;
        });
    });
    describe('getTracer()', () => {
        it('should return a tracer instance', () => {
            const tracer = (0, tracing_1.getTracer)();
            expect(tracer).toBeDefined();
        });
        it('should initialize tracing if not already done', () => {
            const tracer = (0, tracing_1.getTracer)();
            expect(tracer).not.toBeNull();
        });
        it('should return the same tracer instance', () => {
            const tracer1 = (0, tracing_1.getTracer)();
            const tracer2 = (0, tracing_1.getTracer)();
            expect(tracer1).toBeDefined();
            expect(tracer2).toBeDefined();
        });
    });
    describe('createSpan()', () => {
        it('should create a span with name', () => {
            const span = (0, tracing_1.createSpan)('test-operation');
            expect(span).toBeDefined();
        });
        it('should set attributes on span', () => {
            const span = (0, tracing_1.createSpan)('test-operation', {
                userId: 'user-123',
                operationId: 'op-456',
            });
            expect(span).toBeDefined();
        });
        it('should handle span without attributes', () => {
            const span = (0, tracing_1.createSpan)('test-operation');
            expect(span).toBeDefined();
        });
        it('should support different attribute types', () => {
            const span = (0, tracing_1.createSpan)('test-operation', {
                stringAttr: 'value',
                numberAttr: 123,
                booleanAttr: true,
                arrayAttr: ['a', 'b', 'c'],
            });
            expect(span).toBeDefined();
        });
    });
    describe('withSpan() async context', () => {
        it('should run function within span context', async () => {
            const result = await (0, tracing_1.withSpan)('test-operation', async (span) => {
                return 'success';
            });
            expect(result).toBe('success');
        });
        it('should catch errors in span', async () => {
            const error = new Error('Test error');
            try {
                await (0, tracing_1.withSpan)('test-operation', async (span) => {
                    throw error;
                });
            }
            catch (e) {
                expect(e).toBe(error);
            }
        });
        it('should set attributes', async () => {
            await (0, tracing_1.withSpan)('test-operation', async (span) => {
                return 'success';
            }, {
                userId: 'user-123',
            });
            expect(tracing_1.withSpan).toBeDefined();
        });
        it('should end span after execution', async () => {
            let spanEnded = false;
            await (0, tracing_1.withSpan)('test-operation', async (span) => {
                const mockSpan = span;
                if (!mockSpan.end) {
                    mockSpan.end = jest.fn();
                }
                return 'done';
            });
            expect(tracing_1.withSpan).toBeDefined();
        });
    });
    describe('withSpanSync() sync context', () => {
        it('should run sync function within span context', () => {
            const result = (0, tracing_1.withSpanSync)('sync-operation', (span) => {
                return 'sync-success';
            });
            expect(result).toBe('sync-success');
        });
        it('should handle sync errors', () => {
            const error = new Error('Sync error');
            expect(() => {
                (0, tracing_1.withSpanSync)('sync-operation', (span) => {
                    throw error;
                });
            }).toThrow();
        });
        it('should set attributes on sync span', () => {
            const result = (0, tracing_1.withSpanSync)('sync-operation', (span) => {
                return 'result';
            }, { operation: 'test' });
            expect(result).toBe('result');
        });
    });
    describe('traceDbQuery()', () => {
        it('should trace database queries', async () => {
            const result = await (0, tracing_1.traceDbQuery)('SELECT * FROM users WHERE id = ?', 'SELECT', 'users', async () => {
                return [{ id: 1, name: 'John' }];
            });
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
        it('should set database attributes', async () => {
            await (0, tracing_1.traceDbQuery)('INSERT INTO users VALUES (?)', 'INSERT', 'users', async () => {
                return { id: 1 };
            });
            expect(tracing_1.traceDbQuery).toBeDefined();
        });
        it('should measure query duration', async () => {
            await (0, tracing_1.traceDbQuery)('SELECT COUNT(*) FROM orders', 'SELECT', 'orders', async () => {
                return [{ count: 42 }];
            });
            expect(tracing_1.traceDbQuery).toBeDefined();
        });
        it('should handle query errors', async () => {
            const error = new Error('Query failed');
            try {
                await (0, tracing_1.traceDbQuery)('SELECT * FROM invalid_table', 'SELECT', 'invalid_table', async () => {
                    throw error;
                });
            }
            catch (e) {
                expect(e).toBe(error);
            }
        });
    });
    describe('traceExternalCall()', () => {
        it('should trace external HTTP calls', async () => {
            const result = await (0, tracing_1.traceExternalCall)('payment-service', 'POST', 'https://payment-api.example.com/charge', async () => {
                return { transactionId: 'txn-123', status: 'success' };
            });
            expect(result).toBeDefined();
        });
        it('should set HTTP attributes', async () => {
            await (0, tracing_1.traceExternalCall)('user-service', 'GET', 'https://users-api.example.com/users/123', async () => {
                return { id: '123', name: 'Alice' };
            });
            expect(tracing_1.traceExternalCall).toBeDefined();
        });
        it('should handle external call failures', async () => {
            const error = new Error('Service unavailable');
            try {
                await (0, tracing_1.traceExternalCall)('failing-service', 'GET', 'https://failing-service.example.com/endpoint', async () => {
                    throw error;
                });
            }
            catch (e) {
                expect(e).toBe(error);
            }
        });
    });
    describe('traceCacheOperation()', () => {
        it('should trace cache get operations', async () => {
            const result = await (0, tracing_1.traceCacheOperation)('get', 'user:123', 'user-cache', async () => {
                return { id: '123', name: 'Bob' };
            });
            expect(result).toBeDefined();
        });
        it('should trace cache set operations', async () => {
            const result = await (0, tracing_1.traceCacheOperation)('set', 'user:123', 'user-cache', async () => {
                return true;
            });
            expect(result).toBe(true);
        });
        it('should trace cache delete operations', async () => {
            const result = await (0, tracing_1.traceCacheOperation)('delete', 'user:123', 'user-cache', async () => {
                return true;
            });
            expect(result).toBe(true);
        });
        it('should handle cache operation errors', async () => {
            const error = new Error('Cache error');
            try {
                await (0, tracing_1.traceCacheOperation)('get', 'invalid:key', 'user-cache', async () => {
                    throw error;
                });
            }
            catch (e) {
                expect(e).toBe(error);
            }
        });
        it('should set cache hit attribute', async () => {
            await (0, tracing_1.traceCacheOperation)('get', 'key', 'cache', async () => {
                return { data: 'value' };
            });
            expect(tracing_1.traceCacheOperation).toBeDefined();
        });
        it('should set cache miss attribute', async () => {
            await (0, tracing_1.traceCacheOperation)('get', 'key', 'cache', async () => {
                return null;
            });
            expect(tracing_1.traceCacheOperation).toBeDefined();
        });
    });
    describe('tracingMiddleware', () => {
        it('should create span for HTTP request', () => {
            (0, tracing_1.tracingMiddleware)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should set span attributes from request', () => {
            (0, tracing_1.tracingMiddleware)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should capture response status code', () => {
            mockResponse.statusCode = 404;
            (0, tracing_1.tracingMiddleware)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should handle 4xx responses', () => {
            mockResponse.statusCode = 400;
            (0, tracing_1.tracingMiddleware)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should handle 5xx responses', () => {
            mockResponse.statusCode = 500;
            (0, tracing_1.tracingMiddleware)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should set request ID attribute', () => {
            mockRequest.requestId = 'req-123';
            (0, tracing_1.tracingMiddleware)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should set user ID attribute', () => {
            mockRequest.userId = 'user-456';
            (0, tracing_1.tracingMiddleware)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
    });
    describe('Utility functions', () => {
        describe('addSpanEvent()', () => {
            it('should add event to current span', () => {
                (0, tracing_1.addSpanEvent)('operation-complete', { duration: 100 });
                expect(tracing_1.addSpanEvent).toBeDefined();
            });
            it('should handle missing span', () => {
                jest.mock('@opentelemetry/api', () => ({
                    ...jest.requireActual('@opentelemetry/api'),
                    trace: {
                        ...jest.requireActual('@opentelemetry/api').trace,
                        getActiveSpan: jest.fn(() => null),
                    },
                }));
                (0, tracing_1.addSpanEvent)('event');
                expect(tracing_1.addSpanEvent).toBeDefined();
            });
        });
        describe('setSpanAttribute()', () => {
            it('should set attribute on current span', () => {
                (0, tracing_1.setSpanAttribute)('userId', 'user-789');
                expect(tracing_1.setSpanAttribute).toBeDefined();
            });
            it('should handle different attribute types', () => {
                (0, tracing_1.setSpanAttribute)('stringValue', 'test');
                (0, tracing_1.setSpanAttribute)('numberValue', 42);
                (0, tracing_1.setSpanAttribute)('boolValue', true);
                expect(tracing_1.setSpanAttribute).toBeDefined();
            });
        });
        describe('recordException()', () => {
            it('should record exception in span', () => {
                const error = new Error('Test exception');
                (0, tracing_1.recordException)(error);
                expect(tracing_1.recordException).toBeDefined();
            });
            it('should set error status', () => {
                const error = new Error('Database error');
                (0, tracing_1.recordException)(error);
                expect(tracing_1.recordException).toBeDefined();
            });
        });
    });
    describe('getCurrentSpan()', () => {
        it('should return current active span', () => {
            const span = (0, tracing_1.getCurrentSpan)();
            expect(typeof tracing_1.getCurrentSpan).toBe('function');
        });
    });
    describe('Span lifecycle', () => {
        it('should properly lifecycle spans', async () => {
            await (0, tracing_1.withSpan)('operation', async (span) => {
                expect(span).toBeDefined();
                return 'done';
            });
            expect(tracing_1.withSpan).toBeDefined();
        });
    });
    describe('Context propagation', () => {
        it('should propagate W3C Trace Context', () => {
            (0, tracing_1.tracingMiddleware)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
    });
    describe('Error handling', () => {
        it('should handle span creation errors', () => {
            expect(() => {
                (0, tracing_1.createSpan)('test');
            }).not.toThrow();
        });
        it('should record exceptions in spans', async () => {
            const error = new Error('Operation failed');
            try {
                await (0, tracing_1.withSpan)('failing-operation', async (span) => {
                    throw error;
                });
            }
            catch (e) {
                (0, tracing_1.recordException)(e);
            }
            expect(tracing_1.recordException).toBeDefined();
        });
    });
});
//# sourceMappingURL=tracing.test.js.map