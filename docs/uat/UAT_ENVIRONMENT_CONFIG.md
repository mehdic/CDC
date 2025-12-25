# MetaPharm Connect - UAT Environment Configuration

**Version:** 1.0
**Last Updated:** 2025-12-25

---

## Overview

This document describes the UAT (User Acceptance Testing) environment configuration for MetaPharm Connect. The UAT environment mirrors production with isolated data and reduced resources.

---

## Environment Tiers

| Environment | Purpose | URL | Data |
|-------------|---------|-----|------|
| Development | Active development | localhost:5173 / localhost:3000 | Dev data |
| UAT | User acceptance testing | uat.metapharm-connect.ch | Synthetic test data |
| Staging | Pre-production | staging.metapharm-connect.ch | Production clone |
| Production | Live system | metapharm-connect.ch | Real data |

---

## UAT Environment Specifications

### Infrastructure

```yaml
# UAT Environment Overview
environment: uat
region: eu-central-1  # Frankfurt (GDPR compliant)
availability: Single AZ (cost optimization)

# Compute Resources
web_servers:
  type: t3.medium
  count: 2
  autoscaling: false

api_servers:
  type: t3.medium
  count: 2
  autoscaling: false

# Database
database:
  type: PostgreSQL 15
  instance: db.t3.medium
  storage: 100GB
  multi_az: false
  backup_retention: 7 days

# Cache
redis:
  type: cache.t3.micro
  nodes: 1

# Storage
s3_buckets:
  - metapharm-uat-uploads
  - metapharm-uat-prescriptions
  - metapharm-uat-backups
```

### Network Configuration

```yaml
# VPC Configuration
vpc:
  cidr: 10.1.0.0/16

subnets:
  public:
    - 10.1.1.0/24  # AZ-a
  private:
    - 10.1.10.0/24  # AZ-a (application)
    - 10.1.20.0/24  # AZ-a (database)

# Security Groups
security_groups:
  web:
    ingress:
      - port: 443
        source: 0.0.0.0/0
      - port: 80
        source: 0.0.0.0/0  # Redirects to HTTPS
    egress:
      - all

  api:
    ingress:
      - port: 3000
        source: web_sg
    egress:
      - all

  database:
    ingress:
      - port: 5432
        source: api_sg
    egress:
      - none
```

---

## Docker Compose Configuration (Local UAT)

```yaml
# docker-compose.uat.yml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build:
      context: ./backend/services/api-gateway
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=uat
      - PORT=3000
      - DATABASE_URL=postgresql://metapharm:${DB_PASSWORD}@postgres:5432/metapharm_uat
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - LOG_LEVEL=debug
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    networks:
      - metapharm-uat

  # User Service
  user-service:
    build:
      context: ./backend/services/user-service
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=uat
      - DATABASE_URL=postgresql://metapharm:${DB_PASSWORD}@postgres:5432/metapharm_uat
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - metapharm-uat

  # Prescription Service
  prescription-service:
    build:
      context: ./backend/services/prescription-service
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=uat
      - DATABASE_URL=postgresql://metapharm:${DB_PASSWORD}@postgres:5432/metapharm_uat
      - AWS_TEXTRACT_ENABLED=false  # Mock OCR in UAT
    depends_on:
      - postgres
    networks:
      - metapharm-uat

  # Teleconsultation Service
  teleconsultation-service:
    build:
      context: ./backend/services/teleconsultation-service
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=uat
      - TWILIO_ACCOUNT_SID=${TWILIO_UAT_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_UAT_AUTH_TOKEN}
      - TWILIO_API_KEY=${TWILIO_UAT_API_KEY}
      - TWILIO_API_SECRET=${TWILIO_UAT_API_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - metapharm-uat

  # Delivery Service
  delivery-service:
    build:
      context: ./backend/services/delivery-service
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=uat
      - DATABASE_URL=postgresql://metapharm:${DB_PASSWORD}@postgres:5432/metapharm_uat
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_UAT_API_KEY}
    depends_on:
      - postgres
      - redis
    networks:
      - metapharm-uat

  # GDPR Service
  gdpr-service:
    build:
      context: ./backend/services/gdpr-service
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=uat
      - DATABASE_URL=postgresql://metapharm:${DB_PASSWORD}@postgres:5432/metapharm_uat
    depends_on:
      - postgres
    networks:
      - metapharm-uat

  # Web Application
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=http://localhost:3000
        - VITE_ENV=uat
    ports:
      - "5173:80"
    depends_on:
      - api-gateway
    networks:
      - metapharm-uat

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=metapharm
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=metapharm_uat
    volumes:
      - postgres_uat_data:/var/lib/postgresql/data
      - ./scripts/uat/init-uat-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - metapharm-uat

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_uat_data:/data
    networks:
      - metapharm-uat

  # Mailhog (Email Testing)
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - metapharm-uat

volumes:
  postgres_uat_data:
  redis_uat_data:

networks:
  metapharm-uat:
    driver: bridge
```

