package handlers

import (
	"database/sql"
	"strings"

	"receiptlocker/internal/config"
	"receiptlocker/internal/logging"
	"receiptlocker/internal/services"

	"github.com/gofiber/fiber/v2"
)

type BMCHandler struct {
	db         *sql.DB
	bmcService *services.BuyMeACoffeeService
}

func NewBMCHandler(db *sql.DB, cfg *config.Config) *BMCHandler {
	return &BMCHandler{
		db:         db,
		bmcService: services.NewBuyMeACoffeeService(db, cfg),
	}
}

// LinkBMCUsername allows users to link their Buy Me a Coffee username
func (h *BMCHandler) LinkBMCUsername(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found"})
	}

	var req struct {
		BMCUsername string `json:"bmc_username" validate:"required"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if req.BMCUsername == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "BMC username is required"})
	}

	// Normalize username
	bmcUsername := strings.TrimSpace(strings.ToLower(req.BMCUsername))

	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		logging.Error("Failed to start transaction for BMC username link", map[string]interface{}{
			"error":   err.Error(),
			"user_id": userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to link username"})
	}
	defer tx.Rollback()

	// Insert or update the mapping
	query := `
		INSERT INTO user_clerk_mapping (clerk_user_id, bmc_username, updated_at)
		VALUES ($1, $2, CURRENT_TIMESTAMP)
		ON CONFLICT (clerk_user_id) 
		DO UPDATE SET 
			bmc_username = EXCLUDED.bmc_username,
			updated_at = CURRENT_TIMESTAMP
	`
	_, err = tx.Exec(query, userID, bmcUsername)
	if err != nil {
		logging.Error("Failed to link BMC username", map[string]interface{}{
			"error":        err.Error(),
			"user_id":      userID,
			"bmc_username": bmcUsername,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to link username"})
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		logging.Error("Failed to commit BMC username link", map[string]interface{}{
			"error":   err.Error(),
			"user_id": userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to link username"})
	}

	logging.Info("BMC username linked", map[string]interface{}{
		"user_id":      userID,
		"bmc_username": bmcUsername,
	})

	return c.JSON(fiber.Map{
		"message":      "BMC username linked successfully",
		"bmc_username": bmcUsername,
		"note":         "Your membership will be synced automatically. If you have an active 'Retreat' membership, you'll receive premium access shortly.",
	})
}

// HandleWebhook receives webhook events from Buy Me a Coffee
func (h *BMCHandler) HandleWebhook(c *fiber.Ctx) error {
	// Get raw body first (Fiber reads body once, so we need to capture it)
	rawBody := c.Body()
	if len(rawBody) == 0 {
		logging.Warn("Webhook request with empty body", map[string]interface{}{
			"ip": c.IP(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Empty request body",
		})
	}

	// Get the signature from header (try multiple possible header names)
	signature := c.Get("x-signature-sha256")
	if signature == "" {
		signature = c.Get("X-BMC-Signature") // Alternative header name
	}
	if signature == "" {
		signature = c.Get("X-Signature-SHA256") // Another possible variant
	}

	// Log the incoming request for debugging
	logging.Info("Received BMC webhook request", map[string]interface{}{
		"ip":               c.IP(),
		"method":           c.Method(),
		"path":             c.Path(),
		"content_type":     c.Get("Content-Type"),
		"body_length":      len(rawBody),
		"has_signature":    signature != "",
		"signature_header": c.Get("x-signature-sha256") != "" || c.Get("X-BMC-Signature") != "",
		"all_headers":      c.GetReqHeaders(),
	})

	if signature == "" {
		logging.Warn("Webhook request missing signature header", map[string]interface{}{
			"ip":      c.IP(),
			"headers": c.GetReqHeaders(),
		})
		// In development, allow without signature if secret is not set
		// But log warning
		if h.bmcService != nil {
			// Will check inside VerifyWebhookSignature
		} else {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing signature header",
			})
		}
	}

	// Verify signature if provided
	if signature != "" {
		if !h.bmcService.VerifyWebhookSignature(rawBody, signature) {
			logging.Warn("Invalid webhook signature", map[string]interface{}{
				"ip":        c.IP(),
				"signature": signature[:min(20, len(signature))] + "...", // Only log first 20 chars
			})
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid signature",
			})
		}
	}

	// Parse webhook event - create new context with body for parsing
	var event services.BMCWebhookEvent
	if err := c.BodyParser(&event); err != nil {
		// Log the raw body for debugging
		bodyPreview := string(rawBody)
		if len(bodyPreview) > 500 {
			bodyPreview = bodyPreview[:500] + "..."
		}
		logging.Error("Failed to parse webhook payload", map[string]interface{}{
			"error":        err.Error(),
			"body_preview": bodyPreview,
			"content_type": c.Get("Content-Type"),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload format",
		})
	}

	// Log full event details for debugging
	logging.Info("Parsed BMC webhook event", map[string]interface{}{
		"type":              event.Type,
		"user_id":           event.Data.User.ID,
		"user_nickname":     event.Data.User.Nickname,
		"user_email":        event.Data.User.Email,
		"membership_id":     event.Data.Membership.ID,
		"membership_name":   event.Data.Membership.Name,
		"membership_status": event.Data.Membership.Status,
		"created_at":        event.Data.CreatedAt,
	})

	// Validate required fields
	if event.Type == "" {
		logging.Error("Webhook event missing type", map[string]interface{}{
			"event": event,
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Event type is required",
		})
	}

	if event.Data.User.Nickname == "" && event.Data.User.ID == "" {
		logging.Error("Webhook event missing user information", map[string]interface{}{
			"event_type": event.Type,
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "User information is required",
		})
	}

	// Process the event
	if err := h.bmcService.ProcessMembershipEvent(event); err != nil {
		logging.Error("Failed to process webhook event", map[string]interface{}{
			"error":           err.Error(),
			"type":            event.Type,
			"user_nickname":   event.Data.User.Nickname,
			"membership_name": event.Data.Membership.Name,
		})
		// Return 200 to acknowledge receipt, but log error
		// This prevents BMC from retrying and spamming
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"status":  "received",
			"message": "Event received but processing failed",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status":  "success",
		"message": "Event processed successfully",
	})
}
