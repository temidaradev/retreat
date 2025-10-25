#!/bin/bash

# Development Setup Script for Receipt Store
# This script helps set up the application for localhost development

echo "🚀 Setting up Receipt Store for localhost development..."

# Create environment files if they don't exist
create_env_file() {
    local file_path="$1"
    local content="$2"
    
    if [ ! -f "$file_path" ]; then
        echo "Creating $file_path..."
        cat > "$file_path" << EOF
$content
EOF
        echo "✅ Created $file_path"
    else
        echo "⚠️  $file_path already exists, skipping..."
    fi
}

# Root .env file
create_env_file ".env" "# Development Configuration for Receipt Store

# Database Configuration
POSTGRES_DB=receiptlocker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5433

# Redis Configuration
REDIS_PORT=6379

# Backend Configuration
BACKEND_PORT=8080
GIN_MODE=debug
DEV_MODE=true
LOG_LEVEL=debug
LOG_FORMAT=text

# Frontend Configuration
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:8080
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here

# Authentication (replace with your actual Clerk secret key)
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Rate Limiting
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=60

# Database Connection Settings
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=5m
DB_CONN_MAX_IDLE_TIME=1m"

# Frontend .env.local file
create_env_file "frontend/.env.local" "# Frontend Development Environment Variables

VITE_API_URL=http://localhost:8080
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here"

# Backend .env file
create_env_file "backend/.env" "# Backend Development Environment Variables

DATABASE_URL=postgres://postgres:postgres@localhost:5433/receiptlocker?sslmode=disable
REDIS_URL=redis://localhost:6379
PORT=8080
GIN_MODE=debug
DEV_MODE=true
LOG_LEVEL=debug
LOG_FORMAT=text
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=60
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=5m
DB_CONN_MAX_IDLE_TIME=1m"

echo ""
echo "📋 Next steps:"
echo "1. Update the Clerk keys in the .env files with your actual keys"
echo "2. Start the database services: docker-compose up postgres redis -d"
echo "3. Start the backend: cd backend && go run cmd/server/main.go"
echo "4. Start the frontend: cd frontend && npm run dev"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo ""
echo "✅ Development setup complete!"
