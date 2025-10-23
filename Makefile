.PHONY: help build up down restart logs clean test dev

# Default target
help:
	@echo "ReceiptLocker - Docker Commands"
	@echo "================================"
	@echo "make build    - Build all Docker images"
	@echo "make up       - Start all services"
	@echo "make down     - Stop all services"
	@echo "make restart  - Restart all services"
	@echo "make logs     - Show logs from all services"
	@echo "make clean    - Remove all containers, images, and volumes"
	@echo "make test     - Test the application"
	@echo "make dev      - Start development environment"
	@echo ""
	@echo "Quick Start: make up"

# Build all images
build:
	@echo "Building Docker images..."
	docker-compose build

# Start all services
up:
	@echo "Starting all services..."
	docker-compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🌐 Frontend:  http://localhost:3000"
	@echo "🔧 Backend:   http://localhost:8080"
	@echo "📊 Database:  localhost:5433"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "Run 'make logs' to see application logs"

# Start with build
dev: build up

# Stop all services
down:
	@echo "Stopping all services..."
	docker-compose down

# Restart all services
restart:
	@echo "Restarting all services..."
	docker-compose restart

# Show logs
logs:
	docker-compose logs -f

# Clean everything
clean:
	@echo "Cleaning up Docker resources..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup complete!"

# Test the application
test:
	@echo "Testing backend health..."
	@curl -s http://localhost:8080/api/v1/health | jq '.' || echo "Backend not responding"
	@echo ""
	@echo "Testing frontend..."
	@curl -s -o /dev/null -w "Frontend Status: %{http_code}\n" http://localhost:3000

# Quick rebuild
rebuild:
	@echo "Rebuilding and restarting..."
	docker-compose down
	docker-compose build
	docker-compose up -d
	@echo "✅ Rebuild complete!"