---

## Environment Variables

### UAT-Specific Variables

```bash
# .env.uat

# Environment
NODE_ENV=uat
LOG_LEVEL=debug
ENABLE_DEBUG_ENDPOINTS=true

# Database
DATABASE_URL=postgresql://metapharm:${DB_PASSWORD}@localhost:5432/metapharm_uat
DB_POOL_SIZE=10
DB_SSL_MODE=require

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TLS=false

# JWT & Security
JWT_SECRET=${UAT_JWT_SECRET}
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
ENCRYPTION_KEY=${UAT_ENCRYPTION_KEY}

# MFA (Relaxed for testing)
MFA_ENABLED=true
MFA_SKIP_FOR_TEST_ACCOUNTS=true

# Session
SESSION_TIMEOUT_PATIENT=30m
SESSION_TIMEOUT_HEALTHCARE=2h

# Rate Limiting (Relaxed for testing)
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=100

# External Services (UAT/Sandbox accounts)
TWILIO_ACCOUNT_SID=${TWILIO_UAT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_UAT_TOKEN}
STRIPE_SECRET_KEY=${STRIPE_UAT_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_UAT_WEBHOOK_SECRET}
SENDGRID_API_KEY=${SENDGRID_UAT_API_KEY}
GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_UAT_KEY}

# AWS (UAT resources)
AWS_REGION=eu-central-1
AWS_S3_BUCKET=metapharm-uat-uploads
AWS_TEXTRACT_ENABLED=false  # Use mock OCR

# Feature Flags (UAT)
FEATURE_TELECONSULTATION=true
FEATURE_VIP_PROGRAM=true
FEATURE_ECOMMERCE=true
FEATURE_AI_RECOMMENDATIONS=false  # Disabled in UAT

# Mock Services
MOCK_PAYMENT_GATEWAY=true
MOCK_SMS_SERVICE=true
MOCK_OCR_SERVICE=true

# Email (Use Mailhog in local UAT)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
EMAIL_FROM=noreply@metapharm-uat.ch
```

---

## Cloud UAT Environment Setup

### AWS CloudFormation Stack

```yaml
# cloudformation/uat-environment.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: MetaPharm Connect UAT Environment

Parameters:
  Environment:
    Type: String
    Default: uat
  DBPassword:
    Type: String
    NoEcho: true

Resources:
  # VPC
  UATVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.1.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: metapharm-uat-vpc

  # RDS PostgreSQL
  UATDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: metapharm-uat-db
      DBInstanceClass: db.t3.medium
      Engine: postgres
      EngineVersion: '15'
      AllocatedStorage: 100
      MasterUsername: metapharm
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      PubliclyAccessible: false
      StorageEncrypted: true
      BackupRetentionPeriod: 7
      Tags:
        - Key: Environment
          Value: uat

  # ElastiCache Redis
  UATRedis:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheClusterId: metapharm-uat-redis
      CacheNodeType: cache.t3.micro
      Engine: redis
      NumCacheNodes: 1
      VpcSecurityGroupIds:
        - !Ref RedisSecurityGroup

  # S3 Bucket for Uploads
  UATUploadsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: metapharm-uat-uploads
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

Outputs:
  DatabaseEndpoint:
    Value: !GetAtt UATDatabase.Endpoint.Address
  RedisEndpoint:
    Value: !GetAtt UATRedis.RedisEndpoint.Address
  S3Bucket:
    Value: !Ref UATUploadsBucket
```

---

## Deployment Scripts

### Deploy to UAT

```bash
#!/bin/bash
# scripts/deploy-uat.sh

set -e

echo "=== MetaPharm Connect UAT Deployment ==="

# Load environment
source .env.uat

# Build images
echo "Building Docker images..."
docker-compose -f docker-compose.uat.yml build

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.uat.yml run --rm api-gateway npm run migrate

# Seed test data
echo "Seeding test data..."
docker-compose -f docker-compose.uat.yml run --rm api-gateway npm run seed:uat

# Start services
echo "Starting services..."
docker-compose -f docker-compose.uat.yml up -d

# Wait for services
echo "Waiting for services to be ready..."
sleep 30

# Health check
echo "Running health checks..."
curl -f http://localhost:3000/health || exit 1
curl -f http://localhost:5173 || exit 1

echo "=== UAT Environment Ready ==="
echo "Web: http://localhost:5173"
echo "API: http://localhost:3000"
echo "Mailhog: http://localhost:8025"
```

