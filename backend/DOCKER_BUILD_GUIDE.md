# Docker Build Guide - MetaPharm Connect Backend

## Overview

The MetaPharm Connect backend consists of 31 independent microservices, each buildable as a separate Docker container using a unified multi-stage Dockerfile.

### Key Features

- **Single Dockerfile for all services**: Uses `SERVICE_NAME` build argument to build any service
- **Multi-stage build**: Optimized for small, production-ready images (~200-300 MB per service)
- **Security best practices**: Non-root user execution, minimal base image (Alpine)
- **Health checks**: Automatic health check configuration
- **Environment flexibility**: Support for different NODE_ENV settings

## Building Services

### Build All Services

```bash
# Build all 31 services (useful for CI/CD)
cd /Users/mchaouachi/IdeaProjects/CDC/backend

# Compile all TypeScript to JavaScript
npm run build

# Build Docker images for all services
for service in \
  adherence-service \
  analytics-service \
  api-gateway \
  appointment-service \
  auth-service \
  calendar-service \
  controlled-substance-service \
  delivery-service \
  digital-twin-service \
  doctor-service \
  ecommerce-service \
  esante-service \
  insurance-service \
  inventory-service \
  marketing-service \
  medical-records-service \
  messaging-service \
  notification-service \
  nurse-service \
  order-service \
  patient-service \
  payment-service \
  pharmacy-service \
  prescription-service \
  recycling-service \
  refill-service \
  subscription-service \
  teleconsultation-service \
  user-service \
  vip-service \
  voice-service
do
  docker build --build-arg SERVICE_NAME=$service -t metapharm-connect/$service:latest .
done
```

### Build Single Service

```bash
# Example: Build auth-service
cd /Users/mchaouachi/IdeaProjects/CDC/backend

# Ensure TypeScript is built first
npm run build

# Build the Docker image
docker build \
  --build-arg SERVICE_NAME=auth-service \
  -t metapharm-connect/auth-service:latest \
  .
```

### Build Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `SERVICE_NAME` | `api-gateway` | Name of the service to build (must match directory name in `backend/services/`) |
| `NODE_ENV` | `production` | Node environment (production, development, staging) |

### Example: Build Multiple Services

```bash
# Build auth and user services
docker build --build-arg SERVICE_NAME=auth-service -t metapharm/auth-service:latest .
docker build --build-arg SERVICE_NAME=user-service -t metapharm/user-service:latest .

# Build with custom environment
docker build \
  --build-arg SERVICE_NAME=auth-service \
  --build-arg NODE_ENV=staging \
  -t metapharm/auth-service:staging \
  .
```

## Running Services

### Run Container

```bash
# Run auth-service on port 4001
docker run \
  -d \
  --name auth-service \
  -p 4001:4000 \
  -e PORT=4000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:password@db:5432/metapharm \
  metapharm-connect/auth-service:latest

# Check health
docker inspect --format='{{.State.Health.Status}}' auth-service
```

### Environment Variables

All services support these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Service port |
| `NODE_ENV` | `production` | Environment (production, development) |
| `SERVICE_NAME` | `[auto-detected]` | Service identifier |
| `DATABASE_URL` | Required | PostgreSQL connection string |
| `REDIS_URL` | Optional | Redis connection string |
| `JWT_SECRET` | Required | JWT signing secret |
| `LOG_LEVEL` | `info` | Logging level |

Service-specific environment variables are documented in each service's README.

## Service List (31 Total)

```
1. adherence-service           - Medication adherence tracking
2. analytics-service           - Analytics and reporting
3. api-gateway                 - Main API gateway
4. appointment-service         - Appointment scheduling
5. auth-service                - Authentication & authorization
6. calendar-service            - Calendar management
7. controlled-substance-service - Controlled substance tracking
8. delivery-service            - Delivery logistics
9. digital-twin-service        - Patient digital twin profiles
10. doctor-service             - Doctor features & records
11. ecommerce-service          - E-commerce & OTC products
12. esante-service             - Swiss cantonal health records
13. insurance-service          - Insurance integration
14. inventory-service          - Pharmacy inventory
15. marketing-service          - Marketing & promotions
16. medical-records-service    - Medical records management
17. messaging-service          - Inter-professional messaging
18. notification-service       - Push notifications
19. nurse-service              - Nurse features & orders
20. order-service              - Order management
21. patient-service            - Patient profiles & features
22. payment-service            - Payment processing
23. pharmacy-service           - Pharmacy operations
24. prescription-service       - Prescription processing
25. recycling-service          - Medication recycling
26. refill-service             - Prescription refills
27. subscription-service       - VIP subscriptions
28. teleconsultation-service   - Video consultations
29. user-service               - User account management
30. vip-service                - VIP program management
31. voice-service              - Voice & telephony features
```

## Docker Image Details

### Image Composition

