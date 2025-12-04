# MetaPharm Connect - Docker Services Inventory

Complete inventory of all services with their configurations and deployment specifications.

## Summary

| Category | Count | Ports | Configuration |
|----------|-------|-------|----------------|
| Backend Services | 31 | 4000-4030 | All with health checks, Redis/DB dependencies |
| Frontend Services | 3 | 3000-3002 | React/Vite and Next.js applications |
| Infrastructure | 3 | 5432, 6379, 6831/4318/16686 | PostgreSQL, Redis, Jaeger |
| **Total** | **37** | **65 unique ports** | **All syntactically valid** |

## Backend Services (31)

### Tier 1: Critical/High-Frequency Services (HA: 2-3 replicas in production)

| # | Service Name | Port | Replicas | CPU Limit | Memory Limit | Special Dependencies |
|---|---|---|---|---|---|---|
| 1 | api-gateway | 4000 | 2 | 1.0 | 512M | postgres, redis |
| 2 | pharmacy-service | 4003 | 2 | 1.0 | 512M | postgres, redis |
| 3 | prescription-service | 4004 | 2 | 1.0 | 512M | postgres, redis |
| 4 | delivery-service | 4010 | 2 | 1.0 | 512M | postgres, redis (GPS tracking) |
| 5 | ecommerce-service | 4013 | 2 | 1.0 | 512M | postgres, redis |
| 6 | inventory-service | 4016 | 2 | 1.0 | 512M | postgres, redis (QR scanning) |
| 7 | messaging-service | 4019 | 2 | 1.0 | 512M | postgres, redis (real-time) |
| 8 | notification-service | 4020 | 2 | 1.0 | 512M | postgres, redis, messaging-service |
| 9 | order-service | 4022 | 2 | 1.0 | 512M | postgres, redis (transactional) |
| 10 | patient-service | 4023 | 2 | 1.0 | 512M | postgres, redis (frequently accessed) |
| 11 | payment-service | 4024 | 2 | 1.0 | 512M | postgres, redis (critical) |
| 12 | teleconsultation-service | 4028 | 3 | 1.0 | 512M | postgres, redis, user-service, pharmacy-service (real-time video) |
| 13 | voice-service | 4030 | 2 | 1.0 | 512M | postgres, redis (real-time voice) |

### Tier 2: Standard Services (Single replica)

| # | Service Name | Port | Replicas | CPU Limit | Memory Limit | Dependencies |
|---|---|---|---|---|---|---|
| 14 | auth-service | 4001 | 1 | 0.5 | 256M | postgres, redis |
| 15 | user-service | 4002 | 1 | 0.5 | 256M | postgres, redis |
| 16 | adherence-service | 4005 | 1 | 0.5 | 256M | postgres, redis |
| 17 | analytics-service | 4006 | 1 | 0.5 | 256M | postgres, redis |
| 18 | appointment-service | 4007 | 1 | 0.5 | 256M | postgres, redis |
| 19 | calendar-service | 4008 | 1 | 0.5 | 256M | postgres, redis |
| 20 | controlled-substance-service | 4009 | 1 | 0.5 | 256M | postgres, redis |
| 21 | digital-twin-service | 4011 | 1 | 0.5 | 256M | postgres, redis |
| 22 | doctor-service | 4012 | 1 | 0.5 | 256M | postgres, redis |
| 23 | esante-service | 4014 | 1 | 0.5 | 256M | postgres, redis |
| 24 | insurance-service | 4015 | 1 | 0.5 | 256M | postgres, redis |
| 25 | marketing-service | 4017 | 1 | 0.5 | 256M | postgres, redis |
| 26 | medical-records-service | 4018 | 1 | 0.5 | 256M | postgres, redis |
| 27 | nurse-service | 4021 | 1 | 0.5 | 256M | postgres, redis |
| 28 | recycling-service | 4025 | 1 | 0.5 | 256M | postgres, redis |
| 29 | refill-service | 4026 | 1 | 0.5 | 256M | postgres, redis |
| 30 | subscription-service | 4027 | 1 | 0.5 | 256M | postgres, redis |
| 31 | vip-service | 4029 | 1 | 0.5 | 256M | postgres, redis |

