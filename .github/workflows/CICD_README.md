# CI/CD Pipeline Documentation

## Overview

Comprehensive CI/CD pipelines for MetaPharm Connect using GitHub Actions, Docker, and Kubernetes.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CI/CD Pipeline Flow                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Code Push  │────▶│  Build & Test│────▶│ Docker Build │
│   (main)     │     │  (ci.yaml)   │     │ & Push       │
└──────────────┘     └──────────────┘     └──────────────┘
                              │                    │
                              │                    ▼
                              │            ┌──────────────┐
                              │            │  Security    │
                              │            │  Scan        │
                              │            └──────────────┘
                              │                    │
                              ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   Quality    │     │  Push to     │
                     │   Report     │     │  ghcr.io     │
                     └──────────────┘     └──────────────┘
                              │                    │
                              └────────┬───────────┘
                                       │
                                       ▼
                              ┌──────────────┐
                              │  Deploy Dev  │
                              │  (Auto)      │
                              └──────────────┘
                                       │
                                       ▼
                              ┌──────────────┐
                              │   Promote    │
                              │  to Staging  │
                              │  (Manual)    │
                              └──────────────┘
                                       │
                                       ▼
                              ┌──────────────┐
                              │   Promote    │
                              │ to Production│
                              │ (Manual +    │
                              │  Approval)   │
                              └──────────────┘
```

## Workflows

### 1. CI Pipeline (`ci.yaml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Manual dispatch

**Jobs:**
- `lint-and-format`: ESLint, Prettier checks
- `build-core-services`: Build Docker images for core services
- `build-backend-group-a/b`: Parallel backend service builds
- `build-frontend-services`: Build web and mobile apps
- `unit-tests`: Run unit tests in Docker containers
- `integration-tests`: Full service mesh integration testing
- `docker-security-scan`: Trivy vulnerability scanning
- `npm-security-audit`: NPM audit and secret scanning
- `quality-report`: Aggregate quality metrics

**Features:**
- Parallel builds for faster execution
- Docker layer caching
- Coverage reporting (Codecov)
- Artifact retention
- Automatic cleanup

### 2. Docker Build & Push (`docker-build-push.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests
- Manual dispatch

**Services Built:**
- `web`: Frontend web application
- `backend-api-gateway`: API Gateway service
- `backend-auth-service`: Authentication service
- `dashboard-v2`: Dashboard application

**Features:**
- Multi-stage Docker builds
- GitHub Container Registry (ghcr.io)
- Image tagging strategy:
  - `latest` for main branch
  - `<branch>-<sha>` for commits
  - `<version>` for releases
- Trivy security scanning
- Build metadata in labels

**Registry:** `ghcr.io/<owner>/<repo>/<service>:<tag>`

### 3. Kubernetes Deployment (`k8s-deploy.yml`)

**Triggers:**
- Manual dispatch
- Workflow call (from other workflows)

**Inputs:**
- `environment`: Target environment (dev/staging/prod)
- `image_tag`: Docker image tag to deploy

**Jobs:**
- `validate`: Validate Kubernetes manifests and image existence
- `deploy`: Deploy to Kubernetes using Blue-Green strategy
- `rollback`: Automatic rollback on failure
- `notify`: Send notifications

**Deployment Strategy:**
- Blue-Green deployment
- Health checks before traffic switch
- Automatic rollback on failure
- Smoke tests post-deployment

**Kubernetes Resources:**
- Namespaces: `metapharm`
- ConfigMaps: Common configuration
- Deployments: All microservices
- Services: Load balancers for all services

### 4. Environment Promotion (`environment-promotion.yml`)

**Triggers:**
- Manual dispatch only

**Inputs:**
- `source_environment`: dev or staging
- `target_environment`: staging or prod
- `image_tag`: Image tag to promote

**Promotion Flow:**
```
dev → staging → prod
```

**Features:**
- Validation of promotion path
- Pre-promotion security scans
- Canary deployment for production (10% → 100%)
- Manual approval for production
- Progressive rollout monitoring

### 5. Rollback (`rollback.yml`)

**Triggers:**
- Manual dispatch only

**Inputs:**
- `environment`: Environment to rollback (dev/staging/prod)
- `rollback_strategy`: `previous_version` or `specific_version`
- `target_image_tag`: Specific version (if strategy = specific_version)

