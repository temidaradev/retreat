package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"receiptlocker/internal/config"
	"receiptlocker/internal/logging"
	"receiptlocker/internal/services"
	"receiptlocker/internal/types"

	"github.com/gofiber/fiber/v2"
)

type UserEmailHandler struct {
	db           *sql.DB
	config       *config.Config
	emailService *services.EmailService
}

func NewUserEmailHandler(db *sql.DB, cfg *config.Config, emailService *services.EmailService) *UserEmailHandler {
	return &UserEmailHandler{
		db:           db,
		config:       cfg,
		emailService: emailService,
	}
}

func (h *UserEmailHandler) GetUserEmails(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	query := `
		SELECT id, user_id, email, verified, is_primary, created_at, updated_at
		FROM user_emails
		WHERE user_id = $1
		ORDER BY is_primary DESC, created_at ASC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		logging.Error("Failed to get user emails", map[string]interface{}{
			"error":   err.Error(),
			"user_id": userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve emails",
		})
	}
	defer rows.Close()

	emails := []types.UserEmail{}
	for rows.Next() {
		var email types.UserEmail
		err := rows.Scan(
			&email.ID,
			&email.UserID,
			&email.Email,
			&email.Verified,
			&email.IsPrimary,
			&email.CreatedAt,
			&email.UpdatedAt,
		)
		if err != nil {
			continue
		}
		emails = append(emails, email)
	}

	return c.JSON(fiber.Map{
		"emails": emails,
	})
}

func (h *UserEmailHandler) AddUserEmail(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var req types.AddEmailRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	var existingUserID string
	checkQuery := `SELECT user_id FROM user_emails WHERE LOWER(email) = $1 LIMIT 1`
	err := h.db.QueryRow(checkQuery, email).Scan(&existingUserID)

	if err == nil {
		if existingUserID == userID {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "This email is already linked to your account",
			})
		}
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "This email is already linked to another account",
		})
	} else if err != sql.ErrNoRows {
		logging.Error("Failed to check existing email", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add email",
		})
	}

	var token string
	var expiresAt time.Time
	verifiedFlag := true

	var emailID string
	insertQuery := `
		INSERT INTO user_emails (user_id, email, verified, is_primary, verification_token, verification_expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id
	`

	err = h.db.QueryRow(insertQuery, userID, email, verifiedFlag, false, token, expiresAt).Scan(&emailID)
	if err != nil {
		logging.Error("Failed to insert email", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add email",
		})
	}

	logging.Info("User added new email", map[string]interface{}{
		"user_id":  userID,
		"email_id": emailID,
		"email":    email,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":  "Email added successfully.",
		"email_id": emailID,
		"email":    email,
	})
}

func (h *UserEmailHandler) VerifyUserEmail(c *fiber.Ctx) error {

	return h.sendErrorPage(c, "Email verification is disabled.")
}

func (h *UserEmailHandler) VerifyUserEmailByID(c *fiber.Ctx) error {

	return h.sendErrorPage(c, "Email verification is disabled.")
}

func (h *UserEmailHandler) sendErrorPage(c *fiber.Ctx, message string) error {
	return c.Type("html").SendString(fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Verification Failed - Retreat</title>
	<style>
		body { font-family: Arial, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
		.container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
		.error-icon { font-size: 64px; color: #f44336; margin-bottom: 20px; }
		h1 { color: #333; margin-bottom: 10px; }
		p { color: #666; line-height: 1.6; }
		.button { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="error-icon">❌</div>
		<h1>Verification Failed</h1>
		<p>%s</p>
		<a href="https://www.retreat-app.tech/emails" class="button">Go to Email Settings</a>
	</div>
</body>
</html>
	`, message))
}

func (h *UserEmailHandler) ResendVerification(c *fiber.Ctx) error {
	return c.Status(fiber.StatusGone).JSON(fiber.Map{"error": "Email verification is disabled"})
}

func (h *UserEmailHandler) DeleteUserEmail(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	emailID := c.Params("id")

	var isPrimary bool
	checkQuery := `SELECT is_primary FROM user_emails WHERE id = $1 AND user_id = $2`
	err := h.db.QueryRow(checkQuery, emailID, userID).Scan(&isPrimary)

	if err == sql.ErrNoRows {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Email not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete email",
		})
	}

	if isPrimary {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot delete primary email. Change primary email first.",
		})
	}

	deleteQuery := `DELETE FROM user_emails WHERE id = $1 AND user_id = $2`
	_, err = h.db.Exec(deleteQuery, emailID, userID)
	if err != nil {
		logging.Error("Failed to delete email", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete email",
		})
	}

	logging.Info("User deleted email", map[string]interface{}{
		"user_id":  userID,
		"email_id": emailID,
	})

	return c.JSON(fiber.Map{
		"message": "Email deleted successfully",
	})
}

func (h *UserEmailHandler) SetPrimaryEmail(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	emailID := c.Params("id")

	var verified bool
	checkQuery := `SELECT verified FROM user_emails WHERE id = $1 AND user_id = $2`
	err := h.db.QueryRow(checkQuery, emailID, userID).Scan(&verified)

	if err == sql.ErrNoRows {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Email not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to set primary email",
		})
	}

	if !verified {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot set unverified email as primary",
		})
	}

	tx, err := h.db.Begin()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to set primary email",
		})
	}
	defer tx.Rollback()

	_, err = tx.Exec(`UPDATE user_emails SET is_primary = FALSE WHERE user_id = $1`, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to set primary email",
		})
	}

	_, err = tx.Exec(`UPDATE user_emails SET is_primary = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, emailID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to set primary email",
		})
	}

	if err := tx.Commit(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to set primary email",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Primary email updated successfully",
	})
}

func generateVerificationToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (h *UserEmailHandler) sendVerificationEmail(emailID, email, token string) {
	baseURL := h.config.Email.VerificationBaseURL
	if baseURL == "" {
		baseURL = "https://api.retreat-app.tech/api/v1"
	}
	baseURL = strings.TrimRight(baseURL, "/")

	verifyURL := fmt.Sprintf("%s/verify-email/%s/%s", baseURL, emailID, token)

	legacyURL := fmt.Sprintf("%s/verify-email/%s", baseURL, token)

	subject := "Verify Your Email - Retreat"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
		.content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
		.button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
		.footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h2>✉️ Verify Your Email Address</h2>
		</div>
		<div class="content">
			<p>You've added <strong>%s</strong> to your Retreat account.</p>
			
			<p>To start forwarding receipts from this email address, please verify it by clicking the button below:</p>
			
            <div style="text-align: center;">
                <a href="%s" class="button">Verify Email Address</a>
            </div>
			
			<p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #4CAF50;">%s</p>
            <p style="margin-top:8px;color:#777;font-size:12px;">If the button doesn't work, you can also use this link: %s</p>
			
			<p><strong>This link will expire in 24 hours.</strong></p>
			
			<p>Once verified, you can forward receipts from this email to <strong>save@retreat-app.tech</strong> and they'll automatically be added to your account!</p>
		</div>
		<div class="footer">
			<p>If you didn't add this email, you can safely ignore this message.</p>
			<p>&copy; 2025 Retreat. All rights reserved.</p>
		</div>
	</div>
</body>
</html>
`, email, verifyURL, verifyURL, legacyURL)

	if err := h.emailService.SendEmail(email, subject, body); err != nil {
		logging.Error("Failed to send verification email", map[string]interface{}{
			"email": email,
			"error": err.Error(),
		})
	}
}
