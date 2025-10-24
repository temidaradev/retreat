# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install security updates
RUN apk update && apk upgrade --no-cache

# Copy package files
COPY package*.json ./

# Install dependencies with security audit and fund disabled
RUN npm ci --only=production --audit --fund=false --no-optional && \
    npm audit fix --force || true

# Copy source code
COPY . .

# Build the application with optimizations
RUN npm run build

# Production stage
FROM nginx:alpine

# Install security updates and wget for health checks
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache wget && \
    rm -rf /var/cache/apk/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chown -R nginx:nginx /run

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Add labels for better container management
LABEL maintainer="receipt-store-team" \
    version="1.0.0" \
    description="Receipt Store Frontend"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

