package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"

	"receiptlocker/internal/config"
	"receiptlocker/internal/logging"
	"receiptlocker/internal/services"
	"receiptlocker/internal/types"

	"github.com/gofiber/fiber/v2"
)

type EmailHandler struct {
	db            *sql.DB
	config        *config.Config
	parserService *services.EmailParserService
	emailService  *services.EmailService
}

func NewEmailHandler(db *sql.DB, cfg *config.Config, emailService *services.EmailService) *EmailHandler {
	return &EmailHandler{
		db:            db,
		config:        cfg,
		parserService: services.NewEmailParserService(db, cfg),
		emailService:  emailService,
	}
}

func (h *EmailHandler) HandleInboundEmail(c *fiber.Ctx) error {
	logging.Info("Received inbound email webhook", map[string]interface{}{
		"ip":         c.IP(),
		"user_agent": c.Get("User-Agent"),
	})

	if h.config.Email.InboundWebhookSecret != "" {
		if !h.verifyWebhookSignature(c) {
			logging.Warn("Invalid webhook signature for inbound email", map[string]interface{}{
				"ip": c.IP(),
			})
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid webhook signature",
			})
		}
	}

	var emailPayload types.InboundEmailWebhook
	if err := c.BodyParser(&emailPayload); err != nil {

		emailPayload = types.InboundEmailWebhook{
			From:    c.FormValue("from"),
			To:      c.FormValue("to"),
			Subject: c.FormValue("subject"),
			Text:    c.FormValue("text"),
			HTML:    c.FormValue("html"),
		}

		if emailPayload.From == "" {
			logging.Error("Failed to parse email webhook payload", map[string]interface{}{
				"error": err.Error(),
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid email payload",
			})
		}
	}

	logging.Info("Processing inbound email", map[string]interface{}{
		"from":    emailPayload.From,
		"to":      emailPayload.To,
		"subject": emailPayload.Subject,
	})

	senderEmail := h.extractEmailAddress(emailPayload.From)
	if senderEmail == "" {
		logging.Error("Failed to extract sender email", map[string]interface{}{
			"from": emailPayload.From,
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid sender email",
		})
	}

	userID, err := h.parserService.GetUserByEmail(senderEmail)
	if err != nil {
		logging.Warn("User not found for email", map[string]interface{}{
			"email": senderEmail,
			"error": err.Error(),
		})

		h.sendErrorNotification(senderEmail, "User not found. Please sign up at retreat-app.tech first.")

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Email received, but user not found",
		})
	}

	parsedReceipt, err := h.parserService.ParseReceiptEmail(&emailPayload)
	if err != nil {
		logging.Warn("Failed to parse receipt from email", map[string]interface{}{
			"user_id": userID,
			"error":   err.Error(),
		})

		h.sendErrorNotification(senderEmail, "Unable to extract receipt information from your email. Please ensure the email contains clear receipt details (store, amount, date).")

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Email received, but unable to parse receipt data",
		})
	}

	if err := h.checkReceiptLimit(userID); err != nil {
		logging.Warn("Receipt limit exceeded for user", map[string]interface{}{
			"user_id": userID,
		})

		h.sendErrorNotification(senderEmail, "Receipt limit reached. Please upgrade to premium or delete old receipts.")

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Receipt limit reached",
		})
	}

	receiptID, err := h.parserService.CreateReceiptFromParsedData(userID, parsedReceipt, emailPayload.From)
	if err != nil {
		logging.Error("Failed to create receipt from email", map[string]interface{}{
			"user_id": userID,
			"error":   err.Error(),
		})

		h.sendErrorNotification(senderEmail, "Failed to save your receipt. Please try again or contact support.")

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create receipt",
		})
	}

	h.sendSuccessNotification(senderEmail, parsedReceipt, receiptID)

	logging.Info("Successfully created receipt from email", map[string]interface{}{
		"receipt_id": receiptID,
		"user_id":    userID,
		"confidence": parsedReceipt.Confidence,
	})

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":    "Receipt created successfully",
		"receipt_id": receiptID,
	})
}

