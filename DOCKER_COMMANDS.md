# Docker Compose Quick Commands

Quick reference for MetaPharm Connect Docker operations.

## Development

### Start Development Environment
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway

# Last 100 lines
docker-compose logs --tail 100 api-gateway
```

### Access Services

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:4000/health |
| Web App | http://localhost:3000 |
| Dashboard | http://localhost:3001 |
| Bazinga Dashboard | http://localhost:3002 |
| Jaeger | http://localhost:16686 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Debug a Service

```bash
# Connect debugger to api-gateway (port 9229)
# In Chrome: chrome://inspect
# In VS Code: Add to .vscode/launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Attach api-gateway",
  "port": 9229,
  "protocol": "inspector"
}
```

### Restart Service
```bash
docker-compose restart api-gateway
```

### Execute Commands in Container
```bash
# PostgreSQL
docker-compose exec postgres psql -U metapharm -d metapharm_db

# Redis
docker-compose exec redis redis-cli

# Any service shell
docker-compose exec api-gateway sh
```

### Stop All Services
```bash
docker-compose down
```

### Remove All Data
```bash
docker-compose down -v
```

## Testing (CI Pipeline)

### Start Test Environment
```bash
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
```

### Verify Services are Ready
```bash
docker-compose ps
```

### Run Tests
```bash
npm test
```

### Check Specific Service
```bash
# API Gateway health
curl http://localhost:4000/health

# API Gateway with timeout
curl -m 5 http://localhost:4000/health
```

### View Test Logs
```bash
docker-compose logs --tail 50 api-gateway
```

### Clean Up After Tests
```bash
docker-compose -f docker-compose.yml -f docker-compose.test.yml down -v
```

## Production

### Prepare Environment Variables

```bash
# Create .env file
cat > .env << EOF
REGISTRY=docker.io/metapharm
IMAGE_TAG=v1.0.0
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
API_URL=https://api.metapharm.local
API_GATEWAY_URL=https://api.metapharm.local/api
ORCHESTRATOR_URL=https://orchestrator.metapharm.local
EOF
```

### Start Production Services
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Monitor Services
```bash
# List running containers
docker-compose ps

# View service status
docker-compose ps --services

# Get resource usage
docker stats

# Check service health
docker-compose exec postgres pg_isready -U metapharm
docker-compose exec redis redis-cli ping
```

### View Production Logs
```bash
# Real-time logs
docker-compose logs -f --tail 50

# Specific service with timestamp
docker-compose logs --timestamps api-gateway | tail -20
```

### Update Service Image
```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

### Backup Database
```bash
# PostgreSQL dump
docker-compose exec postgres pg_dump -U metapharm metapharm_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U metapharm metapharm_db < backup.sql
```

## Maintenance

### Check Service Status
```bash
# Full status
docker-compose ps

# Pretty format
docker-compose ps --format "table {{.Service}}\t{{.State}}\t{{.Ports}}"
```

### View Configuration
```bash
# Merged configuration (all overrides applied)
docker-compose config | head -100

# Save merged config
docker-compose config > merged-compose.yml
```

### Rebuild Images
```bash
# Build all
docker-compose build

# Build specific service
docker-compose build api-gateway

# Build without cache
docker-compose build --no-cache
```

### Update All Services
```bash
# Pull new images
docker-compose pull

# Restart services
docker-compose up -d
```

## Troubleshooting

### Service Fails to Start

```bash
# View detailed logs
docker-compose logs api-gateway

# Check if port is in use
lsof -i :4000

# Verify health check
docker-compose exec api-gateway curl http://localhost:4000/health
```

### Database Connection Issues

```bash
# Test PostgreSQL
docker-compose exec postgres pg_isready -U metapharm

# Test Redis
docker-compose exec redis redis-cli ping

# Check environment variables
docker-compose exec api-gateway env | grep DATABASE_URL
```

### Memory/CPU Issues

```bash
# Check resource usage
docker stats

# View container resource limits
docker inspect <container_id> | grep -A 10 "HostConfig"

# Increase resource limits in docker-compose.prod.yml
```

