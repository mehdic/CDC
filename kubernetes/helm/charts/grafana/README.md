# Grafana Helm Chart

## Overview

This Helm chart deploys Grafana with comprehensive dashboards for MetaPharm Connect platform monitoring. The chart includes five pre-configured dashboards that visualize metrics collected by Prometheus (T7-002).

## Chart Details

- **Chart Version**: 1.0.0
- **Grafana Version**: 10.2.0
- **App Type**: Dashboard & Visualization
- **Namespace**: monitoring
- **Replicas**: 2 (configurable)

## Features

### Pre-Configured Dashboards

1. **Platform Overview Dashboard**
   - System health score gauge
   - Active services count
   - Alert status timeline
   - Real-time platform health monitoring

2. **Service Health Dashboard**
   - Per-service latency metrics (P50, P95, P99)
   - Error rate tracking by service
   - Service throughput monitoring
   - Visual identification of performance degradation

3. **Business Metrics Dashboard**
   - Prescriptions processed (24h count)
   - Teleconsultations completed
   - Active user statistics
   - Hourly trend analysis

4. **Delivery Operations Dashboard**
   - Active delivery tracking
   - Average delivery time monitoring
   - Available drivers count
   - Delivery completion rates

5. **On-Call Dashboard**
   - Critical alert counter
   - Warning alert counter
   - Runbook link references
   - Alert history timeline (24h)

### Configuration Features

- **High Availability**: Multi-replica deployment with pod affinity rules
- **Data Persistence**: Configurable persistent storage for dashboards
- **Security**: RBAC, network policies, pod security policies
- **Scalability**: Horizontal pod autoscaling based on CPU/memory
- **Monitoring**: Service monitor for Prometheus integration
- **Ingress**: NGINX ingress with TLS support
- **Pod Disruption**: Budget configuration for safe rolling updates

## Installation

### Prerequisites

1. Kubernetes cluster (1.24+)
2. Prometheus deployed (use T7-002 chart)
3. kubectl configured and authenticated
4. Helm 3.x installed

### Basic Installation

```bash
# Add Grafana Helm repository (optional, if using external charts)
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install the chart
helm install grafana ./kubernetes/helm/charts/grafana \
  --namespace monitoring \
  --create-namespace

# Verify installation
kubectl get pods -n monitoring -l app=grafana
kubectl get svc -n monitoring -l app=grafana
```

### Installation with Custom Values

```bash
# Install with custom Prometheus URL
helm install grafana ./kubernetes/helm/charts/grafana \
  --namespace monitoring \
  --create-namespace \
  --set datasources.prometheus.url="http://prometheus-custom:9090"

# Install with custom admin password
helm install grafana ./kubernetes/helm/charts/grafana \
  --namespace monitoring \
  --create-namespace \
  --set grafana.admin.password="your-secure-password"

# Install with custom storage size
helm install grafana ./kubernetes/helm/charts/grafana \
  --namespace monitoring \
  --create-namespace \
  --set grafana.persistence.size="20Gi"
```

### Environment-Specific Installation

```bash
# Development environment
helm install grafana ./kubernetes/helm/charts/grafana \
  -f ./kubernetes/helm/charts/grafana/values-dev.yaml \
  --namespace monitoring \
  --create-namespace

# Staging environment
helm install grafana ./kubernetes/helm/charts/grafana \
  -f ./kubernetes/helm/charts/grafana/values-staging.yaml \
  --namespace monitoring \
  --create-namespace

# Production environment
helm install grafana ./kubernetes/helm/charts/grafana \
  -f ./kubernetes/helm/charts/grafana/values-prod.yaml \
  --namespace monitoring \
  --create-namespace
```

## Configuration

### Key Values

| Parameter | Default | Description |
|-----------|---------|-------------|
| `grafana.replicaCount` | 2 | Number of Grafana replicas |
| `grafana.image.tag` | 10.2.0 | Grafana version |
| `grafana.admin.password` | metapharm-secure-password-change-me | Admin password (change in production) |
| `grafana.persistence.enabled` | true | Enable persistent storage |
| `grafana.persistence.size` | 10Gi | Storage size |
| `datasources.prometheus.url` | http://prometheus:9090 | Prometheus URL |
| `ingress.enabled` | true | Enable ingress |
| `ingress.hosts[0].host` | grafana.metapharm.local | Grafana hostname |

