# Quick Start Guide - Receipt Store

Get your Receipt Store application up and running in minutes!

## 🚀 Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Go 1.25+ (for backend development)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/receipt-store.git
cd receipt-store
```

### 2. Configure Environment

```bash
# Copy example environment file
cp env.example .env

# Edit .env with your values
nano .env
```

**Minimum required variables for development:**
```env
POSTGRES_PASSWORD=dev_password
REDIS_PASSWORD=dev_redis
CLERK_SECRET_KEY=your_clerk_secret_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
DEV_MODE=true
DB_SSLMODE=disable
```

### 3. Start Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access Application

- **Backend API**: http://localhost:8080
- **API Health**: http://localhost:8080/api/v1/health
- **Frontend**: http://localhost:3000 (if running frontend container)

## 🏭 Production Deployment

### Quick Deploy to Hetzner

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Clone repository
git clone https://github.com/yourusername/receipt-store.git
cd receipt-store

# 3. Configure production environment
cp env.example .env
nano .env  # Add production values

# 4. Run deployment script
./deploy-production.sh
```

For detailed production setup, see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

## 🔧 Development Workflow

### Backend Development

```bash
cd backend

# Install dependencies
go mod download

# Run tests
go test ./...

# Run locally (without Docker)
go run cmd/server/main.go
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Database Management

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d receiptlocker

# Create backup
docker-compose exec postgres pg_dump -U postgres receiptlocker > backup.sql

# Restore backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres receiptlocker
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
go test ./... -v
```

### API Testing

```bash
# Health check
curl http://localhost:8080/api/v1/health

# Test with authentication (replace TOKEN with your Clerk token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/api/v1/receipts
```

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100
```

### Check Health

```bash
# Backend health
curl http://localhost:8080/api/v1/health

# Database health
docker-compose exec postgres pg_isready -U postgres
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
sudo lsof -i :8080

# Or use netstat
netstat -tulpn | grep 8080

# Stop conflicting service or change port in docker-compose.yml
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Backend Won't Start

```bash
# Check backend logs
docker-compose logs backend

# Common issues:
# 1. Missing environment variables
# 2. Database not ready (wait 30 seconds)
# 3. Port conflict

# Restart backend
docker-compose restart backend
```

### Clean Start

```bash
# Stop all services
docker-compose down

# Remove volumes (⚠️ deletes all data!)
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build
```

## 📝 Environment Variables

### Essential Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_PASSWORD` | PostgreSQL password | ✅ |
| `REDIS_PASSWORD` | Redis password | ✅ |
| `CLERK_SECRET_KEY` | Clerk authentication key | ✅ |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key | ✅ |
| `VITE_API_URL` | Backend API URL | ✅ |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_REQUESTS` | Rate limit per window | `100` |
| `DB_MAX_OPEN_CONNS` | Max DB connections | `25` |

See [env.example](./env.example) for complete list.

## 🔐 Security Notes

### Development
- Use weak passwords in development only
- Never commit `.env` file
- Use `DEV_MODE=true` for easier debugging

### Production
- Generate strong passwords: `openssl rand -base64 32`
- Enable SSL/TLS (`DB_SSLMODE=require`)
- Use firewall rules
- Keep secrets in environment variables only
- Regularly update dependencies
- Enable rate limiting

## 📚 Additional Resources

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Development Guide](./DEVELOPMENT.md)
- [API Documentation](./docs/API.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

## 💬 Get Help

- GitHub Issues: [Report a bug](https://github.com/yourusername/receipt-store/issues)
- Documentation: [Full docs](https://retreat-app.tech/docs)
- Community: [Discord/Slack](https://your-community-link)

## ✅ Quick Checklist

Development:
- [ ] Docker installed and running
- [ ] `.env` file configured
- [ ] Services started with `docker-compose up -d`
- [ ] Health check passing
- [ ] Clerk authentication configured

Production:
- [ ] Server provisioned and secured
- [ ] Domain DNS configured
- [ ] SSL certificate installed
- [ ] Environment variables set
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Firewall configured

---

**Need help?** Check [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed instructions.

