# MetaPharm Monitoring & Observability Guide

This guide covers the comprehensive monitoring and observability infrastructure for MetaPharm Connect.

## Overview

The monitoring system provides four main pillars:

1. **Logging** (CloudWatch) - Application and infrastructure logs
2. **Metrics** (Prometheus) - System and business metrics
3. **Tracing** (OpenTelemetry/Jaeger) - Distributed request tracing
4. **Error Tracking** (Sentry) - Error monitoring and debugging

## Architecture

```
Application Services (Express)
    ↓
Monitoring Middleware & SDK
    ├─→ Winston Logger → CloudWatch Logs
    ├─→ Prometheus Metrics → Prometheus Server
    ├─→ OpenTelemetry Tracing → Jaeger Collector
    └─→ Sentry SDK → Sentry
        ↓
    Dashboards & Alerts
    ├─→ Grafana Dashboards
    ├─→ Alertmanager
    ├─→ PagerDuty (Critical)
    └─→ Slack (All levels)
```

## Setup & Configuration

### 1. Initialize Monitoring in Your Express App

```typescript
import express from 'express';
import {
  logger,
  configureCloudWatchLogging,
  requestLoggingMiddleware,
  metricsMiddleware,
  metricsEndpoint,
  tracingMiddleware,
  initializeTracing,
  healthCheckEndpoint,
  readinessCheckEndpoint,
  livenessCheckEndpoint,
  sentryRequestHandler,
  sentryErrorHandler,
  initializeSentry,
  setupUncaughtExceptionHandler,
  setupUnhandledRejectionHandler,
} from '@metapharm/backend/shared/monitoring';

const app = express();

// Initialize error tracking
initializeSentry();
setupUncaughtExceptionHandler();
setupUnhandledRejectionHandler();

// Sentry handlers (must be early)
app.use(sentryRequestHandler());

// Logging middleware
app.use(requestLoggingMiddleware);
configureCloudWatchLogging();

// Metrics middleware
app.use(metricsMiddleware);

// Tracing middleware
app.use(tracingMiddleware);

// Health check endpoints
app.get('/health', healthCheckEndpoint);
app.get('/health/ready', readinessCheckEndpoint);
app.get('/health/live', livenessCheckEndpoint);

// Metrics endpoint for Prometheus
app.get('/metrics', metricsEndpoint);

// Your API routes
app.get('/api/orders', (req, res) => {
  res.json({ orders: [] });
});

// Error handling middleware (must be last)
app.use(sentryErrorHandler());
```

### 2. Environment Configuration

Create a `.env` file with:

```env
# Logging
LOG_LEVEL=info
NODE_ENV=production
SERVICE_NAME=metapharm-api
LOG_RETENTION_DAYS=30

# CloudWatch
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Sentry
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
APP_VERSION=1.0.0

# PagerDuty
PAGERDUTY_INTEGRATION_KEY=xxx
PAGERDUTY_SERVICE_KEY=xxx

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
JAEGER_AGENT_HOST=jaeger
JAEGER_AGENT_PORT=6831
```

## Using the Monitoring System

### Logging

#### Log with Context

```typescript
import { logInfo, logError, logWithContext } from '@metapharm/backend/shared/monitoring';

// Simple logging
logInfo('Order created successfully');

// With metadata
logInfo('Order created', {
  orderId: '12345',
  userId: 'user-abc',
  amount: 99.99,
});

// With request ID
logWithContext('info', 'Processing request', 'req-id-123', {
  endpoint: '/api/orders',
  method: 'POST',
});

// Error logging
logError('Failed to process order', error, {
  orderId: '12345',
  attempt: 2,
});
```

### Metrics

#### Record Business Metrics

```typescript
import {
  recordOrderCreated,
  recordOrderCompleted,
  recordDeliveryCompleted,
  recordConsultationStarted,
  updateActiveUsers,
  updateInventoryLevel,
} from '@metapharm/backend/shared/monitoring';

// When order is created
recordOrderCreated('prescription');

// When order completes
recordOrderCompleted('prescription');

// Track deliveries
recordDeliveryCompleted('success');

// Track consultations
recordConsultationStarted('pharmacist-patient');

// Update gauges
updateActiveUsers('patient', 1523);
updateInventoryLevel('pharmacy-001', 'ASPIRIN-500mg', 250);
```

#### Record Custom Metrics

```typescript
import { databaseQueryDuration, recordDatabaseQuery } from '@metapharm/backend/shared/monitoring';

const startTime = Date.now();
const results = await database.query('SELECT * FROM orders');
recordDatabaseQuery('select', 'orders', Date.now() - startTime);
```

### Health Checks

The system provides three types of health checks:

#### 1. Liveness Check (Process Running)

```
GET /health/live
Response: 200 OK
{
  "alive": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 2. Readiness Check (Ready for Traffic)

```
GET /health/ready
Response: 200 OK or 503 Service Unavailable
{
  "ready": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": {
      "ready": true
    },
    "redis": {
      "ready": true
    }
  }
}
```

#### 3. Deep Health Check (Full System Status)

```
GET /health
Response: 200 OK or 503 Service Unavailable
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600000,
  "checks": {
    "database": {
      "status": "pass|warn|fail",
      "duration": 5,
      "error": null
    },
    "redis": {
      "status": "pass|warn|fail",
      "duration": 2,
      "error": null
    },
    "memory": {
      "status": "pass|warn|fail",
      "error": null
    },
    "uptime": {
      "status": "pass",
      "duration": 3600000
    }
  }
}
```

### Tracing

#### Automatic HTTP Tracing

HTTP requests are automatically traced via middleware:

```
GET /api/orders/123
├─ HTTP Request Span
│  ├─ attributes: method, url, status_code
│  └─ events: request_received, request_completed
```

#### Manual Span Creation

```typescript
import { createSpan, addUserContext, addBusinessContext } from '@metapharm/backend/shared/monitoring';

