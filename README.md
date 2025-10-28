# Retreat

### !! Mail forwarding is still work in progress !!

Never lose your receipts again. 

Retreat is a simple app that tracks your receipts and warranty information. Just forward your purchase emails and we'll automatically extract the important stuff - warranty dates, purchase amounts, store names - and send you reminders before things expire.

I built this because I kept losing receipts and missing warranty claims. Maybe you've been there too.

## What it does

The main thing: forward your purchase emails to `save@receiptlocker.com` and we'll handle the rest.

- **Email forwarding** - Just forward emails, we'll parse out the receipt info
- **Warranty tracking** - We'll tell you when warranties are about to expire
- **PDF uploads** - Got a PDF receipt? Upload it manually if you want
- **Simple dashboard** - See all your receipts in one place
- **Free to use** - 5 receipts included, no credit card needed
- **Sponsor for more** - $5 gets you 50 receipts + premium features (I'm using Buy Me a Coffee since I can't use Stripe yet)

## What's under the hood

Built with Go on the backend and React on the frontend. I chose these because they're fast and I like working with them. The stack is pretty straightforward:

- React + TypeScript for the frontend (with Tailwind for styling)
- Go + Fiber for the API (super fast)
- PostgreSQL for the database (it's just receipts, doesn't need anything fancy)
- Redis for caching and rate limiting
- Clerk for authentication (saves me from building login stuff)
- Docker Compose to run everything locally

Nothing too exotic here - just solid tools that work well together.

## Getting started

### Running it locally

You'll need Docker Desktop and a Clerk account (it's free). Then:

```bash
git clone <repository-url>
cd receipt-store
cp env.example .env
# Fill in your Clerk keys and database password in .env
docker-compose up -d
```

That's it. The frontend will be at `http://localhost:3000` and the API at `http://localhost:8080`.

If you run into issues, check the [quick start guide](./QUICK_START.md) - it has more details and troubleshooting tips.

### Deploying to production

I've got a deployment script for Hetzner that sets everything up with SSL and proper security. Check out [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for the full walkthrough, or if you're feeling brave:

```bash
./deploy-production.sh
```

## Configuration

You'll need to set up a few environment variables. At minimum, you need:

```env
CLERK_SECRET_KEY=sk_live_your_key_here          # Get this from clerk.dev
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key    # Also from clerk.dev
POSTGRES_PASSWORD=your_secure_password         # Make it a good one
REDIS_PASSWORD=another_secure_password         # Don't reuse the DB password
VITE_API_URL=https://api.retreat-app.tech      # Your API URL in production
```

There's also optional stuff like email notifications (SMTP settings) and Buy Me a Coffee integration if you want the sponsorship system working. Check [env.example](./env.example) for the complete list with descriptions.

## API Reference

**Base URL**: `http://localhost:8080/api/v1` (dev) or `https://api.retreat-app.tech/api/v1` (prod)

### Public (no auth needed)
- `GET /health` - Is the API alive?
- `GET /ready` - Is it ready for traffic?
- `GET /live` - Health check for orchestration

### Protected (need authentication)
- `GET /receipts` - Get all your receipts
- `POST /receipts` - Add a new receipt
- `GET /receipts/:id` - Get one receipt
- `PUT /receipts/:id` - Update a receipt
- `DELETE /receipts/:id` - Delete a receipt
- `POST /parse-email` - Parse email text (returns structured data)
- `POST /parse-pdf` - Parse PDF receipt (returns structured data)
- `GET /sponsorship/status` - Check if user is a sponsor

## How it works

Pretty standard setup:

```
Your Browser → Nginx (SSL) → Go API → PostgreSQL
                                  ↓
                               Redis (cache)
```

The frontend is a React app that talks to a Go API. The API stores everything in PostgreSQL and uses Redis for caching and rate limiting. Nginx sits in front to handle SSL and routing. Nothing groundbreaking, but it works well for this use case.

Authentication is handled by Clerk (JWT tokens) so I didn't have to build all that auth stuff myself.

## Security

I tried to be sensible about security without going overboard:

- Authentication via Clerk (JWT tokens)
- Rate limiting to prevent abuse (100 requests per minute default)
- CORS protection (only allows requests from your frontend domain)
- Security headers (XSS protection, etc.)
- SQL injection protection (using prepared statements)
- Input validation on all endpoints
- Docker containers run with read-only filesystems where possible
- Graceful shutdown so in-flight requests finish

It's not Fort Knox, but it's better than most hobby projects. The Docker setup uses security best practices (read-only containers, no-new-privileges, resource limits).

## Documentation

There are a few more detailed guides if you need them:

- [Quick Start Guide](./QUICK_START.md) - Detailed setup instructions
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - How I deploy to Hetzner
- [Development Guide](./DEVELOPMENT.md) - Development workflow
- [env.example](./env.example) - All the environment variables explained

## Contributing

Pull requests are welcome! I'm a solo developer, so any help is appreciated. If you want to contribute:

1. Fork the repo
2. Make your changes (try to match the existing code style)
3. Test your changes
4. Open a pull request

I'm not super strict about it, but it helps if:
- You follow the existing patterns (I use standard Go formatting and ESLint for the frontend)
- You add tests if you're adding new functionality
- You update docs if you changed the API
- Tests pass before you submit

If you're testing changes:
```bash
# Backend tests
cd backend && go test ./... -v

# Frontend linting
cd frontend && npm run lint
```

## Troubleshooting

If something's not working:

- **Backend won't start?** Check the logs: `docker-compose logs backend`
- **Database connection issues?** Make sure PostgreSQL is running and `DATABASE_URL` is correct
- **Auth failing?** Double-check your `CLERK_SECRET_KEY` is right
- **CORS errors?** Your frontend URL needs to be in the allowed origins list

The [quick start guide](./QUICK_START.md#troubleshooting) has more detailed troubleshooting steps.

## Performance

It's pretty fast. The API responds in under 100ms most of the time, and it can handle a decent amount of traffic. I've got connection pooling set up for the database and Redis for caching. Rate limiting keeps things fair for everyone.

Honestly, for a receipt tracking app, performance hasn't been an issue. PostgreSQL and Go are both plenty fast for this.

## License

MIT License - do whatever you want with it.

## Questions or Issues?

If you find bugs or have suggestions, open an issue on GitHub. I'm pretty responsive (or try to be).

You can also email me at support@retreat-app.tech if GitHub issues aren't your thing.

## Thanks for checking it out

If you find this useful, a ⭐ on GitHub would make my day. Or if you're feeling generous, you can sponsor the project via Buy Me a Coffee (link in the app).

---

Built with Go and React (and probably too much coffee)
