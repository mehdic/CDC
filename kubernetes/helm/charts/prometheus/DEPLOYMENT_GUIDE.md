# Prometheus Helm Chart Deployment Guide

## Overview

This document provides step-by-step instructions for deploying the Prometheus monitoring stack for MetaPharm Connect across different environments.

## Prerequisites

Before deploying, ensure you have:

1. **Kubernetes Cluster**: 1.24+ with persistent volume provisioning
2. **Helm**: 3.0+ installed and configured
3. **kubectl**: Configured to access your cluster
4. **Optional**: Slack and PagerDuty accounts for notifications

## Environment Setup

### 1. Create Monitoring Namespace

```bash
kubectl create namespace monitoring
```

### 2. Configure Secrets (Production Only)

For production deployments, create secrets for notification channels:

```bash
# Get your Slack webhook URL from: https://api.slack.com/messaging/webhooks
# Get your PagerDuty service key from your PagerDuty dashboard

kubectl create secret generic alertmanager-secrets \
  --from-literal=slack-webhook-url='https://hooks.slack.com/services/YOUR/WEBHOOK/URL' \
  --from-literal=pagerduty-service-key='YOUR_PAGERDUTY_KEY' \
  -n monitoring
```

## Deployment by Environment

### Development Deployment

```bash
# Navigate to chart directory
cd kubernetes/helm/charts/prometheus

# Install Prometheus with development values
helm install prometheus . \
  --namespace monitoring \
  --values values-dev.yaml

# Verify deployment
kubectl get pods -n monitoring
kubectl get svc -n monitoring

# Access Prometheus (port-forward)
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open http://localhost:9090
```

### Staging Deployment

```bash
cd kubernetes/helm/charts/prometheus

# Install with staging values
helm install prometheus . \
  --namespace monitoring \
  --values values-staging.yaml

# Verify
kubectl rollout status deployment/prometheus -n monitoring
kubectl rollout status deployment/alertmanager -n monitoring
```

### Production Deployment

```bash
cd kubernetes/helm/charts/prometheus

# Create basic auth secret for Ingress (optional)
htpasswd -c auth prometheus
kubectl create secret generic prometheus-basic-auth --from-file=auth -n monitoring

# Install with production values
helm install prometheus . \
  --namespace monitoring \
  --values values-prod.yaml \
  --set ingress.enabled=true \
  --set alertmanagerIngress.enabled=true

# Verify
kubectl rollout status deployment/prometheus -n monitoring
kubectl rollout status deployment/alertmanager -n monitoring
kubectl get ingress -n monitoring
```

## Post-Deployment Verification

### 1. Verify Pod Status

```bash
kubectl get pods -n monitoring -w
```

Expected output:
- prometheus-0, prometheus-1: Running
- alertmanager-0, alertmanager-1: Running

### 2. Check Service Discovery

```bash
# Port-forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# In browser, visit: http://localhost:9090/service-discovery
# Verify all services are discovered and showing "UP" status
```

### 3. Verify Metrics Collection

```bash
# Query Prometheus API
curl http://localhost:9090/api/v1/query?query=up

# Or use Prometheus UI:
# http://localhost:9090
# Query: count(up{job="metapharm"}) to count monitored services
```

### 4. Test Alert Rules

```bash
# Port-forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Visit: http://localhost:9090/alerts
# Should see all alert rules listed with status
```

### 5. Verify AlertManager

```bash
# Port-forward to AlertManager
kubectl port-forward -n monitoring svc/alertmanager 9093:9093

# Visit: http://localhost:9093
# Should show no active alerts (or expected ones)
```

### 6. Test Notifications (Production)

```bash
# Test Slack webhook
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test alert from MetaPharm monitoring"}'

# Test PagerDuty (requires proper API setup)
# Use AlertManager UI to trigger a test
```

## Configuration Updates

### Update Alert Rules

To modify alert rules after deployment:

1. Edit `templates/prometheus-rules-configmap.yaml`
2. Run: `helm upgrade prometheus .`
3. Prometheus reloads automatically within 1-2 minutes

Alternatively, trigger immediate reload:

```bash
kubectl exec -it prometheus-0 -n monitoring -- \
  curl -X POST http://localhost:9090/-/reload
```

### Update Slack Webhook

```bash
kubectl patch secret alertmanager-secrets \
  -n monitoring \
  -p '{"data":{"slack-webhook-url":"'$(echo -n "NEW_URL" | base64)'"}}'

# Restart AlertManager to apply
kubectl rollout restart deployment/alertmanager -n monitoring
```

### Update Scrape Intervals

Edit `values.yaml` and update:

```yaml
serviceMonitors:
  highTier:
    scrapeInterval: 15s  # Change here
```

Then upgrade:

```bash
helm upgrade prometheus . \
  --namespace monitoring \
  --values values.yaml
```

## Storage Management

### Check Current Usage

```bash
# Connect to Prometheus pod
kubectl exec -it prometheus-0 -n monitoring -- bash

# Inside pod, check storage
df -h /prometheus
du -sh /prometheus/*
```

### Increase Storage

