package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"receiptlocker/internal/config"
	"receiptlocker/internal/database"
	"receiptlocker/internal/handlers"
	"receiptlocker/internal/logging"
	"receiptlocker/internal/middleware"
	"receiptlocker/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Setup context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		logging.Info("No .env file found (this is normal in production)")
	}

	// Load configuration
	cfg := config.Load()

	// Validate configuration
	if err := cfg.Validate(); err != nil {
		logging.Fatal("Configuration validation failed", map[string]interface{}{
			"error": err.Error(),
		})
	}

	// Initialize logging
	logging.Info("Starting Receipt Store application", map[string]interface{}{
		"version": "1.0.0",
		"env":     cfg.Server.GinMode,
		"port":    cfg.Server.Port,
	})

	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		logging.Fatal("Failed to connect to database", map[string]interface{}{
			"error": err.Error(),
		})
	}
	defer func() {
		logging.Info("Closing database connection")
		db.Close()
	}()

	// Create Fiber app with production-ready configuration
	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
		// Disable startup message in production
		DisableStartupMessage: cfg.Server.GinMode == "release",
		// Enable prefork for better performance (optional)
		Prefork: false,
		// Server header
		ServerHeader: "Retreat-API",
		// App name for identification
		AppName: "Receipt Store API v1.0.0",
	})

	// Configure CORS FIRST - before any other middleware
	app.Use(cors.New(cors.Config{
		AllowOriginsFunc: func(origin string) bool {
			allowedOrigins := []string{
				"https://retreat-app.tech",
				"https://www.retreat-app.tech",
				"https://temidara.rocks",
				"https://www.temidara.rocks",
				"http://localhost:3000",
				"http://localhost:5173",
				"http://localhost:8080",
				"http://127.0.0.1:3000",
				"http://127.0.0.1:5173",
				"http://127.0.0.1:8080",
			}
			for _, allowed := range allowedOrigins {
				if origin == allowed {
					return true
				}
			}
			return false
		},
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Requested-With,x-user-id",
		AllowCredentials: true,
		MaxAge:           86400,
		ExposeHeaders:    "Content-Length,Content-Type",
	}))

	// Setup production middleware AFTER CORS
	middleware.SetupProductionMiddleware(app)

	// Store config in app locals for admin middleware access
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("config", cfg)
		return c.Next()
	})

	// Initialize handlers
	receiptHandler := handlers.NewReceiptHandler(db)
	bmcHandler := handlers.NewBMCHandler(db, cfg)
	bmcService := services.NewBuyMeACoffeeService(db, cfg)
	adminHandler := handlers.NewAdminHandler(db, cfg, bmcService)

	// Initialize services
	cronService := services.NewCronService(db, cfg)
	cronService.Start()
	defer cronService.Stop()

	// API routes
	api := app.Group("/api/v1")
	{
		// Handle OPTIONS requests for CORS preflight
		api.Options("/*", func(c *fiber.Ctx) error {
			return c.SendStatus(fiber.StatusOK)
		})

		// Enhanced health check endpoint
		api.Get("/health", func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{"status": "healthy"})
		})

		// Readiness probe
		api.Get("/ready", func(c *fiber.Ctx) error {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := db.PingContext(ctx); err != nil {
				return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
					"ready": false,
					"error": "database not ready",
				})
			}
			return c.JSON(fiber.Map{"ready": true})
		})

		// Liveness probe
		api.Get("/live", func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{"alive": true})
		})

		// CORS test endpoint
		api.Get("/cors-test", func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{
				"message": "CORS test successful",
				"headers": c.GetReqHeaders(),
			})
		})

		// Sponsorship status endpoint (public)
		api.Get("/sponsorship/status", func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{
				"status":  "none",
				"message": "No active sponsorship",
			})
		})

		// Protected routes (require authentication)
		protected := api.Group("", middleware.ClerkAuthMiddleware())
		{
			// Receipt routes
			receipts := protected.Group("/receipts")
			{
				receipts.Get("", receiptHandler.GetReceipts)
				receipts.Post("", receiptHandler.CreateReceipt)
				receipts.Get("/:id", receiptHandler.GetReceipt)
				receipts.Put("/:id", receiptHandler.UpdateReceipt)
				receipts.Delete("/:id", receiptHandler.DeleteReceipt)
			}

			// Email parsing route
			protected.Post("/parse-email", receiptHandler.ParseEmail)

			// PDF parsing route
			protected.Post("/parse-pdf", receiptHandler.ParsePDF)

			// Buy Me a Coffee integration routes
			protected.Post("/bmc/link-username", bmcHandler.LinkBMCUsername)
		}

		// Public webhook endpoint (no auth required, uses signature verification)
		api.Post("/bmc/webhook", bmcHandler.HandleWebhook)

		// Helper endpoint to get current user info (for finding your Clerk user ID)
		protected.Get("/me", func(c *fiber.Ctx) error {
			cfg, _ := c.Locals("config").(*config.Config)

			userID := c.Locals("userID")
			email := c.Locals("userEmail")
			username := c.Locals("username")

			return c.JSON(fiber.Map{
				"user_id":         userID,
				"email":           email,
				"username":        username,
				"admin_emails":    cfg.Admin.Emails,
				"admin_user_ids":  cfg.Admin.UserIDs,
				"admin_usernames": cfg.Admin.Usernames,
				"recommendation":  "If email/username are empty, use ADMIN_USER_IDS with your user_id above",
				"note":            fmt.Sprintf("Add to .env: ADMIN_USER_IDS=%s", userID),
			})
		})

		// Admin routes (require authentication + admin privileges)
		admin := api.Group("/admin", middleware.ClerkAuthMiddleware(), middleware.AdminAuthMiddleware())
		{
			// Dashboard and system info
			admin.Get("/dashboard", adminHandler.GetDashboard)
			admin.Get("/system-info", adminHandler.GetSystemInfo)

			// BMC management
			admin.Get("/bmc/users", adminHandler.GetBMCUsers)
			admin.Post("/bmc/sync", adminHandler.SyncBMCMemberships)
			admin.Post("/bmc/link-username", adminHandler.LinkBMCUsername)

			// Subscription management (crisis controls)
			admin.Get("/subscriptions", adminHandler.GetSubscriptions)
			admin.Post("/subscriptions/grant", adminHandler.GrantSubscription)
			admin.Post("/subscriptions/revoke", adminHandler.RevokeSubscription)
		}

	}

	// Start server in a goroutine
	port := cfg.Server.Port
	if port == "" {
		port = "8080"
	}

	// Channel to listen for errors coming from the listener
	serverErrors := make(chan error, 1)

	go func() {
		logging.Info("Server starting", map[string]interface{}{
			"port": port,
			"env":  cfg.Server.GinMode,
		})
		serverErrors <- app.Listen(":" + port)
	}()

	// Channel to listen for interrupt signals
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	// Block until we receive a signal or an error
	select {
	case err := <-serverErrors:
		logging.Fatal("Failed to start server", map[string]interface{}{
			"error": err.Error(),
		})

	case sig := <-shutdown:
		logging.Info("Shutdown signal received", map[string]interface{}{
			"signal": sig.String(),
		})

		// Stop cron service
		cronService.Stop()

		// Create context with timeout for graceful shutdown
		shutdownCtx, shutdownCancel := context.WithTimeout(ctx, cfg.Server.ShutdownTimeout)
		defer shutdownCancel()

		// Gracefully shutdown the server
		if err := app.ShutdownWithContext(shutdownCtx); err != nil {
			logging.Error("Error during graceful shutdown", map[string]interface{}{
				"error": err.Error(),
			})
			// Force shutdown
			if err := app.Shutdown(); err != nil {
				logging.Fatal("Force shutdown failed", map[string]interface{}{
					"error": err.Error(),
				})
			}
		}

		logging.Info("Server shutdown complete")
	}
}

// customErrorHandler handles errors in a production-ready way
func customErrorHandler(c *fiber.Ctx, err error) error {
	// Default to 500 Internal Server Error
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	// Check if it's a Fiber error
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	// Log the error
	logging.Error("Request error", map[string]interface{}{
		"method":     c.Method(),
		"path":       c.Path(),
		"status":     code,
		"error":      err.Error(),
		"request_id": c.Locals("requestid"),
		"user_id":    c.Locals("userID"),
	})

	// Return JSON error response
	return c.Status(code).JSON(fiber.Map{
		"error":      message,
		"status":     code,
		"request_id": c.Locals("requestid"),
		"timestamp":  time.Now().UTC().Format(time.RFC3339),
	})
}
