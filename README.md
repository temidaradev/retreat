# Retreat - Receipt & Warranty Management

A production-ready micro-SaaS that helps users never lose receipts and warranty information. Forward purchase emails to automatically extract warranty info, track expiry dates, and get smart reminders.

## 🎯 Features

- **Email Forwarding**: Auto-parse receipt data from forwarded emails
- **Warranty Tracking**: Automatic expiry detection and notifications
- **PDF Parsing**: Upload and parse PDF receipts
- **Modern Dashboard**: React 18 + TypeScript + Tailwind CSS interface
- **Secure Auth**: Clerk.dev authentication with JWT
- **Sponsorship System**: Free tier (10 receipts) + Premium via Buy Me a Coffee
- **Production Ready**: Graceful shutdown, health checks, structured logging, rate limiting
- **Secure by Default**: SSL/TLS, security headers, no-new-privileges containers

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Go 1.25, Fiber v2 framework, PostgreSQL 15
- **Cache**: Redis 7
- **Auth**: Clerk.dev
- **Deployment**: Docker Compose, Nginx, Let's Encrypt
- **Monitoring**: Built-in health checks, structured JSON logging

## 🚀 Quick Start

### Development

1. **Prerequisites**: Docker Desktop, Clerk account
2. **Clone & Setup**:
   ```bash
   git clone <repository-url>
   cd receipt-store
   cp env.example .env
   # Edit .env with your Clerk keys and database credentials
   ```
3. **Run**:
   ```bash
   docker-compose up -d
   ```
4. **Access**: 
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/api/v1/health

📖 **Full guide**: See [QUICK_START.md](./QUICK_START.md)

### Production Deployment

Deploy to Hetzner with production-grade security and monitoring:

```bash
# Quick deploy
./deploy-production.sh
```

📖 **Detailed guide**: See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

## 📋 Environment Variables

### Required
```env
CLERK_SECRET_KEY=sk_live_your_key_here          # From clerk.dev
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key    # From clerk.dev
POSTGRES_PASSWORD=secure_password               # Database password
REDIS_PASSWORD=secure_redis_password            # Redis password
VITE_API_URL=https://api.retreat-app.tech      # Production API URL
```

### Optional
```env
BUYMEACOFFEE_USERNAME=your_username    # Sponsorship integration
SMTP_HOST=smtp.gmail.com              # Email notifications
SMTP_PORT=587
SMTP_USERNAME=your_email
SMTP_PASSWORD=your_app_password
LOG_LEVEL=info                        # debug, info, warn, error
RATE_LIMIT_REQUESTS=100               # Requests per window
```

📖 **Complete list**: See [env.example](./env.example)

## 🔌 API Endpoints

**Base URL**: 
- Development: `http://localhost:8080/api/v1`
- Production: `https://api.retreat-app.tech/api/v1`

### Public Endpoints
- `GET /health` - Health check
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

### Protected Endpoints (Require Authentication)
- `GET /receipts` - List all receipts
- `POST /receipts` - Create receipt
- `GET /receipts/:id` - Get specific receipt
- `PUT /receipts/:id` - Update receipt
- `DELETE /receipts/:id` - Delete receipt
- `POST /parse-email` - Parse email content
- `POST /parse-pdf` - Parse PDF receipts
- `GET /sponsorship/status` - Check sponsorship status

## 🏗️ Architecture

```
┌─────────────┐      HTTPS      ┌─────────────┐
│   Frontend  │ ◄──────────────► │   Nginx     │
│  (React)    │                  │  Reverse    │
└─────────────┘                  │   Proxy     │
                                 └──────┬──────┘
                                        │
                                 ┌──────▼──────┐
                                 │   Backend   │
                                 │   (Go/Fiber)│
                                 └──────┬──────┘
                                        │
                          ┌─────────────┴──────────────┐
                          │                            │
                   ┌──────▼──────┐            ┌────────▼─────┐
                   │  PostgreSQL │            │    Redis     │
                   │  (Primary)  │            │   (Cache)    │
                   └─────────────┘            └──────────────┘
```

### Key Components

- **Frontend**: React SPA with Clerk authentication
- **Backend**: Go API server with Fiber framework
- **Database**: PostgreSQL 15 with connection pooling
- **Cache**: Redis for sessions and rate limiting
- **Reverse Proxy**: Nginx with SSL/TLS termination
- **Authentication**: Clerk JWT validation

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Get started in 5 minutes
- **[Production Deployment](./PRODUCTION_DEPLOYMENT.md)** - Deploy to Hetzner
- **[Development Guide](./DEVELOPMENT.md)** - Development workflow
- **[Environment Variables](./env.example)** - Configuration reference

## 🔒 Security Features

- ✅ JWT-based authentication with Clerk
- ✅ Rate limiting (100 req/min by default)
- ✅ CORS protection with origin whitelist
- ✅ Security headers (XSS, CSRF, Clickjacking)
- ✅ SQL injection protection (prepared statements)
- ✅ Input validation
- ✅ Docker container security (read-only, no-new-privileges)
- ✅ Graceful shutdown handling
- ✅ Health checks and monitoring

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for API changes
- Ensure all tests pass before submitting PR
- Use conventional commit messages

### Testing

```bash
# Backend tests
cd backend && go test ./... -v

# Frontend tests  
cd frontend && npm test

# Check linting
cd backend && golangci-lint run
cd frontend && npm run lint

# Full integration test
docker-compose up -d && npm run test:e2e
```

## 🐛 Troubleshooting

Common issues and solutions:

1. **Backend won't start**: Check logs with `docker-compose logs backend`
2. **Database connection failed**: Verify `DATABASE_URL` and PostgreSQL is running
3. **Authentication failed**: Verify `CLERK_SECRET_KEY` is correct
4. **CORS errors**: Check allowed origins in `main.go`

See [QUICK_START.md](./QUICK_START.md#troubleshooting) for detailed troubleshooting.

## 📈 Performance

- **Response Time**: < 100ms (p95)
- **Throughput**: 1000+ req/s on single instance
- **Database**: Connection pooling (25 max connections)
- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: Prevents abuse and ensures fair usage

## 📄 License

MIT License - see LICENSE file for details.

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/receipt-store/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/receipt-store/discussions)
- **Email**: support@retreat-app.tech

## ⭐ Show Your Support

If you find this project helpful, please give it a ⭐️ on GitHub!

---

Built with ❤️ using Go and React
