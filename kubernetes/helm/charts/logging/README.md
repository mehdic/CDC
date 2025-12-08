# Logging Helm Chart

Log aggregation with Loki and Promtail for MetaPharm Connect platform.

## Overview

This chart deploys:
- **Loki**: Log aggregation and storage system
- **Promtail**: Log collector running as DaemonSet on all nodes
- **Log-based alerts**: AlertManager rules for healthcare-specific monitoring
- **PII sanitization**: GDPR-compliant log sanitization

## Features

### GDPR/HIPAA Compliance
- Automatic PII sanitization (emails, phone numbers, Swiss AHV numbers, IBAN, credit cards)
- Configurable log retention policies per environment
- Audit trails for compliance

### Healthcare-Specific Alerts
- Prescription processing errors
- Authentication failures
- Database connection issues
- Payment processing errors
- Inventory stock-out alerts

### Performance
- Distributed Loki deployment (3 replicas in production)
- Efficient log ingestion (4MB/s in production)
- Compressed storage with retention policies

## Installation

### Development
```bash
helm install logging . \
  --namespace logging \
  --create-namespace \
  -f values-dev.yaml
```

### Staging
```bash
helm install logging . \
  --namespace logging \
  --create-namespace \
  -f values-staging.yaml
```

### Production
```bash
helm install logging . \
  --namespace logging \
  --create-namespace \
  -f values-prod.yaml
```

## Configuration

### Log Retention

Default retention periods:
- **Production**: 30 days (720h)
- **Staging**: 7 days (168h)
- **Development**: 3 days (72h)

Configure in `values.yaml`:
```yaml
loki:
  retention:
    enabled: true
    retentionPeriod: 720h
```

### PII Sanitization

PII sanitization is **ENABLED BY DEFAULT** for GDPR compliance.

Patterns sanitized:
- Email addresses → `[EMAIL]`
- Phone numbers → `[PHONE]`
- Swiss AHV numbers → `[AHV]`
- IBAN numbers → `[IBAN]`
- Credit card numbers → `[CREDIT_CARD]`

Configure in `values.yaml`:
```yaml
promtail:
  piiSanitization:
    enabled: true
    patterns:
      email: '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'
    replacements:
      email: '[EMAIL]'
```

### Resource Limits

Production defaults:
```yaml
loki:
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 2000m
      memory: 4Gi

promtail:
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
```

## Usage

### Querying Logs in Grafana

1. Add Loki datasource:
   - URL: `http://loki:3100`
   - Type: Loki

2. Example LogQL queries:

```logql
# All error logs
{level="error"}

# Logs from specific service
{service="prescription-service"}

# Logs with trace ID
{traceId="abc123"}

# Rate of errors per service
sum(rate({level="error"}[5m])) by (service)

# Search for specific text
{service="auth-service"} |= "login failed"
```

### Log Format

Expected log format (JSON):
```json
{
  "timestamp": "2025-12-04T10:30:00.000Z",
  "level": "info",
  "service": "prescription-service",
  "traceId": "abc123",
  "spanId": "def456",
  "message": "Prescription validated successfully",
  "metadata": {
    "prescriptionId": "rx-789",
    "pharmacyId": "ph-001",
    "duration_ms": 150
  }
}
```

### Annotation for Pod Log Collection

Add to your Deployment/StatefulSet:
```yaml
spec:
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
```

## Alerts

### Healthcare-Specific Alerts

1. **UnauthorizedAccessAttempt**: Multiple failed auth attempts
2. **PrescriptionValidationFailures**: High prescription error rate
3. **PatientDataAccessLog**: Unusual patient data access patterns
4. **EncryptionFailure**: Encryption errors (critical)

### Service Health Alerts

1. **ServiceCrashLoop**: Services experiencing panics/fatal errors
2. **SlowAPIResponses**: API response time > 5 seconds
3. **DependencyFailure**: External dependency connection failures

### Business Logic Alerts

1. **LowPrescriptionProcessingRate**: Prescription processing below threshold
2. **HighDeliveryFailureRate**: > 10% delivery failures
3. **PaymentProcessingErrors**: Payment service errors
4. **InventoryStockOutAlerts**: Multiple stock-out events

## Testing

Run Helm template validation tests:
```bash
cd kubernetes/helm/charts/logging
pytest tests/test_helm_templates.py -v
```

Validate PII sanitization:
```bash
# Test patterns
pytest tests/test_helm_templates.py::TestPIISanitization -v
```

Lint chart:
```bash
helm lint .
```

## Architecture

```
┌─────────────────────────────────────────┐
│           Kubernetes Cluster             │
│                                          │
│  ┌─────────────┐      ┌──────────────┐  │
│  │   Pod 1     │      │   Pod 2      │  │
│  │ (app logs)  │      │ (app logs)   │  │
│  └──────┬──────┘      └──────┬───────┘  │
│         │                    │          │
│         ▼                    ▼          │
│  ┌────────────────────────────────────┐ │
│  │     Promtail DaemonSet             │ │
│  │  (PII Sanitization Pipeline)       │ │
│  └──────────────┬─────────────────────┘ │
│                 │                        │
│                 ▼                        │
│  ┌────────────────────────────────────┐ │
│  │      Loki (StatefulSet)            │ │
│  │  - Log storage                     │ │
│  │  - Retention policies              │ │
│  │  - Query engine                    │ │
│  └──────────────┬─────────────────────┘ │
│                 │                        │
└─────────────────┼────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │    Grafana     │
         │  (Log Explorer) │
         └────────────────┘
```

## Troubleshooting

### Logs not appearing in Loki

1. Check Promtail is running:
```bash
kubectl get daemonset -n logging
```

2. Check Promtail logs:
```bash
kubectl logs -n logging -l app=promtail
```

3. Verify pod annotation:
```bash
kubectl get pod <pod-name> -o yaml | grep prometheus.io/scrape
```

### High memory usage

1. Reduce retention period:
```yaml
loki:
  retention:
    retentionPeriod: 168h  # 7 days instead of 30
```

2. Reduce ingestion limits:
```yaml
loki:
  limits:
    ingestionRate: 2097152  # 2MB/s instead of 4MB/s
```

### PII still appearing in logs

1. Verify sanitization is enabled:
```yaml
promtail:
  piiSanitization:
    enabled: true
```

2. Check Promtail config:
```bash
kubectl get configmap -n logging logging-promtail -o yaml
```

3. Add custom patterns if needed:
```yaml
promtail:
  piiSanitization:
    patterns:
      custom: '(your-regex-pattern)'
    replacements:
      custom: '[CUSTOM_PII]'
```

## Security Considerations

1. **PII Sanitization**: Always enabled in all environments
2. **RBAC**: Least privilege access for Promtail
3. **Network Policies**: Restrict Loki access to authorized services
4. **Encryption**: Use TLS for Loki API in production
5. **Audit Logs**: Enable for all log queries

## Contributing

When adding new alerts:
1. Add to `values.yaml` under `alerts.rules`
2. Test with `helm template`
3. Validate LogQL expression
4. Document in this README

## License

Copyright © 2025 MetaPharm Connect
