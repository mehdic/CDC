# Docker Quick Start Guide

## TL;DR - 30 Second Setup

```bash
# 1. Navigate to backend directory
cd /Users/mchaouachi/IdeaProjects/CDC/backend

# 2. Build TypeScript
npm run build

# 3. Build a service
docker build --build-arg SERVICE_NAME=auth-service -t metapharm/auth-service .

# 4. Run it
docker run -d -p 4001:4000 \
  -e DATABASE_URL=postgresql://user:pass@localhost/db \
  -e JWT_SECRET=dev-secret \
  metapharm/auth-service

# 5. Check health
curl http://localhost:4001/health
```

## Build Commands Cheat Sheet

```bash
# Build single service
docker build --build-arg SERVICE_NAME=auth-service -t metapharm/auth-service:latest .

# Build with custom tag
docker build --build-arg SERVICE_NAME=auth-service -t metapharm/auth-service:v1.0.0 .

# Build all services (use script)
./scripts/build-all-docker-services.sh metapharm-connect latest

# Test specific services
./scripts/test-docker-build.sh metapharm-connect
```

## Run Commands Cheat Sheet

```bash
# Run service with environment variables
docker run -d --name auth-service \
  -p 4001:4000 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/db \
  -e JWT_SECRET=secret \
  metapharm/auth-service:latest

# Run with docker-compose (5 core services)
docker-compose up -d

# Run specific service from compose
docker-compose up -d auth-service

# Stop all services
docker-compose down
```

## Management Commands

```bash
# List running containers
docker ps

# Check health status
docker inspect <container> --format='{{.State.Health.Status}}'

# View service logs
docker logs <container>

# Follow logs in real time
docker logs -f <container>

# Execute command in container
docker exec <container> curl http://localhost:4000/health

# Stop container
docker stop <container>

# Remove container
docker rm <container>

# Remove image
docker rmi <image>
```

## Build Arguments

| Argument | Default | Purpose |
|----------|---------|---------|
| SERVICE_NAME | api-gateway | Which service to build |
| NODE_ENV | production | Environment (production/development) |

Example: `--build-arg SERVICE_NAME=auth-service --build-arg NODE_ENV=development`

## Environment Variables (Required at Runtime)

| Variable | Required For | Example |
|----------|--------------|---------|
| DATABASE_URL | Most services | postgresql://user:pass@host:5432/db |
| JWT_SECRET | auth-service, api-gateway | your-secret-key |
| REDIS_URL | Cache services | redis://host:6379 |
| PORT | All (optional) | 4000 (default) |

## All 31 Services

```
adherence-service, analytics-service, api-gateway, appointment-service,
auth-service, calendar-service, controlled-substance-service, delivery-service,
digital-twin-service, doctor-service, ecommerce-service, esante-service,
insurance-service, inventory-service, marketing-service, medical-records-service,
messaging-service, notification-service, nurse-service, order-service,
patient-service, payment-service, pharmacy-service, prescription-service,
recycling-service, refill-service, subscription-service, teleconsultation-service,
user-service, vip-service, voice-service
```

## Verify Installation

```bash
# Check Docker is installed
docker --version

# Check Docker daemon is running
docker ps

# Verify npm/Node
node --version
npm --version
```

## Common Issues

| Issue | Solution |
|-------|----------|
| `Cannot connect to Docker daemon` | Start Docker Desktop or `sudo systemctl start docker` |
| `Service not found at dist/services/...` | Run `npm run build` first |
| `Port already in use` | Use different port: `-p 4001:4000` |
| `Health check failing` | Verify service has `/health` endpoint |
| `Module not found` | Run `npm install` before building |

## Quick Test

```bash
# Full workflow test
cd /Users/mchaouachi/IdeaProjects/CDC/backend
npm run build
docker build --build-arg SERVICE_NAME=api-gateway -t test-api:latest .
docker run -d --name test-api -p 4000:4000 test-api:latest
sleep 5
curl http://localhost:4000/health
docker stop test-api
docker rm test-api
```

## Docker Compose (Local Dev)

```bash
# Start everything
docker-compose up -d

# View status
docker ps

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Next Steps

1. Read DOCKER_BUILD_GUIDE.md for detailed information
2. Read HEALTH_CHECK_SETUP.md for health endpoint requirements
3. Check DOCKER_IMPLEMENTATION_STATUS.md for current status
4. Use docker-compose.yml for local development

## Files Reference

- **Dockerfile**: `/Users/mchaouachi/IdeaProjects/CDC/backend/Dockerfile`
- **docker-compose.yml**: `/Users/mchaouachi/IdeaProjects/CDC/docker-compose.yml`
- **Build script**: `/Users/mchaouachi/IdeaProjects/CDC/backend/scripts/build-all-docker-services.sh`
- **Test script**: `/Users/mchaouachi/IdeaProjects/CDC/backend/scripts/test-docker-build.sh`

## Support

For issues or questions:
1. Check Docker logs: `docker logs <container>`
2. Inspect container: `docker inspect <container>`
3. Read detailed guides in DOCKER_BUILD_GUIDE.md
4. Check HEALTH_CHECK_SETUP.md for health endpoints
