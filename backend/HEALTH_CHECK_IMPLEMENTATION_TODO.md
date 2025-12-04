# Health Check Implementation TODO

## Status

**26/31 services** have health endpoints implemented.
**5/31 services** need health check endpoints added.

## Services Requiring Health Endpoint Implementation

### 1. adherence-service
**Location**: `backend/services/adherence-service/src/index.ts`

**Implementation**:
```typescript
import express, { Request, Response } from 'express';

const app = express();

// Add this health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'adherence-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rest of your routes...
```

**Priority**: High - Critical for medication adherence tracking

---

### 2. calendar-service
**Location**: `backend/services/calendar-service/src/index.ts`

**Implementation**:
```typescript
import express, { Request, Response } from 'express';

const app = express();

// Add this health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'calendar-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rest of your routes...
```

**Priority**: Medium - Used for appointment/event management

---

### 3. digital-twin-service
**Location**: `backend/services/digital-twin-service/src/index.ts`

**Implementation**:
```typescript
import express, { Request, Response } from 'express';

const app = express();

// Add this health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'digital-twin-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rest of your routes...
```

**Priority**: High - Critical for patient digital profiles

---

### 4. recycling-service
**Location**: `backend/services/recycling-service/src/index.ts`

**Implementation**:
```typescript
import express, { Request, Response } from 'express';

const app = express();

// Add this health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'recycling-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rest of your routes...
```

**Priority**: Medium - Medication recycling/disposal tracking

---

### 5. subscription-service
**Location**: `backend/services/subscription-service/src/index.ts`

**Implementation**:
```typescript
import express, { Request, Response } from 'express';

const app = express();

// Add this health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'subscription-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rest of your routes...
```

**Priority**: High - Critical for VIP subscription management

---

## Advanced Health Check (With Dependencies)

If your service depends on database or cache, use this pattern:

```typescript
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check if service is running
    const isRunning = true; // Always true if we got here

    // Optional: Check database
    // const dbHealthy = await checkDatabase();

    // Optional: Check cache
    // const cacheHealthy = await checkRedis();

    res.status(200).json({
      status: 'healthy',
      service: 'adherence-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      dependencies: {
        // database: dbHealthy ? 'ok' : 'down',
        // cache: cacheHealthy ? 'ok' : 'down'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'adherence-service',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

## Implementation Checklist

For each service, complete the following:

### adherence-service
- [ ] Add `/health` endpoint to `src/index.ts`
- [ ] Test: `npm run dev` and `curl http://localhost:4000/health`
- [ ] Verify returns HTTP 200
- [ ] Verify JSON response includes `status: 'healthy'`
- [ ] Commit changes

### calendar-service
- [ ] Add `/health` endpoint to `src/index.ts`
- [ ] Test: `npm run dev` and `curl http://localhost:4000/health`
- [ ] Verify returns HTTP 200
- [ ] Verify JSON response includes `status: 'healthy'`
- [ ] Commit changes

### digital-twin-service
- [ ] Add `/health` endpoint to `src/index.ts`
- [ ] Test: `npm run dev` and `curl http://localhost:4000/health`
- [ ] Verify returns HTTP 200
- [ ] Verify JSON response includes `status: 'healthy'`
- [ ] Commit changes

### recycling-service
- [ ] Add `/health` endpoint to `src/index.ts`
- [ ] Test: `npm run dev` and `curl http://localhost:4000/health`
- [ ] Verify returns HTTP 200
- [ ] Verify JSON response includes `status: 'healthy'`
- [ ] Commit changes

### subscription-service
- [ ] Add `/health` endpoint to `src/index.ts`
- [ ] Test: `npm run dev` and `curl http://localhost:4000/health`
- [ ] Verify returns HTTP 200
- [ ] Verify JSON response includes `status: 'healthy'`
- [ ] Commit changes

## Testing After Implementation

Once all health endpoints are added:

```bash
# Build TypeScript
npm run build

# Test one service with Docker
docker build --build-arg SERVICE_NAME=adherence-service \
  -t metapharm/adherence-service:test .

# Verify health check works
docker run -d --name test-adherence -p 4000:4000 metapharm/adherence-service:test
sleep 5
curl http://localhost:4000/health
docker stop test-adherence
docker rm test-adherence
```

Expected output:
```json
{
  "status": "healthy",
  "service": "adherence-service",
  "timestamp": "2025-12-04T14:30:00.000Z",
  "version": "1.0.0"
}
```

## Automated Testing

After all services are updated, run:

```bash
# Build and test all services
cd /Users/mchaouachi/IdeaProjects/CDC/backend
npm run build
./scripts/build-all-docker-services.sh metapharm-connect latest
```

## Docker Compose Update

Once all health endpoints are implemented, docker-compose.yml can be expanded to include all 31 services following this pattern:

```yaml
your-service-name:
  build:
    context: ./backend
    dockerfile: Dockerfile
    args:
      SERVICE_NAME: your-service-name
      NODE_ENV: development
  container_name: metapharm-your-service
  environment:
    NODE_ENV: development
    PORT: 4000
    SERVICE_NAME: your-service-name
    DATABASE_URL: postgresql://metapharm:metapharm_dev_password@postgres:5432/metapharm_db
  ports:
    - "400X:4000"
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
  networks:
    - metapharm-network
```

## Verification After Completion

```bash
# Quick verification - ensure all services have health endpoint
grep -l "'/health'" /Users/mchaouachi/IdeaProjects/CDC/backend/services/*/src/index.ts | wc -l

# Should output: 31

# Detailed verification
grep -l "'/health'" /Users/mchaouachi/IdeaProjects/CDC/backend/services/*/src/index.ts | \
  sed 's|.*/\(.*\)/src.*|\1|' | sort
```

All 31 services should be listed.

## Documentation References

- Detailed implementation guide: `HEALTH_CHECK_SETUP.md`
- Examples from existing services: Check `analytics-service`, `api-gateway`, or `auth-service`
- Testing: `DOCKER_BUILD_GUIDE.md` → "Health Checks" section

## Timeline Estimate

- **Per service**: 5-10 minutes
- **Total for 5 services**: 25-50 minutes
- **Testing**: 10-15 minutes
- **Total**: ~1 hour

## Priority Order

1. **adherence-service** (Critical - medication tracking)
2. **digital-twin-service** (Critical - patient profiles)
3. **subscription-service** (Critical - VIP program)
4. **calendar-service** (Medium - appointments)
5. **recycling-service** (Medium - disposal tracking)

---

**Next Step**: Implement health endpoints following the examples above, then verify with:
```bash
npm run build && ./scripts/test-docker-build.sh metapharm-connect
```
