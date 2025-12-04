# Docker Compose CI Implementation Guide

## Overview

This guide documents the complete Docker Compose-based CI pipeline implementation for MetaPharm Connect. The system builds and tests all 37 backend services, web, and mobile applications in containerized environments.

## Architecture

### Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  GitHub Actions Trigger                      │
│  (push to main/develop OR pull_request to main/develop)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           1. Lint & Format Check (1-2 min)                  │
│  - ESLint, Prettier, Backend linting                        │
│  - Non-blocking (warnings only)                             │
└──────────────────┬───────────────────┬──────────────────────┘
                   │                   │
         ┌─────────▼─────────┐   ┌─────▼──────────────┐
         │  2a. Docker Setup │   │ 2b. Frontend Build │
         │  - Buildx config  │   │  - Web & Mobile    │
         │  - Registry login │   │  (parallel, 5-8m)  │
         └────────┬──────────┘   └──────────┬─────────┘
                  │                         │
                  ▼                         │
         ┌────────────────────┐             │
         │ 3. Build Backend   │             │
         │ Services (Docker)  │             │
         │ - All 37 services  │             │
         │ - Layer caching    │             │
         │ (8-12 min)         │             │
         └────────┬───────────┘             │
                  │                         │
                  ├─────────────────────────┤
                  │
                  ▼
         ┌────────────────────┐
         │ 4. Unit Tests in   │
         │    Containers      │
         │ - Start DB & Cache │
         │ - Run tests        │
         │ (4-6 min)          │
         └────────┬───────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ 5. Integration   │   │ 6. Security Scan │
│ Tests (full mesh)│   │ - Docker Images  │
│ (5-8 min)       │   │ - NPM audit      │
│                  │   │ (3-5 min)        │
└────────┬─────────┘   └─────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌────────────────────┐
         │ 7. Quality Report  │
         │ - Consolidate      │
         │   results          │
         │ - Comment PR       │
         │ (1 min)            │
         └────────────────────┘

Total Time: ~25-40 minutes (depends on cache hits)
```

## Job Descriptions

### 1. lint-and-format
- **Purpose:** Code quality and format validation
- **Duration:** 1-2 minutes
- **Status:** Warning level (non-blocking)
- **Outputs:** ESLint JSON report
- **Triggers:** All pushes and PRs

### 2. setup-docker
- **Purpose:** Prepare Docker Buildx and registry login
- **Duration:** 30 seconds
- **Status:** Required for backend builds
- **Dependencies:** lint-and-format
- **Actions:** Docker Buildx setup, registry authentication

### 3. build-backend-services
- **Purpose:** Build all 37 backend services via Docker Compose
- **Duration:** 8-12 minutes (first run) / 3-5 minutes (cached)
- **Docker Compose:** Combines `docker-compose.yml` + `docker-compose.test.yml`
- **Caching:** GitHub Actions cache for BuildX layers
- **Dependencies:** setup-docker
- **Outputs:** Built Docker images in local daemon

### 4. build-frontend-services
- **Purpose:** Build web and mobile applications
- **Duration:** 5-8 minutes (parallel)
- **Matrix:** web, mobile (2 parallel jobs)
- **Node.js:** 20 with npm caching
- **Dependencies:** lint-and-format
- **Outputs:** dist/ artifacts for web and mobile

### 5. unit-tests
- **Purpose:** Run unit tests inside Docker containers
- **Duration:** 4-6 minutes
- **Services Started:**
  - PostgreSQL (ephemeral, test database)
  - Redis (ephemeral, in-memory)
  - API Gateway + additional services
- **Health Checks:** Automatic wait for service readiness
- **Test Commands:**
  - `docker compose exec -T api-gateway npm test -- --coverage`
  - Backend coverage uploaded to Codecov
- **Cleanup:** Automatic Docker resource cleanup
- **Dependencies:** build-backend-services, lint-and-format

### 6. integration-tests
- **Purpose:** Full service mesh integration testing
- **Duration:** 5-8 minutes
- **Services:** All 37 backend services + DB + Cache
- **Health Checks:** HTTP, database, cache readiness
- **Test Commands:**
  - `docker compose exec -T api-gateway npm run test:integration`
  - Full coverage collected
  - Service logs captured
- **Artifacts:** Test results, logs, coverage
- **Cleanup:** Complete teardown with volume deletion
- **Dependencies:** build-backend-services, build-frontend-services

### 7. docker-security-scan
- **Purpose:** Trivy vulnerability scanning on built Docker images
- **Duration:** 3-5 minutes
- **Scans:**
  - Docker image manifest analysis
  - Package vulnerability detection
  - Severity filtering: HIGH, CRITICAL
- **Output:** SARIF format for GitHub Security tab
- **Status:** Non-blocking (continues on error)
- **Dependencies:** build-backend-services

### 8. npm-security-audit
- **Purpose:** NPM and secret scanning
- **Duration:** 2-3 minutes
- **Checks:**
  - `npm audit --audit-level=moderate`
  - Gitleaks secret detection
- **Status:** Non-blocking
- **Dependencies:** lint-and-format

### 9. quality-report
- **Purpose:** Consolidate all results and report
- **Duration:** 1 minute
- **Generates:**
  - Summary table of all jobs
  - Docker Compose infrastructure details
  - PR comment (if applicable)
- **Status:** Fails if any build job failed
- **Dependencies:** All jobs

## Docker Compose Configuration

### Base Configuration (docker-compose.yml)
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: metapharm_db
      POSTGRES_USER: metapharm
      POSTGRES_PASSWORD: metapharm_dev_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U metapharm"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # All 37 backend services...
  api-gateway:
    build:
      context: ./backend
      dockerfile: Dockerfile
      args:
        SERVICE_NAME: api-gateway
        NODE_ENV: development
```

