import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

const SERVICE_NAME = process.env.SERVICE_NAME || 'metapharm-api';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

let sdk: any = null;

/**
 * Initialize OpenTelemetry tracing
 * This should be called at application startup
 * Requires @opentelemetry/sdk-node to be installed for full functionality
 */
export async function initializeTracing() {
  logger.info('OpenTelemetry API initialized (SDK initialization requires additional packages)', {
    service: SERVICE_NAME,
    environment: ENVIRONMENT,
  });
  // SDK initialization would require @opentelemetry/sdk-node, @opentelemetry/auto-instrumentations-node
  // For now, the OpenTelemetry API is available for use
}

/**
 * Shutdown tracing SDK
 */
export async function shutdownTracing() {
  if (sdk) {
    try {
      await (sdk as any).shutdown();
      logger.info('OpenTelemetry tracing shut down');
    } catch (error) {
      logger.error('Error shutting down tracing', {
        error: (error as Error).message,
      });
    }
  }
}

/**
 * Get the current tracer
 */
export function getTracer() {
  return trace.getTracer(SERVICE_NAME, '1.0.0');
}

/**
 * Create a span for async operations
 */
export async function createSpan<T>(
  spanName: string,
  fn: (span: any) => Promise<T>
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(spanName);

  try {
    const result = await context.with(trace.setSpan(context.active(), span), async () => {
      return await fn(span);
    });
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message,
    });
    throw error;
  } finally {
    span.end();
  }
}

/**
 * HTTP tracing middleware
 * Automatically creates spans for incoming HTTP requests
 */
export const tracingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const tracer = getTracer();
  const spanName = `${req.method} ${req.route?.path || req.path}`;

  const span = tracer.startSpan(spanName, {
    attributes: {
      'http.method': req.method,
      'http.url': req.originalUrl,
      'http.target': req.path,
      'http.host': req.hostname,
      'http.scheme': req.protocol,
      'http.user_agent': req.get('user-agent'),
      'http.client_ip': req.ip,
    },
  });

  // Set span in context for rest of request
  context.with(trace.setSpan(context.active(), span), () => {
    res.on('finish', () => {
      span.setAttributes({
        'http.status_code': res.statusCode,
        'http.response_content_length': res.get('content-length'),
      });

      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      span.end();
    });
  });

  next();
};

/**
 * Add attributes to current span
 */
export function addSpanAttribute(key: string, value: any) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes({ [key]: value });
  }
}

/**
 * Add event to current span
 */
export function addSpanEvent(name: string, attributes?: Record<string, any>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Record exception in span
 */
export function recordException(error: Error) {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

/**
 * Add user context to span
 */
export function addUserContext(userId: string, userType?: string, pharmacyId?: string) {
  addSpanAttribute('user.id', userId);
  if (userType) addSpanAttribute('user.type', userType);
  if (pharmacyId) addSpanAttribute('pharmacy.id', pharmacyId);
}

/**
 * Add business context to span
 */
export function addBusinessContext(
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>
) {
  addSpanAttribute('business.entity_type', entityType);
  addSpanAttribute('business.entity_id', entityId);
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      addSpanAttribute(`business.${key}`, value);
    });
  }
}

/**
 * Create database operation span
 */
export async function traceDatabase<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  return createSpan(`db.${operation}.${table}`, async (span) => {
    span.setAttributes({
      'db.system': 'postgresql',
      'db.operation': operation,
      'db.collection': table,
    });

    try {
      const result = await fn();
      return result;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    }
  });
}

/**
 * Create cache operation span
 */
export async function traceCache<T>(
  operation: string,
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  return createSpan(`cache.${operation}`, async (span) => {
    span.setAttributes({
      'cache.system': 'redis',
      'cache.operation': operation,
      'cache.key': key,
    });

    try {
      const result = await fn();
      return result;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    }
  });
}

/**
 * Create external service call span
 */
export async function traceExternalCall<T>(
  serviceName: string,
  method: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  return createSpan(`http.${serviceName}`, async (span) => {
    span.setAttributes({
      'http.method': method,
      'http.url': endpoint,
      'peer.service': serviceName,
    });

    try {
      const result = await fn();
      return result;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    }
  });
}