1. **Dependencies Stage**: Installs build tools and all npm dependencies
2. **Builder Stage**: Compiles TypeScript to JavaScript
3. **Production Stage**:
   - Minimal Alpine-based runtime
   - Only production dependencies
   - Non-root nodejs user
   - Health check endpoint monitoring
   - Startup script to load correct service

### Image Size

Typical image sizes:
- Base node:20-alpine: ~150 MB
- With dependencies: ~200-300 MB per service
- Total with shared code: ~250-350 MB

### Security Features

- Non-root user (`nodejs`) runs all processes
- Alpine Linux base for minimal attack surface
- Production dependencies only (no dev tools)
- Health checks prevent unhealthy containers
- Read-only root filesystem option available

## Health Checks

Each service must implement a `/health` endpoint that returns:

```json
{
  "status": "healthy",
  "service": "auth-service",
  "timestamp": "2025-12-04T10:00:00Z"
}
```

The Dockerfile's health check:
- Checks `/health` endpoint on startup
- Verifies HTTP 200 status code
- Runs every 30 seconds
- Timeout: 10 seconds
- Start period: 40 seconds (allows service startup time)

### Verify Health Check

```bash
# Check service health
docker exec auth-service curl -s http://localhost:4000/health

# Monitor health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Docker Compose Setup (Development)

See `docker-compose.yml` for local development with all services running together.

### Start All Services

```bash
docker-compose up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service

# Last 100 lines
docker-compose logs --tail=100 auth-service
```

### Stop Services

```bash
docker-compose down
```

## Troubleshooting

### Build Issues

**Issue**: `Service not found at dist/services/{service}/src/index.js`

**Solution**:
```bash
# Rebuild TypeScript
npm run build

# Verify service exists
ls -la dist/services/{service}/src/index.js
```

**Issue**: `Cannot find module '@shared/...'`

**Solution**: TypeScript paths need rebuilding
```bash
npm run build
# Includes: tsc && tsc-alias
```

### Runtime Issues

**Issue**: Container exits immediately

**Solution**: Check logs
```bash
docker logs <container-name>

# Common causes:
# - Service not found: Verify SERVICE_NAME matches directory name
# - Missing environment variables: Check DATABASE_URL, JWT_SECRET
# - Port already in use: Change PORT environment variable
```

**Issue**: Health check failing

**Solution**: Verify service has `/health` endpoint
```bash
# Check if endpoint responds
docker exec <container> curl -v http://localhost:4000/health

# View service startup logs
docker logs <container>
```

### Port Conflicts

```bash
# Find what's using port 4000
lsof -i :4000

# Use different port
docker run -p 4001:4000 metapharm-connect/auth-service:latest
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Microservices

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build auth-service
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          build-args: SERVICE_NAME=auth-service
          push: true
          tags: ${{ secrets.REGISTRY }}/auth-service:latest
```

### Local Build Script

```bash
#!/bin/bash
# build-all-services.sh

REGISTRY="metapharm-connect"

for service in adherence-service analytics-service api-gateway \
  appointment-service auth-service calendar-service \
  controlled-substance-service delivery-service digital-twin-service \
  doctor-service ecommerce-service esante-service insurance-service \
  inventory-service marketing-service medical-records-service \
  messaging-service notification-service nurse-service order-service \
  patient-service payment-service pharmacy-service prescription-service \
  recycling-service refill-service subscription-service \
  teleconsultation-service user-service vip-service voice-service
do
  echo "Building $service..."
  docker build --build-arg SERVICE_NAME=$service \
    -t $REGISTRY/$service:latest .

  if [ $? -eq 0 ]; then
    echo "✓ $service built successfully"
  else
    echo "✗ Failed to build $service"
    exit 1
  fi
done

echo "All services built successfully!"
```

## Performance Optimization

### Layer Caching

The Dockerfile is optimized for Docker layer caching:
1. Build dependencies change rarely → cached
2. Source code changes frequently → later layer
3. Only modified layers rebuild → faster builds

### Build Speed

Typical build times:
- Cold build (first time): 5-10 minutes
- Warm build (cached layers): 1-2 minutes
- Incremental build (code only): <30 seconds

### Reduce Image Size

For minimal images, consider:
```dockerfile
# Remove source maps in production
ENV NODE_OPTIONS=--disable-sourcemaps
```

## Best Practices

1. **Always rebuild after code changes**
   ```bash
   npm run build  # TypeScript → JavaScript
   docker build . # Docker image
   ```

2. **Use specific version tags**
   ```bash
   docker build -t metapharm/auth-service:v1.0.0 .
   ```

3. **Monitor health checks**
   ```bash
   docker ps  # Shows health status
   ```

4. **Set resource limits**
   ```bash
   docker run -m 512m --cpus=1 metapharm/auth-service:latest
   ```

5. **Use environment files**
   ```bash
   docker run --env-file .env.production metapharm/auth-service:latest
   ```

## References

- [Node.js Best Practices in Docker](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
