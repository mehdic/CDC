# Health Check Configuration - MetaPharm Connect Services

## Overview

All MetaPharm Connect microservices are configured with Docker health checks that validate the service is responding correctly on startup and during operation.

## Health Check Requirements

### Endpoint Requirements

Every service MUST implement a `/health` endpoint that:

1. **Returns HTTP 200 status** on success
2. **Is implemented as a GET endpoint**
3. **Returns quickly** (< 1 second preferred)
4. **Requires no authentication**
5. **Returns JSON response**:

```json
{
  "status": "healthy",
  "service": "service-name",
  "timestamp": "2025-12-04T10:00:00Z",
  "version": "1.0.0"
}
```

### Docker Health Check Configuration

The Dockerfile includes this health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"
```

**Parameters:**
- `--interval=30s`: Check health every 30 seconds
- `--timeout=10s`: Wait 10 seconds for response
- `--start-period=40s`: Give service 40 seconds to start before health checks
- `--retries=3`: Mark unhealthy after 3 consecutive failures

## Implementing Health Checks

### Express.js Example

```typescript
// In your Express app setup (src/index.ts)

import express from 'express';

const app = express();

// Health check endpoint (should be first)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: process.env.SERVICE_NAME || 'unknown',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  });
});

// Other routes...
app.listen(process.env.PORT || 4000, () => {
  console.log(`Service running on port ${process.env.PORT || 4000}`);
});
```

### Advanced Health Check

For services with dependencies (database, cache, etc.):

```typescript
// Check service readiness with dependencies
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseConnection();

    // Check cache connection
    const cacheHealthy = await checkRedisConnection();

    if (dbHealthy && cacheHealthy) {
      res.status(200).json({
        status: 'healthy',
        service: process.env.SERVICE_NAME || 'unknown',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: 'ok',
          cache: 'ok'
        }
      });
    } else {
      res.status(503).json({
        status: 'degraded',
        service: process.env.SERVICE_NAME || 'unknown',
        dependencies: {
          database: dbHealthy ? 'ok' : 'down',
          cache: cacheHealthy ? 'ok' : 'down'
        }
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: process.env.SERVICE_NAME || 'unknown',
      error: error.message
    });
  }
});
```

## Service-Specific Health Checks

Each of the 31 services should implement `/health` with appropriate dependency checks:

### Required Dependencies by Service Type

**Database-dependent services:**
- auth-service, user-service, pharmacy-service, prescription-service, etc.
- Check: PostgreSQL connection + query execution

**Cache-dependent services:**
- notification-service, messaging-service, analytics-service, etc.
- Check: Redis connection + key access

**External API services:**
- esante-service, insurance-service, payment-service
- Check: API availability + timeout handling

**Stateless services:**
- delivery-service (GPS only), digital-twin-service
- Minimal checks: Process running + memory available

## Health Check Implementation Checklist

For each service, verify:

- [ ] `/health` endpoint implemented
- [ ] Returns HTTP 200 on success
- [ ] Returns JSON response
- [ ] No authentication required for health check
- [ ] Includes service name in response
- [ ] Checks critical dependencies
- [ ] Fails fast on errors (< 1 second timeout)
- [ ] Tested with: `curl http://localhost:PORT/health`

## Verifying Health Checks

### Check Running Service

```bash
# Using curl
curl http://localhost:4000/health

# Using docker exec
docker exec metapharm-auth-service curl -s http://localhost:4000/health

# Monitor health status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Docker Health Status

```bash
# Check individual container health
docker inspect metapharm-auth-service --format='{{.State.Health.Status}}'

# Output examples:
# "healthy"    - All is well
# "unhealthy"  - Health check failing
# "starting"   - Within start period, not yet checked
# "none"       - No health check configured
```

### Monitoring Health Over Time

```bash
# Watch health logs
docker inspect metapharm-auth-service --format='{{json .State.Health}}' | jq '.Log[-3:]'

# Continuous monitoring
watch 'docker ps --format "table {{.Names}}\t{{.Status}}"'
```

## Troubleshooting Health Checks

### Health Check Returning 500 Error

**Symptom**: `docker ps` shows "unhealthy"

**Debugging:**
```bash
# Check service logs
docker logs metapharm-auth-service | tail -50

# Check endpoint directly
docker exec metapharm-auth-service curl -v http://localhost:4000/health

# Check if endpoint exists
docker exec metapharm-auth-service curl -v http://localhost:4000/health 2>&1 | grep -E "(< HTTP|Connection)"
```

**Solutions:**
1. Verify `/health` route is implemented
2. Check service starts before health check (start-period=40s)
3. Ensure endpoint doesn't require authentication
4. Add error handling in health check handler

### Health Check Timeout

**Symptom**: Health checks taking > 10 seconds

**Debugging:**
```bash
# Measure response time
time docker exec metapharm-auth-service curl http://localhost:4000/health

# Check database/cache performance
docker logs metapharm-auth-service | grep "health check"
```

**Solutions:**
1. Optimize dependency checks (add timeouts)
2. Use simple checks in health endpoint
3. Avoid expensive queries in health check
4. Check database/cache is responsive

### Services Restarting Constantly

**Symptom**: Docker keeps restarting container (unhealthy)

**Debugging:**
```bash
# Check restart count
docker inspect metapharm-auth-service --format='{{.RestartCount}}'

# Check health history
docker inspect metapharm-auth-service --format='{{json .State.Health.Log}}' | jq '.' | tail -20
```

**Solutions:**
1. Increase `start-period` (allow more startup time)
2. Check database is ready before service starts
3. Verify environment variables are set
4. Check logs for initialization errors

## Health Check Performance

### Expected Response Times

| Service Type | Typical Response | Acceptable Range |
|--------------|------------------|------------------|
| Stateless | 50ms | 50-200ms |
| Database-backed | 100-150ms | 100-300ms |
| Cache-backed | 75-125ms | 75-250ms |
| API-dependent | 200-500ms | 200-1000ms |

### Monitoring Health Check Performance

```bash
# Get average health check duration
docker inspect metapharm-auth-service --format='{{json .State.Health.Log}}' | \
  jq '[.[] | .ExitCode as $code | .Output |
    if ($code == 0) then "ok" else "fail" end]'
```

## Docker Compose Health Checks

In `docker-compose.yml`, services include health checks:

```yaml
services:
  auth-service:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
```

### Wait for Service Health

```bash
# Wait for all services to be healthy
docker-compose up -d
docker-compose ps

# Check specific service
docker-compose logs auth-service | grep -i health
```

## Best Practices

1. **Keep health checks simple**: Avoid complex logic
2. **Add timeouts to external calls**: Use 500ms timeout
3. **Cache dependency checks**: Don't query database on every check
4. **Log failures**: Help debugging with clear error messages
5. **Monitor health metrics**: Track health check frequency
6. **Test locally**: Verify `curl http://localhost:PORT/health` works
7. **Document dependencies**: List all services checked
8. **Handle graceful shutdown**: Prepare for SIGTERM

## References

- [Docker Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Docker Compose Health Checks](https://docs.docker.com/compose/compose-file/compose-file-v3/#healthcheck)
- [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) (future migration)
