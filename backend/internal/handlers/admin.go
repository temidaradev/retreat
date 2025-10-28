package handlers

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"receiptlocker/internal/config"
	"receiptlocker/internal/logging"
	"receiptlocker/internal/services"

	"github.com/gofiber/fiber/v2"
)

type AdminHandler struct {
	db         *sql.DB
	bmcService *services.BuyMeACoffeeService
	cfg        *config.Config
}

func NewAdminHandler(db *sql.DB, cfg *config.Config, bmcService *services.BuyMeACoffeeService) *AdminHandler {
	return &AdminHandler{
		db:         db,
		bmcService: bmcService,
		cfg:        cfg,
	}
}

func (h *AdminHandler) GetDashboard(c *fiber.Ctx) error {
	stats := make(map[string]interface{})

	var totalReceipts int
	if err := h.db.QueryRow("SELECT COUNT(*) FROM receipts WHERE deleted_at IS NULL").Scan(&totalReceipts); err != nil {
		logging.Error("Failed to get total receipts", map[string]interface{}{"error": err.Error()})
	} else {
		stats["total_receipts"] = totalReceipts
	}

	var activeSubscriptions int
	if err := h.db.QueryRow("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'").Scan(&activeSubscriptions); err != nil {
		logging.Error("Failed to get active subscriptions", map[string]interface{}{"error": err.Error()})
	} else {
		stats["active_subscriptions"] = activeSubscriptions
	}

	var totalBMCLinkedUsers int
	if err := h.db.QueryRow("SELECT COUNT(*) FROM user_clerk_mapping WHERE bmc_username IS NOT NULL").Scan(&totalBMCLinkedUsers); err != nil {
		logging.Error("Failed to get BMC linked users", map[string]interface{}{"error": err.Error()})
	} else {
		stats["bmc_linked_users"] = totalBMCLinkedUsers
	}

	statusCounts := make(map[string]int)
	rows, err := h.db.Query("SELECT status, COUNT(*) FROM receipts WHERE deleted_at IS NULL GROUP BY status")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var status string
			var count int
			if err := rows.Scan(&status, &count); err == nil {
				statusCounts[status] = count
			}
		}
		stats["receipts_by_status"] = statusCounts
	}

	stats["timestamp"] = time.Now().UTC()

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   stats,
	})
}