## Frontend Services (3)

| # | Service Name | Port | Framework | Dependencies | Replicas |
|---|---|---|---|---|---|
| 1 | web | 3000 | React 18 / Vite | api-gateway | 2 (prod) |
| 2 | dashboard-v2 | 3001 | Next.js 14 | api-gateway | 2 (prod) |
| 3 | bazinga-dashboard | 3002 | Next.js 14 | api-gateway | 1 (prod) |

## Infrastructure Services (3)

| # | Service Name | Port | Image | Resources (Prod) | Persistence |
|---|---|---|---|---|---|
| 1 | postgres | 5432 | postgres:16-alpine | CPU: 2, RAM: 2G | postgres_data volume |
| 2 | redis | 6379 | redis:7-alpine | CPU: 1, RAM: 1G | redis_data volume |
| 3 | jaeger | 6831/4318/16686 | jaegertracing/all-in-one | CPU: 0.5, RAM: 512M | In-memory |

## Health Check Configuration

### Production Schedule
```
Interval: 30 seconds
Timeout: 10 seconds
Retries: 3
Start Period: 40 seconds
```

### Development Schedule
```
Interval: 10 seconds
Timeout: 5 seconds
Retries: 5
Start Period: 20 seconds
```

### Test Schedule
```
Interval: 5 seconds
Timeout: 3 seconds
Retries: 2
Start Period: 20 seconds
```

## Resource Allocation Summary

### Production Environment

**Total CPU Allocation:**
- Infrastructure: 3.5 CPU cores
  - PostgreSQL: 2 CPU
  - Redis: 1 CPU
  - Jaeger: 0.5 CPU

- Tier 1 Services (13 services × 2-3 replicas = 28 instances): 28 CPU cores
  - Replicas: 28 instances total

- Tier 2 Services (18 services × 1 replica = 18 instances): 9 CPU cores
  - 18 single instances

- Frontend (3 services × 2 replicas average = 5 instances): 2.5 CPU cores

**Total: ~43 CPU cores** (with high-availability setup)

**Total Memory Allocation:**
- Infrastructure: 3.5 GB
  - PostgreSQL: 2 GB
  - Redis: 1 GB
  - Jaeger: 512 MB

- Tier 1 Services: 14 GB (28 instances × 512M)
- Tier 2 Services: 4.5 GB (18 instances × 256M)
- Frontend: 1.25 GB (5 instances × 256M)

**Total: ~23.25 GB RAM** (with high-availability setup)

## Network Topology

```
┌─────────────────────────────────────────────────────────┐
│                   metapharm-network                     │
│                    (bridge driver)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Load Balancers / Frontends          │  │
│  │  web:3000, dashboard-v2:3001, bazinga-dash:3002 │  │
│  └────────────────────┬─────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │         API Gateway (port 4000)                  │  │
│  │     High availability: 2 replicas                │  │
│  └─────────┬──────────────────────────┬─────────────┘  │
│            │                          │                 │
│  ┌─────────▼────────┐  ┌──────────────▼────────────┐  │
│  │   Auth Services  │  │   Business Logic Services  │  │
│  │ (4001-4007)      │  │ (4008-4030)                │  │
│  │ Single instances │  │ High-demand: 2-3 replicas │  │
│  └────────┬─────────┘  │ Standard: 1 replica       │  │
│           │            └──────────────┬─────────────┘  │
│           │                           │                 │
│  ┌────────┴───────────────────────────▼──────────────┐  │
│  │          Infrastructure Layer                     │  │
│  │  PostgreSQL:5432, Redis:6379, Jaeger:16686       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Service Dependencies

### Critical Path (Required for API Gateway to function)
```
api-gateway
  → postgres
  → redis
  → auth-service
  → user-service
