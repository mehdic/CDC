# MetaPharm Connect Helm Charts

Complete Helm chart deployment for the MetaPharm Connect healthcare platform with support for multiple environments (dev, staging, production).

## 📋 Overview

This Helm chart packages the entire MetaPharm Connect platform consisting of:
- **30 Microservices** (application services)
- **5 Infrastructure services** (PostgreSQL, Redis, RabbitMQ, Elasticsearch)
- **Environment-specific configurations** (dev, staging, prod)
- **Horizontal Pod Autoscaling** for critical services
- **Security-first approach** with non-root containers, read-only filesystems
- **Health checks and monitoring** with Prometheus integration

## 📂 Directory Structure

```
kubernetes/helm/
├── helmfile.yaml                      # Multi-environment orchestration
└── charts/
    └── metapharm/
        ├── Chart.yaml                 # Chart metadata
        ├── values.yaml                # Default values
        ├── values-dev.yaml            # Development environment
        ├── values-staging.yaml        # Staging environment
        ├── values-prod.yaml           # Production environment
        ├── templates/
        │   ├── _helpers.tpl           # Template helpers
        │   ├── namespace.yaml         # Namespace definition
        │   ├── configmaps/
        │   │   └── common-config.yaml # Shared configuration
        │   ├── secrets/
        │   │   └── secrets.yaml       # Secret templates
        │   ├── deployments/
        │   │   └── microservices.yaml # All service deployments
        │   ├── services/
        │   │   └── microservices.yaml # All service definitions
        │   ├── hpa/
        │   │   └── autoscaling.yaml   # Horizontal Pod Autoscalers
        │   └── ingress/
        │       └── ingress.yaml       # Ingress configuration
        └── tests/
            ├── deployment_test.yaml   # Deployment tests
            ├── service_test.yaml      # Service tests
            ├── hpa_test.yaml          # HPA tests
            └── values_test.yaml       # Values tests
```

## 🚀 Quick Start

### Prerequisites

1. **Kubernetes cluster** (v1.24+)
2. **Helm 3** installed
3. **kubectl** configured
4. **Helmfile** (optional, for multi-environment management)

### Installation

#### Option 1: Using Helm directly

```bash
# 1. Create namespace and secrets first
kubectl create namespace metapharm

# 2. Create required secrets
kubectl create secret generic metapharm-db-credentials \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD=<secure-password> \
  -n metapharm

kubectl create secret generic metapharm-jwt-secret \
  --from-literal=JWT_SECRET=<jwt-secret> \
  --from-literal=JWT_REFRESH_SECRET=<refresh-secret> \
  -n metapharm

# 3. Install the chart (development)
helm install metapharm ./charts/metapharm \
  -f ./charts/metapharm/values-dev.yaml \
  -n metapharm

# 4. Install for production
helm install metapharm ./charts/metapharm \
  -f ./charts/metapharm/values-prod.yaml \
  -n metapharm
```

#### Option 2: Using Helmfile (Recommended)

```bash
# Install to development
helmfile -e dev sync

# Install to staging
helmfile -e staging sync

# Install to production
helmfile -e prod sync
```

## 🔧 Configuration

### Environment-Specific Values

**Development (`values-dev.yaml`)**:
- Minimal resource allocation
- Single replica for most services
- Debug logging enabled
- No autoscaling
- 5Gi storage volumes

**Staging (`values-staging.yaml`)**:
- Moderate resource allocation
- 2 replicas for critical services
- Info-level logging
- Limited autoscaling (2-5 replicas)
- 10Gi storage volumes

**Production (`values-prod.yaml`)**:
- Full resource allocation
- 3 replicas for critical services (high tier)
- 2 replicas for standard services (medium tier)
- Aggressive autoscaling (up to 10 replicas)
- 100Gi storage volumes
- Premium storage class

### Key Configuration Parameters

#### Global Settings

```yaml
global:
  environment: production         # development | staging | production
  domain: metapharm.ch           # Primary domain
  imageRegistry: metapharm       # Docker registry
  imageTag: v1.0.0              # Image tag (overrides appVersion)
  imagePullPolicy: IfNotPresent # Image pull policy
  namespace: metapharm           # Kubernetes namespace
```

