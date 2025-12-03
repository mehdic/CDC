# MetaPharm Connect - Kubernetes Infrastructure

Production-ready Kubernetes manifests for the MetaPharm Connect healthcare platform with full observability, security, and Swiss compliance.

## 🏗️ Architecture Overview

This infrastructure implements a microservices architecture with:
- **30+ microservices** for healthcare operations
- **Prometheus + Grafana** monitoring stack
- **Loki + Promtail** centralized logging
- **PostgreSQL** primary database with encryption
- **Redis** caching and session management
- **Swiss data residency** compliance
- **HIPAA/GDPR** compliant security controls

## 📁 Directory Structure

```
infrastructure/kubernetes/
├── base/                    # Base Kubernetes resources
│   ├── namespace.yaml       # MetaPharm namespace
│   ├── configmap.yaml       # Application configuration
│   ├── secrets.yaml         # Secret template (DO NOT commit actual secrets)
│   ├── ingress.yaml         # NGINX Ingress with TLS
│   ├── kustomization.yaml   # Kustomize base
│   └── services/            # Microservice deployments
│       ├── api-gateway.yaml
│       ├── auth-service.yaml
│       ├── prescription-service.yaml
│       ├── postgres.yaml
│       └── redis.yaml
├── monitoring/              # Prometheus & Grafana stack
│   ├── prometheus.yaml      # Prometheus with alerting rules
│   └── grafana.yaml         # Grafana with dashboards
├── logging/                 # Loki & Promtail stack
│   ├── loki.yaml           # Loki log aggregation
│   └── promtail.yaml       # Promtail log collection
└── overlays/               # Environment-specific configs
    ├── dev/                # Development environment
    ├── staging/            # Staging environment
    └── production/         # Production environment
        ├── network-policies.yaml        # Network security
        └── prometheus-service-monitor.yaml
```

## 🚀 Quick Start

### Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl CLI installed
- Kustomize (v4.0+) or kubectl with kustomize support
- Helm (optional, for cert-manager)
- Storage provisioner configured (for PVCs)

### 1. Install Required Components

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager for TLS certificates
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@metapharm.ch
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

### 2. Configure Secrets

**CRITICAL:** Replace all placeholder values in secrets before deploying.

```bash
# Create secrets from environment file
kubectl create secret generic metapharm-secrets \
  --from-literal=DB_PASSWORD='YOUR_SECURE_DB_PASSWORD' \
  --from-literal=JWT_SECRET='YOUR_256_BIT_JWT_SECRET' \
  --from-literal=ENCRYPTION_KEY='YOUR_32_BYTE_ENCRYPTION_KEY' \
  --from-literal=HIN_CLIENT_ID='YOUR_HIN_CLIENT_ID' \
  --from-literal=HIN_CLIENT_SECRET='YOUR_HIN_CLIENT_SECRET' \
  --namespace=metapharm

# Create monitoring auth secret
htpasswd -c auth admin
kubectl create secret generic monitoring-auth \
  --from-file=auth \
  --namespace=metapharm
```

### 3. Deploy to Environment

#### Development
```bash
kubectl apply -k overlays/dev/
```

#### Staging
```bash
kubectl apply -k overlays/staging/
```

#### Production
```bash
kubectl apply -k overlays/production/
```

## 📊 Monitoring & Observability

### Access Grafana Dashboards

```bash
# Port-forward to Grafana
kubectl port-forward -n metapharm svc/grafana-service 3000:3000

# Open browser
open http://localhost:3000
# Default credentials: admin / [from GRAFANA_ADMIN_PASSWORD secret]
```

**Pre-configured Dashboards:**
- **MetaPharm Services Overview** - Request rates, latencies, error rates
- **MetaPharm Infrastructure** - CPU, memory, disk, network metrics

### Access Prometheus

```bash
kubectl port-forward -n metapharm svc/prometheus-service 9090:9090
open http://localhost:9090
```

### View Logs (Loki)

Logs are accessible through Grafana's Explore feature:
1. Open Grafana
2. Navigate to Explore
3. Select "Loki" datasource
4. Query: `{namespace="metapharm"}`

Example log queries:
```promql
# All logs from prescription service
{namespace="metapharm", app="prescription-service"}

# Error logs across all services
{namespace="metapharm"} |= "ERROR"

# Logs with trace ID
{namespace="metapharm"} | json | trace_id="abc123"
```

## 🔒 Security Features

### 1. Network Policies (Production)

Network isolation enforced at pod level:
- Default deny all traffic
- Explicit allow rules for service-to-service communication
- Database access restricted to backend services only
- Prometheus scraping allowed from monitoring namespace

### 2. RBAC & Service Accounts

Least-privilege access:
- Prometheus service account for metrics scraping
- Promtail service account for log collection
- No default service account access to Kubernetes API

### 3. Pod Security

