#!/bin/bash

# Receipt Store Backend Deployment Script for Raspberry Pi 5
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="receipt-store"
COMPOSE_FILE="docker-compose.pi.yml"
ENV_FILE=".env"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Raspberry Pi
check_pi() {
    if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        log_warning "This script is optimized for Raspberry Pi 5. Continue anyway? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "Exiting..."
            exit 0
        fi
    else
        log_success "Raspberry Pi detected"
    fi
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        log_info "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check available memory
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$MEMORY_GB" -lt 4 ]; then
        log_warning "Less than 4GB RAM detected. Performance may be affected."
    fi
    
    # Check available disk space
    DISK_SPACE=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    if [ "$DISK_SPACE" -lt 10 ]; then
        log_warning "Less than 10GB free disk space. Consider freeing up space."
    fi
    
    log_success "System requirements check completed"
}

# Setup environment file
setup_env() {
    log_info "Setting up environment configuration..."
    
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "env.pi.template" ]; then
            cp env.pi.template "$ENV_FILE"
            log_success "Created $ENV_FILE from template"
            log_warning "Please edit $ENV_FILE with your actual configuration values"
            log_info "Required values to update:"
            log_info "  - DB_PASSWORD (database password)"
            log_info "  - CLERK_SECRET_KEY (from Clerk dashboard)"
            log_info "  - JWT_SECRET (generate a secure random string)"
            log_info "  - SMTP credentials (if using email features)"
            
            # Ask if user wants to edit now
            echo
            log_info "Would you like to edit the environment file now? (y/N)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                ${EDITOR:-nano} "$ENV_FILE"
            fi
        else
            log_error "Environment template not found. Please create $ENV_FILE manually."
            exit 1
        fi
    else
        log_info "Environment file already exists"
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p backups
    mkdir -p nginx/ssl
    mkdir -p logs
    
    log_success "Directories created"
}

# Build and deploy
deploy() {
    log_info "Starting deployment..."
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build custom images
    log_info "Building application image..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Start services
    log_info "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service status
    check_services
}

# Check service status
check_services() {
    log_info "Checking service status..."
    
    # Check if containers are running
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_success "Services are running"
        
        # Test health endpoints
        if curl -f http://localhost/health >/dev/null 2>&1; then
            log_success "Health check passed"
        else
            log_warning "Health check failed - services may still be starting"
        fi
        
        # Show service URLs
        echo
        log_info "Service URLs:"
        log_info "  - Backend API: http://localhost/api/v1/"
        log_info "  - Health Check: http://localhost/health"
        log_info "  - Database: localhost:5432"
        
    else
        log_error "Some services failed to start"
        docker-compose -f "$COMPOSE_FILE" logs
        exit 1
    fi
}

# Show logs
show_logs() {
    log_info "Showing service logs..."
    docker-compose -f "$COMPOSE_FILE" logs -f
}

# Stop services
stop_services() {
    log_info "Stopping services..."
    docker-compose -f "$COMPOSE_FILE" down
    log_success "Services stopped"
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    BACKUP_FILE="backups/receipt-store-backup-$(date +%Y%m%d-%H%M%S).sql"
    
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres receiptlocker > "$BACKUP_FILE"
    
    if [ -f "$BACKUP_FILE" ]; then
        log_success "Database backup created: $BACKUP_FILE"
    else
        log_error "Database backup failed"
        exit 1
    fi
}

# Update services
update_services() {
    log_info "Updating services..."
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Rebuild and restart
    docker-compose -f "$COMPOSE_FILE" up -d --build
    
    log_success "Services updated"
}

# Show help
show_help() {
    echo "Receipt Store Backend Deployment Script for Raspberry Pi 5"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  deploy     Deploy the application (default)"
    echo "  start      Start services"
    echo "  stop       Stop services"
    echo "  restart    Restart services"
    echo "  logs       Show service logs"
    echo "  status     Check service status"
    echo "  backup     Backup database"
    echo "  update     Update services"
    echo "  help       Show this help message"
    echo
}

# Main script
main() {
    case "${1:-deploy}" in
        "deploy")
            check_pi
            check_requirements
            setup_env
            create_directories
            deploy
            ;;
        "start")
            docker-compose -f "$COMPOSE_FILE" up -d
            check_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 5
            docker-compose -f "$COMPOSE_FILE" up -d
            check_services
            ;;
        "logs")
            show_logs
            ;;
        "status")
            check_services
            ;;
        "backup")
            backup_database
            ;;
        "update")
            update_services
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
