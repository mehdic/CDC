# Loki Log Aggregation Deployment Guide

Complete guide for deploying Loki and Promtail log aggregation system for MetaPharm Connect.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Verification](#verification)
5. [Configuration](#configuration)
6. [Querying Logs](#querying-logs)
7. [Troubleshooting](#troubleshooting)
8. [Compliance & Security](#compliance--security)

## Quick Start

Deploy in 3 commands:

```bash
# 1. Development environment
helmfile -e dev sync

# 2. Or production environment
helmfile -e prod sync

# 3. Verify deployment
kubectl get all -n logging
```

## Prerequisites

### System Requirements
- Kubernetes 1.24+
- Helm 3.0+
- Helmfile 0.140+
- kubectl configured

### Storage Requirements
- Development: 5GB persistent volume
- Production: 100GB persistent volume
- Storage class: `standard` (dev) or `fast-ssd` (prod)

### Create Storage Class (if needed)

```bash
# For development with hostPath (single-node clusters)
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
provisioner: kubernetes.io/host-path
volumeBindingMode: Immediate
EOF

# For production with proper storage
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.amazon.com  # Adjust for your cloud provider
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
EOF
```

## Installation

### Option 1: Using Helmfile (Recommended)

```bash
# Clone configuration and navigate
cd /Users/mchaouachi/IdeaProjects/CDC/kubernetes/helm

# Deploy to development
helmfile -e dev sync

# Or deploy to production
helmfile -e prod sync

# Check deployment status
helmfile status
```

### Option 2: Manual Helm Installation

```bash
# Create logging namespace
kubectl create namespace logging

# Install Loki
helm install loki ./charts/loki \
  -n logging \
  -f ./charts/loki/values.yaml \
  -f ./charts/loki/values-dev.yaml

# Wait for Loki to be ready
kubectl wait --for=condition=ready pod -l app=loki -n logging --timeout=300s

# Install Promtail (depends on Loki)
helm install promtail ./charts/promtail \
  -n logging \
  -f ./charts/promtail/values.yaml \
  -f ./charts/promtail/values-dev.yaml

# Wait for Promtail to be ready
kubectl rollout status daemonset/promtail -n logging --timeout=300s
```

### Option 3: Upgrade Existing Installation

```bash
# Check current version
helm list -n logging

# Upgrade both charts
helm upgrade loki ./charts/loki -n logging -f values-dev.yaml
helm upgrade promtail ./charts/promtail -n logging -f values-dev.yaml

# Check rollout status
kubectl rollout status sts/loki -n logging
kubectl rollout status daemonset/promtail -n logging
```

## Verification

### 1. Check Pod Status

```bash
# List all logging pods
kubectl get pods -n logging -o wide

# Expected output:
# NAME                                READY   STATUS    RESTARTS   AGE
# loki-0                              1/1     Running   0          2m
# promtail-xxxxx                      1/1     Running   0          1m
# promtail-yyyyy                      1/1     Running   0          1m
# (one promtail pod per node)
```

### 2. Check Loki Health

```bash
# Check Loki readiness
kubectl exec -n logging loki-0 -- curl -s http://localhost:3100/ready
# Expected: 200 OK

# Check Loki metrics
kubectl exec -n logging loki-0 -- curl -s http://localhost:3100/metrics | head -20
```

### 3. Check Promtail Collection

```bash
# View Promtail logs
kubectl logs -n logging -l app=promtail -f --tail=50

# Check if Promtail is pushing logs
kubectl logs -n logging -l app=promtail | grep "pushing batch"

# Check Promtail metrics (in pod)
kubectl exec -n logging pod/promtail-xxxxx -- \
  curl -s http://localhost:3101/metrics | grep promtail_read_bytes_total
```

### 4. Query Logs via Loki API

```bash
# Port-forward to Loki
kubectl port-forward -n logging svc/loki 3100:3100 &

# Query logs - all pods
curl -G -s -H "Accept: application/json" \
  "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode '{namespace="metapharm"}' | jq .

# Query logs - specific app
curl -G -s -H "Accept: application/json" \
  "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode '{namespace="metapharm", app="auth-service"}' | jq .

# Query logs - errors only
curl -G -s -H "Accept: application/json" \
  "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode '{namespace="metapharm"} | json | level="error"' | jq .
```

### 5. Verify PII Sanitization

```bash
# Get all logs and check for redactions
kubectl port-forward -n logging svc/loki 3100:3100 &

# Query logs - look for redacted patterns
curl -G -s -H "Accept: application/json" \
  "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode '{namespace="metapharm"} | json' | jq . | grep -E "REDACTED|email|phone|SSN"

# Check if any real SSN patterns exist (should be empty)
curl -G -s -H "Accept: application/json" \
  "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode '{namespace="metapharm"} | json | message =~ ".*\\d{3}-\\d{2}-\\d{4}.*"' | jq .
```

## Configuration

### Loki Configuration

Key settings in `values.yaml`:

```yaml
# Storage
loki:
  persistence:
    size: 10Gi  # Adjust for your needs
    storageClassName: standard

# Retention (30 days for GDPR/HIPAA)
config:
  limits_config:
    retention_period: 720h
  table_manager:
    retention_deletes_enabled: true

# Resource limits
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
```

### Promtail Configuration

Key settings in `values.yaml`:

```yaml
# Log forwarding
lokiClient:
  url: http://loki:3100/loki/api/v1/push
  batchSize: 1048576  # 1MB

# PII Sanitization
piiSanitization:
  enabled: true
  emailPattern: '...'
  phonePattern: '...'
  # ... all patterns defined

# Namespaces to monitor
scrapeConfigs:
  kubernetesSD:
    namespaces:
      - metapharm
      - kube-system
```

### Environment-Specific Values

```bash
# Development (7-day retention, smaller resources)
helmfile -e dev sync

# Production (30-day retention, high availability)
helmfile -e prod sync
```

## Querying Logs

### Integration with Grafana

1. **Access Grafana**:
   ```bash
   kubectl port-forward -n monitoring svc/grafana 3000:3000 &
   # Open http://localhost:3000
   ```

2. **Add Loki Data Source**:
   - Configuration → Data Sources → Add new data source
   - Select "Loki"
   - URL: `http://loki:3100`
   - Click "Test" → "Save"

3. **Query Logs in Grafana**:
   - Explore → Select Loki data source
   - Use LogQL queries (see examples below)

### LogQL Query Examples

#### 1. All logs from metapharm namespace
```logql
{namespace="metapharm"}
```

#### 2. Errors only
```logql
{namespace="metapharm"} | json | level="error"
```

#### 3. Specific service
```logql
{namespace="metapharm", app="auth-service"}
```

#### 4. Request tracing
```logql
{namespace="metapharm"} | json | correlation_id="request-id-123"
```

#### 5. Performance analysis
```logql
{namespace="metapharm"} | json | duration > 1000
```

#### 6. Error rate
```logql
count_over_time({namespace="metapharm"} | json | level="error" [5m]) by (app)
```

#### 7. Service throughput
```logql
sum(rate({namespace="metapharm"} | json [5m])) by (app)
```

#### 8. PII verification
```logql
{namespace="metapharm"} | json | message =~ ".*\\d{3}-\\d{2}-\\d{4}.*"
```

#### 9. Patient data access
```logql
{namespace="metapharm"} | json | action="access_patient_record"
```

#### 10. Prescription processing
```logql
{namespace="metapharm", app="prescription-service"} | json | event="prescription_created"
```

## Monitoring

### Key Metrics to Monitor

```bash
# Loki metrics
kubectl port-forward -n logging svc/loki 3100:3100 &
curl http://localhost:3100/metrics | grep -E "loki_ingester|loki_distributor"

# Promtail metrics
kubectl port-forward -n logging svc/promtail 3101:3101 &
curl http://localhost:3101/metrics | grep -E "promtail_read|promtail_lines"
```

### Set Up Prometheus Scraping (Optional)

```yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: loki
  namespace: logging
spec:
  selector:
    matchLabels:
      app: loki
  endpoints:
  - port: http
    interval: 30s
---
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: promtail
  namespace: logging
spec:
  selector:
    matchLabels:
      app: promtail
  endpoints:
  - port: http-metrics
    interval: 30s
```

## Troubleshooting

### Loki Pod Not Starting

```bash
# Check events
kubectl describe pod -n logging loki-0

# Check logs
kubectl logs -n logging loki-0 -f

# Common issues:
# 1. Storage class not found
kubectl get storageclass

# 2. Insufficient resources
kubectl top node

# 3. PVC not bound
kubectl get pvc -n logging
```

### Promtail Not Collecting Logs

```bash
# Check DaemonSet status
kubectl describe daemonset -n logging promtail

# Check Promtail logs
kubectl logs -n logging -l app=promtail -f

# Test Promtail connectivity to Loki
kubectl exec -n logging pod/promtail-xxxxx -- \
  curl -v http://loki:3100/ready
```

### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n logging

# Reduce rate limiting in values.yaml
config:
  limits_config:
    max_bytes_per_second: 5242880  # 5MB/s (reduce from 10MB/s)

# Reduce batch size in promtail
promtail:
  resources:
    limits:
      memory: 256Mi
```

### Logs Not Appearing

```bash
# Check if applications are logging
kubectl logs -n metapharm pod/api-gateway-xxxxx

# Verify Promtail is processing logs
kubectl exec -n logging pod/promtail-xxxxx -- \
  tail -f /tmp/positions/positions.yaml

# Test manual log query
kubectl port-forward -n logging svc/loki 3100:3100 &
curl 'http://localhost:3100/loki/api/v1/query?query=%7Bnamespace%3D%22metapharm%22%7D'
```

### PII Not Sanitized

```bash
# Check Promtail configuration
kubectl get configmap -n logging promtail-config -o yaml

# Test regex patterns
kubectl exec -n logging pod/promtail-xxxxx -- \
  grep -E "emailPattern|phonePattern" /etc/promtail/config.yaml

# Query for unsanitized data
curl 'http://localhost:3100/loki/api/v1/query?query=%7Bnamespace%3D%22metapharm%22%7D%20%7C%20json%20%7C%20message%20%3D~%20%22.*%5Cd%7B3%7D-%5Cd%7B2%7D-%5Cd%7B4%7D.*%22'
```

## Compliance & Security

### GDPR Compliance

1. **Data Retention**: 30-day automatic deletion
   ```yaml
   limits_config:
     retention_period: 720h  # 30 days
   ```

2. **PII Sanitization**: Automatic redaction of sensitive data
   - Configured in Promtail pipeline
   - Patterns defined in `piiSanitization` section

3. **Data Subject Rights**:
   ```logql
   # Find all logs for a user (GDPR Right to Access)
   {namespace="metapharm"} | json | user_id="user-12345"

   # Delete logs for a user (Right to Be Forgotten)
   # Manual deletion via LogQL query results
   ```

### HIPAA Compliance

1. **PHI Protection**:
   - Medical record numbers redacted
   - Patient IDs redacted
   - Prescription numbers redacted

2. **Access Controls**:
   - RBAC configured in ServiceAccount
   - Kubernetes network policies (optional)

3. **Audit Logging**:
   - All access logged with timestamps
   - Correlation IDs for request tracing

### Security Best Practices

1. **Network Security**
   ```bash
   # Restrict access to Loki API
   kubectl apply -f - <<EOF
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: loki-network-policy
     namespace: logging
   spec:
     podSelector:
       matchLabels:
         app: loki
     policyTypes:
     - Ingress
     ingress:
     - from:
       - namespaceSelector:
           matchLabels:
             name: metapharm
       - namespaceSelector:
           matchLabels:
             name: monitoring
   EOF
   ```

2. **TLS Encryption**
   ```yaml
   # Enable TLS in production
   loki:
     service:
       tls:
         enabled: true
         certPath: /etc/loki/certs/tls.crt
         keyPath: /etc/loki/certs/tls.key
   ```

3. **Resource Quotas**
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: v1
   kind: ResourceQuota
   metadata:
     name: logging-quota
     namespace: logging
   spec:
     hard:
       requests.cpu: "2"
       requests.memory: "4Gi"
       limits.cpu: "4"
       limits.memory: "8Gi"
   EOF
   ```

## Backup & Disaster Recovery

### Backup Loki Data

```bash
# Create backup directory
mkdir -p /backups/loki-$(date +%Y%m%d)

# Copy PVC data
kubectl cp -n logging loki-0:/loki/chunks /backups/loki-$(date +%Y%m%d)/

# Or use snapshot if using cloud storage
# (EBS, GCP Persistent Disk, etc.)
```

### Recovery Procedure

```bash
# Delete old StatefulSet (keeps PVC)
kubectl delete sts loki -n logging

# Restore backup to PVC
kubectl cp /backups/loki-20240101/chunks -n logging loki-0:/loki/

# Redeploy
helm upgrade loki ./charts/loki -n logging
```

## Performance Tuning

### For High Log Volume

```yaml
# Increase resource limits
loki:
  resources:
    limits:
      memory: 4Gi
      cpu: 2000m

# Increase ingestion rate
config:
  limits_config:
    max_bytes_per_second: 104857600  # 100MB/s

# Use multiple replicas
loki:
  replicaCount: 3

# Increase batch size in Promtail
promtail:
  lokiClient:
    batchSize: 4194304  # 4MB
```

### For Resource-Constrained Environments

```yaml
# Minimal resources
loki:
  persistence:
    size: 2Gi
  resources:
    limits:
      memory: 256Mi
      cpu: 100m

# Short retention
config:
  limits_config:
    retention_period: 72h  # 3 days

# Disable unused features
config:
  auth_enabled: false
  query_range:
    cache_results: false
```

## Support & Documentation

- [Loki Official Docs](https://grafana.com/docs/loki/latest/)
- [LogQL Query Guide](https://grafana.com/docs/loki/latest/query/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/clients/promtail/)
- [MetaPharm Docs](https://docs.metapharm.ch)

For issues, contact: devops@metapharm.ch