#### Service Configuration Example

```yaml
services:
  apiGateway:
    enabled: true                # Enable/disable service
    name: api-gateway
    tier: high                   # Resource tier: high | medium | low
    component: microservice
    port: 3000
    replicas: 3                  # Base replica count
    serviceType: LoadBalancer    # ClusterIP | LoadBalancer
    resources:
      requests:
        cpu: 500m
        memory: 512Mi
      limits:
        cpu: 1000m
        memory: 1Gi
    autoscaling:
      enabled: true
      minReplicas: 3
      maxReplicas: 10
      targetCPU: 70              # Target CPU utilization %
      targetMemory: 80           # Target memory utilization %
    healthCheck:
      path: /health
      port: 3000
```

#### Infrastructure Configuration

```yaml
infrastructure:
  postgresPrimary:
    enabled: true
    replicas: 1
    resources:
      requests:
        cpu: 500m
        memory: 1Gi
      limits:
        cpu: 1000m
        memory: 2Gi
    storage:
      size: 100Gi
      storageClass: premium
```

### Secret Management

Secrets are **NOT** stored in the chart values. Create secrets externally:

```bash
# Database credentials
kubectl create secret generic metapharm-db-credentials \
  --from-literal=DB_USER=<username> \
  --from-literal=DB_PASSWORD=<password> \
  -n metapharm

# JWT secrets
kubectl create secret generic metapharm-jwt-secret \
  --from-literal=JWT_SECRET=<secret> \
  --from-literal=JWT_REFRESH_SECRET=<refresh-secret> \
  -n metapharm

# Redis password
kubectl create secret generic metapharm-redis-password \
  --from-literal=REDIS_PASSWORD=<password> \
  -n metapharm

# RabbitMQ credentials
kubectl create secret generic metapharm-rabbitmq-credentials \
  --from-literal=RABBITMQ_USER=<username> \
  --from-literal=RABBITMQ_PASSWORD=<password> \
  -n metapharm

# External API keys
kubectl create secret generic metapharm-external-api-keys \
  --from-literal=AWS_ACCESS_KEY_ID=<key> \
  --from-literal=AWS_SECRET_ACCESS_KEY=<secret> \
  --from-literal=TWILIO_ACCOUNT_SID=<sid> \
  --from-literal=TWILIO_AUTH_TOKEN=<token> \
  --from-literal=SENDGRID_API_KEY=<key> \
  --from-literal=STRIPE_SECRET_KEY=<key> \
  --from-literal=HIN_CLIENT_ID=<id> \
  --from-literal=HIN_CLIENT_SECRET=<secret> \
  -n metapharm
```

**Alternative**: Use **Sealed Secrets** or **External Secrets Operator** for production.

## 🔍 Verification

### Check Deployment Status

```bash
# Get all releases
helm list -n metapharm

# Check pods
kubectl get pods -n metapharm

# Check services
kubectl get svc -n metapharm

# Check deployments
kubectl get deployments -n metapharm

# Check HPA status
kubectl get hpa -n metapharm

# View logs for a specific service
kubectl logs -f deployment/api-gateway-deployment -n metapharm
```

### Test Health Endpoints

```bash
# Port-forward to API Gateway
kubectl port-forward -n metapharm svc/api-gateway-svc 3000:3000

# Test health endpoint
curl http://localhost:3000/health
```

## 📈 Scaling

### Manual Scaling

```bash
# Scale a specific deployment
kubectl scale deployment api-gateway-deployment --replicas=5 -n metapharm
```

### Autoscaling

Autoscaling is configured via HPA (Horizontal Pod Autoscaler) for services with `autoscaling.enabled: true`.

View autoscaling status:
```bash
kubectl get hpa -n metapharm
kubectl describe hpa api-gateway-hpa -n metapharm
```

## 🔄 Updates and Rollbacks

### Upgrade Release

```bash
# Upgrade to new version
helm upgrade metapharm ./charts/metapharm \
  -f ./charts/metapharm/values-prod.yaml \
  -n metapharm

# Using Helmfile
helmfile -e prod apply
```

### Rollback

```bash
# View release history
helm history metapharm -n metapharm

# Rollback to previous version
helm rollback metapharm -n metapharm

# Rollback to specific revision
helm rollback metapharm 3 -n metapharm
```

