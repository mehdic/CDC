# Deployment Runbook

**MetaPharm Connect - Production Deployment Procedures**

---

## Overview

This runbook provides step-by-step procedures for deploying MetaPharm Connect to production, including pre-deployment verification, deployment execution, post-deployment validation, and rollback procedures.

---

## Table of Contents

1. [Pre-Deployment](#pre-deployment)
2. [Deployment Steps](#deployment-steps)
3. [Health Verification](#health-verification)
4. [Rollback Procedures](#rollback-procedures)
5. [Emergency Procedures](#emergency-procedures)

---

## Pre-Deployment {#pre-deployment}

### T-24 Hours: Final Preparation

| Step | Action | Command/Verification | Owner |
|------|--------|---------------------|-------|
| 1 | Verify all CI pipelines green | GitHub Actions dashboard | DevOps |
| 2 | Confirm on-call rotation active | PagerDuty schedule | SRE |
| 3 | Notify stakeholders of deployment window | Email/Slack notification | PM |
| 4 | Verify backup completed | `aws rds describe-db-snapshots` | DevOps |
| 5 | Review deployment artifacts | `gh run list --workflow=docker-build-push.yml` | DevOps |

### T-1 Hour: Pre-Flight Check

```bash
# 1. Verify Kubernetes cluster health
kubectl get nodes
kubectl get pods -n metapharm

# 2. Check current deployment status
kubectl get deployments -n metapharm

# 3. Verify image exists in registry
docker manifest inspect ghcr.io/mehdic/CDC/web:${IMAGE_TAG}
docker manifest inspect ghcr.io/mehdic/CDC/backend:${IMAGE_TAG}

# 4. Verify database connectivity
kubectl exec -it $(kubectl get pod -n metapharm -l app=api-gateway -o jsonpath='{.items[0].metadata.name}') -n metapharm -- node -e "require('pg').connect(process.env.DATABASE_URL).then(() => console.log('DB OK'))"

# 5. Verify Redis connectivity
kubectl exec -it $(kubectl get pod -n metapharm -l app=api-gateway -o jsonpath='{.items[0].metadata.name}') -n metapharm -- node -e "require('redis').createClient({url: process.env.REDIS_URL}).connect().then(() => console.log('Redis OK'))"

# 6. Check current version
kubectl get deployment api-gateway -n metapharm -o jsonpath='{.spec.template.spec.containers[0].image}'
```

### T-15 Minutes: Final Confirmation

- [ ] All team members in deployment channel
- [ ] Monitoring dashboards open
- [ ] Rollback artifacts verified
- [ ] Launch commander confirmed

---

## Deployment Steps {#deployment-steps}

### Step 1: Create Pre-Deployment Backup

```bash
# Create snapshot of current state
kubectl get deployments -n metapharm -o yaml > /tmp/pre-deploy-backup-$(date +%Y%m%d%H%M%S).yaml
kubectl get services -n metapharm -o yaml >> /tmp/pre-deploy-backup-$(date +%Y%m%d%H%M%S).yaml
kubectl get configmaps -n metapharm -o yaml >> /tmp/pre-deploy-backup-$(date +%Y%m%d%H%M%S).yaml

# Upload to S3 for safekeeping
aws s3 cp /tmp/pre-deploy-backup-*.yaml s3://metapharm-backups/deployments/

echo "Backup created: $(date)"
```

### Step 2: Run Database Migrations (If Needed)

```bash
# Check pending migrations
kubectl exec -it $(kubectl get pod -n metapharm -l app=api-gateway -o jsonpath='{.items[0].metadata.name}') -n metapharm -- npm run migration:status

# Run migrations (if any pending)
kubectl exec -it $(kubectl get pod -n metapharm -l app=api-gateway -o jsonpath='{.items[0].metadata.name}') -n metapharm -- npm run migration:up

# Verify migration success
kubectl exec -it $(kubectl get pod -n metapharm -l app=api-gateway -o jsonpath='{.items[0].metadata.name}') -n metapharm -- npm run migration:status
```

### Step 3: Deploy Using GitHub Actions

**Option A: Via GitHub Actions UI**

1. Navigate to GitHub Actions
2. Select "Kubernetes Deployment" workflow
3. Click "Run workflow"
4. Select environment: `prod`
5. Enter image tag: `${IMAGE_TAG}`
6. Click "Run workflow"

**Option B: Via GitHub CLI**

```bash
# Trigger deployment workflow
gh workflow run k8s-deploy.yml \
  -f environment=prod \
  -f image_tag=${IMAGE_TAG}

# Monitor workflow progress
gh run watch $(gh run list --workflow=k8s-deploy.yml --limit=1 --json databaseId -q '.[0].databaseId')
```

### Step 4: Monitor Deployment Progress

```bash
# Watch rollout status
kubectl rollout status deployment/api-gateway -n metapharm --timeout=10m
kubectl rollout status deployment/web-app -n metapharm --timeout=10m
kubectl rollout status deployment/user-service -n metapharm --timeout=10m
kubectl rollout status deployment/pharmacy-service -n metapharm --timeout=10m

# Check pod status
watch -n 5 'kubectl get pods -n metapharm'
```

### Step 5: Verify Deployment Success

```bash
# Check all pods are running
kubectl get pods -n metapharm -o wide

# Verify no pods in error state
kubectl get pods -n metapharm --field-selector=status.phase!=Running

# Check deployment annotations
kubectl get deployment api-gateway -n metapharm -o jsonpath='{.metadata.annotations}'
```

---

## Health Verification {#health-verification}

### Immediate Health Checks (T+0 to T+5 min)

```bash
# 1. Liveness probe check
API_ENDPOINT=$(kubectl get svc api-gateway-svc -n metapharm -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -f http://${API_ENDPOINT}/health/live

# 2. Readiness probe check
curl -f http://${API_ENDPOINT}/health/ready

# 3. Full health check
curl -s http://${API_ENDPOINT}/health | jq .

# Expected output:
# {
#   "status": "healthy",
#   "checks": {
#     "database": {"status": "pass"},
#     "redis": {"status": "pass"},
#     "memory": {"status": "pass"}
#   }
# }
```

### Smoke Tests (T+5 to T+15 min)

```bash
# 1. API endpoint check
curl -f http://${API_ENDPOINT}/api/v1/status

# 2. Authentication endpoint
curl -X POST http://${API_ENDPOINT}/api/v1/auth/health

# 3. Web app check
curl -f https://metapharm-connect.ch/ -I

# 4. Metrics endpoint
curl -f http://${API_ENDPOINT}/metrics | head -20
```

### Functional Verification (T+15 to T+30 min)

| Test | Expected Result | Status |
|------|-----------------|--------|
| User login | 200 OK + JWT token | [ ] |
| Prescription list | 200 OK + data | [ ] |
| Pharmacy search | 200 OK + results | [ ] |
| Teleconsultation health | 200 OK | [ ] |
| Notification service | 200 OK | [ ] |

### Monitoring Verification

```bash
# 1. Check Prometheus targets
curl -s http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health=="up")'

# 2. Verify Grafana dashboards
# Open: https://grafana.metapharm-connect.ch/d/metapharm-overview

# 3. Check error rates
curl -s "http://prometheus:9090/api/v1/query?query=sum(rate(http_requests_total{status=~\"5..\"}[5m]))" | jq .

# 4. Check latency
curl -s "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.99,sum(rate(http_request_duration_seconds_bucket[5m]))by(le))" | jq .
```

---

## Rollback Procedures {#rollback-procedures}

### Decision Criteria

**Trigger immediate rollback if:**
- Error rate > 5% for 5 minutes
- P99 latency > 2 seconds for 5 minutes
- Critical feature unavailable
- Database connection failures
- Security incident detected

### Rollback Option 1: Quick Rollback (Preferred)

```bash
# Rollback to previous revision
kubectl rollout undo deployment/api-gateway -n metapharm
kubectl rollout undo deployment/web-app -n metapharm
kubectl rollout undo deployment/user-service -n metapharm
kubectl rollout undo deployment/pharmacy-service -n metapharm

# Verify rollback
kubectl rollout status deployment/api-gateway -n metapharm --timeout=5m

# Confirm version
kubectl get deployment api-gateway -n metapharm -o jsonpath='{.spec.template.spec.containers[0].image}'
```

### Rollback Option 2: Via GitHub Actions

```bash
# Trigger rollback workflow
gh workflow run rollback.yml \
  -f environment=prod \
  -f rollback_strategy=previous_version

# Monitor rollback
gh run watch $(gh run list --workflow=rollback.yml --limit=1 --json databaseId -q '.[0].databaseId')
```

### Rollback Option 3: Specific Version

```bash
# Rollback to specific version
gh workflow run rollback.yml \
  -f environment=prod \
  -f rollback_strategy=specific_version \
  -f target_image_tag=v1.2.3

# Or manually
kubectl set image deployment/api-gateway api-gateway=ghcr.io/mehdic/CDC/api-gateway:v1.2.3 -n metapharm
```

### Database Rollback (If Needed)

```bash
# 1. Get latest backup
aws rds describe-db-snapshots --db-instance-identifier metapharm-prod-db --query 'DBSnapshots[-1].DBSnapshotIdentifier'

# 2. Stop application (prevent data inconsistency)
kubectl scale deployment -n metapharm --all --replicas=0

# 3. Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier metapharm-prod-db-restored \
  --db-snapshot-identifier <snapshot-id>

# 4. Update connection string and restart
# (Requires manual intervention - see Emergency Procedures)
```

### Migration Rollback

```bash
# Revert last migration
kubectl exec -it $(kubectl get pod -n metapharm -l app=api-gateway -o jsonpath='{.items[0].metadata.name}') -n metapharm -- npm run migration:down

# Verify migration state
kubectl exec -it $(kubectl get pod -n metapharm -l app=api-gateway -o jsonpath='{.items[0].metadata.name}') -n metapharm -- npm run migration:status
```

---

## Emergency Procedures {#emergency-procedures}

### Emergency Stop (All Services)

```bash
# EMERGENCY: Stop all deployments immediately
kubectl scale deployment -n metapharm --all --replicas=0

# Verify all stopped
kubectl get pods -n metapharm

# Notify stakeholders
# (Use emergency communication channels)
```

### Emergency Database Isolation

```bash
# Revoke all application connections
# 1. Update security group to block application subnet
aws ec2 revoke-security-group-ingress \
  --group-id sg-metapharm-db \
  --protocol tcp \
  --port 5432 \
  --source-group sg-metapharm-app

# 2. Force disconnect active sessions (via RDS)
# (Requires DB admin access)
```

### Security Incident Response

1. **Immediately** rotate all JWT secrets:
```bash
# Generate new secrets
NEW_JWT_SECRET=$(openssl rand -base64 32)
NEW_REFRESH_SECRET=$(openssl rand -base64 32)

# Update Kubernetes secrets
kubectl create secret generic metapharm-secrets \
  --from-literal=JWT_SECRET=${NEW_JWT_SECRET} \
  --from-literal=JWT_REFRESH_SECRET=${NEW_REFRESH_SECRET} \
  -n metapharm \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart deployments to pick up new secrets
kubectl rollout restart deployment -n metapharm
```

2. **Invalidate all sessions**:
```bash
# Flush Redis session store
kubectl exec -it $(kubectl get pod -n metapharm -l app=redis -o jsonpath='{.items[0].metadata.name}') -n metapharm -- redis-cli FLUSHDB
```

3. **Enable incident mode**:
- Notify Security Officer
- Enable enhanced logging
- Prepare incident report

---

## Post-Deployment

### T+30 Minutes: Initial Stability Check

- [ ] Error rate < 0.1%
- [ ] P99 latency < 500ms
- [ ] No critical alerts fired
- [ ] All health checks passing

### T+2 Hours: Extended Verification

- [ ] User login/logout working
- [ ] Prescription workflows tested
- [ ] Teleconsultation tested
- [ ] No user complaints received

### T+24 Hours: Full Validation

- [ ] All SLOs met
- [ ] No incidents reported
- [ ] Performance metrics stable
- [ ] Error budget maintained

### Documentation

```markdown
## Deployment Record

- **Deployment ID:** _______________
- **Date/Time:** _______________
- **Deployer:** _______________
- **Image Tag:** _______________
- **Previous Version:** _______________
- **Duration:** _______________
- **Issues Encountered:** _______________
- **Rollback Required:** [ ] Yes / [ ] No
- **Notes:** _______________
```

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Check cluster health | `kubectl get nodes && kubectl get pods -n metapharm` |
| Check deployment status | `kubectl rollout status deployment/api-gateway -n metapharm` |
| View logs | `kubectl logs -f deployment/api-gateway -n metapharm --tail=100` |
| Quick rollback | `kubectl rollout undo deployment/api-gateway -n metapharm` |
| Check versions | `kubectl get deployments -n metapharm -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.template.spec.containers[0].image}{"\n"}{end}'` |
| Scale to zero | `kubectl scale deployment -n metapharm --all --replicas=0` |
| Scale up | `kubectl scale deployment -n metapharm --all --replicas=3` |
| Force restart | `kubectl rollout restart deployment -n metapharm` |

---

*This runbook should be reviewed and updated after each deployment.*
