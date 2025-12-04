# MetaPharm Connect Docker Compose Guide

Complete Docker Compose configuration for the entire MetaPharm Connect platform with support for development, testing, and production environments.

## Overview

The platform consists of:
- **31 Backend Services** (ports 4000-4030)
- **3 Frontend Services** (ports 3000-3002)
- **Infrastructure**: PostgreSQL 16, Redis 7, Jaeger (observability)

## Files

### `docker-compose.yml` (Base Configuration)

The main configuration file with all 35 services (31 backend + 3 frontend + infrastructure). Suitable for:
- Production baseline
- Service definitions
- Network and volume configuration
- Default health checks

### `docker-compose.dev.yml` (Development Overrides)

Development-specific enhancements:
- Volume mounts for hot reload (source code synchronization)
- Debug ports for Node.js debugging (ports 9229-9259)
- Environment variables for debugging
- Enhanced logging configuration

**Usage:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### `docker-compose.test.yml` (CI/Testing Configuration)

CI pipeline optimization:
- Ephemeral database (no persistence)
- Fast health check intervals (5s instead of 30s)
- Minimal logging to speed up tests
- Test-specific environment variables
- Alternative ports to avoid conflicts

**Usage:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.test.yml up
```

### `docker-compose.prod.yml` (Production Configuration)

Production deployment configuration:
- Pre-built Docker images (no local builds)
- Resource limits and reservations
- Multiple replicas for high-demand services
- Production logging with rotation
- Secrets from environment variables
- Persistent volume management

**Usage:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

**Environment Variables (Production):**
```bash
REGISTRY=docker.io/metapharm                    # Docker registry
IMAGE_TAG=v1.0.0                               # Image tag
POSTGRES_PASSWORD=<secure-password>             # PostgreSQL password
REDIS_PASSWORD=<secure-password>                # Redis password
JWT_SECRET=<secure-secret>                      # JWT secret
JWT_REFRESH_SECRET=<secure-secret>              # JWT refresh secret
API_URL=https://api.metapharm.local            # API endpoint
API_GATEWAY_URL=https://api.metapharm.local/api # API gateway endpoint
ORCHESTRATOR_URL=https://orchestrator.metapharm.local # Orchestrator URL
```

## Service Categories

### Backend Services

#### High-Demand Services (2+ replicas in production)

- **api-gateway** (4000) - Load balanced, 2 replicas
- **pharmacy-service** (4003) - Core business logic, 2 replicas
- **prescription-service** (4004) - High frequency, 2 replicas
- **delivery-service** (4010) - GPS/tracking intensive, 2 replicas
- **ecommerce-service** (4013) - E-commerce platform, 2 replicas
- **inventory-service** (4016) - QR code scanning, 2 replicas
- **messaging-service** (4019) - Real-time messaging, 2 replicas
- **notification-service** (4020) - High frequency notifications, 2 replicas
- **order-service** (4022) - Transactional, 2 replicas
- **patient-service** (4023) - Frequently accessed, 2 replicas
- **payment-service** (4024) - Critical business logic, 2 replicas
- **teleconsultation-service** (4028) - Real-time video, 3 replicas
- **voice-service** (4030) - Real-time voice, 2 replicas

#### Standard Services (1 replica in production)

Remaining 18 services with standard resource allocation:
adherence-service, analytics-service, appointment-service, calendar-service,
controlled-substance-service, digital-twin-service, doctor-service,
esante-service, insurance-service, marketing-service, medical-records-service,
nurse-service, recycling-service, refill-service, subscription-service,
user-service, auth-service, vip-service

### Frontend Services

- **web** (3000) - React/Vite application
- **dashboard-v2** (3001) - Next.js admin dashboard
- **bazinga-dashboard** (3002) - Orchestration dashboard

### Infrastructure Services

- **postgres** (5432) - PostgreSQL database
- **redis** (6379) - Redis cache and messaging
- **jaeger** (6831, 4318, 16686) - Distributed tracing

## Quick Start

### Development Environment

```bash
# Start all services with hot reload and debugging
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f

# Debug a specific service
docker-compose logs api-gateway

# Access services
curl http://localhost:4000/health          # API Gateway
curl http://localhost:3000                 # Web App
curl http://localhost:3001                 # Dashboard
curl http://localhost:16686                # Jaeger Tracing
```

### Testing Environment

```bash
# Start services for CI testing
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d

# Run tests against services
npm test

# Clean up
docker-compose -f docker-compose.yml -f docker-compose.test.yml down -v
```

### Production Deployment

```bash
# Set environment variables
export REGISTRY=docker.io/metapharm
export IMAGE_TAG=v1.0.0
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 32)
export JWT_SECRET=$(openssl rand -base64 32)

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Monitor health
docker-compose ps
```

## Service Health Checks

All services include health checks to ensure they're ready before dependent services start:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
  interval: 30s          # Production: 30s, Dev: 10s, Test: 5s
  timeout: 10s
  retries: 3
  start_period: 40s      # Time to allow startup before first check
```

