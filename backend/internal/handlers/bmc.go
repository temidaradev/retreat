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

	bmcUsername := strings.TrimSpace(strings.ToLower(req.BMCUsername))

	tx, err := h.db.Begin()
	if err != nil {
		logging.Error("Failed to start transaction for BMC username link", map[string]interface{}{
			"error":   err.Error(),
			"user_id": userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to link username"})
	}
	defer tx.Rollback()

	var existingClerkUserID string
	checkQuery := `
		SELECT clerk_user_id 
		FROM user_clerk_mapping 
		WHERE LOWER(bmc_username) = $1 AND clerk_user_id != $2
		LIMIT 1
	`
	err = tx.QueryRow(checkQuery, bmcUsername, userID).Scan(&existingClerkUserID)

	if err == nil {

		logging.Warn("Attempt to link BMC username already linked to another account", map[string]interface{}{
			"user_id":          userID,
			"bmc_username":     bmcUsername,
			"existing_user_id": existingClerkUserID,
			"ip":               c.IP(),
		})
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "This Buy Me a Coffee username is already linked to another account. Please ensure you're using the correct username.",
		})
	} else if err != sql.ErrNoRows {

		logging.Error("Failed to check for existing BMC username", map[string]interface{}{
			"error":        err.Error(),
			"user_id":      userID,
			"bmc_username": bmcUsername,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify username availability"})
	}

	query := `
		INSERT INTO user_clerk_mapping (clerk_user_id, bmc_username, updated_at)
		VALUES ($1, $2, CURRENT_TIMESTAMP)
		ON CONFLICT (clerk_user_id) 
		DO UPDATE SET 
			bmc_username = EXCLUDED.bmc_username,
			updated_at = CURRENT_TIMESTAMP
		WHERE user_clerk_mapping.clerk_user_id = $1
	`
	_, err = tx.Exec(query, userID, bmcUsername)
	if err != nil {

		if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate key") {
			logging.Warn("Unique constraint violation on BMC username link (race condition?)", map[string]interface{}{
				"error":        err.Error(),
				"user_id":      userID,
				"bmc_username": bmcUsername,
				"ip":           c.IP(),
			})
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "This Buy Me a Coffee username is already linked to another account. Please ensure you're using the correct username.",
			})
		}

		logging.Error("Failed to link BMC username", map[string]interface{}{
			"error":        err.Error(),
			"user_id":      userID,
			"bmc_username": bmcUsername,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to link username"})
	}

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

func (h *BMCHandler) HandleWebhook(c *fiber.Ctx) error {

	rawBody := c.Body()
	if len(rawBody) == 0 {
		logging.Warn("Webhook request with empty body", map[string]interface{}{
			"ip": c.IP(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Empty request body",
		})
	}

	signature := c.Get("x-signature-sha256")
	if signature == "" {
		signature = c.Get("X-BMC-Signature")
	}
	if signature == "" {
		signature = c.Get("X-Signature-SHA256")
	}

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

		if h.bmcService != nil {

		} else {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing signature header",
			})
		}
	}

	if signature != "" {
		if !h.bmcService.VerifyWebhookSignature(rawBody, signature) {
			logging.Warn("Invalid webhook signature", map[string]interface{}{
				"ip":        c.IP(),
				"signature": signature[:min(20, len(signature))] + "...",
			})
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid signature",
			})
		}
	}

	var event services.BMCWebhookEvent
	if err := c.BodyParser(&event); err != nil {

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

	if err := h.bmcService.ProcessMembershipEvent(event); err != nil {
		logging.Error("Failed to process webhook event", map[string]interface{}{
			"error":           err.Error(),
			"type":            event.Type,
			"user_nickname":   event.Data.User.Nickname,
			"membership_name": event.Data.Membership.Name,
		})

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
