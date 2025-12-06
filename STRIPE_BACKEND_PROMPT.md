# Stripe Payment & Admin Panel - Go Backend

## Overview

This document covers:

1. Stripe payment integration for premium subscriptions
2. Enhanced admin panel API endpoints for managing all users

---

## Install Stripe Go SDK

```bash
go get github.com/stripe/stripe-go/v76
```

---

## Environment Variables

Add these to your `.env` file:

```env
STRIPE_SECRET_KEY=sk_live_xxxx        # or sk_test_xxxx for testing
STRIPE_WEBHOOK_SECRET=whsec_xxxx      # From Stripe Dashboard > Webhooks
STRIPE_PRICE_ID=price_xxxx            # Your premium plan price ID
FRONTEND_URL=https://your-frontend-url.com
```

---

# Part 1: Stripe Payment Integration

## API Endpoints

### 1. Create Checkout Session

**Endpoint:** `POST /api/v1/payments/stripe/checkout`

**Auth:** Required (Bearer token)

**Request:** `{ "plan": "sponsor" }`

**Response:** `{ "checkout_url": "https://checkout.stripe.com/..." }`

```go
package handlers

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
)

func CreateStripeCheckout(c *fiber.Ctx) error {
	// Get authenticated user ID from middleware
	userID := c.Locals("user_id").(string)

	// Parse request body
	var body struct {
		Plan string `json:"plan"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Set Stripe API key
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	// Create checkout session params
	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(os.Getenv("STRIPE_PRICE_ID")),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL:        stripe.String(os.Getenv("FRONTEND_URL") + "/?payment=success"),
		CancelURL:         stripe.String(os.Getenv("FRONTEND_URL") + "/pricing?payment=cancelled"),
		ClientReferenceID: stripe.String(userID),
	}

	// Create the session
	s, err := session.New(params)
	if err != nil {
		log.Printf("Stripe checkout error: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create checkout session"})
	}

	return c.JSON(fiber.Map{"checkout_url": s.URL})
}
```

### 2. Stripe Webhook Handler

**Endpoint:** `POST /api/v1/payments/stripe/webhook`

**Auth:** None (uses Stripe signature verification)

**Events to Handle:**

| Event                           | Action                     |
| ------------------------------- | -------------------------- |
| `checkout.session.completed`    | Grant premium subscription |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Revoke premium access      |
| `invoice.payment_failed`        | Log/notify failed payment  |

```go
package handlers

import (
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/subscription"
	"github.com/stripe/stripe-go/v76/webhook"
)

func HandleStripeWebhook(c *fiber.Ctx) error {
	payload := c.Body()
	sigHeader := c.Get("Stripe-Signature")

	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	// Verify webhook signature
	event, err := webhook.ConstructEvent(payload, sigHeader, os.Getenv("STRIPE_WEBHOOK_SECRET"))
	if err != nil {
		log.Printf("Webhook signature verification failed: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid signature"})
	}

	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Failed to parse session"})
		}

		clerkUserID := session.ClientReferenceID
		stripeCustomerID := ""
		stripeSubscriptionID := ""

		if session.Customer != nil {
			stripeCustomerID = session.Customer.ID
		}
		if session.Subscription != nil {
			stripeSubscriptionID = session.Subscription.ID
		}

		// Fetch subscription details
		var periodStart, periodEnd time.Time
		if stripeSubscriptionID != "" {
			sub, err := subscription.Get(stripeSubscriptionID, nil)
			if err == nil {
				periodStart = time.Unix(sub.CurrentPeriodStart, 0)
				periodEnd = time.Unix(sub.CurrentPeriodEnd, 0)
			}
		}

		// TODO: Save to database
		// db.UpsertSubscription(Subscription{
		//     ClerkUserID:          clerkUserID,
		//     StripeCustomerID:     stripeCustomerID,
		//     StripeSubscriptionID: stripeSubscriptionID,
		//     PaymentSource:        "stripe",
		//     Plan:                 "premium",
		//     Status:               "active",
		//     CurrentPeriodStart:   periodStart,
		//     CurrentPeriodEnd:     periodEnd,
		// })

		log.Printf("✅ Premium granted to user %s via Stripe", clerkUserID)

	case "customer.subscription.updated":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Failed to parse subscription"})
		}
		// TODO: db.UpdateSubscriptionByStripeID(sub.ID, string(sub.Status))
		log.Printf("📝 Subscription %s updated: %s", sub.ID, sub.Status)

	case "customer.subscription.deleted":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Failed to parse subscription"})
		}
		// TODO: db.UpdateSubscriptionByStripeID(sub.ID, "cancelled")
		log.Printf("❌ Subscription %s cancelled", sub.ID)

	case "invoice.payment_failed":
		var invoice stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Failed to parse invoice"})
		}
		log.Printf("⚠️ Payment failed for customer %s", invoice.Customer.ID)
	}

	return c.JSON(fiber.Map{"received": true})
}
```

---

# Part 2: Enhanced Admin Panel API

The frontend admin panel now needs these endpoints to manage all users with different payment sources.

## Database Schema Updates

Update your subscriptions/users table:

```sql
-- Add payment source tracking
ALTER TABLE subscriptions ADD COLUMN payment_source VARCHAR(50) DEFAULT 'free';
-- Values: 'free', 'stripe', 'bmc', 'cryptomus', 'manual'