### Network Issues

```bash
# Test internal DNS
docker-compose exec api-gateway nslookup postgres

# Test connectivity
docker-compose exec api-gateway curl http://postgres:5432

# View network info
docker network inspect metapharm-network
```

## Performance

### Monitor Active Connections

```bash
# PostgreSQL connections
docker-compose exec postgres psql -U metapharm -d metapharm_db -c \
  "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Redis connections
docker-compose exec redis redis-cli CLIENT LIST
```

### Analyze Performance

```bash
# PostgreSQL slow queries
docker-compose exec postgres psql -U metapharm -d metapharm_db -c \
  "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check indexes
docker-compose exec postgres psql -U metapharm -d metapharm_db -c \
  "SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;"
```

### Scale Services (Development)

```bash
# Scale pharmacy-service to 3 replicas
docker-compose up -d --scale pharmacy-service=3

# Note: Production scaling uses docker-compose.prod.yml replicas configuration
```

## Useful Aliases

Add to `.bash_profile` or `.bashrc`:

```bash
# Development
alias dca-dev='docker-compose -f docker-compose.yml -f docker-compose.dev.yml'
alias dca-test='docker-compose -f docker-compose.yml -f docker-compose.test.yml'
alias dca-prod='docker-compose -f docker-compose.yml -f docker-compose.prod.yml'

# Common commands
alias dc-up='docker-compose up -d'
alias dc-down='docker-compose down'
alias dc-logs='docker-compose logs -f'
alias dc-ps='docker-compose ps'
alias dc-restart='docker-compose restart'
alias dc-clean='docker-compose down -v'

# Usage
# dca-dev up -d
# dca-test ps
# dc-logs api-gateway
```

## Environment Files

### Development (.env.dev)
```
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=metapharm:*
```

### Testing (.env.test)
```
NODE_ENV=test
LOG_LEVEL=error
DATABASE_URL=postgresql://metapharm:test_password@postgres:5432/metapharm_test
```

### Production (.env.prod)
```
NODE_ENV=production
LOG_LEVEL=info
POSTGRES_PASSWORD=<random-secure-password>
REDIS_PASSWORD=<random-secure-password>
JWT_SECRET=<random-secure-secret>
API_URL=https://api.metapharm.local
```

## Port Reference

### Backend Services
- 4000: api-gateway
- 4001: auth-service
- 4002: user-service
- 4003: pharmacy-service
- 4004: prescription-service
- 4005: adherence-service
- 4006: analytics-service
- 4007: appointment-service
- 4008: calendar-service
- 4009: controlled-substance-service
- 4010: delivery-service
- 4011: digital-twin-service
- 4012: doctor-service
- 4013: ecommerce-service
- 4014: esante-service
- 4015: insurance-service
- 4016: inventory-service
- 4017: marketing-service
- 4018: medical-records-service
- 4019: messaging-service
- 4020: notification-service
- 4021: nurse-service
- 4022: order-service
- 4023: patient-service
- 4024: payment-service
- 4025: recycling-service
- 4026: refill-service
- 4027: subscription-service
- 4028: teleconsultation-service
- 4029: vip-service
- 4030: voice-service

### Frontend Services
- 3000: web (React/Vite)
- 3001: dashboard-v2 (Next.js)
- 3002: bazinga-dashboard (Orchestration)

### Infrastructure
- 5432: PostgreSQL
- 6379: Redis
- 6831: Jaeger (UDP)
- 4318: Jaeger (OTLP)
- 16686: Jaeger UI

### Debug Ports
- 9229: api-gateway
- 9230: auth-service
- 9231: user-service
- ... (9232-9259 for remaining backend services)

## Documentation

For detailed information, see:
- `DOCKER_COMPOSE_GUIDE.md` - Comprehensive guide
- `docker-compose.yml` - Base configuration
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.test.yml` - CI/Testing configuration
- `docker-compose.prod.yml` - Production deployment
