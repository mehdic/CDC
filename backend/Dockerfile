# ========================================
# Multi-Stage Dockerfile for Backend Microservices
# ========================================
# Features:
# - Supports building ANY of 31 microservices via SERVICE_NAME build arg
# - Multi-stage build: dependencies → builder → production
# - Base: Node.js 20 Alpine for small, secure images
# - Non-root user execution for security
# - Health check configured for typical /health endpoint
# ========================================

# Build-time arguments
ARG SERVICE_NAME=api-gateway
ARG NODE_ENV=production

# ========================================
# Stage 1: Dependencies Installation
# ========================================
FROM node:20-alpine AS dependencies

LABEL maintainer="MetaPharm Connect Team"
LABEL description="MetaPharm Connect Backend Microservices"

WORKDIR /app

# Install build dependencies for native modules (needed for some packages)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    git \
    ca-certificates

# Copy package files for root and all services
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for TypeScript compilation)
# Use npm install instead of npm ci since package-lock.json is in root (npm workspaces)
RUN npm install --include=dev

# ========================================
# Stage 2: TypeScript Build
# ========================================
FROM node:20-alpine AS builder

ARG SERVICE_NAME=api-gateway

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code (entire backend structure)
COPY . .

# Build TypeScript to JavaScript
# This compiles everything into dist/ directory
RUN npm run build

# ========================================
# Stage 3: Production Runtime
# ========================================
FROM node:20-alpine AS production

ARG SERVICE_NAME=api-gateway
ARG NODE_ENV=production

LABEL service="${SERVICE_NAME}"
LABEL version="1.0.0"

# Security: Create non-root user for running the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install production dependencies only (remove dev dependencies)
COPY package*.json ./
# Copy package-lock.json generated in dependencies stage for reproducible builds
COPY --from=dependencies /app/package-lock.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy compiled TypeScript from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy shared utilities and config files needed at runtime
# Note: These directories must exist in the builder stage
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared
COPY --from=builder --chown=nodejs:nodejs /app/config ./config

# Copy tsconfig.runtime.json for tsconfig-paths runtime resolution (baseUrl points to dist/)
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.runtime.json ./tsconfig.json

# Create logs directory with correct permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Create a startup script that loads the correct service with tsconfig-paths
RUN printf '#!/bin/sh\n\
SERVICE_PATH="dist/services/%s/src/index.js"\n\
if [ ! -f "$SERVICE_PATH" ]; then\n\
  echo "Error: Service not found at $SERVICE_PATH"\n\
  ls -la dist/services/ || true\n\
  exit 1\n\
fi\n\
exec node -r tsconfig-paths/register "$SERVICE_PATH"\n' "${SERVICE_NAME}" > /app/entrypoint.sh && \
chmod +x /app/entrypoint.sh

# Security: Switch to non-root user
USER nodejs

# Expose default port (services can override via PORT environment variable)
EXPOSE 4000

# Health check: Verify service is responding on /health endpoint
# This works for any service that implements a standard health check route
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))" || exit 1

# Set default environment variables
ENV NODE_ENV=${NODE_ENV} \
    PORT=4000 \
    SERVICE_NAME=${SERVICE_NAME}

# Use custom entrypoint to load the correct service
ENTRYPOINT ["/app/entrypoint.sh"]