func (h *AdminHandler) GetBMCUsers(c *fiber.Ctx) error {
	query := `
		SELECT clerk_user_id, bmc_username, created_at, updated_at
		FROM user_clerk_mapping
		WHERE bmc_username IS NOT NULL
		ORDER BY updated_at DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		logging.Error("Failed to get BMC users", map[string]interface{}{"error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch BMC users",
		})
	}
	defer rows.Close()

	type BMCUser struct {
		ClerkUserID string    `json:"clerk_user_id"`
		BMCUsername string    `json:"bmc_username"`
		CreatedAt   time.Time `json:"created_at"`
		UpdatedAt   time.Time `json:"updated_at"`
	}

	var users []BMCUser
	for rows.Next() {
		var user BMCUser
		if err := rows.Scan(&user.ClerkUserID, &user.BMCUsername, &user.CreatedAt, &user.UpdatedAt); err != nil {
			continue
		}
		users = append(users, user)
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"count":  len(users),
		"data":   users,
	})
}

func (h *AdminHandler) GetSubscriptions(c *fiber.Ctx) error {
	statusFilter := c.Query("status", "")

	query := `
		SELECT id, user_id, clerk_user_id, plan, status, 
		       current_period_start, current_period_end, created_at, updated_at
		FROM subscriptions
	`
	args := []interface{}{}

	if statusFilter != "" {
		query += " WHERE status = $1"
		args = append(args, statusFilter)
	}

	query += " ORDER BY created_at DESC LIMIT 100"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		logging.Error("Failed to get subscriptions", map[string]interface{}{"error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch subscriptions",
		})
	}
	defer rows.Close()

	type Subscription struct {
		ID                 string     `json:"id"`
		UserID             *string    `json:"user_id"`
		ClerkUserID        *string    `json:"clerk_user_id"`
		Plan               string     `json:"plan"`
		Status             string     `json:"status"`
		CurrentPeriodStart *time.Time `json:"current_period_start"`
		CurrentPeriodEnd   *time.Time `json:"current_period_end"`
		CreatedAt          time.Time  `json:"created_at"`
		UpdatedAt          time.Time  `json:"updated_at"`
	}

	var subscriptions []Subscription
	for rows.Next() {
		var sub Subscription
		var userID, clerkUserID sql.NullString
		var periodStart, periodEnd sql.NullTime

		err := rows.Scan(
			&sub.ID, &userID, &clerkUserID, &sub.Plan, &sub.Status,
			&periodStart, &periodEnd, &sub.CreatedAt, &sub.UpdatedAt,
		)
		if err != nil {
			continue
		}

		if userID.Valid {
			sub.UserID = &userID.String
		}
		if clerkUserID.Valid {
			sub.ClerkUserID = &clerkUserID.String
		}
		if periodStart.Valid {
			sub.CurrentPeriodStart = &periodStart.Time
		}
		if periodEnd.Valid {
			sub.CurrentPeriodEnd = &periodEnd.Time
		}

		subscriptions = append(subscriptions, sub)
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"count":  len(subscriptions),
		"data":   subscriptions,
	})
}

func (h *AdminHandler) SyncBMCMemberships(c *fiber.Ctx) error {
	logging.Info("Manual BMC sync triggered by admin", map[string]interface{}{
		"admin_user": c.Locals("userID"),
	})

	webhookURL := fmt.Sprintf("https://retreat-app.tech/api/v1/bmc/webhook")
	return c.JSON(fiber.Map{
		"status":      "success",
		"message":     "BMC integration uses real-time webhooks. Use BMC's 'Send Test' feature to trigger test events.",
		"webhook_url": webhookURL,
		"note":        "Webhooks are processed automatically when members subscribe/cancel",
	})
}

func (h *AdminHandler) GrantSubscription(c *fiber.Ctx) error {
	var req struct {
		ClerkUserID    string `json:"clerk_user_id" validate:"required"`
		DurationMonths int    `json:"duration_months"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if req.ClerkUserID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "clerk_user_id is required"})
	}

	if req.DurationMonths <= 0 {
		req.DurationMonths = 1
	}

	tx, err := h.db.Begin()
	if err != nil {
		logging.Error("Failed to start transaction for manual subscription grant", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	defer tx.Rollback()

	now := time.Now()
	endDate := now.AddDate(0, req.DurationMonths, 0)

	var existingID string
	var existingStatus string
	checkQuery := `SELECT id, status FROM subscriptions WHERE clerk_user_id = $1 AND plan = 'premium' ORDER BY created_at DESC LIMIT 1`
	err = tx.QueryRow(checkQuery, req.ClerkUserID).Scan(&existingID, &existingStatus)

	if err == sql.ErrNoRows {
		var userUUID sql.NullString
		uuidQuery := `SELECT user_uuid FROM user_clerk_mapping WHERE clerk_user_id = $1`
		_ = tx.QueryRow(uuidQuery, req.ClerkUserID).Scan(&userUUID)

		insertQuery := `
			INSERT INTO subscriptions (user_id, clerk_user_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
			VALUES ($1, $2, 'premium', 'active', $3, $4, $5, $6)
			RETURNING id
		`
		var userIDValue interface{}
		if userUUID.Valid {
			userIDValue = userUUID.String
		} else {
			userIDValue = nil
		}

		err = tx.QueryRow(insertQuery, userIDValue, req.ClerkUserID, now, endDate, now, now).Scan(&existingID)
		if err != nil {
			logging.Error("Failed to create subscription", map[string]interface{}{"error": err.Error()})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create subscription"})
		}

		if err := tx.Commit(); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to commit"})
		}

		logging.Info("Admin granted premium subscription", map[string]interface{}{
			"admin_user":    c.Locals("userID"),
			"clerk_user_id": req.ClerkUserID,
			"duration":      req.DurationMonths,
		})

		return c.JSON(fiber.Map{
			"status":  "success",
			"message": "Premium subscription granted",
			"data": map[string]interface{}{
				"subscription_id": existingID,
				"clerk_user_id":   req.ClerkUserID,
				"duration_months": req.DurationMonths,
				"expires_at":      endDate,
			},
		})
	}

	updateQuery := `
		UPDATE subscriptions 
		SET status = 'active', 
		    current_period_start = $1,
		    current_period_end = $2,
		    updated_at = $3
		WHERE id = $4
	`
	_, err = tx.Exec(updateQuery, now, endDate, now, existingID)
	if err != nil {
		logging.Error("Failed to update subscription", map[string]interface{}{"error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update subscription"})
	}

	if err := tx.Commit(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to commit"})
	}

	logging.Info("Admin updated premium subscription", map[string]interface{}{
		"admin_user":    c.Locals("userID"),
		"clerk_user_id": req.ClerkUserID,
		"duration":      req.DurationMonths,
	})

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Premium subscription updated",
		"data": map[string]interface{}{
			"subscription_id": existingID,
			"clerk_user_id":   req.ClerkUserID,
			"expires_at":      endDate,
		},
	})
}

