# Kubernetes Kustomize Deployment Guide

## Overview

This directory contains Kubernetes manifests organized using Kustomize for environment-specific deployments (dev, staging, production).

## Structure

```
kubernetes/
├── base/                           # Base manifests (shared across environments)
│   ├── kustomization.yaml          # Base kustomize config
│   ├── deployments/                # Deployment manifests
│   │   ├── api-gateway.yaml
│   │   ├── auth-service.yaml
│   │   ├── prescription-service.yaml
│   │   ├── postgres.yaml
│   │   └── redis.yaml
│   ├── services/                   # Service manifests
│   ├── configmaps/                 # ConfigMaps
│   ├── hpa/                        # Horizontal Pod Autoscalers
│   └── ingress/                    # Ingress with TLS
│
└── overlays/                       # Environment-specific configurations
    ├── dev/                        # Development environment
    │   ├── kustomization.yaml
    │   └── patches/                # Dev-specific patches
    ├── staging/                    # Staging environment
    │   ├── kustomization.yaml
    │   └── patches/
    └── prod/                       # Production environment
        ├── kustomization.yaml
        ├── patches/
        └── pdb/                    # PodDisruptionBudgets (prod only)
```

## Environment Configurations

### Development (dev)
- **Replicas**: 1 per service
- **Resources**: Minimal (100m CPU, 128Mi memory)
- **HPA**: 1-3 replicas max
- **Storage**: 5Gi (postgres), 2Gi (redis)
- **TLS**: Disabled
- **Image Tags**: `dev-latest`

### Staging (staging)
- **Replicas**: 2 per service
- **Resources**: Medium (250m CPU, 256Mi memory)
- **HPA**: 2-6 replicas
- **Storage**: 20Gi (postgres), 5Gi (redis)
- **TLS**: Enabled
- **Image Tags**: `v1.0.0-rc`

### Production (prod)
- **Replicas**: 3 per service (HA)
- **Resources**: Full (500m CPU, 512Mi memory)
- **HPA**: 3-10 replicas
- **Storage**: 100Gi (postgres), 20Gi (redis)
- **TLS**: Enabled with cert-manager
- **Image Tags**: `v1.0.0` (stable releases)
- **PodDisruptionBudgets**: Enabled
- **Zone Anti-Affinity**: Required (spread across AZs)

## Prerequisites

1. **Kustomize** (v5.0+)
   ```bash
   kubectl kustomize --help
   # OR install standalone
   curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
   ```

2. **kubectl** (v1.27+)
   ```bash
   kubectl version --client
   ```

3. **Kubernetes Cluster** with:
   - Metrics Server (for HPA)
   - cert-manager (for TLS in staging/prod)
   - NGINX Ingress Controller
   - StorageClass configured (`standard`, `fast-ssd`, `premium-ssd`)

## Deployment

### Build and Preview (Dry-run)

```bash
# Dev environment
kubectl kustomize overlays/dev

# Staging environment
kubectl kustomize overlays/staging

# Production environment
kubectl kustomize overlays/prod
```

### Deploy to Cluster

```bash
# Deploy to dev
kubectl apply -k overlays/dev

# Deploy to staging
kubectl apply -k overlays/staging

# Deploy to production
kubectl apply -k overlays/prod
```

### Verify Deployment

```bash
# Check all resources
kubectl get all -n metapharm-dev
kubectl get all -n metapharm-staging
kubectl get all -n metapharm

# Check HPA status
kubectl get hpa -n metapharm

# Check PDB (production only)
kubectl get pdb -n metapharm

# Check Ingress
kubectl get ingress -n metapharm

# Check TLS certificates
kubectl get certificate -n metapharm
```

## Key Features

### 1. Image Pinning (No :latest)
All images use pinned version tags:
- Dev: `dev-latest` (CI builds)
- Staging: `v1.0.0-rc` (release candidates)
- Prod: `v1.0.0` (stable releases)

