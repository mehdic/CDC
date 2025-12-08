# Prometheus Monitoring for MetaPharm Connect

Complete Prometheus monitoring stack for MetaPharm Connect healthcare platform including Prometheus, AlertManager, alert rules, and service monitors.

## Overview

This Helm chart deploys a production-ready Prometheus monitoring solution with:

- **Prometheus Server**: Multi-replica setup with persistent storage
- **AlertManager**: Alert routing and notification management
- **Alert Rules**: Comprehensive SLO, resource, and infrastructure monitoring
- **ServiceMonitors**: Automatic scrape configuration for all backend services
- **Slack & PagerDuty Integration**: Multi-channel alert notifications

## Features

### Monitoring Coverage

- **19 Backend Microservices**: API Gateway, Auth, Prescription, Delivery, Inventory, Medical Records, Messaging, Notification, Order, Payment, Teleconsultation, Adherence, Analytics, Appointment, Calendar, Controlled Substance, Digital Twin, Doctor, Drug Interaction, E-commerce, E-santé, Insurance, Marketing, Nurse, Pharmacy, Recycling, Refill, User, VIP, Voice

- **3-Tier Service Monitoring**:
  - **High-Tier (Critical)**: 15s scrape interval for mission-critical services
  - **Medium-Tier**: 30s scrape interval for standard services
  - **Low-Tier**: 60s scrape interval for non-critical services

- **Infrastructure Monitoring**:
  - Kubernetes nodes and cluster health
  - Pod metrics and restart tracking
  - Database connectivity and performance
  - Cache (Redis) health and memory usage

### Alert Rules

**SLO Alerts**:
- High latency (P95 > 500ms)
- High error rate (>1% 5xx errors)
- Pod restarting too frequently

**Resource Alerts**:
- High CPU usage (>80%)
- High memory usage (>85%)
- High disk usage (>85%)

**Infrastructure Alerts**:
- Node down detection
- Database connection pool exhaustion
- Redis memory pressure

### Notification Channels

