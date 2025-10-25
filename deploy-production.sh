#!/bin/bash

# Production Deployment Script for Receipt Store
# Usage: ./deploy-production.sh

set -e

echo "================================================"
echo "Receipt Store - Production Deployment"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create a .env file from env.example:"
    echo "  cp env.example .env"
    echo "  nano .env"
    exit 1
fi

# Load environment variables
source .env

# Verify required environment variables
REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "CLERK_SECRET_KEY"
    "VITE_CLERK_PUBLISHABLE_KEY"
)

echo "Checking required environment variables..."
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set!${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ All required environment variables are set${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ docker-compose is available${NC}"
echo ""

# Pull latest changes (if in git repo)
if [ -d .git ]; then
    echo "Pulling latest changes from git..."
    git pull origin main || git pull origin master
    echo -e "${GREEN}✓ Git repository updated${NC}"
    echo ""
fi

# Backup database if exists
if docker-compose ps | grep -q "postgres"; then
    echo "Creating database backup..."
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker-compose exec -T postgres pg_dump -U postgres receiptlocker > $BACKUP_FILE 2>/dev/null || true
    
    if [ -f $BACKUP_FILE ]; then
        gzip $BACKUP_FILE
        echo -e "${GREEN}✓ Database backed up to ${BACKUP_FILE}.gz${NC}"
    else
        echo -e "${YELLOW}⚠ Database backup skipped (database not running)${NC}"
    fi
    echo ""
fi

# Build containers
echo "Building Docker containers..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Containers built successfully${NC}"
else
    echo -e "${RED}Error: Failed to build containers${NC}"
    exit 1
fi
echo ""

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

# Start services
echo "Starting services..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Services started successfully${NC}"
else
    echo -e "${RED}Error: Failed to start services${NC}"
    exit 1
fi
echo ""

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check if backend is healthy
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose ps | grep -q "backend.*healthy" || curl -f http://localhost:8080/api/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}Error: Backend failed to become healthy${NC}"
        echo "Check logs with: docker-compose logs backend"
        exit 1
    fi
    
    echo "Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done
echo ""

# Check database connection
echo "Verifying database connection..."
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database is ready${NC}"
else
    echo -e "${RED}Error: Database is not ready${NC}"
    exit 1
fi
echo ""

# Display running services
echo "Running services:"
docker-compose ps
echo ""

# Display useful information
echo "================================================"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "================================================"
echo ""
echo "API Endpoints:"
echo "  - Health: http://localhost:8080/api/v1/health"
echo "  - API: http://localhost:8080/api/v1"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Restart: docker-compose restart"
echo "  - Stop: docker-compose stop"
echo "  - Status: docker-compose ps"
echo ""
echo "Next steps:"
echo "  1. Configure Nginx reverse proxy (see PRODUCTION_DEPLOYMENT.md)"
echo "  2. Set up SSL certificate with certbot"
echo "  3. Configure monitoring and alerts"
echo "  4. Test API endpoints"
echo "  5. Connect frontend to API"
echo ""
echo "For more information, see PRODUCTION_DEPLOYMENT.md"
echo ""