async function processOrder(orderId: string, userId: string) {
  return createSpan('process_order', async (span) => {
    // Add user context
    addUserContext(userId, 'patient');

    // Add business context
    addBusinessContext('order', orderId, {
      type: 'prescription',
      items: 5,
    });

    // Your code here
    const result = await database.query('SELECT * FROM orders WHERE id = ?', [orderId]);

    return result;
  });
}
```

#### Database Tracing

```typescript
import { traceDatabase } from '@metapharm/backend/shared/monitoring';

const orders = await traceDatabase('select', 'orders', async () => {
  return database.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
});
```

#### Cache Tracing

```typescript
import { traceCache } from '@metapharm/backend/shared/monitoring';

const cachedData = await traceCache('get', `user:${userId}`, async () => {
  return cache.get(`user:${userId}`);
});
```

#### External Service Tracing

```typescript
import { traceExternalCall } from '@metapharm/backend/shared/monitoring';

const result = await traceExternalCall(
  'payment-service',
  'POST',
  'https://api.payment.com/charge',
  async () => {
    return axios.post('https://api.payment.com/charge', { amount: 99.99 });
  }
);
```

### Error Tracking with Sentry

#### Capture Exceptions

```typescript
import { captureException, setErrorTrackingUserContext } from '@metapharm/backend/shared/monitoring';

try {
  await processOrder(orderId);
} catch (error) {
  setErrorTrackingUserContext(userId, 'patient', email, pharmacyId);
  captureException(error as Error, {
    orderId,
    step: 'inventory_check',
  });
}
```

#### Capture Messages

```typescript
import { captureMessage, addErrorTrackingBreadcrumb } from '@metapharm/backend/shared/monitoring';

// Track user actions (breadcrumbs)
addErrorTrackingBreadcrumb('User clicked order button', 'user-action');
addErrorTrackingBreadcrumb('Order validation failed', 'validation', {
  reason: 'Out of stock',
});

// Capture informational message
captureMessage('Order processing started', 'info');
```

### Alerting

#### Send Alerts

```typescript
import { sendAlert, alertManager } from '@metapharm/backend/shared/monitoring';

// Send critical alert
await sendAlert({
  name: 'Database Connection Pool Exhausted',
  description: 'Active connections: 95/100',
  severity: 'critical',
  service: 'metapharm-api',
  environment: 'production',
  metric: 'db_connections_active',
  threshold: 100,
  currentValue: 95,
});

// Check alert conditions
const definition = {
  name: 'High Error Rate',
  metric: 'error_rate',
  operator: 'gt' as const,
  threshold: 0.05,
  severity: 'error' as const,
  checkInterval: 60000,
};

const errorRate = 0.08;
await alertManager.checkAndAlert(definition, errorRate);
```

## Dashboards

### Service Health Dashboard

URL: `http://grafana:3000/d/metapharm-health`

Displays:
- Service uptime (gauge)
- HTTP request rate (time series)
- API latency percentiles (time series)
- Error rate (time series)

### Business Metrics Dashboard

URL: `http://grafana:3000/d/metapharm-business`

Displays:
- Orders in 24h (stat)
- Deliveries in 24h (stat)
- Consultations in 24h (stat)
- Active users (stat)
- Order creation rate (time series)
- Delivery completion rate (time series)

## Alert Rules

### Critical Alerts

**ServiceDown**: Service is not responding (pages on-call)
**DatabaseConnectionPoolExhausted**: DB pool at 95% capacity
**CriticalMemoryUsage**: Memory > 95%
**DeliveryServiceDown**: Delivery service unavailable

### Error Alerts

**HighErrorRate**: 5% error rate for 5 minutes
**HighLatency**: 95th percentile > 2 seconds
**DatabaseErrorRate**: Error rate in queries > 1%

### Warning Alerts

**LowCacheHitRate**: Cache hit rate < 50%
**HighMemoryUsage**: Memory > 85%
**HighCPUUsage**: CPU > 80%
**NoOrdersProcessed**: No orders in 1 hour

## Troubleshooting

### Logs Not Appearing in CloudWatch

1. Check AWS credentials in `.env`
2. Verify `SERVICE_NAME` and `NODE_ENV` are set
3. Check CloudWatch log group: `/metapharm/{SERVICE_NAME}`

### Metrics Not Showing in Prometheus

1. Verify `/metrics` endpoint is accessible
2. Check Prometheus configuration scrape targets
3. Check service is running on configured port

### Traces Not Appearing in Jaeger

1. Verify `OTEL_EXPORTER_OTLP_ENDPOINT` is correct
2. Check Jaeger collector is running
3. Verify OpenTelemetry SDK initialization

### Alerts Not Firing

1. Check alert rules in `alert_rules.yml`
2. Verify Prometheus evaluation (Alerts tab)
3. Check Alertmanager configuration
4. Verify Slack/PagerDuty webhooks

## Performance Considerations

- **Sampling**: In production, traces are sampled at 10% (configurable)
- **Log retention**: Default 30 days (configurable via `LOG_RETENTION_DAYS`)
- **Metrics cardinality**: Be careful with high-cardinality labels
- **Sentry**: Enabled only in production by default

## Best Practices

1. **Always add context** to logs, spans, and error captures
2. **Use appropriate log levels**: DEBUG, INFO, WARN, ERROR
3. **Keep metric labels low-cardinality** to prevent explosion
4. **Add breadcrumbs** before errors for context
5. **Use health checks** in your load balancer configuration
6. **Monitor the monitors** - set up dashboards for monitoring infrastructure

## Related Documentation

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