**Jobs:**
- `validate-rollback`: Validate rollback request
- `get-previous-version`: Retrieve previous deployment version
- `backup-current-state`: Backup current Kubernetes state
- `execute-rollback`: Execute Kubernetes rollback
- `create-incident-report`: Generate incident documentation
- `notify`: Send notifications

**Features:**
- Pre-rollback state backup (90-day retention)
- Health checks post-rollback
- Smoke tests validation
- Incident report generation
- Automatic notification

## Component-Specific Workflows

### Web CI (`web-tests.yml`)

**Triggers:**
- Push to `main` affecting `web/**`
- Pull requests

**Steps:**
- Lint with ESLint
- Run unit tests
- Build production bundle
- Upload coverage reports

### Backend CI (`backend-tests.yml`)

**Triggers:**
- Push to `main` affecting `backend/**`
- Pull requests

**Services:**
- PostgreSQL 16
- Redis 7

**Steps:**
- Lint backend code
- Run unit tests with coverage
- Upload coverage reports

### Mobile CI (`mobile-tests.yml`)

**Triggers:**
- Push to `main` affecting `mobile/**`
- Pull requests

**Steps:**
- Lint mobile code
- Run unit tests
- Upload coverage reports

### Playwright E2E Tests (`playwright-tests.yml`)

**Triggers:**
- Push to `main`
- Pull requests
- Manual dispatch

**Features:**
- Matrix testing (Chromium, Firefox, WebKit)
- Parallel execution
- Video recording on failure
- Screenshot capture
- HTML test reports

### Security Scan (`security-scan.yml`)

**Triggers:**
- Push to `main`
- Pull requests
- Scheduled (daily)
- Manual dispatch

**Scans:**
- Trivy container vulnerability scanning
- NPM audit for dependencies
- Gitleaks secret scanning
- SARIF report upload to GitHub Security

### Load Tests (`load-tests.yml`)

**Triggers:**
- Manual dispatch
- Scheduled (weekly)

**Tools:**
- k6 for load testing
- Artillery for stress testing

**Features:**
- Configurable VU (virtual users)
- Configurable duration
- Performance metrics reporting

## Notifications

### Slack Integration

**Setup:**
1. Create Slack Incoming Webhook
2. Add webhook URL to repository secrets: `SLACK_WEBHOOK_URL`

**Notifications sent for:**
- Deployment success/failure
- Promotion success/failure
- Rollback events
- CI pipeline failures

**Format:**
```
✅/❌ <Workflow Name>

Repository: owner/repo
Branch: main
Status: success/failure
Environment: prod
Triggered By: username
Commit: abc123

[View Workflow Run] [View Commit]
```

### Reusable Notification Action

**Location:** `.github/actions/notify-slack/action.yml`

**Usage:**
```yaml
- uses: ./.github/actions/notify-slack
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    workflow-name: 'Deploy to Production'
    status: 'success'
    environment: 'prod'
```

## Configuration

### Required Secrets

| Secret | Description | Where to Use |
|--------|-------------|--------------|
| `GITHUB_TOKEN` | Automatic token | All workflows (auto-provided) |
| `KUBE_CONFIG` | Base64-encoded kubeconfig | Kubernetes deployments |
| `SLACK_WEBHOOK_URL` | Slack webhook URL | Notifications |

### Adding Secrets

```bash
# GitHub CLI
gh secret set KUBE_CONFIG < ~/.kube/config-base64

# Or via GitHub UI:
# Settings → Secrets and variables → Actions → New repository secret
```

### Environment Configuration

**GitHub Environments:**
1. `dev` - Auto-deploy on main branch
2. `staging` - Manual approval required
3. `production` - Manual approval + reviewers required

**Setup:**
```
Settings → Environments → New environment
→ Add environment protection rules:
  - Required reviewers
  - Wait timer
  - Deployment branches
```

## Image Tagging Strategy

### Development
```
ghcr.io/owner/repo/web:main-abc123def456
ghcr.io/owner/repo/web:develop-abc123def456
```

### Staging
```
ghcr.io/owner/repo/web:v1.2.3-rc.1
ghcr.io/owner/repo/web:staging-latest
```

### Production
```
ghcr.io/owner/repo/web:v1.2.3
ghcr.io/owner/repo/web:latest
```

## Deployment Process

### Development Environment

**Automatic on push to `main`:**
```bash
git push origin main
# CI runs → Docker builds → Auto-deploy to dev
```

### Staging Environment

