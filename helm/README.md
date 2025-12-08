# MetaPharm Connect Helm Chart

This Helm chart deploys the complete MetaPharm Connect healthcare platform on Kubernetes.

## Overview

MetaPharm Connect is a comprehensive healthcare platform connecting pharmacists, doctors, nurses, delivery personnel, and patients. The platform consists of:

- **32 Backend Microservices** (Node.js/TypeScript)
- **3 Frontend Applications** (Web, Mobile, Dashboard)
- **Infrastructure Services** (PostgreSQL, Redis, Jaeger)

## Prerequisites

- Kubernetes 1.24+
- Helm 3.8+
- PV provisioner support in the underlying infrastructure (for PostgreSQL and Redis persistence)
- kubectl configured to access your cluster

## Installation

### Quick Start

```bash
# Add the chart repository (if published)
helm repo add metapharm-connect https://charts.metapharm.com
helm repo update

# Install the chart with default values (development)
helm install metapharm-connect metapharm-connect/metapharm-connect \
  --create-namespace \
  --namespace metapharm

# Or install from local directory
helm install metapharm-connect ./helm/metapharm-connect \
  --create-namespace \
  --namespace metapharm
```

### Environment-Specific Deployments

#### Development Environment

```bash
helm install metapharm-connect ./helm/metapharm-connect \
  --namespace metapharm-dev \
  --create-namespace \
  -f helm/metapharm-connect/values-dev.yaml
```

**Development Configuration:**
- Single replica for all services
- Lower resource limits (100m CPU, 128Mi memory)
- Smaller persistent volumes (5Gi for PostgreSQL, 2Gi for Redis)
- Debug logging enabled
- No autoscaling

#### Staging Environment

```bash
helm install metapharm-connect ./helm/metapharm-connect \
  --namespace metapharm-staging \
  --create-namespace \
  -f helm/metapharm-connect/values-staging.yaml
```

**Staging Configuration:**
- 2 replicas for critical services
- Medium resource limits (250m CPU, 256Mi memory)
- Medium persistent volumes (20Gi for PostgreSQL, 5Gi for Redis)
- Info logging
- Autoscaling enabled (2-5 replicas)

#### Production Environment

```bash
helm install metapharm-connect ./helm/metapharm-connect \
  --namespace metapharm-prod \
  --create-namespace \
  -f helm/metapharm-connect/values-prod.yaml
```

**Production Configuration:**
- 3+ replicas for all services
- High resource limits (500m-2000m CPU, 512Mi-4Gi memory)
- Large persistent volumes (100Gi for PostgreSQL with read replicas)
- JSON structured logging
- Autoscaling enabled (3-20 replicas)
- Security contexts enforced
- Network policies enabled

## Configuration

### Key Configuration Sections

#### Global Settings

```yaml
global:
  imageRegistry: ""  # Override default registry
  imagePullSecrets: []  # Image pull secrets
  storageClass: ""  # Storage class for PVCs
```

#### Image Configuration

```yaml
image:
  registry: docker.io
  repository: metapharm
  pullPolicy: IfNotPresent
  tag: "1.0.0"
```

#### Infrastructure Services

**PostgreSQL:**

```yaml
postgresql:
  enabled: true
  auth:
    username: metapharm
    password: changeme  # Override in production!
    database: metapharm_db
  primary:
    persistence:
      enabled: true
      size: 100Gi
      storageClass: "fast-ssd"
    resources:
      limits:
        cpu: 2000m
        memory: 4Gi
```

**Redis:**

```yaml
redis:
  enabled: true
  auth:
    enabled: true
    password: changeme  # Override in production!
  master:
    persistence:
      enabled: true
      size: 20Gi
```

#### Backend Services

Each service can be configured individually:

```yaml
services:
  apiGateway:
    enabled: true
    replicaCount: 3
    port: 4000
    type: ClusterIP
    env:
      NODE_ENV: "production"
      LOG_LEVEL: "info"
    resources:
      limits:
        cpu: 1000m
        memory: 1Gi
    autoscaling:
      enabled: true
      minReplicas: 3
      maxReplicas: 20
```

#### Ingress Configuration

```yaml
ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: api.metapharm.com
      paths:
        - path: /
          pathType: Prefix
          backend: api-gateway
  tls:
    - secretName: metapharm-prod-tls
      hosts:
        - api.metapharm.com
```

### Secrets Management

**⚠️ SECURITY WARNING:** The default values contain development credentials. These MUST be changed in production!

#### Option 1: Helm Values (Not Recommended for Production)