### Test Override Configuration (docker-compose.test.yml)
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: metapharm_test
      POSTGRES_PASSWORD: test_password
    volumes:
      - /var/lib/postgresql/data  # Ephemeral
    healthcheck:
      interval: 5s  # Faster for CI
      timeout: 3s
      retries: 3

  redis:
    command: redis-server --appendonly no  # Disable persistence
    healthcheck:
      interval: 5s
      timeout: 3s
      retries: 3

  api-gateway:
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://metapharm:test_password@postgres:5432/metapharm_test
      LOG_LEVEL: error
```

### Key Differences
- **Persistence:** Base uses named volumes, test uses ephemeral
- **Health Checks:** Base 10s intervals, test 5s (faster)
- **Database:** test schema instead of main
- **Logging:** Error level in test, info in dev
- **Ports:** Test uses alternatives (5433, 6380) to avoid conflicts

## Building Services Locally

### Replicate CI Environment
```bash
# Build backend services
docker compose -f docker-compose.yml -f docker-compose.test.yml build

# Start services
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d

# Run tests in container
docker compose exec -T api-gateway npm test -- --coverage

# View logs
docker compose logs -f api-gateway

# Cleanup
docker compose down -v
```

### Test Individual Service
```bash
# Build specific service
docker compose build api-gateway

# Run its tests
docker compose exec -T api-gateway npm test

# Extract coverage
docker cp cdc-api-gateway-1:/app/coverage ./backend/coverage
```

## Caching Strategy

### BuildX Layer Caching
```yaml
- name: Build cache layer setup
  uses: actions/cache@v4
  with:
    path: /tmp/.buildx-cache
    key: buildx-cache-${{ github.sha }}
    restore-keys: |
      buildx-cache-
```

**How It Works:**
1. GitHub Actions caches Docker build layers
2. Key includes commit SHA for uniqueness
3. Falls back to older commits if exact match not found
4. Reduces Docker image rebuild time by 50-70%

**Size:** 5GB limit (default GitHub Actions cache)

### NPM Dependency Caching
```yaml
cache: 'npm'
cache-dependency-path: |
  package-lock.json
  ${{ matrix.app }}/package-lock.json
