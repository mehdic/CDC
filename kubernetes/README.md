# MetaPharm Connect - Kubernetes Deployment Manifests

This directory contains comprehensive Kubernetes deployment manifests for the entire MetaPharm Connect healthcare platform.

## 📋 Overview

The platform consists of:
- **30 Microservices** (application services)
- **5 Infrastructure services** (databases, caching, message queue, search)
- **Total: 35 services** with full Kubernetes configuration

## 📂 Directory Structure

```
kubernetes/
├── namespaces/
│   └── metapharm.yaml                 # Namespace definition
├── configmaps/
│   └── common-config.yaml             # Shared configuration
├── deployments/
│   ├── <service>-deployment.yaml      # Deployment manifests (35 services)
│   └── <service>-sa.yaml              # ServiceAccount per service (35 total)
├── services/
│   └── <service>-svc.yaml             # Service manifests (35 services)
├── secrets/
│   └── README.md                      # Secret templates (not committed)
├── tests/
│   ├── unit/                          # Unit tests for manifest validation
│   ├── contract/                      # K8s schema compliance tests
│   └── e2e/                           # E2E deployment tests
└── generate_manifests.py              # Manifest generator script
```

## 🚀 Services

### Application Services (30)

1. **adherence-service** (3011) - Medication adherence tracking
2. **analytics-service** (3012) - Business analytics and reporting
3. **api-gateway** (3000) - Main API gateway (LoadBalancer)
4. **appointment-service** (3013) - Appointment scheduling
5. **auth-service** (3001) - Authentication and authorization
6. **calendar-service** (3014) - Calendar integration
7. **controlled-substance-service** (3015) - Controlled substance management
8. **delivery-service** (3002) - Delivery tracking and management
9. **digital-twin-service** (3016) - Patient digital twin AI profiles
10. **doctor-service** (3017) - Doctor-specific features
11. **drug-interaction-service** (3018) - Drug interaction checking
12. **ecommerce-service** (3019) - E-commerce and parapharmacy
13. **esante-service** (3020) - Swiss e-santé integration
14. **insurance-service** (3021) - Insurance and third-party payment
15. **inventory-service** (3003) - Inventory management
16. **marketing-service** (3022) - Marketing and promotions
17. **medical-records-service** (3004) - Medical records management
18. **messaging-service** (3005) - Secure messaging (WhatsApp integration)
19. **notification-service** (3006) - Email/SMS/push notifications
20. **nurse-service** (3023) - Nurse-specific features
21. **order-service** (3007) - Order processing
22. **payment-service** (3008) - Payment processing (Stripe)
23. **pharmacy-service** (3024) - Pharmacy management
24. **prescription-service** (3009) - Prescription processing
25. **recycling-service** (3025) - Medication recycling workflow
26. **refill-service** (3026) - Prescription refill automation
27. **teleconsultation-service** (3010) - Teleconsultation and video calls
28. **user-service** (3027) - User management
29. **vip-service** (3028) - VIP/Golden MetaPharm program
30. **voice-service** (3029) - Voice transcription

### Infrastructure Services (5)

31. **postgres-primary** (5432) - Primary PostgreSQL database
32. **postgres-replica** (5432) - PostgreSQL read replica (2 replicas)
33. **redis** (6379) - Redis cache (2 replicas)
34. **rabbitmq** (5672) - RabbitMQ message queue (2 replicas)
35. **elasticsearch** (9200) - Elasticsearch search engine (2 replicas)

## ⚙️ Resource Tiers

Services are categorized into three resource tiers:

### High Tier (Critical Services)
- **Replicas:** 3
- **CPU Request/Limit:** 500m / 1000m
- **Memory Request/Limit:** 512Mi / 1Gi
- **Services:** api-gateway, auth-service, digital-twin-service, drug-interaction-service, medical-records-service, messaging-service, payment-service, prescription-service, teleconsultation-service, postgres-primary, postgres-replica

### Medium Tier (Standard Services)
- **Replicas:** 2
- **CPU Request/Limit:** 250m / 500m
- **Memory Request/Limit:** 256Mi / 512Mi
- **Services:** Most application services, redis, rabbitmq, elasticsearch

### Low Tier (Batch/Worker Services)
- **Replicas:** 1-2
- **CPU Request/Limit:** 100m / 250m
- **Memory Request/Limit:** 128Mi / 256Mi
- **Services:** marketing-service, recycling-service

## 🔒 Security Features

All deployments include:

- **Non-root containers** (`runAsUser: 1000`)
- **Read-only root filesystem**
- **Dropped capabilities** (ALL capabilities dropped)
- **No privilege escalation**
- **Service accounts** with minimal permissions
- **Secret management** (credentials externalized)

## 🏥 Health Checks

Application services have:

### Liveness Probe
- **Path:** `/health`
- **Initial Delay:** 30s
- **Period:** 10s
- **Timeout:** 5s
- **Failure Threshold:** 3

### Readiness Probe
- **Path:** `/health`
- **Initial Delay:** 10s
- **Period:** 5s
- **Timeout:** 3s
- **Failure Threshold:** 3

## 📊 High Availability

Services with `replicas > 1` include:

