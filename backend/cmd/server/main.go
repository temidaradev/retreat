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
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Requested-With",
		AllowCredentials: false,
		MaxAge:           86400,
	}))

	// Setup production middleware AFTER CORS
	middleware.SetupProductionMiddleware(app)

	// Initialize handlers
	receiptHandler := handlers.NewReceiptHandler(db)
	sponsorshipHandler := handlers.NewSponsorshipHandler(db)

	// Initialize services
	cronService := services.NewCronService(db)
	cronService.Start()
	defer cronService.Stop()

	// API routes
	api := app.Group("/api/v1")
	{
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

			// Sponsorship routes
			log.Println("Registering sponsorship routes...")
			sponsorship := protected.Group("/sponsorship")
			{
				sponsorship.Get("/test", sponsorshipHandler.TestSponsorshipEndpoint)
				sponsorship.Get("/info", sponsorshipHandler.GetSponsorshipInfo)
				sponsorship.Get("/status", sponsorshipHandler.GetSponsorshipStatus)
				sponsorship.Post("/verify", sponsorshipHandler.RequestSponsorshipVerification)
			}
			log.Println("Sponsorship routes registered successfully")
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