### Database Configuration

The chart supports two database backends:

**SQLite (Default)**
```yaml
grafana:
  config:
    database:
      type: sqlite3
      url: "file:/var/lib/grafana/grafana.db"
```

**PostgreSQL (Recommended for Production)**
```yaml
grafana:
  config:
    database:
      type: postgres
      url: "postgres://user:password@postgres:5432/grafana"
```

### Datasource Configuration

Update Prometheus datasource URL:
```yaml
datasources:
  prometheus:
    url: "http://prometheus-prod:9090"
    access: proxy
    isDefault: true
```

### Security Configuration

**Admin Credentials**
```bash
# Change admin password
kubectl patch secret grafana-admin -n monitoring \
  -p '{"data":{"admin-password":"'$(echo -n 'new-password' | base64 -w0)'"}}'
```

**HTTPS/TLS**
```yaml
ingress:
  tls:
    - secretName: grafana-tls
      hosts:
        - grafana.metapharm.ch
```

## Dashboard Metrics

### Required Prometheus Metrics

The dashboards expect the following metrics from Prometheus:

**Application Metrics**
- `http_request_duration_seconds_bucket` - HTTP request latency
- `http_requests_total` - Total HTTP requests
- `prescription_total` - Total prescriptions processed
- `teleconsultation_total` - Total consultations
- `active_users` - Active user count

**Delivery Metrics**
- `delivery_active_count` - Active deliveries
- `delivery_duration_minutes` - Average delivery time
- `delivery_drivers_available` - Available drivers
- `delivery_requested_total` - Total delivery requests
- `delivery_completed_total` - Completed deliveries

**Alert Metrics**
- `ALERTS` - Active alerts from Prometheus
- `ALERTS_FIRED` - Alert firing history
- `up` - Service availability

**Infrastructure Metrics**
- `node_cpu_seconds_total` - Node CPU time
- `node_memory_MemAvailable_bytes` - Node memory available
- `kube_pod_container_status_restarts_total` - Pod restarts

## Usage

### Accessing Grafana

**Via Ingress (Production)**
```
https://grafana.metapharm.local
```

**Port Forward (Development)**
```bash
kubectl port-forward -n monitoring svc/grafana 3000:3000
# Access at http://localhost:3000
```

### Login Credentials

- **Username**: admin
- **Password**: Check values.yaml (default: metapharm-secure-password-change-me)

**Change password on first login in production!**

### Importing Dashboards

The dashboards are automatically provisioned via ConfigMap. No manual import needed.

### Custom Dashboards

To add custom dashboards:

1. Create/export dashboard JSON from Grafana
2. Add to `configmap-dashboards.yaml` under `data` section
3. Helm upgrade the chart

```bash
helm upgrade grafana ./kubernetes/helm/charts/grafana \
  --namespace monitoring
```

## Monitoring Grafana Itself

Grafana exposes metrics at `/metrics` endpoint. A ServiceMonitor is included for Prometheus scraping:

```bash
# Verify ServiceMonitor
kubectl get servicemonitor -n monitoring
kubectl describe servicemonitor grafana -n monitoring
```

## High Availability

The chart supports HA with multiple replicas:

```yaml
grafana:
  replicaCount: 3
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchExpressions:
                - key: app
                  operator: In
                  values:
                    - grafana
```

## Backup & Restore

### Backing Up Grafana Data

```bash
# Export persistent volume
kubectl exec -n monitoring <grafana-pod> -- \
  tar czf /var/lib/grafana/backup.tar.gz \
  /var/lib/grafana/dashboards

# Copy backup from pod
kubectl cp monitoring/<grafana-pod>:/var/lib/grafana/backup.tar.gz \
  ./grafana-backup.tar.gz
```

### Restoring Data

```bash
# Copy backup to pod
kubectl cp ./grafana-backup.tar.gz \
  monitoring/<grafana-pod>:/var/lib/grafana/backup.tar.gz

# Extract backup
kubectl exec -n monitoring <grafana-pod> -- \
  tar xzf /var/lib/grafana/backup.tar.gz
```

