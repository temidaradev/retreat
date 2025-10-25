package main

import (
	"log"

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
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		logging.Info("No .env file found")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize logging
	logging.Info("Starting Receipt Store application", map[string]interface{}{
		"version": "1.0.0",
		"env":     cfg.Server.GinMode,
	})

	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		logging.Fatal("Failed to connect to database", map[string]interface{}{
			"error": err.Error(),
		})
	}
	defer db.Close()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	// Configure CORS FIRST - before any other middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "https://retreat-app.tech,https://www.retreat-app.tech,https://temidara.rocks,https://www.temidara.rocks,http://localhost:3000,http://localhost:5173",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Requested-With,x-user-id",
		AllowCredentials: true,
		MaxAge:           86400,
		ExposeHeaders:    "Content-Length,Content-Type",
	}))

	// Setup production middleware AFTER CORS
	middleware.SetupProductionMiddleware(app)

	// Initialize handlers
	receiptHandler := handlers.NewReceiptHandler(db)

	// Initialize services
	cronService := services.NewCronService(db)
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
			if err := db.Ping(); err != nil {
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

		}

	}

	// Start server
	port := cfg.Server.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