ALTER TABLE subscriptions ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN cryptomus_order_id VARCHAR(255);

-- Add indexes
CREATE INDEX idx_subscriptions_payment_source ON subscriptions(payment_source);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

## Admin API Endpoints

### 1. Get Dashboard Stats (Updated)

**Endpoint:** `GET /api/v1/admin/dashboard`

**Response:**

```json
{
  "status": "success",
  "data": {
    "total_receipts": 150,
    "active_subscriptions": 25,
    "bmc_linked_users": 10,
    "stripe_users": 8,
    "cryptomus_users": 5,
    "free_users": 100,
    "receipts_by_status": {
      "active": 100,
      "expiring": 30,
      "expired": 20
    },
    "timestamp": "2025-12-06T10:00:00Z"
  }
}
```

```go
func GetAdminDashboard(c *fiber.Ctx) error {
	// Count users by payment source
	var stats struct {
		TotalReceipts       int            `json:"total_receipts"`
		ActiveSubscriptions int            `json:"active_subscriptions"`
		BMCLinkedUsers      int            `json:"bmc_linked_users"`
		StripeUsers         int            `json:"stripe_users"`
		CryptomusUsers      int            `json:"cryptomus_users"`
		FreeUsers           int            `json:"free_users"`
		ReceiptsByStatus    map[string]int `json:"receipts_by_status"`
		Timestamp           time.Time      `json:"timestamp"`
	}

	// Query counts from database
	db.QueryRow("SELECT COUNT(*) FROM receipts").Scan(&stats.TotalReceipts)
	db.QueryRow("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'").Scan(&stats.ActiveSubscriptions)
	db.QueryRow("SELECT COUNT(*) FROM subscriptions WHERE payment_source = 'bmc'").Scan(&stats.BMCLinkedUsers)
	db.QueryRow("SELECT COUNT(*) FROM subscriptions WHERE payment_source = 'stripe'").Scan(&stats.StripeUsers)
	db.QueryRow("SELECT COUNT(*) FROM subscriptions WHERE payment_source = 'cryptomus'").Scan(&stats.CryptomusUsers)
	db.QueryRow("SELECT COUNT(*) FROM subscriptions WHERE payment_source = 'free' OR payment_source IS NULL").Scan(&stats.FreeUsers)

	// Get receipts by status
	stats.ReceiptsByStatus = make(map[string]int)
	rows, _ := db.Query("SELECT status, COUNT(*) FROM receipts GROUP BY status")
	for rows.Next() {
		var status string
		var count int
		rows.Scan(&status, &count)
		stats.ReceiptsByStatus[status] = count
	}

	stats.Timestamp = time.Now()

	return c.JSON(fiber.Map{"status": "success", "data": stats})
}
```

### 2. Get All Users (New Endpoint)

**Endpoint:** `GET /api/v1/admin/users`

**Query Params:** `?filter=stripe|bmc|cryptomus|free|manual` (optional)

**Response:**

```json
{
  "status": "success",
  "count": 50,
  "data": [
    {
      "clerk_user_id": "user_abc123",
      "email": "user@example.com",
      "plan": "premium",
      "status": "active",
      "payment_source": "stripe",
      "stripe_customer_id": "cus_xxx",
      "stripe_subscription_id": "sub_xxx",
      "bmc_username": null,
      "cryptomus_order_id": null,
      "current_period_end": "2026-01-06T00:00:00Z",
      "receipt_count": 15,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-12-01T00:00:00Z"
    }
  ]
}
```