## Troubleshooting

### Grafana Not Starting

```bash
# Check pod status
kubectl get pods -n monitoring -l app=grafana
kubectl logs -n monitoring <grafana-pod>

# Check resource availability
kubectl top nodes
kubectl top pods -n monitoring
```

### Prometheus Datasource Not Working

```bash
# Verify Prometheus service DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup prometheus.monitoring.svc.cluster.local

# Check Grafana logs for connection errors
kubectl logs -n monitoring deployment/grafana | grep -i prometheus
```

### Dashboards Not Displaying Data

```bash
# Verify Prometheus has metrics
# In Prometheus UI (port-forward): http://localhost:9090
# Query: up{job="kubernetes-pods"}

# Check dashboard JSON for correct metric names
kubectl get configmap grafana-dashboards -n monitoring -o yaml
```

### PVC Not Binding

```bash
# Check PVC status
kubectl get pvc -n monitoring
kubectl describe pvc grafana-pvc -n monitoring

# Check storage class availability
kubectl get storageclass
```

## Upgrades

### Upgrading Grafana Version

```bash
# Update chart values
helm upgrade grafana ./kubernetes/helm/charts/grafana \
  --namespace monitoring \
  --set grafana.image.tag="10.3.0"

# Verify upgrade
kubectl rollout status deployment/grafana -n monitoring
```

### Rolling Back

```bash
helm rollback grafana 1 --namespace monitoring
```

## Performance Tuning

### Resource Limits

Adjust for your workload:

```yaml
grafana:
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 2000m
      memory: 2Gi
```

### Autoscaling

Enable HPA for dynamic scaling:

```yaml
grafana:
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
    targetCPU: 70
```

## Security Best Practices

1. **Change Default Credentials**
   ```bash
   helm install grafana ./kubernetes/helm/charts/grafana \
     --set grafana.admin.password="<strong-password>"
   ```

2. **Enable RBAC**
   ```yaml
   rbac:
     create: true
   ```

3. **Use Network Policies**
   ```yaml
   networkPolicy:
     enabled: true
   ```

4. **Enable Pod Security Policies**
   ```yaml
   podSecurityPolicy:
     enabled: true
   ```

5. **Use TLS for Ingress**
   ```yaml
   ingress:
     tls:
       - secretName: grafana-tls
         hosts:
           - grafana.metapharm.ch
   ```

## Support

For issues or questions:

1. Check logs: `kubectl logs -n monitoring deployment/grafana`
2. Verify Prometheus: `kubectl port-forward -n monitoring svc/prometheus 9090:9090`
3. Review Grafana configuration: `kubectl get configmap -n monitoring`

## Chart Files

```
kubernetes/helm/charts/grafana/
├── Chart.yaml                         # Chart metadata
├── values.yaml                        # Default values
├── values-dev.yaml                    # Development overrides
├── values-staging.yaml                # Staging overrides
├── values-prod.yaml                   # Production overrides
├── README.md                          # This file
├── templates/
│   ├── _helpers.tpl                   # Template helpers
│   ├── namespace.yaml                 # Kubernetes namespace
│   ├── serviceaccount.yaml            # Service account
│   ├── rbac.yaml                      # RBAC configuration
│   ├── deployment.yaml                # Grafana deployment
│   ├── service.yaml                   # Grafana service
│   ├── pvc.yaml                       # Persistent volume claim
│   ├── ingress.yaml                   # Ingress configuration
│   ├── servicemonitor.yaml            # Prometheus service monitor
│   ├── pdb.yaml                       # Pod disruption budget
│   ├── configmap-dashboards.yaml      # Dashboard definitions
│   └── configmap-datasources.yaml     # Datasource configurations
└── tests/
    └── test_grafana_chart.py          # Chart validation tests
```

## Related Charts

- **Prometheus** (T7-002): Metrics collection and alerting
- **Loki**: Log aggregation and visualization
- **Promtail**: Log collection

## Links

- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [MetaPharm Documentation](https://docs.metapharm.ch)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## License

Apache 2.0