All deployments enforce:
- `runAsNonRoot: true`
- `allowPrivilegeEscalation: false`
- `readOnlyRootFilesystem: true`
- Drop all capabilities
- Security context with fsGroup

### 4. TLS/SSL

- HTTPS enforced on all ingress routes
- TLS 1.2+ only
- Strong cipher suites configured
- Automatic certificate renewal via cert-manager

### 5. Secrets Management

**DO NOT commit secrets to Git!**

Use one of:
- External secret stores (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault)
- Sealed Secrets (Bitnami)
- Kubernetes native secrets with encryption at rest

## 🇨🇭 Swiss Compliance

### Data Residency

All data stored in Swiss-based infrastructure:
- Configure storage classes with `allowedTopologies` to enforce Swiss data centers
- Set `DATA_RESIDENCY: "CH"` in ConfigMap
- Use Swiss-based cloud regions (e.g., AWS eu-central-1, Azure Switzerland North)

### HIPAA/GDPR Compliance

- End-to-end encryption for PHI (configured in application layer)
- Immutable audit logs (Loki retention: 30 days)
- Access controls via RBAC
- Data retention policies enforced

### Swiss HIN e-ID Integration

HIN credentials configured in secrets:
- `HIN_CLIENT_ID`
- `HIN_CLIENT_SECRET`

## 📈 Scaling

### Horizontal Pod Autoscaling (HPA)

Example HPA for API Gateway:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: metapharm
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

Apply with:
```bash
kubectl apply -f hpa.yaml
```

### Vertical Scaling

Adjust resource requests/limits in base deployments or use Kustomize patches.

## 🔥 Alerting

### Prometheus Alerts

Pre-configured alerts in `monitoring/prometheus.yaml`:
- **ServiceDown** - Service unavailable for 5+ minutes (Critical)
- **HighErrorRate** - Error rate > 5% (Warning)
- **HighResponseTime** - p95 latency > 1s (Warning)
- **HighCPUUsage** - CPU > 80% for 10 minutes (Warning)
- **HighMemoryUsage** - Memory > 90% of limit (Warning)
- **DatabaseConnectionFailure** - DB connection errors (Critical)
- **DiskSpaceLow** - < 10% disk space (Warning)

### Alertmanager Configuration

To receive alerts via email/Slack:

```yaml
# Create alertmanager-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: metapharm
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
    route:
      receiver: 'default-receiver'
      group_by: ['alertname', 'cluster']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
    receivers:
      - name: 'default-receiver'
        email_configs:
          - to: 'ops@metapharm.ch'
            from: 'alerts@metapharm.ch'
            smarthost: 'smtp.gmail.com:587'
            auth_username: 'alerts@metapharm.ch'
            auth_password: 'YOUR_EMAIL_PASSWORD'
```

## 🐛 Troubleshooting

### View Pod Logs

```bash
# Get all pods
kubectl get pods -n metapharm

# View logs
kubectl logs -n metapharm <pod-name>

# Follow logs
kubectl logs -n metapharm <pod-name> -f

# View previous pod logs (after restart)
kubectl logs -n metapharm <pod-name> --previous
```

### Debug Pod Issues

```bash
# Describe pod
kubectl describe pod -n metapharm <pod-name>

# Get events
kubectl get events -n metapharm --sort-by='.lastTimestamp'

# Execute shell in pod
kubectl exec -n metapharm <pod-name> -it -- /bin/sh
```

### Check Resource Usage

```bash
# CPU and memory usage
kubectl top pods -n metapharm

# Node usage
kubectl top nodes
```

### Validate Manifests

```bash
# Dry-run
kubectl apply -k overlays/production/ --dry-run=client

# Validate YAML syntax
yamllint infrastructure/kubernetes/

# Kustomize build (see generated manifests)
kubectl kustomize overlays/production/
```

## 🔄 Disaster Recovery

### Database Backups

```bash
# Manual backup
kubectl exec -n metapharm postgres-0 -- pg_dump -U metapharm_user metapharm > backup.sql

# Restore
kubectl exec -i -n metapharm postgres-0 -- psql -U metapharm_user metapharm < backup.sql
```

### Automated Backups with CronJob

See `base/backup-cronjob.yaml` (to be created) for automated PostgreSQL backups to S3.

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Swiss HIN e-ID](https://www.hin.ch/)

## 🤝 Contributing

When adding new services:
1. Create deployment in `base/services/<service-name>.yaml`
2. Add to `base/kustomization.yaml` resources
3. Update `base/configmap.yaml` with service URL
4. Add Prometheus scraping annotations
5. Update Grafana dashboards
6. Document in this README

## 📞 Support

For issues:
- Check pod logs: `kubectl logs -n metapharm <pod-name>`
- Review events: `kubectl get events -n metapharm`
- Contact: ops@metapharm.ch
