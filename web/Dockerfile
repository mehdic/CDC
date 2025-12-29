# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies fresh (ignoring local node_modules)
RUN rm -rf node_modules && npm install --legacy-peer-deps && npm install terser --save-dev

# Copy source code (exclude node_modules via .dockerignore)
COPY . .

# Ensure esbuild is rebuilt for the correct platform
RUN npm rebuild esbuild

# Build the React app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a health check endpoint directory
RUN mkdir -p /usr/share/nginx/html/health && \
    echo "OK" > /usr/share/nginx/html/health/index.html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/health || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
