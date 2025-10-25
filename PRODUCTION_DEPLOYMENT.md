# Production Deployment Guide - Receipt Store (Retreat)

This guide covers deploying the Receipt Store application to production on Hetzner using Docker Compose with the API hosted at `https://api.retreat-app.tech`.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Application Deployment](#application-deployment)
4. [SSL/TLS Configuration](#ssltls-configuration)
5. [Monitoring & Logging](#monitoring--logging)
6. [Backup & Recovery](#backup--recovery)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Services
- Hetzner Cloud Server (minimum: CX21 - 2 vCPU, 4GB RAM)
- Domain name configured to point to your server
  - `api.retreat-app.tech` → Server IP
  - `retreat-app.tech` → Frontend (Vercel/Netlify or same server)
- Clerk account with API keys
- PostgreSQL 15+
- Docker & Docker Compose
- SSL certificate (Let's Encrypt recommended)

### Local Requirements
- SSH access to server
- Git installed
- Docker Compose v2.0+

## Server Setup

### 1. Initial Server Configuration

```bash
# SSH into your Hetzner server
ssh root@YOUR_SERVER_IP

# Update system packages
apt update && apt upgrade -y

# Install required packages
apt install -y \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    ufw \
    fail2ban

# Enable Docker
systemctl enable docker
systemctl start docker

# Create non-root user for deployment
useradd -m -s /bin/bash retreat
usermod -aG docker retreat
```

### 2. Firewall Configuration

```bash
# Configure UFW firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable

# Check status
ufw status
```

### 3. Fail2ban Configuration

```bash
# Configure fail2ban for SSH protection
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
EOF

systemctl enable fail2ban
systemctl restart fail2ban
```

## Application Deployment

### 1. Clone Repository

```bash
# Switch to retreat user
su - retreat

# Clone the repository
git clone https://github.com/yourusername/receipt-store.git
cd receipt-store
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with production values
nano .env
```

**Required Environment Variables:**

```bash
# Database (generate secure passwords!)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_your_actual_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_actual_key_here

# API URL
VITE_API_URL=https://api.retreat-app.tech

# Security
JWT_SECRET=$(openssl rand -base64 32)

# Production settings
GIN_MODE=release
DEV_MODE=false
LOG_LEVEL=info
LOG_FORMAT=json
DB_SSLMODE=require
```

### 3. Build and Start Services

```bash
# Build the containers
docker-compose build --no-cache

# Start the services
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Verify all services are running
docker-compose ps
```

### 4. Verify Database

```bash
# Check database connection
docker-compose exec postgres psql -U postgres -d receiptlocker -c "SELECT version();"

# Verify migrations ran successfully
docker-compose exec postgres psql -U postgres -d receiptlocker -c "\dt"
```

## SSL/TLS Configuration

### 1. Install SSL Certificate

```bash
# Exit to root user
exit

# Obtain SSL certificate from Let's Encrypt
certbot --nginx -d api.retreat-app.tech

# Auto-renewal (already configured by certbot)
systemctl status certbot.timer
```

### 2. Nginx Configuration

Create Nginx configuration for the API:

```bash
cat > /etc/nginx/sites-available/retreat-api << 'EOF'
upstream backend {
    server 127.0.0.1:8080;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.retreat-app.tech;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.retreat-app.tech;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.retreat-app.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.retreat-app.tech/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/retreat-api-access.log;
    error_log /var/log/nginx/retreat-api-error.log;

    # Proxy settings
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffers
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check endpoint (no auth required)
    location /api/v1/health {
        proxy_pass http://backend;
        access_log off;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/retreat-api /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

## Monitoring & Logging

### 1. Container Health Checks

```bash
# Check container health
docker-compose ps

# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Export logs to file
docker-compose logs --no-color > logs-$(date +%Y%m%d).txt
```

### 2. Application Monitoring

Create a monitoring script:

```bash
cat > /home/retreat/monitor.sh << 'EOF'
#!/bin/bash

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.retreat-app.tech/api/v1/health)

if [ "$API_STATUS" != "200" ]; then
    echo "API health check failed with status: $API_STATUS"
    # Send alert (configure with your alerting service)
    # curl -X POST https://your-alert-webhook.com -d "API is down"
fi

# Check database
POSTGRES_STATUS=$(docker-compose exec -T postgres pg_isready -U postgres)
if [ $? -ne 0 ]; then
    echo "PostgreSQL is not responding"
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "Disk usage is above 80%: ${DISK_USAGE}%"
fi

# Check memory
MEMORY_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d'.' -f1)
if [ "$MEMORY_USAGE" -gt 85 ]; then
    echo "Memory usage is above 85%: ${MEMORY_USAGE}%"
fi
EOF

chmod +x /home/retreat/monitor.sh

# Add to crontab (run every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/retreat/monitor.sh >> /home/retreat/monitor.log 2>&1") | crontab -
```

### 3. Log Rotation

```bash
cat > /etc/logrotate.d/receipt-store << 'EOF'
/home/retreat/receipt-store/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 retreat retreat
    sharedscripts
}
EOF
```

## Backup & Recovery

### 1. Database Backup Script

```bash
cat > /home/retreat/backup-db.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/retreat/receipt-store/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U postgres receiptlocker > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 7 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x /home/retreat/backup-db.sh

# Schedule daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /home/retreat/backup-db.sh >> /home/retreat/backup.log 2>&1") | crontab -
```

### 2. Database Restore

```bash
# Restore from backup
gunzip -c backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker-compose exec -T postgres psql -U postgres receiptlocker
```

### 3. Full System Backup

```bash
# Backup volumes
docker run --rm \
  -v receiptlocker-postgres-data:/data \
  -v /home/retreat/backups:/backup \
  alpine tar czf /backup/postgres-volume-$(date +%Y%m%d).tar.gz /data
```

## Security Best Practices

### 1. Regular Updates

```bash
# Update system packages weekly
apt update && apt upgrade -y

# Update Docker images
cd /home/retreat/receipt-store
docker-compose pull
docker-compose up -d --build
```

### 2. Security Audit

```bash
# Check for security vulnerabilities
docker scan receiptlocker-backend:latest

# Audit Docker containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 3. Access Control

- Use SSH keys only (disable password authentication)
- Implement IP whitelisting for admin access
- Use strong, unique passwords for all services
- Enable 2FA for Clerk dashboard
- Regularly rotate secrets and tokens

### 4. Database Security

```bash
# Inside postgres container, create read-only user for monitoring
docker-compose exec postgres psql -U postgres -d receiptlocker << 'EOF'
CREATE USER monitoring WITH PASSWORD 'monitoring_password';
GRANT CONNECT ON DATABASE receiptlocker TO monitoring;
GRANT USAGE ON SCHEMA public TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
EOF
```

## Troubleshooting

### Common Issues

#### 1. Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common causes:
# - Database not ready: Wait 30 seconds and check again
# - Missing environment variables: Verify .env file
# - Port already in use: Check with `netstat -tulpn | grep 8080`
```

#### 2. Database connection issues

```bash
# Verify database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d receiptlocker -c "SELECT 1;"
```

#### 3. SSL certificate issues

```bash
# Check certificate status
certbot certificates

# Renew manually
certbot renew

# Test Nginx configuration
nginx -t
```

#### 4. High memory usage

```bash
# Check memory usage by container
docker stats

# Restart specific service
docker-compose restart backend

# If persistent, adjust resource limits in docker-compose.yml
```

### Useful Commands

```bash
# View all containers
docker-compose ps

# Restart all services
docker-compose restart

# Stop all services
docker-compose stop

# Start all services
docker-compose start

# Rebuild and restart
docker-compose up -d --build

# View container resource usage
docker stats

# Clean up unused Docker resources
docker system prune -a

# Follow logs for all services
docker-compose logs -f --tail=100
```

## Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] SSL certificate installed and working
- [ ] Database backups scheduled
- [ ] Monitoring scripts configured
- [ ] Firewall rules configured
- [ ] Fail2ban configured
- [ ] Log rotation configured
- [ ] Health checks passing
- [ ] Clerk authentication tested
- [ ] API endpoints tested
- [ ] Frontend connected and working
- [ ] Rate limiting configured
- [ ] Security headers verified
- [ ] Domain DNS configured correctly
- [ ] Email notifications working (if configured)

## Maintenance Windows

Schedule regular maintenance:

- **Daily**: Automated backups at 2 AM
- **Weekly**: System updates (Sundays, 3 AM)
- **Monthly**: Security audit and log review
- **Quarterly**: Full disaster recovery test

## Support & Contact

For issues or questions:
- GitHub Issues: [repository-url]
- Email: support@retreat-app.tech
- Documentation: https://retreat-app.tech/docs

## License

[Your License Here]