```yaml
secrets:
  postgresql:
    password: "secure-postgres-password"
  redis:
    password: "secure-redis-password"
  jwt:
    secret: "secure-jwt-secret-key"
```

#### Option 2: Kubernetes Secrets (Recommended)

Create secrets before installation:

```bash
# Create PostgreSQL secret
kubectl create secret generic metapharm-postgresql-secret \
  --namespace metapharm-prod \
  --from-literal=postgres-password='your-secure-password'

# Create Redis secret
kubectl create secret generic metapharm-redis-secret \
  --namespace metapharm-prod \
  --from-literal=redis-password='your-secure-password'

# Create application secrets
kubectl create secret generic metapharm-secrets \
  --namespace metapharm-prod \
  --from-literal=jwt-secret='your-jwt-secret' \
  --from-literal=stripe-api-key='your-stripe-key' \
  --from-literal=sendgrid-api-key='your-sendgrid-key'
```

Then reference in values:

```yaml
postgresql:
  auth:
    existingSecret: "metapharm-postgresql-secret"
    secretKeys:
      adminPasswordKey: "postgres-password"

redis:
  auth:
    existingSecret: "metapharm-redis-secret"
    existingSecretPasswordKey: "redis-password"
```

## Upgrading

### Standard Upgrade

```bash
helm upgrade metapharm-connect ./helm/metapharm-connect \
  --namespace metapharm-prod \
  -f helm/metapharm-connect/values-prod.yaml
```

### Zero-Downtime Upgrade

```bash
# Upgrade with rollback on failure
helm upgrade metapharm-connect ./helm/metapharm-connect \
  --namespace metapharm-prod \
  -f helm/metapharm-connect/values-prod.yaml \
  --atomic \
  --timeout 10m
```

### Upgrade Strategy

The chart uses rolling updates by default:
- Pods are updated one at a time
- New pods must be healthy before continuing
- Maximum 25% unavailable during updates

## Rollback

```bash
# View release history
helm history metapharm-connect --namespace metapharm-prod

# Rollback to previous version
helm rollback metapharm-connect --namespace metapharm-prod

# Rollback to specific revision
helm rollback metapharm-connect 3 --namespace metapharm-prod
```

## Testing

### Run Helm Tests

```bash
helm test metapharm-connect --namespace metapharm-prod
```

This runs:
- API Gateway connectivity test
- PostgreSQL availability test
- Redis connectivity test

### Manual Testing

```bash
# Port-forward to API Gateway
kubectl port-forward -n metapharm-prod \
  svc/metapharm-connect-api-gateway 4000:4000

# Test health endpoint
curl http://localhost:4000/health

# Test specific service
kubectl port-forward -n metapharm-prod \
  svc/metapharm-connect-user-service 4001:4001
```

## Monitoring

### View All Pods

```bash
kubectl get pods -n metapharm-prod -l "app.kubernetes.io/instance=metapharm-connect"
```

### View Logs

```bash
# API Gateway logs
kubectl logs -n metapharm-prod -l "app.kubernetes.io/component=api-gateway" -f

# User Service logs
kubectl logs -n metapharm-prod -l "app.kubernetes.io/component=user-service" -f

# All backend services logs
kubectl logs -n metapharm-prod -l "app.kubernetes.io/name=metapharm-connect" -f
```

### Jaeger Tracing

```bash
# Port-forward to Jaeger UI
kubectl port-forward -n metapharm-prod \
  svc/metapharm-connect-jaeger 16686:16686

# Open browser to: http://localhost:16686
```

## Scaling

### Manual Scaling

```bash
# Scale a specific service
kubectl scale deployment metapharm-connect-api-gateway \
  -n metapharm-prod \
  --replicas=5

# Or via Helm upgrade
helm upgrade metapharm-connect ./helm/metapharm-connect \
  -n metapharm-prod \
  --set services.apiGateway.replicaCount=5
```

### Autoscaling

Autoscaling is configured per service in values:

```yaml
services:
  apiGateway:
    autoscaling:
      enabled: true
      minReplicas: 3
      maxReplicas: 20
      targetCPUUtilizationPercentage: 80
      targetMemoryUtilizationPercentage: 80
```

## Backup and Restore

### PostgreSQL Backup

```bash
# Export database
kubectl exec -n metapharm-prod metapharm-connect-postgresql-0 -- \
  pg_dump -U metapharm metapharm_db > backup.sql

# Restore database
kubectl exec -i -n metapharm-prod metapharm-connect-postgresql-0 -- \
  psql -U metapharm metapharm_db < backup.sql
```

### Redis Backup

