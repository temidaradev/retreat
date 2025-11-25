# Retreat

### Mobile is work in progress

Never lose your receipts again.

Retreat is a simple app that tracks your receipts and warranty information. Just forward your purchase emails and we'll automatically extract the important stuff - warranty dates, purchase amounts, store names - and send you reminders before things expire.

I built this because I kept losing receipts (sometimes they just literally disapperead without me knowing .d)

## What it does

The main thing: forward your purchase emails to `save@retreat-app.tech` and we'll handle the rest.

- **Email forwarding** - Just forward emails, we'll parse out the receipt info
- **Warranty tracking** - We'll tell you when warranties are about to expire
- **PDF uploads** - Got a PDF receipt? Upload it manually if you want
- **Simple dashboard** - See all your receipts in one place
- **Free to use** - 5 receipts included, no credit card needed
- **Sponsor for more** - $8 gets you 50 receipts + premium features (I'm using Buy Me a Coffee since I can't use Stripe yet)

## What's under the hood

Built with Go on the backend and React on the frontend. I chose these because they're fast and I like working with them. The stack is pretty straightforward:

- React + TypeScript for the frontend (with Tailwind)
- Go + Fiber for the API
- PostgreSQL for the database
- Redis for caching and rate limiting
- Clerk for authentication
- Docker Compose to run everything locally

## How it works

The frontend is a React app that talks to a Go API. The API stores everything in PostgreSQL and uses Redis for caching and rate limiting. Nothing groundbreaking, but it works well for this use case.

Authentication is handled by Clerk (JWT tokens) so I didn't have to build all that auth stuff myself.

## Security

I tried to be sensible about security without going overboard:

- Authentication via Clerk (JWT tokens)
- Rate limiting to prevent abuse (100 requests per minute default)
- CORS protection (only allows requests from frontend domain)
- Security headers (XSS protection, etc.)
- SQL injection protection (using prepared statements)
- Input validation on all endpoints
- Docker containers run with read-only filesystems where possible
- Graceful shutdown so in-flight requests finish

It's not Fort Knox, but it's better than most hobby projects. The Docker setup uses security best practices.

## Contributing

Pull requests are welcome! I'm a solo developer, so any help is appreciated.

---

Built with Go and React (and probably too much coffee [sometimes redbull :3])