## 🧪 Testing

### Helm Unit Tests

Using **helm-unittest** plugin:

```bash
# Install helm-unittest plugin
helm plugin install https://github.com/helm-unittest/helm-unittest

# Run all tests
helm unittest charts/metapharm

# Run specific test
helm unittest -f tests/deployment_test.yaml charts/metapharm

# Run with detailed output
helm unittest -v charts/metapharm
```

### Template Validation

```bash
# Lint the chart
helm lint ./charts/metapharm

# Dry-run with development values
helm install metapharm ./charts/metapharm \
  -f ./charts/metapharm/values-dev.yaml \
  --dry-run --debug \
  -n metapharm

# Template rendering (outputs YAML)
helm template metapharm ./charts/metapharm \
  -f ./charts/metapharm/values-prod.yaml \
  -n metapharm
```

### Schema Validation

```bash
# Validate Kubernetes resource schemas
helm template metapharm ./charts/metapharm \
  -f ./charts/metapharm/values-prod.yaml \
  -n metapharm | kubectl apply --dry-run=client -f -
```

## 🛠️ Customization

### Override Specific Values

```bash
# Override image tag
helm install metapharm ./charts/metapharm \
  -f ./charts/metapharm/values-prod.yaml \
  --set global.imageTag=v1.1.0 \
  -n metapharm

# Override replica count
helm install metapharm ./charts/metapharm \
  -f ./charts/metapharm/values-prod.yaml \
  --set services.apiGateway.replicas=5 \
  -n metapharm

# Enable/disable services
helm install metapharm ./charts/metapharm \
  -f ./charts/metapharm/values-prod.yaml \
  --set services.marketingService.enabled=false \
  -n metapharm
```

### Custom Values File

Create a custom values file:

```yaml
# custom-values.yaml
global:
  imageTag: v1.2.0

services:
  apiGateway:
    replicas: 5
    resources:
      limits:
        cpu: 2000m
        memory: 2Gi
```

Apply:
```bash
helm install metapharm ./charts/metapharm \
  -f ./charts/metapharm/values-prod.yaml \
  -f custom-values.yaml \
  -n metapharm
```

## 🔐 Security

### Security Features

- **Non-root containers**: All pods run as user 1000
- **Read-only root filesystem**: Containers cannot write to filesystem
- **No privilege escalation**: Prevents privilege escalation attacks
- **Dropped capabilities**: All Linux capabilities dropped
- **Network policies**: (Optional) Restrict pod-to-pod communication
- **Secret management**: Secrets externalized and not committed to Git

### Security Context

Applied to all deployments:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

## 📊 Monitoring

### Prometheus Integration

All services expose metrics at `/metrics` endpoint with annotations:

```yaml
prometheus.io/scrape: "true"
prometheus.io/port: "<service-port>"
prometheus.io/path: "/metrics"
```

### Health Checks

- **Liveness probe**: Restarts pod if unhealthy (30s delay, 10s period)
- **Readiness probe**: Removes pod from service if not ready (10s delay, 5s period)

## 🔗 Dependencies

### Optional Dependencies

Add external dependencies in `Chart.yaml`:

```yaml
dependencies:
  - name: postgresql
    version: "12.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: infrastructure.postgresPrimary.useExternal
```

## 📚 Additional Resources

- [Helm Documentation](https://helm.sh/docs/)
- [Helmfile Documentation](https://helmfile.readthedocs.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [MetaPharm Architecture](../../docs/architecture.md)

## 🤝 Contributing

When making changes:

1. Update values files for all environments
2. Update this README
3. Run helm lint: `helm lint ./charts/metapharm`
4. Run unit tests: `helm unittest charts/metapharm`
5. Test dry-run: `helm install --dry-run --debug`
6. Document breaking changes

## 📝 Version History

- **v1.0.0** (2025-12-08): Initial Helm chart release
  - Support for 30 microservices
  - 5 infrastructure services
  - Multi-environment support (dev/staging/prod)
  - HPA for critical services
  - Security hardening
  - Prometheus monitoring integration

## 📄 License

MetaPharm Connect - Proprietary and Confidential