```bash
# Trigger Redis save
kubectl exec -n metapharm-prod metapharm-connect-redis-master-0 -- \
  redis-cli -a $REDIS_PASSWORD BGSAVE

# Copy RDB file
kubectl cp metapharm-prod/metapharm-connect-redis-master-0:/data/dump.rdb \
  ./redis-backup.rdb
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n metapharm-prod

# Check events
kubectl get events -n metapharm-prod --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n metapharm-prod
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
kubectl logs -n metapharm-prod metapharm-connect-postgresql-0

# Test connection from pod
kubectl run -it --rm debug --image=postgres:16-alpine \
  --restart=Never -n metapharm-prod -- \
  psql -h metapharm-connect-postgresql -U metapharm -d metapharm_db
```

### Service Discovery Issues

```bash
# Check services
kubectl get svc -n metapharm-prod

# Check endpoints
kubectl get endpoints -n metapharm-prod

# DNS test from pod
kubectl run -it --rm debug --image=busybox \
  --restart=Never -n metapharm-prod -- \
  nslookup metapharm-connect-api-gateway
```

## Uninstallation

```bash
# Uninstall release (keeps PVCs)
helm uninstall metapharm-connect --namespace metapharm-prod

# Delete PVCs manually if needed
kubectl delete pvc -n metapharm-prod -l "app.kubernetes.io/instance=metapharm-connect"

# Delete namespace
kubectl delete namespace metapharm-prod
```

## Chart Structure

```
helm/metapharm-connect/
├── Chart.yaml                          # Chart metadata
├── values.yaml                         # Default values
├── values-dev.yaml                     # Development overrides
├── values-staging.yaml                 # Staging overrides
├── values-prod.yaml                    # Production overrides
├── templates/
│   ├── _helpers.tpl                   # Template helpers
│   ├── configmap.yaml                 # Application config
│   ├── secrets.yaml                   # Secrets
│   ├── serviceaccount.yaml            # Service account
│   ├── deployment.yaml                # Backend services deployments
│   ├── deployment-frontend.yaml       # Frontend deployments
│   ├── deployment-jaeger.yaml         # Jaeger deployment
│   ├── service.yaml                   # Backend services
│   ├── service-frontend.yaml          # Frontend services
│   ├── statefulset-postgresql.yaml    # PostgreSQL StatefulSet
│   ├── statefulset-redis.yaml         # Redis StatefulSet
│   ├── ingress.yaml                   # Ingress configuration
│   ├── NOTES.txt                      # Post-install notes
│   └── tests/
│       ├── test-connection.yaml       # API Gateway test
│       ├── test-database.yaml         # PostgreSQL test
│       └── test-redis.yaml            # Redis test
└── charts/                             # Subchart dependencies
```

## Architecture

### Network Architecture

```
Internet
    ↓
[Ingress Controller]
    ↓
[API Gateway :4000] ← Entry point
    ↓
[Backend Services :4001-4030]
    ↓
[PostgreSQL :5432] [Redis :6379]
```

### Service Communication

All backend services communicate internally via Kubernetes DNS:
- `metapharm-connect-api-gateway.metapharm-prod.svc.cluster.local`
- `metapharm-connect-user-service.metapharm-prod.svc.cluster.local`
- etc.

### Storage

- **PostgreSQL**: StatefulSet with PersistentVolumeClaim
- **Redis**: StatefulSet with PersistentVolumeClaim
- **Services**: EmptyDir volumes for tmp and cache

## Best Practices

### Production Checklist

- [ ] Change all default passwords
- [ ] Use Kubernetes secrets for sensitive data
- [ ] Enable TLS/HTTPS with cert-manager
- [ ] Configure resource limits appropriately
- [ ] Enable autoscaling for critical services
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy for databases
- [ ] Enable network policies
- [ ] Use dedicated storage class (SSD for databases)
- [ ] Configure pod security contexts
- [ ] Set up pod disruption budgets
- [ ] Review and adjust health check parameters

### Security Recommendations

1. **Secrets Management**: Use HashiCorp Vault or AWS Secrets Manager
2. **Network Policies**: Isolate database access to backend services only
3. **Pod Security**: Enforce non-root containers
4. **RBAC**: Use least-privilege service accounts
5. **Image Security**: Scan images for vulnerabilities
6. **Audit Logging**: Enable Kubernetes audit logs
7. **Encryption**: Use encryption at rest for PVCs

## Support

- **Documentation**: [GitHub Repository](https://github.com/mehdic/CDC)
- **Issues**: [GitHub Issues](https://github.com/mehdic/CDC/issues)
- **Email**: support@metapharm.com

## License

Copyright © 2025 MetaPharm Connect
