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

func SecurityMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {

		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("X-XSS-Protection", "1; mode=block")
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		return c.Next()
	}
}

func SetupProductionMiddleware(app *fiber.App) {

	app.Use(requestid.New())

	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
		StackTraceHandler: func(c *fiber.Ctx, e interface{}) {

			if os.Getenv("LOG_LEVEL") == "debug" {
				c.Locals("stack_trace", e)
			}
		},
	}))

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

	app.Use(SecurityMiddleware())

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