func (h *AdminHandler) RevokeSubscription(c *fiber.Ctx) error {
	var req struct {
		ClerkUserID string `json:"clerk_user_id" validate:"required"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if req.ClerkUserID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "clerk_user_id is required"})
	}

	query := `
		UPDATE subscriptions 
		SET status = 'cancelled', updated_at = $1
		WHERE clerk_user_id = $2 AND plan = 'premium' AND status = 'active'
		RETURNING id
	`

	var subscriptionID string
	err := h.db.QueryRow(query, time.Now(), req.ClerkUserID).Scan(&subscriptionID)

	if err == sql.ErrNoRows {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "No active premium subscription found for this user",
		})
	}

	if err != nil {
		logging.Error("Failed to revoke subscription", map[string]interface{}{"error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to revoke subscription"})
	}

	logging.Info("Admin revoked premium subscription", map[string]interface{}{
		"admin_user":      c.Locals("userID"),
		"clerk_user_id":   req.ClerkUserID,
		"subscription_id": subscriptionID,
	})

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Premium subscription revoked",
		"data": map[string]interface{}{
			"subscription_id": subscriptionID,
			"clerk_user_id":   req.ClerkUserID,
		},
	})
}

func (h *AdminHandler) LinkBMCUsername(c *fiber.Ctx) error {
	var req struct {
		ClerkUserID string `json:"clerk_user_id" validate:"required"`
		BMCUsername string `json:"bmc_username" validate:"required"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if req.ClerkUserID == "" || req.BMCUsername == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "clerk_user_id and bmc_username are required"})
	}

	bmcUsername := strings.ToLower(strings.TrimSpace(req.BMCUsername))

	tx, err := h.db.Begin()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	defer tx.Rollback()

	var existingClerkUserID string
	checkQuery := `
		SELECT clerk_user_id 
		FROM user_clerk_mapping 
		WHERE LOWER(bmc_username) = $1 AND clerk_user_id != $2
		LIMIT 1
	`
	err = tx.QueryRow(checkQuery, bmcUsername, req.ClerkUserID).Scan(&existingClerkUserID)

	if err == nil {
		logging.Warn("Admin attempted to link BMC username already linked to another account", map[string]interface{}{
			"admin_user":       c.Locals("userID"),
			"target_user_id":   req.ClerkUserID,
			"bmc_username":     bmcUsername,
			"existing_user_id": existingClerkUserID,
		})
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "This Buy Me a Coffee username is already linked to another account. Please ensure you're using the correct username.",
		})
	} else if err != sql.ErrNoRows {
		logging.Error("Failed to check for existing BMC username (admin action)", map[string]interface{}{
			"error":          err.Error(),
			"target_user_id": req.ClerkUserID,
			"bmc_username":   bmcUsername,
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
	_, err = tx.Exec(query, req.ClerkUserID, bmcUsername)
	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate key") {
			logging.Warn("Unique constraint violation on BMC username link (admin action)", map[string]interface{}{
				"error":          err.Error(),
				"target_user_id": req.ClerkUserID,
				"bmc_username":   bmcUsername,
				"admin_user":     c.Locals("userID"),
			})
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "This Buy Me a Coffee username is already linked to another account. Please ensure you're using the correct username.",
			})
		}

		logging.Error("Failed to link BMC username (admin action)", map[string]interface{}{
			"error":          err.Error(),
			"target_user_id": req.ClerkUserID,
			"bmc_username":   bmcUsername,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to link username"})
	}

	if err := tx.Commit(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to commit"})
	}

	logging.Info("Admin linked BMC username", map[string]interface{}{
		"admin_user":    c.Locals("userID"),
		"clerk_user_id": req.ClerkUserID,
		"bmc_username":  bmcUsername,
	})

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "BMC username linked successfully",
		"data": map[string]interface{}{
			"clerk_user_id": req.ClerkUserID,
			"bmc_username":  bmcUsername,
		},
	})
}

func (h *AdminHandler) GetSystemInfo(c *fiber.Ctx) error {
	info := make(map[string]interface{})

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()
	if err := h.db.PingContext(ctx); err != nil {
		info["database"] = map[string]interface{}{
			"status": "disconnected",
			"error":  err.Error(),
		}
	} else {
		var version string
		h.db.QueryRow("SELECT version()").Scan(&version)
		info["database"] = map[string]interface{}{
			"status":  "connected",
			"version": version,
		}
	}

	info["config"] = map[string]interface{}{
		"bmc_webhook_configured": h.cfg.BuyMeACoffee.WebhookSecret != "",
		"smtp_configured":        h.cfg.Email.SMTPHost != "" && h.cfg.Email.SMTPPassword != "",
		"env":                    h.cfg.Server.GinMode,
	}

	info["server"] = map[string]interface{}{
		"port":     h.cfg.Server.Port,
		"env":      h.cfg.Server.GinMode,
		"dev_mode": h.cfg.Server.DevMode,
	}

	info["timestamp"] = time.Now().UTC()

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   info,
	})
}