### 2. Security Best Practices
✅ runAsNonRoot: true
✅ readOnlyRootFilesystem: true
✅ Drop all capabilities
✅ seccomp profile
✅ Pod anti-affinity

### 3. Health Probes (All Three)
- **Startup Probe**: For slow init (60s max)
- **Liveness Probe**: Restart if unhealthy
- **Readiness Probe**: Remove from service if not ready

### 4. Horizontal Pod Autoscaler (HPA)
- CPU-based scaling (70% threshold)
- Memory-based scaling (80% threshold)
- Scale-down stabilization (5 min)
- Scale-up fast response (1 min)

### 5. Ingress with TLS
- HTTPS enforcement
- Rate limiting (100 req/s)
- CORS configuration
- cert-manager integration

### 6. Production Safety
- PodDisruptionBudgets (min 2 pods available)
- Zone anti-affinity (spread across AZs)
- Rolling updates (maxUnavailable: 0)
- Premium SSD storage

## Configuration Management

### Secrets (DO NOT COMMIT)
Secrets are placeholders in base config. Use one of:

1. **External Secrets Operator** (Recommended for prod)
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/main/deploy/crds/bundle.yaml
   ```

2. **Sealed Secrets** (for GitOps)
   ```bash
   kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
   ```

3. **Manual secrets** (dev only)
   ```bash
   kubectl create secret generic db-credentials \
     --from-literal=POSTGRES_USER=user \
     --from-literal=POSTGRES_PASSWORD=pass \
     -n metapharm-dev
   ```

### ConfigMaps
ConfigMaps are generated by Kustomize. Override in overlays:

```yaml
configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - LOG_LEVEL=debug
      - CUSTOM_VAR=value
```

## Troubleshooting

### HPA Not Scaling
```bash
# Check metrics server
kubectl top nodes
kubectl top pods -n metapharm

# Check HPA status
kubectl describe hpa api-gateway-hpa -n metapharm
```

### Pods Not Starting
```bash
# Check events
kubectl get events -n metapharm --sort-by='.lastTimestamp'

# Check pod logs
kubectl logs -f <pod-name> -n metapharm

# Check pod description
kubectl describe pod <pod-name> -n metapharm
```

### Ingress Not Working
```bash
# Check ingress
kubectl describe ingress metapharm-ingress -n metapharm

# Check cert-manager
kubectl get certificate -n metapharm
kubectl describe certificate metapharm-tls-secret -n metapharm

# Check NGINX ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

## Best Practices

1. **Always test in dev first**
   ```bash
   kubectl apply -k overlays/dev
   # Verify everything works
   kubectl apply -k overlays/staging
   # Final validation
   kubectl apply -k overlays/prod
   ```

2. **Use GitOps for production**
   - ArgoCD: `kubectl apply -n argocd -f argocd-application.yaml`
   - Flux: `flux create kustomization metapharm --source=GitRepository/metapharm`

3. **Monitor deployments**
   ```bash
   kubectl rollout status deployment/api-gateway-deployment -n metapharm
   ```

4. **Rollback if needed**
   ```bash
   kubectl rollout undo deployment/api-gateway-deployment -n metapharm
   ```

5. **Keep within 2 versions of latest K8s**
   ```bash
   kubectl version
   # Server Version should be v1.27+ (as of 2025)
   ```

## Migration from Old Manifests

Old manifests in `kubernetes/deployments/` use hardcoded values. New Kustomize setup provides:
- Environment-specific configurations
- DRY principle (base + overlays)
- Easier maintenance
- Better security (no secrets in Git)

To migrate:
1. Deploy new Kustomize setup to dev
2. Validate functionality
3. Update CI/CD to use `kubectl apply -k`
4. Deprecate old `deployments/` folder

## References

- [Kustomize Documentation](https://kustomize.io/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Gateway API](https://gateway-api.sigs.k8s.io/)
- [cert-manager](https://cert-manager.io/)
- [External Secrets Operator](https://external-secrets.io/)