```go
type AdminUser struct {
	ClerkUserID          string     `json:"clerk_user_id"`
	Email                *string    `json:"email"`
	Plan                 string     `json:"plan"`
	Status               string     `json:"status"`
	PaymentSource        string     `json:"payment_source"`
	StripeCustomerID     *string    `json:"stripe_customer_id"`
	StripeSubscriptionID *string    `json:"stripe_subscription_id"`
	BMCUsername          *string    `json:"bmc_username"`
	CryptomusOrderID     *string    `json:"cryptomus_order_id"`
	CurrentPeriodEnd     *time.Time `json:"current_period_end"`
	ReceiptCount         int        `json:"receipt_count"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

func GetAdminUsers(c *fiber.Ctx) error {
	filter := c.Query("filter") // stripe, bmc, cryptomus, free, manual

	query := `
		SELECT
			s.clerk_user_id,
			u.email,
			COALESCE(s.plan, 'free') as plan,
			COALESCE(s.status, 'none') as status,
			COALESCE(s.payment_source, 'free') as payment_source,
			s.stripe_customer_id,
			s.stripe_subscription_id,
			b.bmc_username,
			s.cryptomus_order_id,
			s.current_period_end,
			(SELECT COUNT(*) FROM receipts r WHERE r.user_id = s.clerk_user_id) as receipt_count,
			s.created_at,
			s.updated_at
		FROM subscriptions s
		LEFT JOIN users u ON s.clerk_user_id = u.clerk_id
		LEFT JOIN bmc_users b ON s.clerk_user_id = b.clerk_user_id
	`

	if filter != "" {
		query += " WHERE s.payment_source = $1"
	}

	query += " ORDER BY s.updated_at DESC"

	var rows *sql.Rows
	var err error
	if filter != "" {
		rows, err = db.Query(query, filter)
	} else {
		rows, err = db.Query(query)
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	defer rows.Close()

	var users []AdminUser
	for rows.Next() {
		var user AdminUser
		err := rows.Scan(
			&user.ClerkUserID, &user.Email, &user.Plan, &user.Status,
			&user.PaymentSource, &user.StripeCustomerID, &user.StripeSubscriptionID,
			&user.BMCUsername, &user.CryptomusOrderID, &user.CurrentPeriodEnd,
			&user.ReceiptCount, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			continue
		}
		users = append(users, user)
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"count":  len(users),
		"data":   users,
	})
}
```

---

## Route Registration

```go
func SetupRoutes(app *fiber.App) {
	api := app.Group("/api/v1")

	// Payment routes
	payments := api.Group("/payments")
	payments.Post("/stripe/checkout", authMiddleware, CreateStripeCheckout)
	payments.Post("/stripe/webhook", HandleStripeWebhook) // NO auth!

	// Admin routes (with admin middleware)
	admin := api.Group("/admin", authMiddleware, adminMiddleware)
	admin.Get("/dashboard", GetAdminDashboard)
	admin.Get("/users", GetAdminUsers)
	admin.Get("/subscriptions", GetAdminSubscriptions)
	admin.Post("/subscriptions/grant", GrantSubscription)
	admin.Post("/subscriptions/revoke", RevokeSubscription)
	admin.Get("/bmc/users", GetBMCUsers)
	admin.Post("/bmc/link-username", LinkBMCUsername)
	admin.Get("/system-info", GetSystemInfo)
}
```

---

## Stripe Dashboard Setup

1. **Create a Product:**

   - Stripe Dashboard → Products → Add product
   - Name: "Retreat Premium"
   - Add price: $8/month

2. **Get the Price ID:**

   - Copy Price ID → `STRIPE_PRICE_ID`

3. **Set up Webhook:**
   - Stripe Dashboard → Developers → Webhooks
   - URL: `https://your-api.com/api/v1/payments/stripe/webhook`
   - Events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Testing

### Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

### Local Webhook Testing

```bash
stripe login
stripe listen --forward-to localhost:3000/api/v1/payments/stripe/webhook
stripe trigger checkout.session.completed
```

---

## Security Checklist

- [ ] Webhook signature verification implemented
- [ ] No auth middleware on webhook endpoint
- [ ] `STRIPE_SECRET_KEY` never exposed to frontend
- [ ] Admin endpoints protected with admin middleware
- [ ] HTTPS in production
