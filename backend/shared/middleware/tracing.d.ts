import { Request, Response, NextFunction } from 'express';
import * as api from '@opentelemetry/api';
export interface SpanAttributes {
    [key: string]: string | number | boolean | string[] | number[] | boolean[];
}
export declare function initializeTracing(options?: {
    serviceName?: string;
    environment?: string;
    exporterUrl?: string;
    enableConsoleExporter?: boolean;
}): void;
export declare function getTracer(): api.Tracer;
export declare function getCurrentSpan(): api.Span | undefined;
export declare function createSpan(name: string, attributes?: SpanAttributes): api.Span;
export declare function withSpan<T>(name: string, fn: (span: api.Span) => Promise<T>, attributes?: SpanAttributes): Promise<T>;
export declare function withSpanSync<T>(name: string, fn: (span: api.Span) => T, attributes?: SpanAttributes): T;
export declare function traceDbQuery<T>(query: string, operation: string, table: string, fn: () => Promise<T>): Promise<T>;
export declare function tracingMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function traceExternalCall<T>(service: string, method: string, url: string, fn: () => Promise<T>): Promise<T>;
export declare function traceCacheOperation<T>(operation: 'get' | 'set' | 'delete', key: string, cacheName: string, fn: () => Promise<T>): Promise<T>;
export declare function addSpanEvent(name: string, attributes?: SpanAttributes): void;
export declare function setSpanAttribute(key: string, value: any): void;
export declare function recordException(error: Error): void;
declare const _default: {
    initializeTracing: typeof initializeTracing;
    getTracer: typeof getTracer;
    getCurrentSpan: typeof getCurrentSpan;
    createSpan: typeof createSpan;
    withSpan: typeof withSpan;
    withSpanSync: typeof withSpanSync;
    traceDbQuery: typeof traceDbQuery;
    traceExternalCall: typeof traceExternalCall;
    traceCacheOperation: typeof traceCacheOperation;
    tracingMiddleware: typeof tracingMiddleware;
    addSpanEvent: typeof addSpanEvent;
    setSpanAttribute: typeof setSpanAttribute;
    recordException: typeof recordException;
};
export default _default;
//# sourceMappingURL=tracing.d.ts.map