**Manual promotion from dev:**
```bash
# Via GitHub UI:
Actions → Environment Promotion → Run workflow
  source_environment: dev
  target_environment: staging
  image_tag: main-abc123def456
```

### Production Environment

**Manual promotion from staging:**
```bash
# Via GitHub UI:
Actions → Environment Promotion → Run workflow
  source_environment: staging
  target_environment: prod
  image_tag: v1.2.3

# Requires:
# - Manual approval
# - Passes security scan
# - Canary deployment (10% traffic)
# - Progressive rollout to 100%
```

## Rollback Process

### Rollback to Previous Version

```bash
# Via GitHub UI:
Actions → Rollback Deployment → Run workflow
  environment: prod
  rollback_strategy: previous_version
```

### Rollback to Specific Version

```bash
# Via GitHub UI:
Actions → Rollback Deployment → Run workflow
  environment: prod
  rollback_strategy: specific_version
  target_image_tag: v1.2.2
```

**Artifacts Created:**
- `pre-rollback-backup-<run-id>`: Kubernetes state backup
- `incident-report-<run-id>`: Incident documentation

## Monitoring & Observability

### CI/CD Metrics

**Available in workflow summaries:**
- Build duration
- Test pass rate
- Coverage percentage
- Security vulnerabilities
- Deployment frequency

### Deployment Metrics

**Tracked via Kubernetes annotations:**
- Deployment timestamp
- Image tag deployed
- Deployed by (user)
- Rollback history

**Query deployments:**
```bash
kubectl get deployments -n metapharm \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.annotations.deployment\.kubernetes\.io/image-tag}{"\n"}{end}'
```

## Troubleshooting

### CI Pipeline Fails

**Check:**
1. Workflow logs in Actions tab
2. Failed job output
3. Artifacts (test results, coverage reports)

**Common issues:**
- Dependency installation failures → Check `package.json`
- Test failures → Check test output artifacts
- Docker build failures → Check Dockerfile syntax
- Lint errors → Run `npm run lint` locally

### Deployment Fails

**Check:**
1. Kubernetes pod status: `kubectl get pods -n metapharm`
2. Pod logs: `kubectl logs <pod-name> -n metapharm`
3. Deployment events: `kubectl describe deployment <name> -n metapharm`

**Common issues:**
- Image pull errors → Check registry authentication
- Health check failures → Verify application health endpoints
- Resource constraints → Check pod resource limits

### Rollback Needed

**Indicators:**
- Increased error rates
- Failed health checks
- User-reported issues

**Action:**
```bash
# Immediate rollback to previous version
Actions → Rollback Deployment → Run workflow
```

## Best Practices

### 1. Branch Protection

**Enable:**
- Require pull request reviews
- Require status checks to pass (CI workflows)
- Require branches to be up to date
- Include administrators

### 2. Image Versioning

**Use semantic versioning:**
- `v1.0.0` for releases
- `v1.0.0-rc.1` for release candidates
- `main-<sha>` for development

### 3. Environment Progression

**Always follow:**
```
dev → staging → production
```

**Never skip staging!**

### 4. Monitoring

**After deployment:**
- Monitor error rates (5 minutes)
- Check latency metrics (5 minutes)
- Review logs for errors
- Validate critical user flows

### 5. Rollback Criteria

**Rollback if:**
- Error rate > 1%
- P95 latency > 2x baseline
- Critical functionality broken
- Security vulnerability detected

## Maintenance

### Weekly Tasks

- Review security scan results
- Update dependencies with vulnerabilities
- Check artifact storage usage
- Review failed workflow runs

### Monthly Tasks

- Review and update workflow configurations
- Audit secret rotation
- Review deployment frequency metrics
- Update documentation

### Quarterly Tasks

- Major dependency updates
- Kubernetes cluster upgrades
- Review and optimize CI costs
- Disaster recovery drills

## Support

### Documentation

- GitHub Actions: https://docs.github.com/en/actions
- Docker: https://docs.docker.com
- Kubernetes: https://kubernetes.io/docs

### Team Contacts

- DevOps Lead: @devops-lead
- Platform Team: @platform-team
- On-call: #platform-oncall

## Changelog

### v1.0.0 (2024-12-24)

**Initial Release:**
- CI pipeline with parallel builds
- Docker build and push workflow
- Kubernetes deployment automation
- Environment promotion workflow
- Rollback capabilities
- Slack notifications
- Security scanning (Trivy, NPM audit, Gitleaks)
- Comprehensive documentation
