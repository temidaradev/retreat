package handlers

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"receiptlocker/internal/services"

	"github.com/gofiber/fiber/v2"
)

type SponsorshipHandler struct {
	db                 *sql.DB
	sponsorshipService *services.SponsorshipService
	emailService       *services.EmailService
}

func NewSponsorshipHandler(db *sql.DB) *SponsorshipHandler {
	return &SponsorshipHandler{
		db:                 db,
		sponsorshipService: services.NewSponsorshipService(db),
		emailService:       services.NewEmailService(db),
	}
}

// RequestSponsorshipVerification handles sponsorship verification requests
func (h *SponsorshipHandler) RequestSponsorshipVerification(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	userEmail := c.Locals("userEmail").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found"})
	}

	// Check if this is a multipart form (file upload) or JSON
	contentType := c.Get("Content-Type")
	var platform, username, proof string
	var screenshotPath string

	if contentType == "application/json" {
		// Handle JSON request
		var req struct {
			Platform string `json:"platform" validate:"required"`
			Username string `json:"username" validate:"required"`
			Proof    string `json:"proof"`
		}

		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		platform = req.Platform
		username = req.Username
		proof = req.Proof
	} else {
		// Handle multipart form data
		_, err := c.MultipartForm()
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid multipart form"})
		}

		platform = c.FormValue("platform")
		username = c.FormValue("username")
		proof = c.FormValue("proof")

		// Handle file upload
		if file, err := c.FormFile("screenshot"); err == nil {
			// Create uploads directory if it doesn't exist
			uploadDir := "./uploads/screenshots"
			if err := os.MkdirAll(uploadDir, 0755); err != nil {
				log.Printf("Failed to create upload directory: %v", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create upload directory"})
			}

			// Generate unique filename
			ext := filepath.Ext(file.Filename)
			filename := fmt.Sprintf("%s_%d%s", userID, time.Now().Unix(), ext)
			screenshotPath = filepath.Join(uploadDir, filename)

			// Save file
			if err := c.SaveFile(file, screenshotPath); err != nil {
				log.Printf("Failed to save file: %v", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save screenshot"})
			}

			log.Printf("Screenshot saved: %s", screenshotPath)
		}
	}

	// Validate platform
	if platform != "buymeacoffee" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Only Buy Me a Coffee is supported"})
	}

	// Validate username
	if username == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Username is required"})
	}

	// Check if user already has a pending verification
	var existingCount int
	checkQuery := `
		SELECT COUNT(*) FROM subscriptions 
		WHERE user_id = $1 AND status = 'pending'
	`
	err := h.db.QueryRow(checkQuery, userID).Scan(&existingCount)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}

	if existingCount > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Verification request already pending"})
	}

	// Store verification details in database
	insertVerificationQuery := `
		INSERT INTO sponsorship_verifications (user_id, platform, username, proof, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`

	var verificationID string
	err = h.db.QueryRow(insertVerificationQuery, userID, platform, username, proof, "pending", time.Now()).Scan(&verificationID)
	if err != nil {
		log.Printf("Failed to create verification record: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create verification request"})
	}

	// Create pending subscription
	insertQuery := `
		INSERT INTO subscriptions (user_id, plan, status, current_period_start, current_period_end)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`

	var id string
	err = h.db.QueryRow(insertQuery, userID, "premium", "pending",
		time.Now(), time.Now().AddDate(1, 0, 0)).Scan(&id)
	if err != nil {
		log.Printf("Failed to create pending subscription: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create verification request"})
	}

	// Send email notification to admin
	emailData := services.SponsorshipVerificationRequest{
		Platform:       platform,
		Username:       username,
		UserEmail:      userEmail,
		UserID:         userID,
		RequestDate:    time.Now().Format("January 2, 2006 at 3:04 PM"),
		Proof:          proof,
		ScreenshotPath: screenshotPath,
	}

	if err := h.emailService.SendSponsorshipVerificationNotification(emailData); err != nil {
		log.Printf("Failed to send admin notification: %v", err)
		// Don't fail the request if email fails
	}

	log.Printf("Sponsorship verification requested by user %s for platform %s (ID: %s)", userID, platform, verificationID)

	return c.JSON(fiber.Map{
		"message": "Verification request submitted. You'll receive an email once verified.",
		"status":  "pending",
		"id":      verificationID,
	})
}

// TestSponsorshipEndpoint is a simple test endpoint
func (h *SponsorshipHandler) TestSponsorshipEndpoint(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "Sponsorship handler is working",
		"userID":  c.Locals("userID"),
	})
}

// GetSponsorshipStatus returns the current sponsorship status
func (h *SponsorshipHandler) GetSponsorshipStatus(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found"})
	}

	if userID == "demo-user" {
		return c.JSON(fiber.Map{
			"status":  "none",
			"message": "No sponsorship verification found",
		})
	}

	query := `
		SELECT plan, status, created_at, updated_at
		FROM subscriptions 
		WHERE user_id = $1
		ORDER BY created_at DESC LIMIT 1
	`

	var plan, status string
	var createdAt, updatedAt string
	err := h.db.QueryRow(query, userID).Scan(&plan, &status, &createdAt, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(fiber.Map{
				"status":  "none",
				"message": "No sponsorship verification found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(fiber.Map{
		"status":     status,
		"plan":       plan,
		"created_at": createdAt,
		"updated_at": updatedAt,
	})
}

// GetSponsorshipInfo returns information about sponsorship options
func (h *SponsorshipHandler) GetSponsorshipInfo(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"platforms": []fiber.Map{
			{
				"name":         "Buy Me a Coffee",
				"id":           "buymeacoffee",
				"url":          "https://buymeacoffee.com/temidaradev",
				"description":  "Support with a one-time coffee purchase",
				"instructions": "After purchasing, provide your username for verification",
			},
		},
		"benefits": []string{
			"Unlimited receipt storage",
			"Advanced email parsing",
			"PDF receipt parsing",
			"Priority support",
			"Early access to new features",
		},
	})
}