### Reset UAT Environment

```bash
#!/bin/bash
# scripts/reset-uat.sh

set -e

echo "=== Resetting UAT Environment ==="

# Stop services
docker-compose -f docker-compose.uat.yml down

# Remove volumes (data reset)
docker volume rm metapharm_postgres_uat_data metapharm_redis_uat_data 2>/dev/null || true

# Rebuild and start
./scripts/deploy-uat.sh

echo "=== UAT Environment Reset Complete ==="
```

---

## Test Account Credentials

### Pre-configured Test Accounts

| Role | Email | Password | MFA Code | Notes |
|------|-------|----------|----------|-------|
| Pharmacist (Master) | pharmacist@uat.metapharm.ch | Uat2025!Pharm | 123456 | Full access |
| Pharmacist (Sub) | assistant@uat.metapharm.ch | Uat2025!Asst | 123456 | Limited access |
| Doctor | doctor@uat.metapharm.ch | Uat2025!Doc | 123456 | HIN test account |
| Nurse | nurse@uat.metapharm.ch | Uat2025!Nurse | 123456 | Hospital A |
| Delivery | delivery@uat.metapharm.ch | Uat2025!Del | N/A | Mobile app |
| Patient | patient@uat.metapharm.ch | Uat2025!Pat | N/A | Standard tier |
| Patient (VIP) | vip@uat.metapharm.ch | Uat2025!Vip | N/A | Golden tier |

### Test Credit Cards (Stripe UAT)

| Card Type | Number | Expiry | CVV | Result |
|-----------|--------|--------|-----|--------|
| Success | 4242424242424242 | 12/28 | 123 | Payment succeeds |
| Declined | 4000000000000002 | 12/28 | 123 | Card declined |
| 3DS Required | 4000000000003220 | 12/28 | 123 | Requires authentication |
| Insufficient Funds | 4000000000009995 | 12/28 | 123 | Insufficient funds |

---

## Monitoring & Logging

### Log Configuration

```yaml
# UAT Logging Configuration
logging:
  level: debug
  format: json

  outputs:
    - type: console
      level: debug
    - type: file
      path: /var/log/metapharm/uat.log
      level: info
      rotation:
        max_size: 100MB
        max_files: 10
    - type: cloudwatch  # For cloud UAT
      log_group: /metapharm/uat
      retention: 14 days

  # Sensitive data masking
  mask_patterns:
    - "password"
    - "creditCard"
    - "ssn"
    - "token"
```

### Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| API Gateway | GET /health | `{"status": "healthy"}` |
| User Service | GET /api/v1/users/health | `{"status": "healthy"}` |
| Prescription Service | GET /api/v1/prescriptions/health | `{"status": "healthy"}` |
| Web App | GET / | HTTP 200 |

---

## Data Isolation

### UAT Data Policies

1. **No Production Data:** UAT environment never contains real patient data
2. **Synthetic Data:** All test data is generated or anonymized
3. **Data Refresh:** UAT data can be reset at any time
4. **Audit Logs:** All actions are logged for testing verification

### Data Generation

See `scripts/uat/generate-test-data.ts` for automated test data generation.

---

## Access Control

### UAT Access Policy

| Role | Access Level | Approval Required |
|------|--------------|-------------------|
| UAT Testers | Full read/write | UAT Lead |
| Developers | Read + limited write | Team Lead |
| QA Team | Full read/write | QA Lead |
| Stakeholders | Read only | Product Owner |

### VPN Requirements

- UAT environment requires VPN connection
- VPN Config: `vpn.metapharm-connect.ch`
- Certificate-based authentication

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Services not starting | Missing env vars | Check `.env.uat` file |
| Database connection failed | Wrong credentials | Verify DB_PASSWORD |
| Redis connection refused | Redis not running | Start Redis container |
| Slow response times | Low resources | Increase Docker memory |
| Email not received | Mailhog not running | Check port 8025 |

### Support Contacts

- **DevOps:** devops@metapharm-connect.ch
- **QA Lead:** qa-lead@metapharm-connect.ch
- **On-call:** +41 XX XXX XX XX

---

*Document maintained by: DevOps Team*
