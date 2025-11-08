# API Gateway - MetaPharm Connect

API Gateway for MetaPharm Connect microservices architecture.

## Overview

The API Gateway serves as the single entry point for all client requests, providing:
- Request routing to microservices
- Rate limiting
- JWT authentication
- CORS configuration
- Request logging
- Health checks

## Architecture

```
Client → API Gateway (Port 4000) → Microservices
                                   ├── Auth Service (4001)
                                   ├── Prescription Service (4002)
                                   ├── Teleconsultation Service (4003)
                                   ├── Inventory Service (4004)
                                   └── Notification Service (4005)
```

## Features

### 1. Rate Limiting (T053)
- **General Limit**: 100 requests / 15 minutes per IP
- **Auth Endpoints**: 5 requests / 15 minutes (brute force protection)
- **Authenticated Users**: 200 requests / 15 minutes
- **Whitelisting**: Support for IP whitelist

### 2. Request Routing (T054)
Routes requests to microservices based on path:
- `/auth/*` → Auth Service
- `/prescriptions/*` → Prescription Service
- `/teleconsultations/*` → Teleconsultation Service
- `/inventory/*` → Inventory Service
- `/notifications/*` → Notification Service

### 3. JWT Authentication (T055)
- Validates JWT tokens from `Authorization: Bearer <token>` header
- Injects user context into requests (userId, role, pharmacyId)
- Public routes bypass authentication: `/health`, `/auth/login`, `/auth/register`

### 4. CORS Configuration (T056)
- Configurable allowed origins (Swiss domains, mobile apps)
- Credentials support (cookies, auth headers)
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- Preflight caching: 24 hours

### 5. Request Logging (T057)
- Development: Human-readable format with colors
- Production: JSON format for log aggregation
- Includes: timestamp, method, URL, status, response time, user ID, role
- Skips health check logging in production

### 6. Health Checks (T058)
- `GET /health` - Full health check (gateway + all services)
- `GET /health/live` - Kubernetes liveness probe
- `GET /health/ready` - Kubernetes readiness probe

## API Endpoints

### Public Endpoints
```
GET  /              - Gateway info
GET  /health        - Full health check
GET  /health/live   - Liveness probe
GET  /health/ready  - Readiness probe
POST /auth/login    - Login (rate limited)
POST /auth/register - Register (rate limited)
```

### Protected Endpoints (require JWT)
All other routes require valid JWT token in Authorization header.

## Configuration

### Environment Variables

Create `.env` file based on `.env.example`:

```bash
# Service Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret-change-this

# Microservices Endpoints
AUTH_SERVICE_URL=http://localhost:4001
PRESCRIPTION_SERVICE_URL=http://localhost:4002
TELECONSULTATION_SERVICE_URL=http://localhost:4003
INVENTORY_SERVICE_URL=http://localhost:4004
NOTIFICATION_SERVICE_URL=http://localhost:4005

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:19006

# Health Check
HEALTH_CHECK_TIMEOUT_MS=2000
```

## Development

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Run Production
```bash
npm start
```

### Run Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

## Middleware Stack

The middleware is applied in this specific order (order matters!):

1. **CORS** - Handle preflight requests
2. **Additional CORS Headers** - Security headers
3. **Request Logging** - Log all requests
4. **Body Parsing** - Parse JSON/URL-encoded bodies
5. **General Rate Limiting** - Apply to all routes
6. **Public Routes** - Health checks, root endpoint
7. **Auth Routes** - Stricter rate limiting, no JWT
8. **JWT Authentication** - All routes below require JWT
9. **Protected Routes** - Proxy to microservices

## Security Features

### Rate Limiting
- Prevents brute force attacks on authentication endpoints
- General API abuse prevention
- Per-IP tracking with whitelist support

### JWT Validation
- Signature verification
- Expiration checking
- Role-based access control (RBAC)
- User context injection

### CORS
- Origin whitelist validation
- Credentials support
- Security headers (XSS, Frame, Content-Type protection)

### Request Logging
- Audit trail for all requests
- User ID tracking
- Error logging

## Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-11-07T16:50:00Z",
  "gateway": {
    "status": "healthy",
    "uptime": 3600,
    "memoryUsage": {
      "heapUsed": 45,
      "heapTotal": 60,
      "rss": 80
    }
  },
  "services": {
    "auth": {
      "name": "auth",
      "status": "healthy",
      "responseTime": 12
    },
    "prescription": {
      "name": "prescription",
      "status": "healthy",
      "responseTime": 15
    },
    "teleconsultation": {
      "name": "teleconsultation",
      "status": "healthy",
      "responseTime": 18
    },
    "inventory": {
      "name": "inventory",
      "status": "healthy",
      "responseTime": 10
    },
    "notification": {
      "name": "notification",
      "status": "healthy",
      "responseTime": 8
    }
  }
}
```

## Error Responses

### 401 Unauthorized (No Token)
```json
{
  "error": "Unauthorized",
  "message": "No authentication token provided",
  "code": "NO_TOKEN"
}
```

### 401 Unauthorized (Invalid Token)
```json
{
  "error": "Unauthorized",
  "message": "Invalid authentication token",
  "code": "INVALID_TOKEN"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### 503 Service Unavailable
```json
{
  "error": "Service Unavailable",
  "message": "The requested service is temporarily unavailable. Please try again later.",
  "code": "SERVICE_UNAVAILABLE"
}
```

## Testing

### Unit Tests
Run unit tests with Jest:
```bash
npm test
```

Tests cover:
- Rate limiting enforcement
- JWT validation
- CORS headers
- Health check endpoints
- Error handling
- Request routing

### Integration Tests
Integration tests require all microservices to be running:
```bash
# Start all services
docker-compose up -d

# Run integration tests
npm run test:integration
```

## Docker

Run with Docker Compose:
```bash
docker-compose up api-gateway
```

## Monitoring

### Logs
- Development: Colorized console output
- Production: JSON format for log aggregation (ELK, CloudWatch)

### Metrics
- Request count
- Response times
- Rate limit hits
- Service health status

### Alerts
Monitor these metrics:
- Health check failures
- High rate limit rejections
- Service unavailability
- High response times (> 2s)

## Troubleshooting

### Gateway won't start
- Check PORT is not already in use
- Verify JWT_SECRET is set
- Check database connectivity

### Services returning 503
- Verify microservices are running
- Check service URLs in .env
- Test service health endpoints directly

### CORS errors
- Verify origin is in ALLOWED_ORIGINS
- Check browser console for exact error
- Ensure credentials are configured correctly

### Rate limit issues
- Check IP whitelist configuration
- Adjust rate limits in .env
- Verify rate limit window timing

## Production Deployment

### Checklist
- [ ] Set strong JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Configure production ALLOWED_ORIGINS
- [ ] Set NODE_ENV=production
- [ ] Configure proper logging aggregation
- [ ] Set up health check monitoring
- [ ] Configure SSL/TLS certificates
- [ ] Set appropriate rate limits
- [ ] Configure IP whitelist if needed

### Kubernetes
Health check endpoints are compatible with Kubernetes probes:
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 4000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Tasks Completed

- [x] T052: Initialize API Gateway with Express server
- [x] T053: Rate limiting middleware
- [x] T054: Request routing to microservices
- [x] T055: JWT validation middleware
- [x] T056: CORS configuration
- [x] T057: Request logging middleware
- [x] T058: Health check endpoint

## License

MetaPharm Connect - Internal Use Only
