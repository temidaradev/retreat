# Retreat - Warranty & Receipt Management SaaS

A modern micro-SaaS application that helps users never lose their receipts and warranty information again. Simply forward purchase emails to save@retreat.com and we'll automatically extract warranty info, track expiry dates, and send reminders.

## 🚀 Features

### Core Features
- **Email Forwarding**: Forward any purchase email to automatically parse receipt data
- **Warranty Tracking**: Automatic warranty period detection and expiry tracking
- **Smart Reminders**: Get notified before warranties expire via email
- **PDF Receipt Parsing**: Upload and parse PDF receipts automatically
- **Modern Dashboard**: Clean, responsive interface built with React and Tailwind CSS
- **Secure Authentication**: Powered by Clerk.dev
- **RESTful API**: Go backend with PostgreSQL database

### Production Features
- **Sponsorship System**: Free tier (10 receipts) and Premium via Buy Me a Coffee & GitHub Sponsors
- **Manual Verification**: Admin panel for approving sponsorship requests
- **Email Notifications**: Automated warranty expiry reminders
- **Rate Limiting**: API protection and abuse prevention
- **Security Headers**: Production-ready security measures
- **Health Monitoring**: Comprehensive health checks and logging
- **Automated Backups**: Database backup and recovery system
- **Docker Deployment**: Production-ready containerization

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │   Go Backend    │    │   PostgreSQL    │
│   (Port 3000)   │◄──►│   (Port 8080)   │◄──►│   (Port 5433)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Clerk Auth    │    │   Email Parser  │
│   (External)    │    │   (Future)      │
└─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Clerk.dev** for authentication
- **Lucide React** for icons
- **React Router** for navigation

