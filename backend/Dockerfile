# Build stage
FROM golang:1.25.1-alpine AS builder

WORKDIR /app

# Install build dependencies and security updates
RUN apk add --no-cache git gcc musl-dev ca-certificates tzdata && \
    apk upgrade --no-cache

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies with checksum verification
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build the application with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -o main cmd/server/main.go

# Security scan stage (optional - requires trivy)
FROM aquasec/trivy:latest AS security-scanner
COPY --from=builder /app/main /main
RUN trivy fs --exit-code 0 --no-progress / || true

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Install runtime dependencies and security updates
RUN apk --no-cache add ca-certificates tzdata wget && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Create non-root user with specific UID/GID
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy the binary from builder
COPY --from=builder /app/main .

# Create necessary directories with proper permissions
RUN mkdir -p /tmp/uploads /app/logs && \
    chown -R appuser:appgroup /app /tmp/uploads

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

# Add labels for better container management
LABEL maintainer="receipt-store-team" \
    version="1.0.0" \
    description="Receipt Store Backend API"

# Run the application
CMD ["./main"]
