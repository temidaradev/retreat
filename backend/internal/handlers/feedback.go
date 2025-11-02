package handlers

import (
	"database/sql"
	"fmt"

	"receiptlocker/internal/config"
	"receiptlocker/internal/logging"
	"receiptlocker/internal/services"

	"github.com/gofiber/fiber/v2"
)

type FeedbackHandler struct {
	db           *sql.DB
	config       *config.Config
	emailService *services.EmailService
}

func NewFeedbackHandler(db *sql.DB, cfg *config.Config, emailService *services.EmailService) *FeedbackHandler {
	return &FeedbackHandler{
		db:           db,
		config:       cfg,
		emailService: emailService,
	}
}

type FeedbackRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
}

func (h *FeedbackHandler) SendFeedback(c *fiber.Ctx) error {
	var req FeedbackRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate required fields
	if req.Name == "" || req.Email == "" || req.Subject == "" || req.Message == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "All fields are required",
		})
	}

	// Get user info if authenticated
	userID := c.Locals("userID")
	userEmail := c.Locals("userEmail")
	username := c.Locals("username")

	logging.Info("Received feedback", map[string]interface{}{
		"user_id":  userID,
		"email":    req.Email,
		"subject":  req.Subject,
		"has_auth": userID != nil,
	})

	// Build email body
	emailBody := h.buildFeedbackEmail(req, userID, userEmail, username)

	// Send email to admin
	adminEmail := h.getAdminEmail()
	if adminEmail == "" {
		logging.Warn("No admin email configured for feedback", nil)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Feedback service not configured",
		})
	}

	subject := fmt.Sprintf("Feedback from %s: %s", req.Name, req.Subject)
	if err := h.emailService.SendEmail(adminEmail, subject, emailBody); err != nil {
		logging.Error("Failed to send feedback email", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to send feedback",
		})
	}

	// Send confirmation email to user
	confirmationBody := h.buildConfirmationEmail(req.Subject)
	confirmationSubject := "Thank you for your feedback - Retreat"
	if err := h.emailService.SendEmail(req.Email, confirmationSubject, confirmationBody); err != nil {
		logging.Warn("Failed to send confirmation email to user", map[string]interface{}{
			"email": req.Email,
			"error": err.Error(),
		})
		// Don't fail the request if confirmation email fails
	}

	return c.JSON(fiber.Map{
		"message": "Feedback sent successfully",
	})
}

func (h *FeedbackHandler) buildFeedbackEmail(req FeedbackRequest, userID interface{}, userEmail interface{}, username interface{}) string {
	userInfo := ""
	if userID != nil {
		userInfo = fmt.Sprintf(`
			<div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6;">
				<h3 style="margin-top: 0; color: #1e40af;">User Information</h3>
				<p><strong>User ID:</strong> %v</p>
				<p><strong>User Email:</strong> %v</p>
				<p><strong>Username:</strong> %v</p>
			</div>`, userID, userEmail, username)
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>New Feedback - Retreat</title>
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
		.content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
		.feedback-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; }
		.label { font-weight: bold; color: #555; margin-right: 10px; }
		.footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h2>📧 New Feedback Received</h2>
		</div>
		<div class="content">
			<p>Hello,</p>
			<p>You have received new feedback from a user:</p>
			
			<div class="feedback-box">
				<h3>Feedback Details</h3>
				<p><span class="label">From:</span> %s</p>
				<p><span class="label">Email:</span> %s</p>
				<p><span class="label">Subject:</span> %s</p>
			</div>
			
			<div class="feedback-box">
				<h3>Message</h3>
				<p style="white-space: pre-wrap;">%s</p>
			</div>
			
			%s
			
			<p style="margin-top: 20px;">Please review and respond as appropriate.</p>
		</div>
		<div class="footer">
			<p>This email was sent automatically from Retreat Feedback System</p>
			<p>&copy; 2025 Retreat. All rights reserved.</p>
		</div>
	</div>
</body>
</html>
`, req.Name, req.Email, req.Subject, req.Message, userInfo)
}

func (h *FeedbackHandler) buildConfirmationEmail(subject string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Thank you for your feedback</title>
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
		.content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
		.footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h2>✓ Thank You for Your Feedback!</h2>
		</div>
		<div class="content">
			<p>Hello,</p>
			<p>Thank you for taking the time to send us feedback about: <strong>%s</strong></p>
			<p>We appreciate your input and will review your message. If we need any additional information, we'll reach out to you.</p>
			<p>Your feedback helps us improve Retreat and provide a better experience for all users.</p>
			<p>Best regards,<br>The Retreat Team</p>
		</div>
		<div class="footer">
			<p>This is an automated confirmation from Retreat - Your Receipt & Warranty Manager</p>
			<p>&copy; 2025 Retreat. All rights reserved.</p>
		</div>
	</div>
</body>
</html>
`, subject)
}

func (h *FeedbackHandler) getAdminEmail() string {
	adminEmail := h.config.Admin.Emails
	if len(adminEmail) > 0 {
		return adminEmail[0]
	}
	return ""
}