```bash
# Edit the PVC
kubectl patch pvc prometheus-pvc -n monitoring -p \
  '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'

# Wait for storage expansion
kubectl describe pvc prometheus-pvc -n monitoring
```

### Adjust Retention

Edit values and set:

```yaml
prometheus:
  persistence:
    retention: 60d  # Change from default
    retentionSize: "90GB"
```

Then upgrade:

```bash
helm upgrade prometheus . \
  --namespace monitoring \
  --values values.yaml
```

## Upgrade Procedures

### Helm Chart Upgrade

```bash
# Pull latest chart changes
git pull origin main

# Test upgrade (dry-run)
helm upgrade prometheus kubernetes/helm/charts/prometheus \
  --namespace monitoring \
  --values values-prod.yaml \
  --dry-run --debug

# Apply upgrade
helm upgrade prometheus kubernetes/helm/charts/prometheus \
  --namespace monitoring \
  --values values-prod.yaml
```

### Prometheus Version Upgrade

Update in `values.yaml`:

```yaml
prometheus:
  image:
    tag: "2.51.0"  # Change version

alertmanager:
  image:
    tag: "0.27.0"  # Change version
```

Then upgrade:

```bash
helm upgrade prometheus . \
  --namespace monitoring \
  --values values.yaml
```

## Monitoring the Monitors

### Key Metrics to Watch

Monitor these metrics to ensure the monitoring stack itself is healthy:

```
# Prometheus health
prometheus_tsdb_symbol_table_size_bytes
prometheus_tsdb_wal_fsync_duration_seconds
prometheus_sd_kubernetes_workqueue_depth

# AlertManager health
alertmanager_alerts
alertmanager_config_hash

# Ingestion rate
rate(prometheus_tsdb_samples_total[5m])

# Scrape success
count(up{job="prometheus"} == 1)
```

### Set Up Meta-Monitoring

Add self-monitoring rules to catch issues:

```yaml
- alert: PrometheusHighMemory
  expr: prometheus_tsdb_memory_chunks > 1000000
  for: 5m

- alert: AlertManagerDown
  expr: up{job="alertmanager"} == 0
  for: 2m
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod prometheus-0 -n monitoring

# Check logs
kubectl logs prometheus-0 -n monitoring
```

Common issues:
- PVC not bound: Check StorageClass
- OOMKilled: Increase memory limits
- ImagePullBackOff: Check registry credentials

### Services Not Being Scraped

```bash
# Check service discovery
curl http://localhost:9090/api/v1/targets

# Verify service labels
kubectl get svc -n metapharm -o jsonpath='{.items[*].metadata.labels}'

# Check endpoint
kubectl get endpoints -n metapharm SERVICE_NAME
```

### Alerts Not Firing

```bash
# Check alert rule status
curl http://localhost:9090/api/v1/rules

# Verify metrics exist
curl http://localhost:9090/api/v1/query?query=METRIC_NAME

# Check AlertManager configuration
kubectl get configmap alertmanager-config -n monitoring -o yaml
```

### High Cardinality Issues

```bash
# Check metric cardinality
curl http://localhost:9090/api/v1/query?query='count(count by (__name__) ({__name__!=""}))'

# Identify problematic metrics
curl http://localhost:9090/api/v1/query?query='topk(20, count by (__name__) ({__name__!=""}))'
```

## Backup and Disaster Recovery

### Backup Prometheus Data

```bash
# Backup to local file
kubectl exec prometheus-0 -n monitoring -- \
  tar czf - /prometheus | gzip > prometheus-backup-$(date +%Y%m%d).tar.gz

# Backup configuration
kubectl get configmap prometheus-config -n monitoring -o yaml > prometheus-config-backup.yaml
kubectl get configmap prometheus-rules -n monitoring -o yaml > prometheus-rules-backup.yaml
```

### Restore from Backup

```bash
# Copy backup into pod
kubectl cp prometheus-backup.tar.gz prometheus-0:/prometheus -n monitoring

# Extract inside pod
kubectl exec -it prometheus-0 -n monitoring -- tar xzf /prometheus/backup.tar.gz

# Restart pod
kubectl delete pod prometheus-0 -n monitoring
```

## Cleanup and Uninstall

### Uninstall Prometheus

```bash
helm uninstall prometheus -n monitoring
```

### Clean Up Persistent Volumes

```bash
# List PVCs
kubectl get pvc -n monitoring

# Delete PVCs (WARNING: Deletes data)
kubectl delete pvc --all -n monitoring
```

### Remove Namespace (Full Cleanup)

```bash
# This removes everything
kubectl delete namespace monitoring
```

## Next Steps

1. **Set up Grafana** for visualization (separate chart)
2. **Configure external alerting** for integration with incident management
3. **Implement custom dashboards** for business metrics
4. **Set up long-term storage** for metrics (optional)
5. **Configure Prometheus federation** for high-availability setups

## Support

For issues or questions:
1. Check logs: `kubectl logs -n monitoring deployment/prometheus`
2. Check events: `kubectl get events -n monitoring --sort-by='.lastTimestamp'`
3. Review AlertManager logs: `kubectl logs -n monitoring deployment/alertmanager`
4. Contact DevOps team: devops@metapharm.ch
