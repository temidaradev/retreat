# Retreat - Receipt & Warranty Management

A micro-SaaS that helps users never lose receipts and warranty information. Forward purchase emails to automatically extract warranty info, track expiry dates, and get smart reminders.

## Features

- **Email Forwarding**: Auto-parse receipt data from forwarded emails
- **Warranty Tracking**: Automatic expiry detection and notifications
- **PDF Parsing**: Upload and parse PDF receipts
- **Modern Dashboard**: React + Tailwind CSS interface
- **Secure Auth**: Clerk.dev authentication
- **Sponsorship System**: Free tier (10 receipts) + Premium via Buy Me a Coffee

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Go, Fiber framework, PostgreSQL
- **Auth**: Clerk.dev
- **Deployment**: Docker, Docker Compose

## Quick Start

1. **Prerequisites**: Docker Desktop, Clerk account
2. **Clone & Setup**:
   ```bash
   git clone <repository-url>
   cd receipt-store
   cp env.example .env
   # Edit .env with your Clerk keys
   ```
3. **Run**:
   ```bash
   docker-compose up -d
   ```
4. **Access**: http://localhost:3000

## Environment Variables

Required:
- `CLERK_SECRET_KEY` - From clerk.dev
- `VITE_CLERK_PUBLISHABLE_KEY` - From clerk.dev

Optional:
- `BUYMEACOFFEE_USERNAME` - For sponsorship integration
- `SMTP_*` - For email notifications

## API Endpoints

Base: `http://localhost:8080/api/v1`

- `GET/POST /receipts` - Receipt management
- `POST /parse-email` - Parse email content
- `POST /parse-pdf` - Parse PDF receipts
- `GET /sponsorship/status` - Check sponsorship status
- `GET /health` - Health check

## Contributing

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
cd backend && go test ./...

# Frontend tests  
cd frontend && npm test

# Full integration test
docker-compose up -d && npm run test:e2e
```

## License

MIT License - see LICENSE file for details.
