# Receipt Store - Localhost Development Setup

This guide will help you set up the Receipt Store application for localhost development and testing.

## Quick Start

1. **Run the setup script:**
   ```bash
   ./setup-dev.sh
   ```

2. **Start the database services:**
   ```bash
   docker-compose up postgres redis -d
   ```

3. **Start the backend:**
   ```bash
   cd backend
   go run cmd/server/main.go
   ```

4. **Start the frontend (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Manual Setup

If you prefer to set up manually, follow these steps:

### 1. Environment Configuration

Create the following environment files:

**Root `.env`:**
```env
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

# Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Rate Limiting
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=60

# Database Connection Settings
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=5m
DB_CONN_MAX_IDLE_TIME=1m
```

**Frontend `frontend/.env.local`:**
```env
VITE_API_URL=http://localhost:8080
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
```

**Backend `backend/.env`:**
```env
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
DB_CONN_MAX_IDLE_TIME=1m
```

### 2. Clerk Authentication Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or use an existing one
3. Copy your publishable key and secret key
4. Update the environment files with your actual Clerk keys:
   - Replace `pk_test_your_clerk_key_here` with your publishable key
   - Replace `sk_test_your_clerk_secret_key_here` with your secret key

### 3. Database Setup

The application uses PostgreSQL and Redis. You can start them using Docker Compose:

```bash
# Start only the database services
docker-compose up postgres redis -d

# Or start all services
docker-compose up -d
```

### 4. Running the Application

**Backend:**
```bash
cd backend
go mod tidy
go run cmd/server/main.go
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **API Health Check:** http://localhost:8080/api/v1/health
- **CORS Test:** http://localhost:8080/api/v1/cors-test

## Troubleshooting

### CORS Issues
The backend has been configured to allow localhost origins. If you encounter CORS issues:
- Check that your frontend is running on port 3000 or 5173
- Verify the backend CORS configuration includes your frontend URL

### Database Connection Issues
- Ensure PostgreSQL is running on port 5433
- Check that the database credentials match your environment variables
- Verify the database `receiptlocker` exists

### Authentication Issues
- Ensure your Clerk keys are correctly set in the environment files
- Check that your Clerk application is configured for localhost development
- Verify the CORS settings allow your frontend domain

### Port Conflicts
If you encounter port conflicts:
- Change the ports in your `.env` files
- Update the CORS configuration in `backend/cmd/server/main.go`
- Update the API URL in your frontend environment

## Development Features

- **Hot Reload:** Frontend supports hot reload during development
- **Debug Logging:** Backend runs in debug mode with detailed logging
- **CORS Testing:** Use `/api/v1/cors-test` endpoint to verify CORS configuration
- **Health Checks:** Multiple health check endpoints available

## API Endpoints

- `GET /api/v1/health` - Health check
- `GET /api/v1/ready` - Readiness probe
- `GET /api/v1/live` - Liveness probe
- `GET /api/v1/cors-test` - CORS test
- `GET /api/v1/sponsorship/status` - Sponsorship status

Protected endpoints (require authentication):
- `GET /api/v1/receipts` - Get all receipts
- `POST /api/v1/receipts` - Create receipt
- `GET /api/v1/receipts/:id` - Get specific receipt
- `PUT /api/v1/receipts/:id` - Update receipt
- `DELETE /api/v1/receipts/:id` - Delete receipt
- `POST /api/v1/parse-email` - Parse email content
- `POST /api/v1/parse-pdf` - Parse PDF content
