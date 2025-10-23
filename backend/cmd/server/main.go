package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"receiptlocker/internal/database"
	"receiptlocker/internal/handlers"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create Gin router
	r := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173", "http://localhost:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "X-User-ID"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// Initialize handlers
	receiptHandler := handlers.NewReceiptHandler(db)

	// API routes
	api := r.Group("/api/v1")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		// Receipt routes
		receipts := api.Group("/receipts")
		{
			receipts.GET("", receiptHandler.GetReceipts)
			receipts.POST("", receiptHandler.CreateReceipt)
			receipts.GET("/:id", receiptHandler.GetReceipt)
			receipts.PUT("/:id", receiptHandler.UpdateReceipt)
			receipts.DELETE("/:id", receiptHandler.DeleteReceipt)
		}

		// Email parsing route
		api.POST("/parse-email", receiptHandler.ParseEmail)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
