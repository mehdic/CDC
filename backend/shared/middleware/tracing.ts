/**
 * Distributed Tracing Middleware (T257)
 * Implements OpenTelemetry distributed tracing
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Features:
 * - Trace API requests across services
 * - Trace database queries
 * - Correlate logs with traces
 * - Span attributes: service, operation, userId, requestId
 * - Trace context propagation via W3C Trace Context
 * - Automatic instrumentation of common operations
 *
 * Usage:
 * // Initialize tracing at app startup
 * initializeTracing();
 *
 * // Use tracing middleware
 * app.use(tracingMiddleware);
 *
 * // Create spans for operations
 * const span = createSpan('operation_name');
 * // ... do work ...
 * span.end();
 *
 * // Or use async context
 * await withSpan('operation_name', async (span) => {
 *   span.setAttribute('userId', userId);
 *   // ... do work ...
 * });
 */

import { Request, Response, NextFunction } from 'express';
import * as api from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BasicTracerProvider, BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { logger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface SpanAttributes {
  [key: string]: string | number | boolean | string[] | number[] | boolean[];
}

// ============================================================================
// Global Tracing State
// ============================================================================

let tracer: api.Tracer | null = null;
let isInitialized = false;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize OpenTelemetry tracing
 * Should be called at application startup (before creating any spans)
 */
export function initializeTracing(options?: {
  serviceName?: string;
  environment?: string;
  exporterUrl?: string;
  enableConsoleExporter?: boolean;
}): void {
  if (isInitialized) {
    logger.warn('Tracing already initialized, skipping');
    return;
  }

  const serviceName = options?.serviceName || 'metapharm-backend';
  const environment = options?.environment || process.env.NODE_ENV || 'development';
  const exporterUrl = options?.exporterUrl || process.env.OTLP_EXPORTER_URL || 'http://localhost:4318/v1/traces';
  const enableConsoleExporter = options?.enableConsoleExporter ?? environment === 'development';

  try {
    // Create tracer provider
    const tracerProvider = new BasicTracerProvider();

    // Add OTLP exporter for production
    if (environment !== 'development') {
      try {
        const otlpExporter = new OTLPTraceExporter({
          url: exporterUrl,
        });
        const processor = new BatchSpanProcessor(otlpExporter);
        (tracerProvider as any).addSpanProcessor(processor);
      } catch (exporterError) {
        logger.warn('Failed to initialize OTLP exporter', exporterError as Error);
      }
    }

    // Add console exporter for development
    if (enableConsoleExporter) {
      try {
        const consoleExporter = new ConsoleSpanExporter();
        (tracerProvider as any).addSpanProcessor(consoleExporter);
      } catch (consoleError) {
        logger.warn('Failed to initialize console exporter', consoleError as Error);
      }
    }

    // Set global tracer provider
    api.trace.setGlobalTracerProvider(tracerProvider);

    // Get tracer instance
    tracer = api.trace.getTracer(serviceName, process.env.APP_VERSION || '0.1.0');

    isInitialized = true;
    logger.info('OpenTelemetry tracing initialized', {
      serviceName,
      environment,
      exporterUrl,
    });
  } catch (error) {
    logger.error('Failed to initialize tracing', error as Error);
  }
}

/**
 * Get the global tracer instance
 */
export function getTracer(): api.Tracer {
  if (!tracer) {
    logger.warn('Tracing not initialized, creating default tracer');
    initializeTracing();
  }
  return tracer!;
}

/**
 * Get current span
 */
export function getCurrentSpan(): api.Span | undefined {
  return api.trace.getActiveSpan();
}

// ============================================================================
// Span Creation
// ============================================================================

/**
 * Create a new span
 */
export function createSpan(name: string, attributes?: SpanAttributes): api.Span {
  const activeSpan = getCurrentSpan();
  const span = getTracer().startSpan(name, {}, api.context.active());

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }

  return span;
}

/**
 * Run code within a span context
 */
export async function withSpan<T>(
  name: string,
  fn: (span: api.Span) => Promise<T>,
  attributes?: SpanAttributes
): Promise<T> {
  const span = createSpan(name, attributes);

  try {
    return await api.context.with(api.trace.setSpan(api.context.active(), span), async () => {
      return fn(span);
    });
  } catch (error) {
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Run synchronous code within a span context
 */
export function withSpanSync<T>(
  name: string,
  fn: (span: api.Span) => T,
  attributes?: SpanAttributes
): T {
  const span = createSpan(name, attributes);

  try {
    return fn(span);
  } catch (error) {
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

// ============================================================================
// Database Tracing
// ============================================================================

/**
 * Trace a database query
 */
export async function traceDbQuery<T>(
  query: string,
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(`db.${operation}`, async (span) => {
    span.setAttribute('db.system', 'postgresql');
    span.setAttribute('db.operation', operation);
    span.setAttribute('db.table', table);
    span.setAttribute('db.statement', query.substring(0, 500)); // Limit query length

    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      span.setAttribute('db.duration_ms', duration);
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: api.SpanStatusCode.ERROR });
      throw error;
    }
  });
}

// ============================================================================
// Request Tracing
// ============================================================================

/**
 * Tracing middleware for Express
 * Creates a span for each HTTP request
 */
export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const spanName = `${req.method} ${req.path}`;
  const requestId = (req as any).requestId || 'unknown';
  const userId = (req as any).userId;

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

  // Add request ID to span
  span.setAttribute('trace.requestId', requestId);

  // Capture response
  const originalJson = res.json;
  res.json = function (data: any) {
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
    } else if (statusCode >= 500) {
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

  // Create context with span
  api.context.with(api.trace.setSpan(api.context.active(), span), () => {
    next();
  });
}

// ============================================================================
// External Service Tracing
// ============================================================================

/**
 * Trace an external HTTP call
 */
export async function traceExternalCall<T>(
  service: string,
  method: string,
  url: string,
  fn: () => Promise<T>
): Promise<T> {
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
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: api.SpanStatusCode.ERROR });
      throw error;
    }
  });
}

// ============================================================================
// Cache Tracing
// ============================================================================

/**
 * Trace a cache operation
 */
export async function traceCacheOperation<T>(
  operation: 'get' | 'set' | 'delete',
  key: string,
  cacheName: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(`cache.${operation}`, async (span) => {
    span.setAttribute('cache.name', cacheName);
    span.setAttribute('cache.key', key);
    span.setAttribute('cache.operation', operation);

    try {
      const result = await fn();
      span.setAttribute('cache.hit', result !== null && result !== undefined);
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: api.SpanStatusCode.ERROR });
      throw error;
    }
  });
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Add event to current span
 */
export function addSpanEvent(name: string, attributes?: SpanAttributes): void {
  const span = getCurrentSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Set attribute on current span
 */
export function setSpanAttribute(key: string, value: any): void {
  const span = getCurrentSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}

/**
 * Record exception in current span
 */
export function recordException(error: Error): void {
  const span = getCurrentSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({ code: api.SpanStatusCode.ERROR });
  }
}

export default {
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