## Networking

All services communicate through the `metapharm-network` bridge network:

```
┌─────────────────────────────────────────────────────┐
│                 metapharm-network                    │
├─────────────────────────────────────────────────────┤
│ API Gateway → Auth → User → Pharmacy → Prescription  │
│ Frontend ← → API Gateway ← → Backend Services       │
│ All Services → PostgreSQL, Redis, Jaeger            │
└─────────────────────────────────────────────────────┘
```

DNS resolution within the network uses service names:
```
postgresql://metapharm:password@postgres:5432/metapharm_db
redis://redis:6379
http://messaging-service:4000/api/messages
```

## Persistent Volumes

### Development & Production

- **postgres_data** - PostgreSQL database files
- **redis_data** - Redis persistence files

### Production Only

- **./backups/postgres** - PostgreSQL backups
- **./backups/redis** - Redis backups

## Resource Limits

### Development Environment

No resource limits (unrestricted CPU/memory)

### Production Environment

**API Gateway (High-traffic):**
```yaml
limits:
  cpus: '1'
  memory: 512M
reservations:
  cpus: '0.5'
  memory: 256M
```

**PostgreSQL (Infrastructure):**
```yaml
limits:
  cpus: '2'
  memory: 2G
reservations:
  cpus: '1'
  memory: 1G
```

**Standard Backend Services:**
```yaml
limits:
  cpus: '0.5'
  memory: 256M
reservations:
  cpus: '0.25'
  memory: 128M
```

## Debugging

### Enable Debug Mode

For development, debug ports are exposed:

```bash
# Connect debugger to any service
# Example: api-gateway uses port 9229 (localhost:9229)
# Use Chrome DevTools or VS Code debugger

# Port mapping:
# api-gateway: 9229
# auth-service: 9230
# user-service: 9231
# pharmacy-service: 9232
# ... and so on
```

### View Service Logs

```bash
# All services
docker-compose logs

# Follow logs
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway

# Last 100 lines
docker-compose logs --tail 100
```

### Inspect Running Container

```bash
# List running containers
docker-compose ps

# Execute command in container
docker-compose exec api-gateway sh

# View container details
docker-compose exec postgres psql -U metapharm -d metapharm_db
```

## Monitoring

### Jaeger Distributed Tracing

Access at `http://localhost:16686` to view:
- Service dependencies
- Request traces
- Performance metrics

### Database Monitoring

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U metapharm -d metapharm_db

# Common queries
\dt                          # List tables
SELECT * FROM pg_stat_activity;  # View connections
```

### Redis Monitoring

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Commands
INFO                         # Server info
KEYS *                       # List keys
DBSIZE                       # Database size
MONITOR                      # Monitor commands
```

## Environment-Specific Considerations

### Development

- Services rebuild from source on each start
- Hot reload enabled via volume mounts
- Debug mode active
- All logs output to console
- No resource limits

### Testing

- Ephemeral database (cleaned between runs)
- Faster startup times
- Minimal logging
- Alternative ports (5433 for postgres, 6380 for redis)
- Fast health checks (5s intervals)

### Production

- Pre-built images from registry
- Resource limits enforced
- High availability via replicas
- Secure credentials from environment
- Persistent data storage
- Log rotation enabled
- Multiple replica counts for critical services

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Remove all data
docker-compose down -v

# Restart service
docker-compose restart api-gateway

# Scale service (development only)
docker-compose up -d --scale pharmacy-service=3

# View resource usage
docker stats

# Build images
docker-compose build

# Pull images
docker-compose pull

# View configuration (after merges)
docker-compose config
```

## Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs service-name

# Common issues:
# - Port already in use: Change port mapping
# - Missing dependencies: Check depends_on
# - Health check failing: Wait longer or adjust check
```

### Database connection errors

```bash
# Test connection
docker-compose exec postgres pg_isready -U metapharm

# Reset database
docker-compose down -v
docker-compose up postgres
```

### Redis connection errors

```bash
# Test connection
docker-compose exec redis redis-cli ping

# Check password
docker-compose exec redis redis-cli -a $REDIS_PASSWORD
```

### Port conflicts

```bash
# Find process using port
lsof -i :4000

# Use alternative docker-compose with different ports
# Edit docker-compose.yml ports section
```

## Performance Tips

1. **Development**: Use volume mounts for source code
2. **Testing**: Use ephemeral database for speed
3. **Production**: Use pre-built images, enable replicas
4. **Monitoring**: Always run Jaeger for production traces
5. **Scaling**: Use docker-compose up --scale for load testing

## Security

### Development

- Use weak development passwords
- No TLS/SSL
- Debug mode enabled

### Production

- Use strong, random passwords
- Enable TLS/SSL with reverse proxy
- Use secrets manager (not environment variables)
- Enable authentication on Redis
- Use secure JWT secrets
- Regular backups

## Support

For issues with Docker Compose configuration, see:
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- MetaPharm Connect Architecture Documentation
- Service-specific README files in backend/services/