func (h *EmailHandler) verifyWebhookSignature(c *fiber.Ctx) bool {

	signature := c.Get("X-Email-Signature")
	if signature == "" {
		signature = c.Get("X-Mailgun-Signature")
	}
	if signature == "" {
		signature = c.Get("X-SendGrid-Signature")
	}

	if signature == "" {
		return false
	}

	body := c.Body()
	mac := hmac.New(sha256.New, []byte(h.config.Email.InboundWebhookSecret))
	mac.Write(body)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

func (h *EmailHandler) extractEmailAddress(from string) string {

	if strings.Contains(from, "<") && strings.Contains(from, ">") {
		start := strings.Index(from, "<") + 1
		end := strings.Index(from, ">")
		if start < end {
			return strings.ToLower(strings.TrimSpace(from[start:end]))
		}
	}

	return strings.ToLower(strings.TrimSpace(from))
}

func (h *EmailHandler) checkReceiptLimit(userID string) error {

	var plan, status string
	var currentPeriodEnd sql.NullTime

	query := `
		SELECT plan, status, current_period_end
		FROM subscriptions
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`

	err := h.db.QueryRow(query, userID).Scan(&plan, &status, &currentPeriodEnd)

	isPremium := false
	if err == nil && status == "active" {

		if currentPeriodEnd.Valid && currentPeriodEnd.Time.After(sql.NullTime{}.Time) {
			isPremium = true
		}
	}

	var count int
	countQuery := `
		SELECT COUNT(*) 
		FROM receipts 
		WHERE user_id = $1 AND deleted_at IS NULL
	`
	if err := h.db.QueryRow(countQuery, userID).Scan(&count); err != nil {
		return err
	}

	limit := 5
	if isPremium {
		limit = 50
	}

	if count >= limit {
		return fiber.NewError(fiber.StatusForbidden, "Receipt limit reached")
	}

	return nil
}

func (h *EmailHandler) sendSuccessNotification(userEmail string, receipt *types.ParsedReceiptData, receiptID string) {
	if h.emailService == nil {
		return
	}

	subject := "Receipt Saved Successfully - Retreat"
	body := h.buildSuccessEmail(receipt, receiptID)

	if err := h.emailService.SendEmail(userEmail, subject, body); err != nil {
		logging.Error("Failed to send success notification", map[string]interface{}{
			"email": userEmail,
			"error": err.Error(),
		})
	}
}

func (h *EmailHandler) sendErrorNotification(userEmail, errorMsg string) {
	if h.emailService == nil {
		return
	}

	subject := "Issue Saving Your Receipt - Retreat"
	body := h.buildErrorEmail(errorMsg)

	if err := h.emailService.SendEmail(userEmail, subject, body); err != nil {
		logging.Error("Failed to send error notification", map[string]interface{}{
			"email": userEmail,
			"error": err.Error(),
		})
	}
}

func (h *EmailHandler) buildSuccessEmail(receipt *types.ParsedReceiptData, receiptID string) string {
	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
		.content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
		.receipt-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
		.detail-row { margin: 8px 0; }
		.label { font-weight: bold; color: #555; }
		.button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
		.footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h2>✓ Receipt Saved Successfully!</h2>
		</div>
		<div class="content">
			<p>Great news! We've successfully processed your receipt and added it to your Retreat account.</p>
			
			<div class="receipt-details">
				<h3>Receipt Details:</h3>
				<div class="detail-row"><span class="label">Store:</span> ` + receipt.Store + `</div>
				<div class="detail-row"><span class="label">Item:</span> ` + receipt.Item + `</div>
				<div class="detail-row"><span class="label">Amount:</span> ` + receipt.Currency + ` ` + formatAmount(receipt.Amount) + `</div>
				<div class="detail-row"><span class="label">Purchase Date:</span> ` + receipt.PurchaseDate.Format("January 2, 2006") + `</div>
				<div class="detail-row"><span class="label">Warranty Expires:</span> ` + receipt.WarrantyExpiry.Format("January 2, 2006") + `</div>
			</div>
			
			<p>You can view and manage this receipt in your Retreat dashboard.</p>
			
			<a href="https://www.retreat-app.tech/receipts/` + receiptID + `" class="button">View Receipt</a>
			
			<p style="margin-top: 20px;">To save more receipts, simply forward them to <strong>save@retreat-app.tech</strong></p>
		</div>
		<div class="footer">
			<p>This is an automated message from Retreat - Your Receipt & Warranty Manager</p>
			<p>&copy; 2025 Retreat. All rights reserved.</p>
		</div>
	</div>
</body>
</html>
`
}

func (h *EmailHandler) buildErrorEmail(errorMsg string) string {
	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
		.content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
		.error-box { background: #ffebee; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
		.button { display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
		.footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h2>⚠ Issue Processing Your Receipt</h2>
		</div>
		<div class="content">
			<p>We received your email but encountered an issue while trying to save your receipt.</p>
			
			<div class="error-box">
				<strong>Issue:</strong> ` + errorMsg + `
			</div>
			
			<h3>What you can do:</h3>
			<ul>
				<li>Ensure your email contains clear receipt information (store name, amount, date)</li>
				<li>Try forwarding the original receipt email from the merchant</li>
				<li>Manually add the receipt through the Retreat app</li>
				<li>Contact our support team if the issue persists</li>
			</ul>
			
			<a href="https://www.retreat-app.tech/receipts/new" class="button">Add Receipt Manually</a>
		</div>
		<div class="footer">
			<p>This is an automated message from Retreat - Your Receipt & Warranty Manager</p>
			<p>&copy; 2025 Retreat. All rights reserved.</p>
		</div>
	</div>
</body>
</html>
`
}

func formatAmount(amount float64) string {

	formatted := fmt.Sprintf("%.2f", amount)

	formatted = strings.TrimRight(formatted, "0")

	formatted = strings.TrimRight(formatted, ".")
	return formatted
}
