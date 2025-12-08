# Loki Helm Chart for MetaPharm Connect

Complete log aggregation solution for MetaPharm Connect healthcare platform using Grafana Loki.

## Overview

This Helm chart deploys:
- **Loki**: Centralized log storage and query service (StatefulSet)
- **Promtail**: Distributed log collection agent (DaemonSet) with PII sanitization
- **LogQL Query Examples**: Pre-built queries for healthcare analytics
- **GDPR/HIPAA Compliance**: 30-day retention policy and PII redaction

## Features

### Log Aggregation
- Multi-tenant log storage with BoltDB + filesystem backend
- Automatic log indexing and compression
- 30-day retention period (configurable)
- Real-time log streaming to Grafana

### PII Sanitization (GDPR Compliance)
Automatic redaction of sensitive healthcare data:
- Email addresses → `[REDACTED-EMAIL]`
- Phone numbers → `[REDACTED-PHONE]`
- Social Security Numbers (SSN/HIN) → `[REDACTED-SSN]`
- Credit card numbers → `[REDACTED-CARD]`
- IBAN accounts → `[REDACTED-IBAN]`
- Passport numbers → `[REDACTED-PASSPORT]`
- Medical record numbers → `[REDACTED-MRN]`
- Patient IDs → `[REDACTED-PATIENT-ID]`
- Prescription numbers → `[REDACTED-RX]`
- Insurance numbers → `[REDACTED-INSURANCE]`

### Kubernetes Integration
- Automatic discovery of all pods via Kubernetes SD
- Per-pod label extraction (namespace, app, container, node)
- StatefulSet for persistent log storage
- DaemonSet for distributed collection (every node)

## Installation

### Prerequisites
- Kubernetes 1.24+
- Helm 3.0+
- 10GB persistent storage (configurable)

### Quick Start

```bash
# Add Bitnami repository (optional, for dependencies)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install Loki in logging namespace
helm install loki ./charts/loki \
  --namespace logging \
  --create-namespace

# Install Promtail (log collector)
helm install promtail ./charts/promtail \
  --namespace logging \
  --create-namespace
```

### Using Helmfile (Recommended)

```bash
# Deploy both Loki and Promtail together
helmfile -e dev sync

# Or for specific environment
helmfile -e prod sync
```

## Configuration

### Loki Values

Key configuration options:

```yaml
# Storage
loki:
  persistence:
    enabled: true
    size: 10Gi  # Increase for larger deployments
    storageClassName: standard

# Retention
config:
  limits_config:
    retention_period: 720h  # 30 days

# Resource limits
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 500m
      memory: 1Gi
```

### Promtail Values

Key configuration options:

```yaml
# Log forwarding
lokiClient:
  url: http://loki:3100/loki/api/v1/push
  batchSize: 1048576  # 1MB

# PII sanitization
piiSanitization:
  enabled: true
  # Customize patterns for your healthcare data

# Namespaces to monitor
scrapeConfigs:
  kubernetesSD:
    namespaces:
      - metapharm
      - kube-system
```

### Environment-Specific Values

```bash
# Development
helm install loki ./charts/loki -f charts/loki/values-dev.yaml

# Production
helm install loki ./charts/loki -f charts/loki/values-prod.yaml
```

## Monitoring & Querying

### Access Loki API

```bash
# Port-forward to Loki
kubectl port-forward -n logging svc/loki 3100:3100

# Query logs via HTTP
curl http://localhost:3100/loki/api/v1/query?query=%7Bnamespace%3D%22metapharm%22%7D
```

### Connect Grafana to Loki

1. Open Grafana: http://grafana.local
2. Add Data Source → Loki
3. URL: `http://loki:3100`
4. Click "Test"

### LogQL Query Examples

#### 1. View all errors in the last hour
```logql
{namespace="metapharm"} | json | level="error"
```

#### 2. Trace a specific request by correlation ID
```logql
{namespace="metapharm"} | json | correlation_id="abc-123-def"
```

#### 3. Service-specific logs
```logql
{namespace="metapharm", app="auth-service"} | json
```

#### 4. Performance analysis - slow requests
```logql
{namespace="metapharm"} | json | duration > 1000
```

#### 5. Error rate by service
```logql
count_over_time({namespace="metapharm"} | json | level="error" [5m]) by (app)
```

#### 6. Request throughput
```logql
sum(rate({namespace="metapharm"} | json [5m])) by (app)
```

#### 7. PII Verification (should be empty)
```logql
{namespace="metapharm"} | json | message =~ ".*\\d{3}-\\d{2}-\\d{4}.*"
```

#### 8. GDPR - Find user logs by ID
```logql
{namespace="metapharm"} | json | user_id="user-12345"
```

#### 9. Prescription processing
```logql
{namespace="metapharm", app="prescription-service"} | json | event="prescription_created"
```

#### 10. Delivery tracking
```logql
{namespace="metapharm", app="delivery-service"} | json | status=~"in_transit|delivered"
```

#### 11. Teleconsultation metrics
```logql
{namespace="metapharm", app="teleconsultation-service"} | json | event=~"call_started|call_ended"
```

#### 12. Alert on high error rate
```logql
sum(rate({namespace="metapharm"} | json | level="error" [1m])) by (app) > 0.05
```

## Architecture

### Components