- **Rolling update strategy** (maxSurge: 1, maxUnavailable: 0)
- **Pod anti-affinity** (preferredDuringSchedulingIgnoredDuringExecution)
- **Session affinity** (ClientIP with 3-hour timeout)
- **Topology-aware routing** enabled

## 🌐 Network Configuration

### Internal Services (ClusterIP)
All services except API Gateway use ClusterIP for internal communication.

### External Services (LoadBalancer)
- **api-gateway** - Exposed via LoadBalancer for external access

### Service Discovery
Services use DNS: `<service-name>-svc.metapharm.svc.cluster.local:<port>`

## 🔧 Configuration Management

### ConfigMap (common-config)
Contains shared configuration:
- Node environment settings
- Database connection parameters
- Redis/RabbitMQ/Elasticsearch endpoints
- Rate limiting configuration
- JWT settings
- Feature flags

### Secrets (externalized)
See `secrets/README.md` for required secrets:
- Database credentials
- JWT secrets
- Redis password
- RabbitMQ credentials
- External API keys (AWS, Twilio, SendGrid, Stripe, HIN e-ID)

## 📈 Monitoring

All pods include Prometheus annotations:
```yaml
prometheus.io/scrape: "true"
prometheus.io/port: "<service-port>"
prometheus.io/path: "/metrics"
```

## 🚀 Deployment Instructions

### Prerequisites

1. Kubernetes cluster (v1.24+)
2. `kubectl` configured
3. Container registry with images

### Step 1: Create Namespace

```bash
kubectl apply -f namespaces/metapharm.yaml
```

### Step 2: Create Secrets

Create all required secrets (see `secrets/README.md`):

```bash
kubectl create secret generic metapharm-db-credentials \
  --from-literal=DB_USER=<user> \
  --from-literal=DB_PASSWORD=<password> \
  -n metapharm

kubectl create secret generic metapharm-jwt-secret \
  --from-literal=JWT_SECRET=<secret> \
  --from-literal=JWT_REFRESH_SECRET=<refresh-secret> \
  -n metapharm

# ... other secrets
```

### Step 3: Apply ConfigMaps

```bash
kubectl apply -f configmaps/common-config.yaml
```

### Step 4: Deploy Infrastructure Services

```bash
kubectl apply -f deployments/postgres-primary.yaml
kubectl apply -f services/postgres-primary-svc.yaml
kubectl apply -f deployments/postgres-primary-sa.yaml

kubectl apply -f deployments/redis.yaml
kubectl apply -f services/redis-svc.yaml
kubectl apply -f deployments/redis-sa.yaml

kubectl apply -f deployments/rabbitmq.yaml
kubectl apply -f services/rabbitmq-svc.yaml
kubectl apply -f deployments/rabbitmq-sa.yaml

kubectl apply -f deployments/elasticsearch.yaml
kubectl apply -f services/elasticsearch-svc.yaml
kubectl apply -f deployments/elasticsearch-sa.yaml
```

### Step 5: Deploy Application Services

Deploy all application services:

```bash
kubectl apply -f deployments/
kubectl apply -f services/
```

Or deploy individual services:

```bash
kubectl apply -f deployments/auth-service.yaml
kubectl apply -f services/auth-service-svc.yaml
kubectl apply -f deployments/auth-service-sa.yaml
```

### Step 6: Verify Deployment

```bash
# Check all pods
kubectl get pods -n metapharm

# Check all services
kubectl get svc -n metapharm

# Check deployments
kubectl get deployments -n metapharm

# Check specific service logs
kubectl logs -f deployment/auth-service-deployment -n metapharm
```

## 🔍 Troubleshooting

### Pod not starting

```bash
kubectl describe pod <pod-name> -n metapharm
kubectl logs <pod-name> -n metapharm
```

### Service not reachable

```bash
kubectl get endpoints <service-name>-svc -n metapharm
kubectl describe svc <service-name>-svc -n metapharm
```

### Check resource usage

```bash
kubectl top pods -n metapharm
kubectl top nodes
```

## 🧪 Testing

### Unit Tests
Test manifest generation and validation:
```bash
python3 -m pytest tests/unit/
```

### Contract Tests
Validate K8s schema compliance:
```bash
python3 -m pytest tests/contract/
```

### E2E Tests
Test deployment to local cluster:
```bash
python3 -m pytest tests/e2e/
```

## 📝 Regenerating Manifests

To regenerate all manifests:

```bash
python3 generate_manifests.py
```

This will regenerate all deployment and service manifests with the latest configurations.

## 🏷️ Versioning

Current manifest version: **v1**

All resources are labeled with:
- `version: v1`
- `app: <service-name>`
- `tier: <high|medium|low>`
- `component: <microservice|infrastructure>`

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [MetaPharm Connect Architecture](../docs/architecture.md)
- [Service Dependencies](../docs/service-dependencies.md)
- [Deployment Runbook](../docs/deployment-runbook.md)

## 🤝 Contributing

When adding new services:

1. Update `generate_manifests.py` with service configuration
2. Run `python3 generate_manifests.py`
3. Update this README
4. Run tests: `python3 -m pytest tests/`
5. Commit changes

## 📄 License

MetaPharm Connect - Proprietary and Confidential
