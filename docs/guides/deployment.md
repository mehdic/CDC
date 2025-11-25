# Deployment Guide

This guide covers deploying MetaPharm Connect to production using AWS, Docker, and Kubernetes.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Docker Setup](#docker-setup)
3. [AWS Deployment](#aws-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Migration](#database-migration)
7. [Health Checks](#health-checks)
8. [Monitoring & Logging](#monitoring--logging)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All tests passing (`npm test`)
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Security scanning passed
- [ ] Load testing completed
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Incident response plan ready

## Docker Setup

### Building Images

**Backend Image**:
```bash
cd backend
docker build -t metapharm-backend:latest .
docker build -t metapharm-backend:v1.0.0 .
```

**Web App Image**:
```bash
cd web
docker build -t metapharm-web:latest .
docker build -t metapharm-web:v1.0.0 .
```

**Mobile App Image** (if backend-driven):
```bash
cd mobile
docker build -t metapharm-mobile:latest .
```

### Docker Compose Setup

The repository includes `docker-compose.yml` for local multi-container setup:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Dockerfile Best Practices

**Backend Dockerfile** (Node.js):
```dockerfile
# Use specific version
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Run
CMD ["node", "dist/index.js"]
```

## AWS Deployment

### Architecture

```
┌─────────────────────────────────────┐
│   CloudFront (CDN)                  │
└─────────────────────────────────────┘
           │
┌─────────────────────────────────────┐
│   Application Load Balancer (ALB)   │
└─────────────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼──┐    ┌────▼──┐
│ ECS  │    │ Auto  │
│Tasks │    │Scaling│
└──────┘    └───────┘
    │
    └──────┬──────┐
           │      │
      ┌────▼──┐ ┌─▼────┐
      │RDS    │ │Redis │
      │(Prod) │ │Cloud │
      └───────┘ └──────┘
```

### Step 1: Prepare AWS Account

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (us-east-1 or eu-central-1)
# - Output format (json)
```

### Step 2: Create ECR Repository

```bash
# Create ECR registry for images
aws ecr create-repository --repository-name metapharm-backend
aws ecr create-repository --repository-name metapharm-web

# Push images
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin {ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

docker tag metapharm-backend:latest {ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/metapharm-backend:latest
docker push {ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/metapharm-backend:latest
```

### Step 3: RDS Database Setup

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier metapharm-prod-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --master-username admin \
  --master-user-password {SECURE_PASSWORD} \
  --allocated-storage 100 \
  --storage-type gp3 \
  --multi-az \
  --backup-retention-period 30 \
  --enable-cloudwatch-logs-exports postgresql

# Get endpoint
aws rds describe-db-instances --db-instance-identifier metapharm-prod-db
```

### Step 4: ElastiCache (Redis)

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id metapharm-cache \
  --cache-node-type cache.t3.small \
  --engine redis \
  --num-cache-nodes 1 \
  --engine-version 7.0 \
  --automatic-failover-enabled
```

### Step 5: ECS Cluster & Tasks

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name metapharm-prod

# Register task definition
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json

# Create service
aws ecs create-service \
  --cluster metapharm-prod \
  --service-name metapharm-backend \
  --task-definition metapharm-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

### Step 6: Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name metapharm-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345

# Create target group
aws elbv2 create-target-group \
  --name metapharm-backend \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-12345

# Register ECS tasks with target group
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=i-12345 Port=5000
```

### Step 7: Auto Scaling

```bash
# Create Auto Scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name metapharm-backend-asg \
  --launch-configuration metapharm-backend-lc \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 2 \
  --availability-zones us-east-1a us-east-1b

# Set scaling policy
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name metapharm-backend-asg \
  --policy-name scale-up \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration file://target-tracking-config.json
```

## Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

### Deployment Steps

**1. Create Namespace**:
```bash
kubectl create namespace metapharm
kubectl config set-context --current --namespace=metapharm
```

**2. Create ConfigMap for environment variables**:
```bash
kubectl create configmap metapharm-config \
  --from-literal=NODE_ENV=production \
  --from-literal=LOG_LEVEL=info \
  -n metapharm
```

**3. Create Secrets**:
```bash
kubectl create secret generic metapharm-secrets \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
  --from-literal=DATABASE_PASSWORD="your-secure-password" \
  -n metapharm
```

**4. Deploy Backend**:
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metapharm-backend
  namespace: metapharm
spec:
  replicas: 3
  selector:
    matchLabels:
      app: metapharm-backend
  template:
    metadata:
      labels:
        app: metapharm-backend
    spec:
      containers:
      - name: backend
        image: {REGISTRY}/metapharm-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: metapharm-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: metapharm-secrets
              key: DATABASE_URL
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: metapharm-backend-service
  namespace: metapharm
spec:
  selector:
    app: metapharm-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

Apply deployment:
```bash
kubectl apply -f backend-deployment.yaml
kubectl get svc metapharm-backend-service
```

**5. Deploy Web App**:
```bash
# Similar deployment configuration
kubectl apply -f web-deployment.yaml
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment metapharm-backend --replicas=5

# Auto scaling
kubectl autoscale deployment metapharm-backend \
  --min=2 \
  --max=10 \
  --cpu-percent=80
```

## Environment Configuration

### Production Secrets

Store in appropriate secret management:

**AWS Secrets Manager**:
```bash
aws secretsmanager create-secret \
  --name metapharm/prod \
  --secret-string file://secrets.json
```

**Environment Variables**:
```env
# Security
JWT_SECRET=<generate-secure-key>
ENCRYPTION_KEY=<generate-encryption-key>
SESSION_SECRET=<secure-session-key>

# Database
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/metapharm
DATABASE_POOL_MAX=20
DATABASE__TIMEOUT=30000

# Redis
REDIS_URL=redis://elasticache-endpoint:6379

# External Services
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
SENDGRID_API_KEY=<sendgrid-key>

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
S3_BUCKET=metapharm-prod

# Features
LOG_LEVEL=info
CORS_ORIGINS=https://metapharm.com,https://app.metapharm.com
```

## Database Migration

### Pre-Deployment

```bash
# Create database backup
pg_dump postgresql://user:pass@localhost:5432/metapharm > backup-prod.sql

# Test migration on staging
cd backend
npm run migration:up -- --target=staging

# Verify data integrity
npm run migration:verify
```

### Deployment

```bash
# Run migrations
npm run migration:up

# Verify
npm run migration:status
```

### Rollback

```bash
# Rollback one migration
npm run migration:down

# Rollback to specific migration
npm run migration:revert -- --target=migration-name
```

## Health Checks

### Liveness Probe

Indicates if application is running:

```typescript
// backend/src/routes/health.ts
app.get('/health', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date() });
});
```

### Readiness Probe

Indicates if application can handle traffic:

```typescript
app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    // Check Redis connection
    await redis.ping();
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not-ready', error: error.message });
  }
});
```

## Monitoring & Logging

### CloudWatch

```bash
# Create log group
aws logs create-log-group --log-group-name /metapharm/prod

# Create metric alarms
aws cloudwatch put-metric-alarm \
  --alarm-name metapharm-cpu-high \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Application Logging

```typescript
import logger from './utils/logger';

logger.info('Application started', { version: '1.0.0' });
logger.error('Database connection failed', { error: err });
logger.debug('Processing user request', { userId: '123' });
```

## Rollback Procedures

### Docker/ECS Rollback

```bash
# List service history
aws ecs describe-services --cluster metapharm-prod --services metapharm-backend

# Update service to previous task definition
aws ecs update-service \
  --cluster metapharm-prod \
  --service metapharm-backend \
  --task-definition metapharm-backend:2 \
  --force-new-deployment

# Verify rollback
aws ecs describe-services --cluster metapharm-prod --services metapharm-backend
```

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/metapharm-backend

# Rollback to previous version
kubectl rollout undo deployment/metapharm-backend

# Rollback to specific revision
kubectl rollout undo deployment/metapharm-backend --to-revision=2

# Verify
kubectl rollout status deployment/metapharm-backend
```

### Database Rollback

```bash
# If migration went wrong
cd backend

# Revert last migration
npm run migration:down

# Restore from backup
psql -f backup-prod.sql postgresql://user:pass@localhost:5432/metapharm
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs container-name

# Inspect image
docker inspect image-name

# Test locally
docker run -it image-name /bin/bash
```

### High Memory Usage

```bash
# Monitor memory
docker stats

# Increase limits in Kubernetes
kubectl set resources deployment metapharm-backend \
  --limits=memory=1Gi,cpu=1000m
```

### Database Connection Issues

```bash
# Test connection
psql postgresql://user:pass@host:5432/metapharm

# Check connection string
echo $DATABASE_URL

# View connection pool stats
SELECT count(*) FROM pg_stat_activity;
```

### Slow Response Times

```bash
# Check database queries
EXPLAIN ANALYZE SELECT ...;

# Monitor application metrics
kubectl top nodes
kubectl top pods

# Review logs
kubectl logs -f deployment/metapharm-backend --tail=100
```

---

**Deployment Complete!** 🚀

For issues or questions, see [Troubleshooting Guide](../troubleshooting/README.md).