### Backend
- **Go** with Fiber framework
- **PostgreSQL** database with automated migrations
- **Clerk SDK** for authentication
- **Sponsorship Integration** for Buy Me a Coffee & GitHub Sponsors
- **SMTP** for email notifications
- **Rate limiting** and security middleware
- **Docker** for containerization

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running
- Clerk account (free at [clerk.dev](https://clerk.dev))
- Buy Me a Coffee account (optional for development)
- GitHub account for sponsors API (optional for development)
- SMTP server for email notifications (optional for development)

### Setup Instructions

1. **Clone the repository**:
```bash
git clone <repository-url>
cd receipt-store
```

2. **Set up Clerk Authentication**:
   - Create an account at [clerk.dev](https://clerk.dev)
   - Create a new application
   - Copy your **Publishable Key** and **Secret Key**

3. **Create environment file**:

Copy the example environment file and update the values:

```bash
cp env.example .env
```

Edit the `.env` file with your configuration:

```bash
# Database Configuration
POSTGRES_DB=retreat
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_PORT=5433

# Backend Configuration
BACKEND_PORT=8080
GIN_MODE=debug

# Frontend Configuration
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:8080

# Clerk Authentication (Required - Get from https://clerk.dev)
CLERK_SECRET_KEY=sk_test_your_secret_key_here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Sponsorship Integration (Buy Me a Coffee & GitHub Sponsors)
BUYMEACOFFEE_USERNAME=your_buymeacoffee_username
GITHUB_USERNAME=your_github_username
GITHUB_TOKEN=your_github_token_for_sponsors_api
KNOWN_SUPPORTERS=[{"username":"supporter1","email":"supporter1@example.com","platform":"buymeacoffee"}]

# Email Configuration (Optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@retreat.com
```

4. **Start the application**:
```bash
docker-compose up -d
```

This will start all services:
- ✅ PostgreSQL database
- ✅ Go backend API
- ✅ React frontend

5. **Access the application**:
   - 🌐 **Frontend**: http://localhost:3000
   - 🔧 **Backend API**: http://localhost:8080
   - 📊 **Database**: localhost:5433

## 🐳 Docker Management

### Useful Commands

**View logs**:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

**Stop services**:
```bash
docker-compose down
```

**Restart services**:
```bash
docker-compose restart
```

**Rebuild after code changes**:
```bash
docker-compose up -d --build
```

**Clean up everything** (including database):
```bash
docker-compose down -v
```

## 🚀 Production Deployment

### Prerequisites for Production
- VPS or cloud server (AWS, DigitalOcean, etc.)
- Domain name
- SSL certificate (Let's Encrypt recommended)
- SMTP server (SendGrid, Mailgun, etc.)

### Production Setup

1. **Prepare your server**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Clone and configure**:
```bash
git clone <your-repo-url>
cd receipt-store
cp env.example .env
# Edit .env with production values
```

3. **Deploy**:
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run full deployment
./deploy.sh deploy

# Or run specific commands
./deploy.sh backup    # Create database backup
./deploy.sh health    # Check service health
./deploy.sh test      # Run tests
```

### Production Features

- **Automatic Backups**: Daily database backups with retention
- **Health Monitoring**: Comprehensive health checks
- **Rate Limiting**: API protection against abuse
- **SSL/TLS**: Secure HTTPS connections
- **Logging**: Centralized logging with rotation
- **Monitoring**: Service health and performance monitoring
- **Rollback**: Easy rollback to previous versions

## 📁 Project Structure

```
receipt-store/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Dashboard.tsx
│   │   │   └── Landing.tsx
│   │   ├── services/        # API services
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── Dockerfile           # Frontend container
│   └── package.json
├── backend/                  # Go backend
│   ├── cmd/
│   │   └── server/
│   │       └── main.go      # Server entry point
│   ├── internal/
│   │   ├── handlers/        # HTTP handlers
│   │   ├── models/          # Data models
│   │   └── database/        # Database connection
│   ├── Dockerfile           # Backend container
│   └── go.mod
├── docker-compose.yml       # Docker orchestration
├── .env                     # Environment variables
└── README.md
```

## 📊 API Endpoints

Base URL: `http://localhost:8080/api/v1`

### Receipts
- `GET /api/v1/receipts` - Get all receipts for authenticated user
- `POST /api/v1/receipts` - Create new receipt
- `GET /api/v1/receipts/:id` - Get specific receipt
- `PUT /api/v1/receipts/:id` - Update receipt
- `DELETE /api/v1/receipts/:id` - Delete receipt

### Email Parsing
- `POST /api/v1/parse-email` - Parse email content for receipt data
- `POST /api/v1/parse-pdf` - Parse PDF receipt content

### Sponsorship Management
- `GET /api/v1/sponsorship/status` - Get current user's sponsorship status
- `POST /api/v1/sponsorship/verify` - Request sponsorship verification
- `GET /api/v1/sponsorship/info` - Get sponsorship platform information

### Admin Routes
- `GET /admin/verifications` - Get pending sponsorship verifications
- `POST /admin/approve` - Approve sponsorship verification
- `POST /admin/reject` - Reject sponsorship verification

### Health Check
- `GET /api/v1/health` - Server health status

All authenticated endpoints require a valid Clerk session token in the `Authorization` header.

## 💰 Monetization Strategy

### Pricing Tiers
- **Free Tier**: 10 receipts, basic features
- **Premium**: Via sponsorship (Buy Me a Coffee or GitHub Sponsors)

### Premium Features
- Unlimited receipt storage
- Advanced email parsing with ML
- PDF receipt parsing
- Email forwarding (save@retreat.com)
- Priority customer support
- Advanced analytics and insights

### Sponsorship Platforms
- **Buy Me a Coffee**: One-time coffee purchases
- **GitHub Sponsors**: Monthly recurring support
- **Manual Verification**: Admin approval system for supporters

## 🚧 Roadmap

### Phase 1 (Completed ✅)
- [x] Basic React frontend with authentication
- [x] Go backend with PostgreSQL
- [x] Receipt CRUD operations
- [x] Basic email parsing
- [x] PDF receipt parsing
- [x] Sponsorship integration (Buy Me a Coffee & GitHub Sponsors)
- [x] Email notifications
- [x] Manual verification system
- [x] Production deployment setup
- [x] Security and rate limiting
- [x] Automated testing

### Phase 2 (In Progress 🚧)
- [ ] Advanced email parsing with ML/NLP
- [ ] Email forwarding setup (save@retreat.com)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Team/family sharing features

### Phase 3 (Future 🔮)
- [ ] OCR for image receipts
- [ ] Integration with major retailers
- [ ] AI-powered warranty recommendations
- [ ] API for third-party integrations
- [ ] Advanced reporting and insights

## 🧪 Testing

### Running Tests

**Backend Tests**:
```bash
cd backend
go test ./...
```

**Frontend Tests**:
```bash
cd frontend
npm test
```

**Integration Tests**:
```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d postgres

# Run integration tests
go test ./cmd/server -v
```

**End-to-End Tests**:
```bash
# Start full application
docker-compose up -d

# Run E2E tests
npm run test:e2e
```

### Test Coverage
- Unit tests for all handlers and services
- Integration tests for API endpoints
- Database migration tests
- Payment webhook tests
- Email notification tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@retreat.com or create an issue in the repository.

---

**Built with ❤️ for people who lose receipts**
