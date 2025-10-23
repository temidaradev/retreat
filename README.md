# Retreat - Warranty & Receipt Management SaaS

A modern micro-SaaS application that helps users never lose their receipts and warranty information again. Simply forward purchase emails to save@retreat.com and we'll automatically extract warranty info, track expiry dates, and send reminders.

## 🚀 Features

- **Email Forwarding**: Forward any purchase email to automatically parse receipt data
- **Warranty Tracking**: Automatic warranty period detection and expiry tracking
- **Smart Reminders**: Get notified before warranties expire
- **Modern Dashboard**: Clean, responsive interface built with React and Tailwind CSS
- **Secure Authentication**: Powered by Clerk.dev
- **RESTful API**: Go backend with PostgreSQL database

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
- **Go** with Gin framework
- **PostgreSQL** database
- **Clerk SDK** for authentication
- **Docker** for containerization

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running
- Clerk account (free at [clerk.dev](https://clerk.dev))

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

Create a `.env` file in the root directory:

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

### Health Check
- `GET /api/v1/health` - Server health status

All authenticated endpoints require a valid Clerk session token in the `Authorization` header.

## 💰 Monetization Strategy

- **Free Tier**: 10 receipts
- **Premium**: $3-5/month for unlimited receipts
- **Features**: Email forwarding, advanced parsing, priority support

## 🚧 Roadmap

### Phase 1 (Current)
- [x] Basic React frontend with authentication
- [x] Go backend with PostgreSQL
- [x] Receipt CRUD operations
- [x] Basic email parsing

### Phase 2 (Next)
- [ ] Advanced email parsing
- [ ] Email forwarding setup
- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] Mobile app

### Phase 3 (Future)
- [ ] OCR for PDF receipts
- [ ] Integration with major retailers
- [ ] Advanced analytics
- [ ] Team/family sharing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@retreat.com or create an issue in the repository.

---

**Built with ❤️ for people who lose receipts**
