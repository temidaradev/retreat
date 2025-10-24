# Receipt Store Backend - Raspberry Pi 5 Deployment

This guide will help you deploy the Receipt Store Backend on your Raspberry Pi 5 using Docker and Docker Compose.

## 🚀 Quick Start

1. **Clone and setup**:
   ```bash
   git clone <your-repo-url>
   cd receipt-store
   chmod +x deploy-pi.sh monitor-pi.sh
   ```

2. **Configure environment**:
   ```bash
   cp env.pi.template .env
   nano .env  # Edit with your actual values
   ```

3. **Deploy**:
   ```bash
   ./deploy-pi.sh
   ```

## 📋 Prerequisites

### Hardware Requirements
- Raspberry Pi 5 (recommended) or Pi 4 with 4GB+ RAM
- 16GB+ microSD card (Class 10 or better)
- Stable internet connection
- Power supply (5V 3A recommended for Pi 5)

### Software Requirements
- Raspberry Pi OS (64-bit recommended)
- Docker Engine
- Docker Compose

## 🛠 Installation

### 1. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Logout and login again for group changes to take effect
```

### 2. Clone Repository

```bash
git clone <your-repo-url>
cd receipt-store
```

### 3. Configure Environment

```bash
# Copy environment template
cp env.pi.template .env

# Edit configuration
nano .env
```

**Required Environment Variables:**
- `DB_PASSWORD`: Secure database password
- `CLERK_SECRET_KEY`: From your Clerk dashboard
- `JWT_SECRET`: Generate a secure random string (32+ characters)
- `SMTP_USERNAME` & `SMTP_PASSWORD`: Email credentials (if using email features)

### 4. Deploy Application

```bash
# Make scripts executable
chmod +x deploy-pi.sh monitor-pi.sh

# Deploy
./deploy-pi.sh
```

## 🐳 Docker Services

The deployment includes the following services:

### Core Services
- **Backend API**: Go application (port 8080)
- **PostgreSQL**: Database (port 5432)
- **Nginx**: Reverse proxy (ports 80, 443)

### Optional Services
- **Watchtower**: Automatic updates
- **Monitoring**: System resource monitoring

## 📊 Monitoring

### Real-time Monitoring
```bash
# Generate monitoring report
./monitor-pi.sh

# Continuous monitoring
./monitor-pi.sh continuous

# Monitor logs
./monitor-pi.sh logs
```

### Service Management
```bash
# Start services
./deploy-pi.sh start

# Stop services
./deploy-pi.sh stop

# Restart services
./deploy-pi.sh restart

# Check status
./deploy-pi.sh status

# View logs
./deploy-pi.sh logs
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PASSWORD` | Database password | `secure_password_123` |
| `CLERK_SECRET_KEY` | Clerk authentication key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USERNAME` | SMTP username | Required |
| `SMTP_PASSWORD` | SMTP password | Required |
| `PORT` | Backend port | `8080` |
| `GIN_MODE` | Environment mode | `release` |

### Raspberry Pi Optimizations

The configuration is optimized for Raspberry Pi 5:
- Reduced database connection pool (10 max connections)
- Optimized Docker images for ARM64
- Resource-efficient Nginx configuration
- Automatic cleanup and updates

## 🔒 Security

### SSL/TLS Setup (Optional)

1. **Generate SSL certificates**:
   ```bash
   mkdir -p nginx/ssl
   # Add your SSL certificates to nginx/ssl/
   ```

2. **Update Nginx configuration**:
   ```bash
   # Uncomment HTTPS section in nginx/nginx.pi.conf
   nano nginx/nginx.pi.conf
   ```

3. **Restart services**:
   ```bash
   ./deploy-pi.sh restart
   ```

### Firewall Configuration

```bash
# Install UFW
sudo apt-get install ufw

# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 📈 Performance Optimization

### System Tuning

1. **Increase swap space**:
   ```bash
   sudo dphys-swapfile swapoff
   sudo nano /etc/dphys-swapfile
   # Set CONF_SWAPSIZE=2048
   sudo dphys-swapfile setup
   sudo dphys-swapfile swapon
   ```

2. **Optimize GPU memory split**:
   ```bash
   sudo nano /boot/config.txt
   # Add: gpu_mem=16
   ```

3. **Enable hardware acceleration**:
   ```bash
   sudo nano /boot/config.txt
   # Add: arm_freq=2400 (for Pi 5)
   ```

### Docker Optimization

```bash
# Limit Docker logs
sudo nano /etc/docker/daemon.json
# Add:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## 🔄 Backup & Recovery

### Database Backup

```bash
# Manual backup
./deploy-pi.sh backup

# Automated backup (add to crontab)
crontab -e
# Add: 0 2 * * * /path/to/receipt-store/deploy-pi.sh backup
```

### Full System Backup

```bash
# Create system image
sudo dd if=/dev/mmcblk0 of=/path/to/backup.img bs=4M status=progress
```

## 🚨 Troubleshooting

### Common Issues

1. **Out of memory**:
   ```bash
   # Check memory usage
   free -h
   # Increase swap or restart services
   ```

2. **High CPU temperature**:
   ```bash
   # Check temperature
   vcgencmd measure_temp
   # Ensure proper cooling
   ```

3. **Service won't start**:
   ```bash
   # Check logs
   ./deploy-pi.sh logs
   # Check Docker status
   docker ps -a
   ```

4. **Database connection issues**:
   ```bash
   # Check database logs
   docker-compose -f docker-compose.pi.yml logs postgres
   # Restart database
   docker-compose -f docker-compose.pi.yml restart postgres
   ```

### Log Locations

- Application logs: `logs/`
- Docker logs: `docker-compose -f docker-compose.pi.yml logs`
- System logs: `/var/log/syslog`

## 🔄 Updates

### Automatic Updates
Watchtower automatically updates Docker images. To disable:
```bash
# Comment out watchtower service in docker-compose.pi.yml
```

### Manual Updates
```bash
# Update services
./deploy-pi.sh update

# Update system
sudo apt update && sudo apt upgrade
```

## 📞 Support

### Health Checks

- Backend API: `http://localhost/api/v1/health`
- Database: `docker-compose -f docker-compose.pi.yml exec postgres pg_isready`
- Nginx: `http://localhost/health`

### Monitoring Endpoints

- System resources: `./monitor-pi.sh resources`
- Service status: `./monitor-pi.sh services`
- Health check: `./monitor-pi.sh health`

## 📝 Additional Notes

- The deployment is optimized for Raspberry Pi 5 but works on Pi 4
- All services run in Docker containers for isolation
- Automatic health checks and restart policies are configured
- Logs are automatically rotated to prevent disk space issues
- The system includes monitoring and alerting capabilities

For more information, check the individual service documentation or contact support.
