# Deployment Environment Variables & Service Dependencies

Complete reference for all environment variables and service dependencies required for MetaPharm Connect production deployment.

**Last Updated**: November 25, 2025
**Status**: Production Ready

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Service Dependencies](#service-dependencies)
3. [Environment Variables by Category](#environment-variables-by-category)
4. [Database Migrations](#database-migrations)
5. [Docker Compose Configuration](#docker-compose-configuration)
6. [Kubernetes Secrets Setup](#kubernetes-secrets-setup)
7. [Health Checks](#health-checks)
8. [Troubleshooting](#troubleshooting)

---

## Quick Reference

### New Services Added (Phase 2)

The following microservices were added in Phase 2 and require configuration:

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| Order Service | 4007 | Order management & checkout | Active |
| Delivery Service | 4006 | Delivery tracking & management | Active |
| Pharmacy Service | 4008 | Pharmacy profile & operations | Active |
| User Service | 4009 | User profile & settings | Active |
| Doctor Service | 4011 | Doctor-specific features | Active |
| Nurse Service | 4012 | Nurse-specific features | Active |
| Payment Service | 4013 | Payment processing | Active |
| E-Commerce Service | N/A | Product catalog & reviews | Active |
| Medical Records Service | N/A | Patient medical records | Active |

### Service URLs (Development)

```
API Gateway:        http://localhost:4000
Auth Service:       http://localhost:4001
Prescription:       http://localhost:4002
Teleconsultation:   http://localhost:4003
Inventory:          http://localhost:4004
Notification:       http://localhost:4005
Delivery:           http://localhost:4006
Order:              http://localhost:4007
Pharmacy:           http://localhost:4008
User:               http://localhost:4009
Doctor:             http://localhost:4011
Nurse:              http://localhost:4012
Payment:            http://localhost:4013
```

---

## Service Dependencies

### Critical Services (Must run before API Gateway)

All microservices must be running before the API Gateway can function properly.

```
API Gateway (4000)
├── Auth Service (4001) [REQUIRED]
├── Prescription Service (4002) [REQUIRED]
├── Teleconsultation Service (4003) [REQUIRED]
├── Inventory Service (4004) [REQUIRED]
├── Notification Service (4005) [REQUIRED]
├── Delivery Service (4006) [REQUIRED]
├── Order Service (4007) [REQUIRED]
├── Pharmacy Service (4008) [REQUIRED]
├── User Service (4009) [REQUIRED]
├── Doctor Service (4011) [REQUIRED]
├── Nurse Service (4012) [REQUIRED]
└── Payment Service (4013) [REQUIRED]

Database (PostgreSQL 16)
├── All services read/write

Cache (Redis)
├── Session storage
├── Rate limiting
└── Caching layer

AWS Services
├── S3 (prescription images, recordings)
├── KMS (encryption)
├── Textract (prescription OCR)
├── SES/SendGrid (email)
└── SNS/FCM (push notifications)

External APIs
├── HIN e-ID (Swiss healthcare auth)
├── FDB MedKnowledge (drug interactions)
├── Twilio (video, SMS, WhatsApp)
├── Google Maps (route optimization)
└── Swiss e-santé (health records)
```

### Startup Sequence (Recommended)

1. **Infrastructure**: PostgreSQL, Redis
2. **Core Services**: Auth Service, User Service
3. **Supporting Services**: Notification, Inventory, Pharmacy
4. **Feature Services**: Prescription, Teleconsultation, Order, Delivery
5. **Specialized Services**: Payment, Doctor, Nurse
6. **API Gateway**: Last (routes to all services)

---

## Environment Variables by Category

### 1. Server Configuration

Controls how the application runs and communicates.

```env
# Environment mode
NODE_ENV=production                    # production, staging, development

# Port Configuration
PORT=4000                              # API Gateway port
API_VERSION=v1                         # API version in URLs
HOST=0.0.0.0                          # Bind address (0.0.0.0 for all interfaces)

# CORS
CORS_ORIGIN=https://app.metapharm.com,https://patient.metapharm.com,https://pharmacist.metapharm.com
CORS_CREDENTIALS=true
```

**Notes**:
- Production: Use HTTPS URLs only
- Staging: Can include both HTTP and HTTPS
- HOST: Use 0.0.0.0 in Docker/Kubernetes, localhost for local development

---

### 2. Service Port Configuration

**IMPORTANT**: Each service needs its own unique port and corresponding environment variable.

```env
# API Gateway
API_GATEWAY_PORT=4000

# Authentication & Authorization
AUTH_SERVICE_PORT=4001
AUTH_SERVICE_URL=http://localhost:4001

# Prescription Processing
PRESCRIPTION_SERVICE_PORT=4002
PRESCRIPTION_SERVICE_URL=http://localhost:4002

# Teleconsultation (Video Calls)
TELECONSULTATION_SERVICE_PORT=4003
TELECONSULTATION_SERVICE_URL=http://localhost:4003

# Inventory Management
INVENTORY_SERVICE_PORT=4004
INVENTORY_SERVICE_URL=http://localhost:4004

# Notifications (Email, SMS, Push)
NOTIFICATION_SERVICE_PORT=4005
NOTIFICATION_SERVICE_URL=http://localhost:4005

# Delivery Tracking & Management
DELIVERY_SERVICE_PORT=4006
DELIVERY_SERVICE_URL=http://localhost:4006

# Order & Cart Management [NEW]
ORDER_SERVICE_PORT=4007
ORDER_SERVICE_URL=http://localhost:4007

# Pharmacy Profile & Operations [NEW]
PHARMACY_SERVICE_PORT=4008
PHARMACY_SERVICE_URL=http://localhost:4008

# User Profile & Settings [NEW]
USER_SERVICE_PORT=4009
USER_SERVICE_URL=http://localhost:4009

# Doctor Services [NEW]
DOCTOR_SERVICE_PORT=4011
DOCTOR_SERVICE_URL=http://localhost:4011

# Nurse Services [NEW]
NURSE_SERVICE_PORT=4012
NURSE_SERVICE_URL=http://localhost:4012

# Payment Processing [NEW]
PAYMENT_SERVICE_PORT=4013
PAYMENT_SERVICE_URL=http://localhost:4013
```

**Important**:
- Ports 4010 is reserved for future services
- Update ALL service URLs when deploying to production
- In Kubernetes, use service names instead of localhost

---

### 3. Database Configuration

PostgreSQL 16+ required.

```env
# Connection String
DATABASE_URL=postgresql://metapharm_user:SecurePassword123!@db.metapharm.com:5432/metapharm_connect

# Connection Details
DATABASE_HOST=db.metapharm.com          # RDS endpoint or hostname
DATABASE_PORT=5432                      # Default PostgreSQL port
DATABASE_NAME=metapharm_connect         # Database name
DATABASE_USER=metapharm_user            # Database user (create before deployment)
DATABASE_PASSWORD=SecurePassword123!    # MUST be strong, min 16 chars
DATABASE_SSL=true                       # MUST be true in production

# Connection Pooling
DATABASE_POOL_MIN=5                     # Minimum connections in pool
DATABASE_POOL_MAX=20                    # Maximum connections in pool
```

**Setup Commands**:
```bash
# Create database and user
createdb -h localhost -U postgres metapharm_connect
psql -h localhost -U postgres -c "CREATE USER metapharm_user WITH PASSWORD 'SecurePassword123!';"
psql -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE metapharm_connect TO metapharm_user;"
psql -h localhost -U postgres -c "GRANT CREATE ON SCHEMA public TO metapharm_user;"
```

---

### 4. Redis Configuration

Redis 7.0+ for caching and sessions.

```env
# Connection
REDIS_URL=redis://:password@cache.metapharm.com:6379
REDIS_HOST=cache.metapharm.com         # ElastiCache endpoint
REDIS_PORT=6379                        # Default Redis port
REDIS_PASSWORD=RedisPassword123!       # MUST be strong
REDIS_DB=0                             # Database number (0-15)

# Configuration
REDIS_TTL=3600                         # Session/cache TTL in seconds (1 hour)
```

---

### 5. Authentication & JWT

JWT token configuration for secure API access.

```env
# JWT Secrets (CHANGE IMMEDIATELY IN PRODUCTION)
JWT_SECRET=GenerateWith32PlusRandomCharsMin_CHANGE_IN_PRODUCTION
JWT_EXPIRES_IN=1h                      # Access token lifetime
JWT_REFRESH_SECRET=AnotherRandomSecret_CHANGE_IN_PRODUCTION
REFRESH_TOKEN_EXPIRES_IN=7d            # Refresh token lifetime
SESSION_SECRET=SessionSecretForEncryption_CHANGE

# MFA
MFA_ISSUER=MetaPharm Connect           # Authenticator app label
MFA_ENABLED=true                       # Enable 2FA for pharmacists
```

**Generate Secure Secrets**:
```bash
# Generate random secrets
openssl rand -base64 32
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 6. AWS Services

AWS configuration for S3, KMS, Textract, and more.

```env
# AWS Account & Region
AWS_REGION=eu-central-1               # Region (Europe = best for Swiss data)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE  # IAM user access key
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/...  # IAM user secret key

# S3 (Prescription images, recordings, documents)
AWS_S3_BUCKET=metapharm-prescriptions-eu-central
AWS_S3_REGION=eu-central-1
S3_ACL=private                         # Keep all objects private

# KMS (Encryption at rest for sensitive data)
AWS_KMS_KEY_ID=arn:aws:kms:eu-central-1:...
KMS_KEY_ROTATION=true                  # Enable automatic key rotation

# Textract (Prescription image OCR)
AWS_TEXTRACT_REGION=eu-central-1       # Textract region
TEXTRACT_CONFIDENCE_THRESHOLD=0.85     # Minimum confidence for OCR
```

**AWS IAM Policy** (minimum required):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::metapharm-prescriptions-eu-central",
        "arn:aws:s3:::metapharm-prescriptions-eu-central/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:eu-central-1:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "textract:AnalyzeDocument",
        "textract:StartDocumentAnalysis",
        "textract:GetDocumentAnalysis"
      ],
      "Resource": "*"
    }
  ]
}
```

---

### 7. Swiss Healthcare Integration

HIN e-ID and e-santé API configuration.

```env
# HIN e-ID (Swiss healthcare authentication)
HIN_CLIENT_ID=your-hin-client-id
HIN_CLIENT_SECRET=your-hin-client-secret
HIN_REDIRECT_URI=https://app.metapharm.com/auth/hin/callback
HIN_AUTHORIZATION_URL=https://oauth2.hin.ch/authorize
HIN_TOKEN_URL=https://oauth2.hin.ch/token
HIN_USERINFO_URL=https://oauth2.hin.ch/userinfo

# Swiss e-santé (Cantonal health records)
ESANTE_API_URL=https://api.e-sante.ch
ESANTE_API_KEY=your-esante-api-key
ESANTE_CLIENT_ID=your-esante-client-id
ESANTE_CLIENT_SECRET=your-esante-client-secret

# Insurance Integration
INSURANCE_API_URL=https://api.insurance-provider.ch
INSURANCE_API_KEY=your-insurance-api-key
```

---

### 8. Third-Party API Services

External APIs for functionality like messaging, video calls, notifications.

```env
# FDB MedKnowledge (Drug interactions & contraindications)
FDB_API_KEY=your-fdb-api-key
FDB_API_URL=https://api.fdbhealth.com
FDB_API_VERSION=v1
FDB_CACHE_HOURS=24                    # Cache drug interaction results

# Twilio (Video calls, SMS, WhatsApp)
TWILIO_ACCOUNT_SID=AC1234567890ABCDEF1234567890ABCDEF
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_VIDEO_API_KEY=your-twilio-video-key
TWILIO_VIDEO_API_SECRET=your-twilio-video-secret
TWILIO_SMS_FROM=+41441234567          # Swiss number for SMS
TWILIO_WHATSAPP_NUMBER=+14155552671   # Twilio WhatsApp Sandbox

# SendGrid (Email)
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SENDGRID_FROM_EMAIL=noreply@metapharm-connect.ch
SENDGRID_FROM_NAME=MetaPharm Connect

# Google Maps (Route optimization)
GOOGLE_MAPS_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_MAPS_TIMEOUT_MS=5000

# Firebase Cloud Messaging (Push notifications)
FCM_SERVER_KEY=AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIII
FCM_PROJECT_ID=metapharm-mobile
```

---

### 9. Rate Limiting & Security

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000            # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100            # Max requests per window

# Authentication Rate Limit (stricter)
AUTH_RATE_LIMIT_WINDOW_MS=900000       # 15 minutes
AUTH_RATE_LIMIT_MAX_REQUESTS=10        # Max 10 login attempts per 15 min

# Encryption
ENCRYPTION_ALGORITHM=aes-256-gcm       # AES 256-bit GCM mode
ENCRYPTION_KEY=YourEncryptionKeyMinimum32CharactersNeeded123!
```

---

### 10. Logging & Monitoring

```env
# Logging
LOG_LEVEL=info                         # debug, info, warn, error (NOT debug in prod)
LOG_FORMAT=json                        # Structured JSON logging
LOG_RETENTION_DAYS=30                  # Retention period

# Sentry (Error tracking)
SENTRY_DSN=https://key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACE_SAMPLE_RATE=0.1          # 10% of requests

# OpenTelemetry (Tracing)
OTLP_EXPORTER_URL=http://otel-collector:4318/v1/traces
OTEL_TRACE_SAMPLE_RATE=0.1            # Sample 10% of traces
ENABLE_TRACING=true
```

---

### 11. Feature Flags

```env
# Toggle features
ENABLE_TELECONSULTATION=true           # Video consultation feature
ENABLE_PRESCRIPTION_OCR=true           # Prescription image reading
ENABLE_DELIVERY_TRACKING=true          # Real-time GPS tracking
ENABLE_E_COMMERCE=true                 # OTC product sales
ENABLE_MFA=true                        # Multi-factor authentication
ENABLE_ENCRYPTION=true                 # Data encryption at rest

# Beta Features
ENABLE_AI_RECOMMENDATIONS=true         # Personalized product recommendations
ENABLE_DELIVERY_AUTOMATION=true        # Automated delivery assignment
```

---

## Database Migrations

All database schemas are auto-migrated on service startup.

### Manual Migration (if needed)

```bash
cd backend/services/[service-name]

# Run migrations
npm run migrate

# Rollback migrations
npm run migrate:rollback

# Check migration status
npm run migrate:status
```

### Migration Files Location

```
backend/services/[service-name]/src/migrations/
```

### New Migrations Added (Phase 2)

- Orders table with status tracking
- Cart items with product details
- Delivery tracking with GPS locations
- Payment transactions
- Pharmacy profiles and operating hours
- User roles and permissions extensions

---

## Docker Compose Configuration

Quick setup for local development with all services.

### Environment File (.env)

Create `backend/.env` with all variables from [Environment Variables by Category](#environment-variables-by-category).

### Start Services

```bash
# From project root
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api-gateway
docker-compose logs -f order-service

# Stop services
docker-compose down
```

### Service Health Check

```bash
# API Gateway
curl http://localhost:4000/health

# Order Service
curl http://localhost:4007/health

# Auth Service
curl http://localhost:4001/health
```

---

## Kubernetes Secrets Setup

For production Kubernetes deployments:

### Create Namespace

```bash
kubectl create namespace metapharm-prod
kubectl config set-context --current --namespace=metapharm-prod
```

### Create Secrets from .env file

```bash
# From backend/.env
kubectl create secret generic metapharm-secrets \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=AWS_ACCESS_KEY_ID="..." \
  --from-literal=AWS_SECRET_ACCESS_KEY="..." \
  --from-literal=SENDGRID_API_KEY="..." \
  --from-literal=TWILIO_AUTH_TOKEN="..." \
  -n metapharm-prod

# Verify
kubectl describe secret metapharm-secrets -n metapharm-prod
```

### Create ConfigMap for non-sensitive config

```bash
kubectl create configmap metapharm-config \
  --from-literal=NODE_ENV=production \
  --from-literal=LOG_LEVEL=info \
  --from-literal=REDIS_HOST=redis.metapharm-prod.svc.cluster.local \
  --from-literal=DATABASE_HOST=postgres.metapharm-prod.svc.cluster.local \
  -n metapharm-prod
```

### Reference in Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: metapharm-prod
spec:
  containers:
  - name: order-service
    image: metapharm-backend:latest
    ports:
    - containerPort: 4007
    env:
    - name: NODE_ENV
      valueFrom:
        configMapKeyRef:
          name: metapharm-config
          key: NODE_ENV
    - name: JWT_SECRET
      valueFrom:
        secretKeyRef:
          name: metapharm-secrets
          key: JWT_SECRET
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: metapharm-secrets
          key: DATABASE_URL
```

---

## Health Checks

Every service exposes a health check endpoint.

### HTTP Health Check

```bash
# Check if service is running
curl -X GET http://localhost:4000/health

# Response (200 OK)
{
  "status": "ok",
  "service": "api-gateway",
  "uptime": 3600,
  "timestamp": "2025-11-25T16:00:00Z"
}
```

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

---

## Troubleshooting

### Issue: Service Cannot Connect to Database

**Symptoms**: `ECONNREFUSED` or `ENOTFOUND` errors

**Solution**:
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
npm run test:db-connection

# Verify firewall
telnet localhost 5432

# Check service status
docker ps | grep postgres
```

### Issue: Redis Connection Timeout

**Symptoms**: Session/cache errors

**Solution**:
```bash
# Verify Redis is running
redis-cli ping

# Check REDIS_URL format
echo $REDIS_URL

# Monitor Redis
redis-cli monitor
```

### Issue: Service Discovery Failure

**Symptoms**: Gateway cannot reach microservices

**Solution**:
```bash
# Verify all services are running
docker-compose ps

# Check service URLs in environment
env | grep SERVICE_URL

# Test inter-service communication
curl http://order-service:4007/health
```

### Issue: JWT Authentication Failed

**Symptoms**: `401 Unauthorized` on all protected routes

**Solution**:
```bash
# Regenerate JWT_SECRET
openssl rand -base64 32

# Update environment
export JWT_SECRET="<new-secret>"

# Restart all services
docker-compose restart
```

### Issue: Rate Limiting Too Strict

**Symptoms**: `429 Too Many Requests` errors

**Solution**:
```bash
# Adjust rate limit
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes

# Restart services
docker-compose restart
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables set and validated
- [ ] Database created and migrations run
- [ ] Redis cluster provisioned
- [ ] AWS IAM user created with minimal required permissions
- [ ] All third-party API keys obtained
- [ ] SSL/TLS certificates configured
- [ ] Domain DNS configured
- [ ] Monitoring and logging configured (Sentry, Datadog, etc.)
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan tested
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] All tests passing

---

**For more information**, see:
- [API Endpoints Documentation](./api/ENDPOINTS.md)
- [Deployment Guide](./guides/deployment.md)
- [Security Implementation](./security/SECURITY_IMPLEMENTATION.md)
