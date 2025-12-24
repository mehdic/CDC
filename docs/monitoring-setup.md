# MetaPharm Connect - Monitoring and Error Tracking Setup (T8-060)

This guide explains how to set up and use the comprehensive monitoring infrastructure for MetaPharm Connect.

## Table of Contents

1. [Overview](#overview)
2. [Backend Monitoring](#backend-monitoring)
3. [Frontend Error Boundaries](#frontend-error-boundaries)
4. [Metrics Collection](#metrics-collection)
5. [Health Checks](#health-checks)
6. [Alert Configuration](#alert-configuration)
7. [Performance Monitoring](#performance-monitoring)

---

## Overview

MetaPharm Connect uses a multi-layered monitoring approach:

- **Error Tracking**: Sentry integration for backend and frontend
- **Metrics**: Prometheus-format metrics for observability
- **Health Checks**: Kubernetes-ready liveness/readiness probes
- **Logging**: Structured Winston logging with CloudWatch integration
- **Tracing**: OpenTelemetry distributed tracing
- **Alerting**: PagerDuty and Slack integrations

---

## Backend Monitoring

### 1. Initialize Monitoring

In your Express application entry point (e.g., `server.ts`):

```typescript
import {
  initializeSentry,
  initializeTracing,
  logger,
  configureCloudWatchLogging,
  setupUncaughtExceptionHandler,
  setupUnhandledRejectionHandler,
} from '@shared/monitoring';

// Initialize error tracking
initializeSentry();

// Initialize distributed tracing
await initializeTracing();

// Configure CloudWatch (production only)
configureCloudWatchLogging();

// Setup global error handlers
setupUncaughtExceptionHandler();
setupUnhandledRejectionHandler();

logger.info('Monitoring initialized');
```

### 2. Add Middleware

```typescript
import {
  requestLoggingMiddleware,
  metricsMiddleware,
  tracingMiddleware,
  sentryRequestHandler,
  sentryErrorHandler,
} from '@shared/monitoring';
import { errorHandler } from '@shared/middleware/errorHandler';

// Order matters!
app.use(sentryRequestHandler()); // Must be first
app.use(tracingMiddleware());
app.use(requestLoggingMiddleware);
app.use(metricsMiddleware);

// ... your routes ...

// Error handlers (must be last)
app.use(sentryErrorHandler());
app.use(errorHandler);
```

### 3. Add Health Check Endpoints

```typescript
import {
  healthCheckEndpoint,
  readinessCheckEndpoint,
  livenessCheckEndpoint,
  metricsEndpoint,
} from '@shared/monitoring';

// Kubernetes probes
app.get('/health', healthCheckEndpoint);
app.get('/health/ready', readinessCheckEndpoint);
app.get('/health/live', livenessCheckEndpoint);

// Prometheus metrics
app.get('/metrics', metricsEndpoint);
```

### 4. Environment Variables

Create `.env` file:

```bash
# Service Configuration
SERVICE_NAME=metapharm-api
NODE_ENV=production
LOG_LEVEL=info

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
APP_VERSION=1.0.0

# CloudWatch (optional)
AWS_REGION=us-east-1
LOG_RETENTION_DAYS=30

# Alerting (optional)
PAGERDUTY_INTEGRATION_KEY=your-pagerduty-key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Tracing (optional)
OTLP_ENDPOINT=http://localhost:4318
OTLP_SERVICE_NAME=metapharm-api
ENABLE_TRACING=true

# Metrics
COLLECT_DEFAULT_METRICS=true
```

---

## Frontend Error Boundaries

### 1. Wrap Your Application

In `web/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

// Initialize Sentry for frontend (optional)
if (import.meta.env.PROD) {
  // Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

### 2. Wrap Critical Components

For components that should have isolated error handling:

```typescript
import { ErrorBoundary, ErrorFallbackMinimal } from '@shared/components/ErrorBoundary';

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Isolated error boundary for widget */}
      <ErrorBoundary fallback={<ErrorFallbackMinimal />}>
        <ComplexWidget />
      </ErrorBoundary>

      {/* Another isolated section */}
      <ErrorBoundary onError={(error, errorInfo) => {
        console.log('Widget failed:', error);
      }}>
        <AnotherWidget />
      </ErrorBoundary>
    </div>
  );
}
```

### 3. Custom Error Handlers

```typescript
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

function MyComponent() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to custom analytics
    console.error('Component error:', error);

    // Track in metrics
    // trackError('component_error', error.message);
  };

  return (
    <ErrorBoundary
      onError={handleError}
      resetKeys={[userId]} // Reset when user changes
      resetOnPropsChange={true}
    >
      <UserProfile userId={userId} />
    </ErrorBoundary>
  );
}
```

---

## Metrics Collection

### 1. Using Built-in Metrics

Metrics are automatically collected for:
- HTTP requests (duration, count, status codes)
- Database queries
- Cache hits/misses
- Active connections

### 2. Custom Business Metrics

```typescript
import {
  recordOrderCreated,
  recordOrderCompleted,
  recordDeliveryCompleted,
  recordConsultationStarted,
  updateActiveUsers,
  updateInventoryLevel,
} from '@shared/monitoring';

// Track business events
async function createOrder(orderData: OrderData) {
  const order = await db.orders.create(orderData);

  // Record metric
  recordOrderCreated(orderData.type); // 'prescription', 'otc', etc.

  return order;
}

// Track deliveries
async function completeDelivery(deliveryId: string) {
  await db.deliveries.update(deliveryId, { status: 'delivered' });

  recordDeliveryCompleted('delivered');
}

// Update gauges periodically
setInterval(async () => {
  const activePharmacists = await getActiveUserCount('pharmacist');
  updateActiveUsers('pharmacist', activePharmacists);
}, 60000); // Every minute
```

### 3. Custom Metrics

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// Create custom metric
const customMetric = new Counter({
  name: 'metapharm_custom_events_total',
  help: 'Custom events counter',
  labelNames: ['event_type', 'service'],
});

// Use it
customMetric.inc({
  event_type: 'prescription_scanned',
  service: process.env.SERVICE_NAME
});
```

---

## Health Checks

### 1. Kubernetes Configuration

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metapharm-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: metapharm-api:latest
        ports:
        - containerPort: 3000

        # Liveness probe - restart if unhealthy
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        # Readiness probe - remove from load balancer if not ready
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2

        # Startup probe - give app time to start
        startupProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 0
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 30
```

### 2. Deep Health Checks

The `/health` endpoint checks:
- Database connectivity (with latency)
- Redis connectivity (with latency)
- Memory usage
- Service uptime

Response format:

```json
{
  "status": "healthy",
  "timestamp": "2025-12-24T20:00:00Z",
  "uptime": 3600000,
  "checks": {
    "database": {
      "status": "pass",
      "duration": 5
    },
    "redis": {
      "status": "pass",
      "duration": 2
    },
    "memory": {
      "status": "pass",
      "duration": 0
    }
  }
}
```

---

## Alert Configuration

### 1. Prometheus Alert Rules

Create `prometheus/alerts.yml`:

```yaml
groups:
  - name: metapharm_alerts
    interval: 30s
    rules:
      # High API Latency (Fast Burn)
      - alert: HighAPILatencyFastBurn
        expr: |
          (
            sum(rate(metapharm_http_request_duration_seconds_sum[1h]))
            /
            sum(rate(metapharm_http_request_duration_seconds_count[1h]))
          ) > 0.2
        for: 5m
        labels:
          severity: critical
          window: fast
        annotations:
          summary: "High API latency detected (fast burn)"
          description: "P99 latency is {{ $value }}s (threshold: 0.2s)"

      # High Error Rate (Slow Burn)
      - alert: HighErrorRateSlowBurn
        expr: |
          (
            sum(rate(metapharm_http_requests_total{status_code=~"5.."}[6h]))
            /
            sum(rate(metapharm_http_requests_total[6h]))
          ) > 0.01
        for: 30m
        labels:
          severity: error
          window: slow
        annotations:
          summary: "High error rate detected (slow burn)"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 1%)"

      # Database Connection Pool Exhausted
      - alert: DatabasePoolExhausted
        expr: metapharm_db_connections_active >= 95
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool near exhaustion"
          description: "Active connections: {{ $value }}"

      # Memory Usage High
      - alert: MemoryUsageHigh
        expr: |
          (process_resident_memory_bytes / process_heap_total_bytes) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memory usage is high"
          description: "Memory usage: {{ $value | humanizePercentage }}"
```

### 2. Application-Level Alerts

```typescript
import { alertManager, DEFAULT_ALERT_DEFINITIONS } from '@shared/monitoring';

// Start monitoring metrics
DEFAULT_ALERT_DEFINITIONS.forEach((definition) => {
  setInterval(async () => {
    // Get current metric value
    const currentValue = await getMetricValue(definition.metric);

    // Check and alert if threshold exceeded
    await alertManager.checkAndAlert(definition, currentValue);
  }, definition.checkInterval);
});
```

### 3. Custom Alerts

```typescript
import { sendAlert } from '@shared/monitoring';

// Send custom alert
async function checkCustomCondition() {
  const prescriptionBacklog = await getPrescriptionBacklogCount();

  if (prescriptionBacklog > 100) {
    await sendAlert({
      name: 'High Prescription Backlog',
      description: `Prescription backlog has reached ${prescriptionBacklog}`,
      severity: 'warning',
      service: 'pharmacy-service',
      environment: process.env.NODE_ENV || 'development',
      metric: 'prescription_backlog',
      threshold: 100,
      currentValue: prescriptionBacklog,
    });
  }
}
```

---

## Performance Monitoring

### 1. Frontend Performance

The `performanceMonitor` automatically tracks Core Web Vitals:

```typescript
import { usePerformanceMonitoring } from '@shared/utils/performanceMonitor';

function PerformanceDashboard() {
  const { metrics, grade } = usePerformanceMonitoring();

  return (
    <div>
      <h2>Performance Grade: {grade.grade} ({grade.score})</h2>

      <ul>
        <li>FCP: {metrics.fcp?.toFixed(2)}ms</li>
        <li>LCP: {metrics.lcp?.toFixed(2)}ms</li>
        <li>FID: {metrics.fid?.toFixed(2)}ms</li>
        <li>CLS: {metrics.cls?.toFixed(4)}</li>
      </ul>

      {grade.issues.length > 0 && (
        <div>
          <h3>Issues:</h3>
          <ul>
            {grade.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 2. Custom Timing Marks

```typescript
import { performanceMonitor } from '@shared/utils/performanceMonitor';

async function loadComplexData() {
  // Mark start
  performanceMonitor.mark('data-load-start');

  const data = await fetchData();

  // Mark end
  performanceMonitor.mark('data-load-end');

  // Measure duration
  const duration = performanceMonitor.measure(
    'data-load-duration',
    'data-load-start',
    'data-load-end'
  );

  console.log(`Data loaded in ${duration}ms`);
}
```

---

## Testing Monitoring

### 1. Unit Tests

```typescript
import { metricsMiddleware, httpRequestCounter } from '@shared/monitoring';

describe('Metrics Middleware', () => {
  it('should track HTTP requests', async () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = jest.fn();

    await metricsMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    // Verify metrics were recorded
  });
});
```

### 2. Integration Tests

```typescript
import request from 'supertest';
import app from '../app';

describe('Health Checks', () => {
  it('should return healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'healthy',
      checks: {
        database: { status: 'pass' },
        redis: { status: 'pass' },
      },
    });
  });
});
```

---

## Grafana Dashboards

### Sample Dashboard JSON

See `docs/grafana-dashboard.json` for a complete dashboard configuration tracking:
- Request rate and latency
- Error rates
- Database performance
- Cache hit rates
- Business metrics (orders, deliveries, consultations)

---

## Troubleshooting

### Metrics Not Appearing

1. Check that middleware is registered: `app.use(metricsMiddleware)`
2. Verify `/metrics` endpoint is accessible
3. Check Prometheus scrape configuration

### Alerts Not Firing

1. Verify environment variables: `PAGERDUTY_INTEGRATION_KEY`, `SLACK_WEBHOOK_URL`
2. Check alert thresholds in code
3. Review alert manager logs

### Health Checks Failing

1. Verify database connection configuration
2. Check Redis connectivity
3. Review health check endpoint logs

---

## Best Practices

1. **Always use structured logging**:
   ```typescript
   logger.info('User logged in', { userId, timestamp });
   ```

2. **Track business metrics**:
   ```typescript
   recordOrderCreated('prescription');
   ```

3. **Use error boundaries in React**:
   ```typescript
   <ErrorBoundary><App /></ErrorBoundary>
   ```

4. **Monitor performance in production**:
   ```typescript
   performanceMonitor.trackMetric('api-call', duration);
   ```

5. **Set up alerts proactively**:
   - Define SLOs (99.9% availability, P99 < 200ms)
   - Configure burn rate alerts
   - Test alert routing regularly

---

## Resources

- [Winston Logging Documentation](https://github.com/winstonjs/winston)
- [Sentry Documentation](https://docs.sentry.io/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [OpenTelemetry Spec](https://opentelemetry.io/docs/)
- [Core Web Vitals](https://web.dev/vitals/)

---

**Generated for:** Task T8-060: Error Tracking and Monitoring
**Date:** 2025-12-24
**Maintainer:** MetaPharm Development Team
