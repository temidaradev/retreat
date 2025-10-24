#!/bin/bash

# Receipt Store Backend Monitoring Script for Raspberry Pi 5
# Monitors system resources and service health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.pi.yml"
LOG_FILE="logs/monitor.log"

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

# Check system resources
check_resources() {
    echo "=== System Resources ==="
    
    # CPU usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    echo "CPU Usage: ${CPU_USAGE}%"
    
    # Memory usage
    MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')
    MEMORY_FREE=$(free -h | grep Mem | awk '{print $7}')
    echo "Memory Usage: $MEMORY_USAGE (Free: $MEMORY_FREE)"
    
    # Disk usage
    DISK_USAGE=$(df -h . | awk 'NR==2{print $5}')
    DISK_FREE=$(df -h . | awk 'NR==2{print $4}')
    echo "Disk Usage: $DISK_USAGE (Free: $DISK_FREE)"
    
    # Temperature (Raspberry Pi specific)
    if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
        TEMP=$(cat /sys/class/thermal/thermal_zone0/temp)
        TEMP_C=$((TEMP/1000))
        echo "CPU Temperature: ${TEMP_C}°C"
        
        if [ $TEMP_C -gt 80 ]; then
            log_warning "High CPU temperature detected!"
        fi
    fi
    
    # Load average
    LOAD=$(uptime | awk -F'load average:' '{print $2}')
    echo "Load Average:$LOAD"
    
    echo
}

# Check Docker services
check_services() {
    echo "=== Docker Services ==="
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose not found"
        return 1
    fi
    
    # Check if services are running
    SERVICES=$(docker-compose -f "$COMPOSE_FILE" ps --services)
    
    for service in $SERVICES; do
        STATUS=$(docker-compose -f "$COMPOSE_FILE" ps "$service" | tail -n +3 | awk '{print $3}')
        if [[ "$STATUS" == *"Up"* ]]; then
            log_success "$service: Running"
        else
            log_error "$service: Not running"
        fi
    done
    
    echo
}

# Check service health
check_health() {
    echo "=== Service Health ==="
    
    # Check backend health
    if curl -f http://localhost/health >/dev/null 2>&1; then
        log_success "Backend API: Healthy"
    else
        log_error "Backend API: Unhealthy"
    fi
    
    # Check database connection
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        log_success "Database: Connected"
    else
        log_error "Database: Connection failed"
    fi
    
    # Check Nginx
    if curl -f http://localhost/health >/dev/null 2>&1; then
        log_success "Nginx: Responding"
    else
        log_error "Nginx: Not responding"
    fi
    
    echo
}

# Check logs for errors
check_logs() {
    echo "=== Recent Errors ==="
    
    # Check for errors in the last 5 minutes
    ERROR_COUNT=$(docker-compose -f "$COMPOSE_FILE" logs --since=5m 2>&1 | grep -i error | wc -l)
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        log_warning "Found $ERROR_COUNT errors in the last 5 minutes"
        docker-compose -f "$COMPOSE_FILE" logs --since=5m 2>&1 | grep -i error | tail -5
    else
        log_success "No recent errors found"
    fi
    
    echo
}

# Generate report
generate_report() {
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "=== Receipt Store Monitoring Report - $TIMESTAMP ==="
    echo
    
    check_resources
    check_services
    check_health
    check_logs
    
    echo "=== End of Report ==="
    echo
}

# Continuous monitoring
monitor_continuous() {
    log_info "Starting continuous monitoring (Press Ctrl+C to stop)"
    
    while true; do
        clear
        generate_report
        sleep 30
    done
}

# Log monitoring
monitor_log() {
    log_info "Monitoring logs (Press Ctrl+C to stop)"
    docker-compose -f "$COMPOSE_FILE" logs -f
}

# Show help
show_help() {
    echo "Receipt Store Backend Monitoring Script for Raspberry Pi 5"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  monitor    Generate one-time monitoring report (default)"
    echo "  continuous Start continuous monitoring"
    echo "  logs       Monitor service logs"
    echo "  resources  Check system resources only"
    echo "  services   Check Docker services only"
    echo "  health     Check service health only"
    echo "  help       Show this help message"
    echo
}

# Main script
main() {
    case "${1:-monitor}" in
        "monitor")
            generate_report
            ;;
        "continuous")
            monitor_continuous
            ;;
        "logs")
            monitor_log
            ;;
        "resources")
            check_resources
            ;;
        "services")
            check_services
            ;;
        "health")
            check_health
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