```

### High-Priority Dependencies
```
prescription-service → pharmacy-service, patient-service
order-service → payment-service, inventory-service
teleconsultation-service → user-service, pharmacy-service, messaging-service
```

### Optional Dependencies (Can be started independently)
```
- analytics-service (reads from postgres)
- digital-twin-service (reads from patient-service)
- recycling-service (independent)
- vip-service (independent)
```

## Environment Variables by Service Type

### All Backend Services
```
NODE_ENV=development|test|production
PORT=4000 (unique per service)
SERVICE_NAME=<service-name>
DATABASE_URL=postgresql://metapharm:password@postgres:5432/metapharm_db
REDIS_URL=redis://redis:6379 (or with password in prod)
LOG_LEVEL=info|debug|error
OTLP_EXPORTER_URL=http://jaeger:4318/v1/traces
```

### Auth-Specific Services
```
JWT_SECRET=<secret-key>
JWT_REFRESH_SECRET=<refresh-secret-key>
```

### Frontend Services
```
NODE_ENV=development|test|production
VITE_API_URL=http://localhost:4000 (dev) or https://api.example.com (prod)
VITE_API_GATEWAY=http://localhost:4000/api (dev) or https://api.example.com/api (prod)
NEXT_PUBLIC_API_URL=http://localhost:4000 (dev) or https://api.example.com (prod)
NEXT_PUBLIC_API_GATEWAY=http://localhost:4000/api (dev) or https://api.example.com/api (prod)
```

## Deployment Specifications

### Development Deployment
- **Build Source**: Local Dockerfile
- **Volume Mounts**: Source code for hot reload
- **Debug Ports**: 9229-9259 exposed
- **Health Checks**: 10s intervals
- **Resource Limits**: None (unlimited)

### Test Deployment
- **Build Source**: Local Dockerfile
- **Database**: Ephemeral (no persistence)
- **Health Checks**: 5s intervals
- **Resource Limits**: None (unlimited)
- **Port Conflicts**: Use alternative ports (5433, 6380)

### Production Deployment
- **Build Source**: Pre-built images from registry
- **Database**: Persistent volumes with backups
- **Health Checks**: 30s intervals
- **Resource Limits**: Enforced per service
- **Replicas**: HA setup with 2-3 instances per high-demand service
- **Logging**: JSON file driver with rotation

## Quick Statistics

- **Total Services**: 37
- **Total Exposed Ports**: 65 (backend 31 + frontend 3 + infrastructure 3 + debug 31 - overlaps)
- **Development Environment**: All 37 services from source
- **Test Environment**: All 37 services from source, ephemeral DB
- **Production Environment**: 37 services as pre-built images, 28 instances for HA (13 Tier 1 × 2-3 replicas + 18 Tier 2 × 1 replica)
- **Total Docker Images**: 37 (1 per service type)
- **Total Volumes**: 2 (postgres_data, redis_data)
- **Networks**: 1 (metapharm-network)

## Service Launch Order (Dependencies)

1. **Infrastructure** (boot first)
   - postgres
   - redis
   - jaeger

2. **Core Services** (boot second)
   - api-gateway
   - auth-service
   - user-service

3. **Business Logic** (boot parallel)
   - All remaining backend services

4. **Frontend** (boot last)
   - web
   - dashboard-v2
   - bazinga-dashboard

## Validation Status

All configurations have been validated and are syntactically correct:

- ✓ docker-compose.yml - VALID (31 backend + 3 frontend + 3 infrastructure = 37 services)
- ✓ docker-compose.dev.yml - VALID (development overrides)
- ✓ docker-compose.test.yml - VALID (CI/testing configuration)
- ✓ docker-compose.prod.yml - VALID (production deployment)

All files are ready for deployment.