- **Slack**: Severity-based channels (#alerts-critical, #alerts-warnings, #alerts-info)
- **PagerDuty**: Integration for critical alerts
- **Configurable**: Easy to add more notification channels

## Quick Start

### Prerequisites

- Kubernetes 1.24+
- Helm 3.0+
- Persistent Volume provisioner (if using persistence)
- Internet access to pull container images

### Installation

#### Development Environment

```bash
helm install prometheus ./kubernetes/helm/charts/prometheus \
  -n monitoring \
  -f ./kubernetes/helm/charts/prometheus/values-dev.yaml
```

#### Staging Environment

```bash
helm install prometheus ./kubernetes/helm/charts/prometheus \
  -n monitoring \
  -f ./kubernetes/helm/charts/prometheus/values-staging.yaml
```

#### Production Environment

```bash
# First, set up alert credentials as secrets
kubectl create secret generic alertmanager-secrets \
  --from-literal=slack-webhook-url='https://hooks.slack.com/services/YOUR/WEBHOOK/URL' \
  --from-literal=pagerduty-service-key='YOUR_PAGERDUTY_KEY' \
  -n monitoring

# Then deploy
helm install prometheus ./kubernetes/helm/charts/prometheus \
  -n monitoring \
  -f ./kubernetes/helm/charts/prometheus/values-prod.yaml
```

### Verify Deployment

```bash
# Check pod status
kubectl get pods -n monitoring

# Check services
kubectl get svc -n monitoring

# View Prometheus dashboard
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Access: http://localhost:9090

# View AlertManager dashboard
kubectl port-forward -n monitoring svc/alertmanager 9093:9093
# Access: http://localhost:9093
```

## Configuration

### Custom Values

Override default values using a custom values file:

```bash
helm install prometheus ./kubernetes/helm/charts/prometheus \
  -f custom-values.yaml
```

### Key Configuration Options

#### Prometheus

```yaml
prometheus:
  enabled: true
  replicaCount: 2
  persistence:
    enabled: true
    size: 50Gi
    retention: 30d
    retentionSize: "45GB"
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 1000m
      memory: 2Gi
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 4
```

#### AlertManager

```yaml
alertmanager:
  enabled: true
  replicaCount: 2
  persistence:
    enabled: true
    size: 10Gi
```

#### Alert Rules

Enable/disable specific alerts:

```yaml
alertRules:
  sloAlerts:
    highLatency:
      enabled: true
      threshold: 500  # milliseconds
      duration: 5m
      severity: warning
    errorRate:
      enabled: true
      threshold: 0.01  # 1%
      duration: 5m
      severity: critical
```

### Environment-Specific Values

The chart includes pre-configured values for different environments:

- **values-dev.yaml**: Development (1 replica, 7-day retention)
- **values-staging.yaml**: Staging (2 replicas, 14-day retention)
- **values-prod.yaml**: Production (3 replicas, 90-day retention)

## Monitoring Services

### Service Discovery

Prometheus automatically discovers services in the `metapharm` namespace with the correct annotations:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
  labels:
    app: my-service
spec:
  ports:
  - name: metrics
    port: 9090
    targetPort: metrics
```

Service pods must expose metrics on `/metrics` endpoint.

### Adding New Services

Update `values.yaml` to include new services in the appropriate tier:

```yaml
serviceMonitors:
  highTier:
    services:
      - apiGateway
      - authService
      - myNewService  # Add here
```

## Alert Configuration

### Slack Integration

1. Create Slack webhook URL:
   - Go to your Slack workspace → Apps & Integrations
   - Create Incoming Webhook
   - Copy webhook URL

2. Update secret:
   ```bash
   kubectl patch secret alertmanager-secrets \
     -n monitoring \
     -p '{"data":{"slack-webhook-url":"'$(echo -n "YOUR_URL" | base64)'"}}'
   ```

3. Verify in AlertManager UI

### PagerDuty Integration

1. Get your PagerDuty service key:
   - Go to PagerDuty → Services → Select service
   - Copy Integration Key

2. Update secret:
   ```bash
   kubectl patch secret alertmanager-secrets \
     -n monitoring \
     -p '{"data":{"pagerduty-service-key":"'$(echo -n "YOUR_KEY" | base64)'"}}'
   ```

3. Restart AlertManager:
   ```bash
   kubectl rollout restart deployment/alertmanager -n monitoring
   ```

## Maintenance

### Scaling

To manually scale Prometheus or AlertManager:

```bash
kubectl scale deployment prometheus -n monitoring --replicas=3
kubectl scale deployment alertmanager -n monitoring --replicas=3
```

### Storage Management

Check storage usage:

```bash
kubectl exec -it prometheus-0 -n monitoring -- \
  df -h /prometheus
```

To increase storage:

```bash
kubectl patch pvc prometheus-pvc -n monitoring -p \
  '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'
```

### Prometheus Reloading

Configuration changes in ConfigMaps are not automatically picked up. Reload configuration:

```bash
kubectl exec -it prometheus-0 -n monitoring -- \
  curl -X POST http://localhost:9090/-/reload
```

Or delete pod to trigger automatic reload:

```bash
kubectl delete pod prometheus-0 -n monitoring
```

### Backup and Restore

Backup Prometheus data:

```bash
kubectl exec prometheus-0 -n monitoring -- \
  tar czf - /prometheus | > prometheus-backup.tar.gz
```

## Troubleshooting

### Prometheus Not Scraping Services

Check service discovery configuration:

```bash
# Access Prometheus UI
kubectl port-forward svc/prometheus 9090:9090 -n monitoring

# Navigate to Status → Service Discovery
# Check for correct labels and target status
```

### Alerts Not Firing

1. Check alert rules status in Prometheus UI
2. Verify metrics are being scraped:
   ```
   # In Prometheus UI, query:
   up{job="service-name"}
   ```
3. Check AlertManager configuration:
   ```bash
   kubectl logs -n monitoring deployment/alertmanager
   ```

### Storage Issues

Check persistent volume status:

```bash
kubectl get pvc -n monitoring
kubectl describe pvc prometheus-pvc -n monitoring
```

## Performance Tuning

### High Volume Environments

For environments with many services/metrics:

```yaml
prometheus:
  resources:
    requests:
      cpu: 2000m
      memory: 4Gi
    limits:
      cpu: 4000m
      memory: 8Gi
  persistence:
    size: 500Gi
    retentionSize: "450GB"
```

### High Cardinality Metrics

Implement metric relabeling to drop high-cardinality labels:

```yaml
# In prometheus-configmap.yaml scrape_configs
relabel_configs:
  - source_labels: [__name__]
    regex: 'expensive_metric_.*'
    action: drop
```

## Testing

Run unit tests for the chart:

```bash
pytest kubernetes/helm/charts/prometheus/tests/

# Or specific test suite
pytest kubernetes/helm/charts/prometheus/tests/test_prometheus_chart.py -v
pytest kubernetes/helm/charts/prometheus/tests/test_alert_rules.py -v
```

Lint the chart:

```bash
helm lint kubernetes/helm/charts/prometheus/
```

Validate templates:

```bash
helm template prometheus kubernetes/helm/charts/prometheus/ > prometheus.yaml
kubectl apply -f prometheus.yaml --dry-run=client
```

## Security Considerations

1. **Network Policies**: Prometheus UI should be restricted to internal networks
2. **Ingress Authentication**: Production Ingress requires basic auth
3. **Secret Management**: Use sealed-secrets or external-secrets for credentials
4. **RBAC**: ServiceAccount has minimal required permissions
5. **Pod Security**: Non-root containers with read-only root filesystem

## Upgrading

```bash
# Check available versions
helm repo update
helm search repo prometheus

# Upgrade
helm upgrade prometheus ./kubernetes/helm/charts/prometheus \
  -n monitoring \
  -f ./kubernetes/helm/charts/prometheus/values-prod.yaml
```

## Uninstall

```bash
helm uninstall prometheus -n monitoring
```

Note: PVCs are not automatically deleted. To remove all data:

```bash
kubectl delete pvc -n monitoring --all
```

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [PromQL Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [MetaPharm Architecture](../../README.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs: `kubectl logs -n monitoring deployment/prometheus`
3. Contact the DevOps team at devops@metapharm.ch
