package middleware

import (
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

// SecurityMiddleware applies security-related middleware
func SecurityMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Add security headers (excluding Cross-Origin headers to avoid CORS conflicts)
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("X-XSS-Protection", "1; mode=block")
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
		// Removed Cross-Origin headers to avoid CORS conflicts

		return c.Next()
	}
}

// SetupProductionMiddleware sets up production-ready middleware
func SetupProductionMiddleware(app *fiber.App) {
	// Request ID middleware for tracing
	app.Use(requestid.New())

	// Recovery middleware
	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
		StackTraceHandler: func(c *fiber.Ctx, e interface{}) {
			// Log stack trace in production
			if os.Getenv("LOG_LEVEL") == "debug" {
				c.Locals("stack_trace", e)
			}
		},
	}))

	// Logger middleware with structured logging
	logFormat := os.Getenv("LOG_FORMAT")
	if logFormat == "json" {
		app.Use(logger.New(logger.Config{
			Format: `{"time":"${time}","level":"info","msg":"${method} ${path}","status":${status},"latency":${latency},"ip":"${ip}","user_agent":"${ua}","request_id":"${locals:requestid}"}` + "\n",
		}))
	} else {
		app.Use(logger.New(logger.Config{
			Format: "[${time}] ${status} - ${method} ${path} - ${ip} - ${latency} - ${locals:requestid}\n",
		}))
	}

	// Helmet middleware for security headers (disabled to avoid CORS conflicts)
	// app.Use(helmet.New(helmet.Config{
	// 	XSSProtection:         "1; mode=block",
	// 	ContentTypeNosniff:    "true",
	// 	XFrameOptions:         "DENY",
	// 	HSTSMaxAge:            31536000,
	// 	HSTSExcludeSubdomains: false,
	// 	HSTSPreloadEnabled:    true,
	// 	ReferrerPolicy:        "strict-origin-when-cross-origin",
	// }))

	// Custom security middleware
	app.Use(SecurityMiddleware())

	// Rate limiting with configurable limits
	rateLimitRequests := 100
	if val := os.Getenv("RATE_LIMIT_REQUESTS"); val != "" {
		if parsed, err := strconv.Atoi(val); err == nil {
			rateLimitRequests = parsed
		}
	}

	rateLimitWindow := 60
	if val := os.Getenv("RATE_LIMIT_WINDOW"); val != "" {
		if parsed, err := strconv.Atoi(val); err == nil {
			rateLimitWindow = parsed
		}
	}

	app.Use(limiter.New(limiter.Config{
		Max:        rateLimitRequests,
		Expiration: time.Duration(rateLimitWindow) * time.Second,
		KeyGenerator: func(c *fiber.Ctx) string {
			// Use user ID if available, otherwise IP
			if userID := c.Locals("userID"); userID != nil {
				return userID.(string)
			}
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error":       "Rate limit exceeded",
				"retry_after": rateLimitWindow,
			})
		},
	}))
}
