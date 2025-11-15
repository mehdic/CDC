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
exports.initializeTracing = initializeTracing;
exports.getTracer = getTracer;
exports.getCurrentSpan = getCurrentSpan;
exports.createSpan = createSpan;
exports.withSpan = withSpan;
exports.withSpanSync = withSpanSync;
exports.traceDbQuery = traceDbQuery;
exports.tracingMiddleware = tracingMiddleware;
exports.traceExternalCall = traceExternalCall;
exports.traceCacheOperation = traceCacheOperation;
exports.addSpanEvent = addSpanEvent;
exports.setSpanAttribute = setSpanAttribute;
exports.recordException = recordException;
const api = __importStar(require("@opentelemetry/api"));
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
const logger_1 = require("../utils/logger");
let tracer = null;
let isInitialized = false;
function initializeTracing(options) {
    if (isInitialized) {
        logger_1.logger.warn('Tracing already initialized, skipping');
        return;
    }
    const serviceName = options?.serviceName || 'metapharm-backend';
    const environment = options?.environment || process.env.NODE_ENV || 'development';
    const exporterUrl = options?.exporterUrl || process.env.OTLP_EXPORTER_URL || 'http://localhost:4318/v1/traces';
    const enableConsoleExporter = options?.enableConsoleExporter ?? environment === 'development';
    try {
        const tracerProvider = new sdk_trace_node_1.BasicTracerProvider();
        if (environment !== 'development') {
            try {
                const otlpExporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
                    url: exporterUrl,
                });
                const processor = new sdk_trace_node_1.BatchSpanProcessor(otlpExporter);
                tracerProvider.addSpanProcessor(processor);
            }
            catch (exporterError) {
                logger_1.logger.warn('Failed to initialize OTLP exporter', exporterError);
            }
        }
        if (enableConsoleExporter) {
            try {
                const consoleExporter = new sdk_trace_node_1.ConsoleSpanExporter();
                const consoleProcessor = new sdk_trace_node_1.BatchSpanProcessor(consoleExporter);
                tracerProvider.addSpanProcessor(consoleProcessor);
            }
            catch (consoleError) {
                logger_1.logger.warn('Failed to initialize console exporter', consoleError);
            }
        }
        api.trace.setGlobalTracerProvider(tracerProvider);
        tracer = api.trace.getTracer(serviceName, process.env.APP_VERSION || '0.1.0');
        isInitialized = true;
        logger_1.logger.info('OpenTelemetry tracing initialized', {
            serviceName,
            environment,
            exporterUrl,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize tracing', error);
    }
}
function getTracer() {
    if (!tracer) {
        logger_1.logger.warn('Tracing not initialized, creating default tracer');
        initializeTracing();
    }
    return tracer;
}
function getCurrentSpan() {
    return api.trace.getActiveSpan();
}
function createSpan(name, attributes) {
    const activeSpan = getCurrentSpan();
    const span = getTracer().startSpan(name, {}, api.context.active());
    if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            span.setAttribute(key, value);
        });
    }
    return span;
}
async function withSpan(name, fn, attributes) {
    const span = createSpan(name, attributes);
    try {
        return await api.context.with(api.trace.setSpan(api.context.active(), span), async () => {
            return fn(span);
        });
    }
    catch (error) {
        span.recordException(error);
        throw error;
    }
    finally {
        span.end();
    }
}
function withSpanSync(name, fn, attributes) {
    const span = createSpan(name, attributes);
    try {
        return fn(span);
    }
    catch (error) {
        span.recordException(error);
        throw error;
    }
    finally {
        span.end();
    }
}
async function traceDbQuery(query, operation, table, fn) {
    return withSpan(`db.${operation}`, async (span) => {
        span.setAttribute('db.system', 'postgresql');
        span.setAttribute('db.operation', operation);
        span.setAttribute('db.table', table);
        span.setAttribute('db.statement', query.substring(0, 500));
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            span.setAttribute('db.duration_ms', duration);
            return result;
        }
        catch (error) {
            span.recordException(error);
            span.setStatus({ code: api.SpanStatusCode.ERROR });
            throw error;
        }
    });
}
function tracingMiddleware(req, res, next) {
    const spanName = `${req.method} ${req.path}`;
    const requestId = req.requestId || 'unknown';
    const userId = req.userId;
    const span = createSpan(spanName, {
        'http.method': req.method,
        'http.url': req.originalUrl,
        'http.target': req.path,
        'http.host': req.hostname,
        'http.scheme': req.protocol,
        'http.client_ip': req.ip || 'unknown',
        'http.user_agent': req.headers['user-agent'] || '',
        'trace.requestId': requestId,
        ...(userId ? { 'trace.userId': userId } : {}),
    });
    span.setAttribute('trace.requestId', requestId);
    const originalJson = res.json;
    res.json = function (data) {
        const startTime = Date.now();
        span.setStatus({ code: api.SpanStatusCode.OK });
        span.setAttribute('http.status_code', res.statusCode);
        span.setAttribute('http.response_content_type', res.getHeader('content-type') || '');
        const statusCode = res.statusCode;
        if (statusCode >= 400 && statusCode < 500) {
            span.setStatus({
                code: api.SpanStatusCode.UNSET,
                message: 'Client error',
            });
        }
        else if (statusCode >= 500) {
            span.setStatus({
                code: api.SpanStatusCode.ERROR,
                message: 'Server error',
            });
        }
        const duration = Date.now() - startTime;
        span.setAttribute('http.response_duration_ms', duration);
        span.end();
        return originalJson.call(this, data);
    };
    api.context.with(api.trace.setSpan(api.context.active(), span), () => {
        next();
    });
}
async function traceExternalCall(service, method, url, fn) {
    return withSpan(`http.${service}`, async (span) => {
        span.setAttribute('http.method', method);
        span.setAttribute('http.url', url);
        span.setAttribute('span.kind', 'CLIENT');
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            span.setAttribute('http.duration_ms', duration);
            return result;
        }
        catch (error) {
            span.recordException(error);
            span.setStatus({ code: api.SpanStatusCode.ERROR });
            throw error;
        }
    });
}
async function traceCacheOperation(operation, key, cacheName, fn) {
    return withSpan(`cache.${operation}`, async (span) => {
        span.setAttribute('cache.name', cacheName);
        span.setAttribute('cache.key', key);
        span.setAttribute('cache.operation', operation);
        try {
            const result = await fn();
            span.setAttribute('cache.hit', result !== null && result !== undefined);
            return result;
        }
        catch (error) {
            span.recordException(error);
            span.setStatus({ code: api.SpanStatusCode.ERROR });
            throw error;
        }
    });
}
function addSpanEvent(name, attributes) {
    const span = getCurrentSpan();
    if (span) {
        span.addEvent(name, attributes);
    }
}
function setSpanAttribute(key, value) {
    const span = getCurrentSpan();
    if (span) {
        span.setAttribute(key, value);
    }
}
function recordException(error) {
    const span = getCurrentSpan();
    if (span) {
        span.recordException(error);
        span.setStatus({ code: api.SpanStatusCode.ERROR });
    }
}
exports.default = {
    initializeTracing,
    getTracer,
    getCurrentSpan,
    createSpan,
    withSpan,
    withSpanSync,
    traceDbQuery,
    traceExternalCall,
    traceCacheOperation,
    tracingMiddleware,
    addSpanEvent,
    setSpanAttribute,
    recordException,
};
//# sourceMappingURL=tracing.js.map