```
┌─────────────────────────────────────────────┐
│         Kubernetes Cluster                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  All Pods (metapharm namespace)      │  │
│  │  - api-gateway                       │  │
│  │  - auth-service                      │  │
│  │  - prescription-service              │  │
│  │  - delivery-service                  │  │
│  │  - ... (19 microservices total)      │  │
│  └──────┬───────────────────────────────┘  │
│         │                                   │
│         │ container logs                    │
│         ▼                                   │
│  ┌──────────────────────────────────────┐  │
│  │  Promtail DaemonSet (every node)     │  │
│  │  - Discovers pods via K8s SD         │  │
│  │  - Extracts labels (app, ns, etc)    │  │
│  │  - Sanitizes PII                     │  │
│  │  - Batches & forwards logs           │  │
│  └──────┬───────────────────────────────┘  │
│         │ HTTP POST /loki/api/v1/push      │
│         ▼                                   │
│  ┌──────────────────────────────────────┐  │
│  │  Loki StatefulSet (1-N replicas)     │  │
│  │  - Receives log batches              │  │
│  │  - Indexes & compresses              │  │
│  │  - Stores in persistent volume       │  │
│  │  - Exposes LogQL query API           │  │
│  └──────┬───────────────────────────────┘  │
│         │ LogQL queries                    │
│         ▼                                   │
│  ┌──────────────────────────────────────┐  │
│  │  Grafana / Log Visualizations        │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### Data Flow

1. **Collection**: Promtail DaemonSet discovers all pods via Kubernetes SD
2. **Processing**: Multi-stage pipeline:
   - JSON parsing
   - PII redaction (regex patterns)
   - Label extraction (app, namespace, tier, etc)
3. **Storage**: Loki receives batched logs, stores in BoltDB index + filesystem
4. **Querying**: Grafana queries Loki via LogQL
5. **Retention**: Automatic deletion after 30 days

## Health Checks

### Verify Loki is running
```bash
kubectl get pods -n logging -l app=loki
kubectl logs -n logging -l app=loki --tail=50
```

### Verify Promtail is collecting logs
```bash
kubectl get daemonset -n logging promtail
kubectl logs -n logging -l app=promtail --tail=50
```

### Test Loki API
```bash
kubectl exec -n logging -it pod/loki-0 -- curl http://localhost:3100/ready
```

### Check PII sanitization
```bash
# Port-forward to Loki
kubectl port-forward -n logging svc/loki 3100:3100

# Query for potentially unsanitized SSN pattern
curl 'http://localhost:3100/loki/api/v1/query?query=%7Bnamespace%3D%22metapharm%22%7D'

# Check response - should contain only [REDACTED-SSN] not real data
```

## Troubleshooting

### Loki pod not starting
```bash
# Check events
kubectl describe pod -n logging loki-0

# Check logs
kubectl logs -n logging loki-0

# Common issue: storage class doesn't exist
kubectl get storageclass
# If needed, create one:
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
provisioner: kubernetes.io/host-path
EOF
```

### Promtail not collecting logs
```bash
# Check DaemonSet status
kubectl get daemonset -n logging promtail
kubectl describe daemonset -n logging promtail

# Check Promtail logs
kubectl logs -n logging -l app=promtail -f

# Check if pods are discovering services
kubectl exec -n logging -it pod/promtail-xxxxx -- \
  curl http://localhost:3101/metrics | grep promtail_read_bytes_total
```

### High memory usage
```bash
# Check Loki resource usage
kubectl top pods -n logging -l app=loki

# If high, adjust in values.yaml:
# loki.resources.limits.memory: 2Gi
# loki.config.limits_config.max_bytes_per_second: 5242880  # 5MB/s
```

### Query timeouts
```bash
# Increase server timeout
config:
  server:
    http_server_read_timeout: 900s
    http_server_write_timeout: 900s
```

## Performance Tuning

### For Large Deployments

```yaml
loki:
  replicaCount: 3  # HA setup
  persistence:
    size: 100Gi  # Large storage
  resources:
    requests:
      memory: 1Gi
    limits:
      memory: 2Gi

config:
  limits_config:
    max_bytes_per_second: 52428800  # 50MB/s
  querier:
    max_concurrent: 50
```

### For Development/Testing

```yaml
loki:
  replicaCount: 1
  persistence:
    size: 5Gi
  resources:
    requests:
      memory: 256Mi
    limits:
      memory: 512Mi
```

## Compliance

### GDPR Compliance
- 30-day retention (configurable)
- PII automatic redaction
- Audit logs with timestamps
- Right-to-be-forgotten: LogQL query to find user data

### HIPAA Compliance
- PHI redaction (medical records, patient IDs)
- Access controls via Kubernetes RBAC
- Encryption at rest (configure persistent volume)
- Encryption in transit (configure TLS)

## Backup & Recovery

### Backup Loki Data
```bash
# Backup persistent volume
kubectl cp -n logging loki-0:/loki/chunks ./loki-backup/
tar czf loki-backup-$(date +%Y%m%d).tar.gz loki-backup/

# Or use snapshot of persistent volume
```

### Recovery
```bash
# Restore from backup
tar xzf loki-backup-20240101.tar.gz
kubectl cp ./loki-backup/chunks -n logging loki-0:/loki/
```

## Upgrading

```bash
# Get current version
helm list -n logging

# Upgrade to latest
helm upgrade loki ./charts/loki -n logging -f values.yaml

# Check rollout status
kubectl rollout status sts/loki -n logging

# Rollback if needed
helm rollback loki 1 -n logging
```

## Uninstall

```bash
# Remove Promtail and Loki
helm uninstall promtail -n logging
helm uninstall loki -n logging

# Optional: Remove persistent volume
kubectl delete pvc -n logging -l app=loki
```

## Additional Resources

- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/query/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/clients/promtail/configuration/)
- [MetaPharm Connect Docs](https://docs.metapharm.ch)

## Support

For issues or questions:
- Check logs: `kubectl logs -n logging -l app=loki`
- Review config: `kubectl get cm -n logging promtail-config -o yaml`
- Contact: devops@metapharm.ch
