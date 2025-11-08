# ========================================
# Multi-Stage Dockerfile for Backend Services
# ========================================
# Base image: Node.js 20 LTS (Alpine for smaller size)
# Build context: backend/
# Target: Production-ready container with minimal size
# ========================================

# ========================================
# Stage 1: Dependencies Installation
# ========================================
FROM node:20-alpine AS dependencies

LABEL maintainer="MetaPharm Connect Team"
LABEL description="MetaPharm Connect Backend Microservices"

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --include=dev

# ========================================
# Stage 2: TypeScript Build
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# ========================================
# Stage 3: Production Runtime
# ========================================
FROM node:20-alpine AS production

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy shared utilities and models if they exist
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared 2>/dev/null || true

# Copy any necessary config files
COPY --chown=nodejs:nodejs tsconfig.json ./

# Security: Switch to non-root user
USER nodejs

# Expose default port (can be overridden by environment variable)
EXPOSE 4000

# Health check endpoint (assumes /health route exists)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Set default environment variables
ENV NODE_ENV=production \
    PORT=4000

# Start the application
CMD ["node", "dist/index.js"]
