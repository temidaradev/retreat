FROM golang:1.25.1-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git gcc musl-dev ca-certificates tzdata && \
    apk upgrade --no-cache

COPY go.mod go.sum ./

RUN go mod download && go mod verify

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -o main cmd/server/main.go

FROM aquasec/trivy:latest AS security-scanner
COPY --from=builder /app/main /main
RUN trivy fs --exit-code 0 --no-progress / || true

FROM alpine:latest

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata wget && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

COPY --from=builder /app/main .

RUN mkdir -p /tmp/uploads /app/logs && \
    chown -R appuser:appgroup /app /tmp/uploads

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

LABEL maintainer="receipt-store-team" \
    version="1.0.0" \
    description="Receipt Store Backend API"

CMD ["./main"]