```

**Benefits:**
- Node modules restored from cache
- Avoids npm registry calls
- ~30 second speedup per job

## Test Artifact Collection

### Coverage Reports
**Location:** `./backend/coverage/` and `./web/coverage/`
**Format:** LCOV and JSON
**Upload:** Codecov action with flags (backend, web)
**Retention:** 30 days

### Integration Test Results
**Location:** `integration-test-results/`
**Contents:**
- Jest test output
- Coverage reports
- Timing information

### Service Logs
**Location:** `service-logs/docker-compose.log`
**Contents:** Complete logs from all services
**Purpose:** Debugging failed integration tests
**Retention:** 7 days

### Lint Reports
**Location:** `lint-reports/eslint-report.json`
**Format:** ESLint JSON format
**Retention:** 7 days

## GitHub Security Integration

### Trivy Scan Results
**Type:** SARIF format
**Location:** GitHub Security → Code scanning alerts
**Coverage:**
- Container image vulnerabilities
- Filesystem/IaC issues
- Dependency vulnerabilities

### NPM Audit Results
**Visibility:** Artifacts section
**Severity:** Moderate and above
**Action:** Referenced in PR comments if failures

### CodeQL Analysis (in security-scan.yml)
**Type:** SAST (Static Analysis Security Testing)
**Languages:** JavaScript, TypeScript
**Results:** GitHub Security tab

## Performance Metrics

### Typical Execution Times
| Component | Time | Cache Effect |
|-----------|------|--------------|
| Lint & Format | 1-2 min | N/A |
| Docker Setup | 30 sec | N/A |
| Backend Build (first) | 10-12 min | -50% cached |
| Backend Build (cached) | 3-5 min | Layer reuse |
| Frontend Build | 5-8 min | NPM cache |
| Unit Tests | 4-6 min | -10% with coverage |
| Integration Tests | 5-8 min | Service health checks |
| Security Scans | 3-5 min | Image size dependent |
| Quality Report | 1 min | N/A |
| **Total (first run)** | **30-40 min** | Baseline |
| **Total (cached)** | **20-25 min** | ~40% faster |

### GitHub Actions Costs
- **Minutes:** Each job runs on ubuntu-latest (10 min/month free)
- **Storage:** 5GB free cache storage
- **Artifacts:** 1GB free artifact storage
- **Concurrent runs:** Standard 20 jobs max

## Failure Modes and Recovery

### Docker Build Fails
**Symptom:** `build-backend-services` job fails
**Diagnosis:**
1. Check Dockerfile syntax
2. Verify build context files exist
3. Check Docker registry access
**Recovery:**
```bash
docker compose build --no-cache  # Force rebuild
```

### Service Health Check Timeout
**Symptom:** `unit-tests` or `integration-tests` timeout
**Diagnosis:**
1. Service not starting (check logs)
2. Health check endpoint not responding
3. Database migration issues
**Recovery:**
```bash
docker compose logs postgres  # Check service logs
docker compose exec api-gateway npm run migrate  # Manual migration
```

### Coverage Report Missing
**Symptom:** Codecov action fails to find coverage file
**Diagnosis:**
1. Tests not generating coverage
2. Wrong coverage file path
3. Test failure prevented coverage generation
**Recovery:**
```bash
docker compose exec api-gateway npm test -- --coverage
docker compose cp api-gateway:/app/coverage ./backend/coverage
```

### Artifact Upload Fails
**Symptom:** Artifact upload step fails
**Diagnosis:**
1. File not found (path incorrect)
2. File size exceeds limits (>2GB)
3. Directory doesn't exist
**Recovery:** Check artifact paths match test output

## Security Considerations

### Secret Handling
- No secrets in Dockerfiles
- Environment variables passed at runtime
- GitHub Secrets used for sensitive data
- Gitleaks prevents secret commits

### Docker Image Security
- Base images scanned via Trivy
- Package vulnerabilities detected
- Severity filtering (HIGH, CRITICAL)
- Results in GitHub Security tab

### Database Security
- Test database uses separate credentials
- Ephemeral volumes prevent data persistence
- Network isolation via Docker network

## Maintenance and Updates

### Regular Tasks
1. **Weekly:** Monitor GitHub Actions usage
2. **Monthly:** Review security scan results
3. **Quarterly:** Update base Docker images
4. **Annually:** Audit caching strategy efficiency

### Version Updates
- Node.js: Update to 20+ (currently 20)
- Docker Compose: Update to v2+ (currently v3.9 spec)
- Actions: Keep at latest (v4, v3)
- Trivy: Auto-updates via action

### Workflow Customization
To modify for your needs:
1. Edit `.github/workflows/ci.yaml`
2. Update `docker-compose.yml` and `docker-compose.test.yml`
3. Test locally with: `docker compose -f docker-compose.yml -f docker-compose.test.yml up`
4. Commit and push to main branch

## Troubleshooting Quick Reference

| Issue | Command | Solution |
|-------|---------|----------|
| Docker daemon not responding | `docker ps` | Restart Docker or use `docker context` |
| Port already in use | `lsof -i :5432` | Kill process or use different port |
| Image pull fails | `docker pull postgres:16-alpine` | Check internet, Docker registry status |
| Service won't start | `docker logs [container]` | Check logs, verify env vars |
| Cache not working | `rm -rf /tmp/.buildx-cache` | Clear cache, rebuild |
| Volume permission denied | `docker exec [container] ls -la /app` | Check ownership, run as correct user |

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Trivy Vulnerability Scanner](https://github.com/aquasecurity/trivy)
- [GitHub Code Scanning](https://docs.github.com/en/code-security/code-scanning)

---

**Last Updated:** 2024-12-04
**CI System:** GitHub Actions + Docker Compose
**Maintainers:** Development Team
