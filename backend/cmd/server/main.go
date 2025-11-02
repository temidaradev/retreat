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
	"receiptlocker/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := godotenv.Load(); err != nil {
		logging.Info("No .env file found (this is normal in production)")
	}

	cfg := config.Load()

	if err := cfg.Validate(); err != nil {
		logging.Fatal("Configuration validation failed", map[string]interface{}{
			"error": err.Error(),
		})
	}

	logging.Info("Starting Receipt Store application", map[string]interface{}{
		"version": "1.0.0",
		"env":     cfg.Server.GinMode,
		"port":    cfg.Server.Port,
	})

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

	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,

		DisableStartupMessage: cfg.Server.GinMode == "release",

		Prefork: false,

		ServerHeader: "Retreat-API",

		AppName: "Receipt Store API v1.0.0",
	})

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

	uploadsDir := utils.GetUploadsDir()
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		logging.Fatal("Failed to create uploads directory", map[string]interface{}{
			"dir":   uploadsDir,
			"error": err.Error(),
		})
	}
	app.Static("/uploads", uploadsDir)

	middleware.SetupProductionMiddleware(app)

	app.Use(func(c *fiber.Ctx) error {
		c.Locals("config", cfg)
		return c.Next()
	})

	emailService := services.NewEmailService(db, cfg)
	bmcService := services.NewBuyMeACoffeeService(db, cfg)

	receiptHandler := handlers.NewReceiptHandler(db)
	bmcHandler := handlers.NewBMCHandler(db, cfg)
	adminHandler := handlers.NewAdminHandler(db, cfg, bmcService)
	emailHandler := handlers.NewEmailHandler(db, cfg, emailService)
	userEmailHandler := handlers.NewUserEmailHandler(db, cfg, emailService)
	feedbackHandler := handlers.NewFeedbackHandler(db, cfg, emailService)

	cronService := services.NewCronService(db, cfg)
	cronService.Start()
	defer cronService.Stop()

	api := app.Group("/api/v1")
	{

		api.Options("/*", func(c *fiber.Ctx) error {
			return c.SendStatus(fiber.StatusOK)
		})

		api.Get("/health", func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{"status": "healthy"})
		})

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

		api.Get("/live", func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{"alive": true})
		})

		api.Get("/cors-test", func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{
				"message": "CORS test successful",
				"headers": c.GetReqHeaders(),
			})
		})

		api.Get("/sponsorship/status", func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{
				"status":  "none",
				"message": "No active sponsorship",
			})
		})

		api.Post("/bmc/webhook", bmcHandler.HandleWebhook)

		api.Post("/email/inbound", emailHandler.HandleInboundEmail)

		api.Post("/feedback", feedbackHandler.SendFeedback)

		protected := api.Group("", middleware.ClerkAuthMiddleware())
		{

			receipts := protected.Group("/receipts")
			{
				receipts.Get("", receiptHandler.GetReceipts)
				receipts.Post("", receiptHandler.CreateReceipt)
				receipts.Get("/:id", receiptHandler.GetReceipt)
				receipts.Put("/:id", receiptHandler.UpdateReceipt)
				receipts.Delete("/:id", receiptHandler.DeleteReceipt)
				receipts.Put("/:id/photo", receiptHandler.UploadReceiptPhoto)
				receipts.Post("/parse-link", receiptHandler.ParseLink)
			}

			protected.Post("/parse-email", receiptHandler.ParseEmail)

			protected.Post("/parse-pdf", receiptHandler.ParsePDF)

			protected.Post("/bmc/link-username", bmcHandler.LinkBMCUsername)

			protected.Get("/emails", userEmailHandler.GetUserEmails)
			protected.Post("/emails", userEmailHandler.AddUserEmail)
			protected.Delete("/emails/:id", userEmailHandler.DeleteUserEmail)
			protected.Post("/emails/:id/set-primary", userEmailHandler.SetPrimaryEmail)
			protected.Post("/emails/:id/resend-verification", userEmailHandler.ResendVerification)

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
		}

		admin := api.Group("/admin", middleware.ClerkAuthMiddleware(), middleware.AdminAuthMiddleware())
		{

			admin.Get("/dashboard", adminHandler.GetDashboard)
			admin.Get("/system-info", adminHandler.GetSystemInfo)

			admin.Get("/bmc/users", adminHandler.GetBMCUsers)
			admin.Post("/bmc/sync", adminHandler.SyncBMCMemberships)
			admin.Post("/bmc/link-username", adminHandler.LinkBMCUsername)

			admin.Get("/subscriptions", adminHandler.GetSubscriptions)
			admin.Post("/subscriptions/grant", adminHandler.GrantSubscription)
			admin.Post("/subscriptions/revoke", adminHandler.RevokeSubscription)
		}

	}

	port := cfg.Server.Port
	if port == "" {
		port = "8080"
	}

	serverErrors := make(chan error, 1)

	go func() {
		logging.Info("Server starting", map[string]interface{}{
			"port": port,
			"env":  cfg.Server.GinMode,
		})
		serverErrors <- app.Listen(":" + port)
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	select {
	case err := <-serverErrors:
		logging.Fatal("Failed to start server", map[string]interface{}{
			"error": err.Error(),
		})

	case sig := <-shutdown:
		logging.Info("Shutdown signal received", map[string]interface{}{
			"signal": sig.String(),
		})

		cronService.Stop()

		shutdownCtx, shutdownCancel := context.WithTimeout(ctx, cfg.Server.ShutdownTimeout)
		defer shutdownCancel()

		if err := app.ShutdownWithContext(shutdownCtx); err != nil {
			logging.Error("Error during graceful shutdown", map[string]interface{}{
				"error": err.Error(),
			})

			if err := app.Shutdown(); err != nil {
				logging.Fatal("Force shutdown failed", map[string]interface{}{
					"error": err.Error(),
				})
			}
		}

		logging.Info("Server shutdown complete")
	}
}

func customErrorHandler(c *fiber.Ctx, err error) error {

	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	logging.Error("Request error", map[string]interface{}{
		"method":     c.Method(),
		"path":       c.Path(),
		"status":     code,
		"error":      err.Error(),
		"request_id": c.Locals("requestid"),
		"user_id":    c.Locals("userID"),
	})

	return c.Status(code).JSON(fiber.Map{
		"error":      message,
		"status":     code,
		"request_id": c.Locals("requestid"),
		"timestamp":  time.Now().UTC().Format(time.RFC3339),
	})
}
