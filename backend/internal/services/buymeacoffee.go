package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"receiptlocker/internal/config"
	"receiptlocker/internal/logging"
)

type BuyMeACoffeeService struct {
	db            *sql.DB
	webhookSecret string
	config        *config.Config
}

type BMCWebhookEvent struct {
	Type string `json:"type"`
	Data struct {
		User struct {
			ID       string `json:"id"`
			Nickname string `json:"nickname"`
			Email    string `json:"email,omitempty"`
			Name     string `json:"name,omitempty"`
		} `json:"user"`
		Membership struct {
			ID     string `json:"id"`
			Name   string `json:"name"`
			Status string `json:"status"`
		} `json:"membership"`
		CreatedAt string `json:"created_at,omitempty"`
		UpdatedAt string `json:"updated_at,omitempty"`
	} `json:"data"`
}

func NewBuyMeACoffeeService(db *sql.DB, cfg *config.Config) *BuyMeACoffeeService {
	return &BuyMeACoffeeService{
		db:            db,
		webhookSecret: cfg.BuyMeACoffee.WebhookSecret,
		config:        cfg,
	}
}

func (b *BuyMeACoffeeService) VerifyWebhookSignature(payload []byte, signature string) bool {
	if b.webhookSecret == "" {
		logging.Warn("Webhook secret not configured, skipping signature verification (dev mode)")
		return true
	}

	if signature == "" {
		return false
	}

	h := hmac.New(sha256.New, []byte(b.webhookSecret))
	h.Write(payload)
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	sig := strings.TrimPrefix(signature, "sha256=")
	sig = strings.TrimPrefix(sig, "SHA256=")
	sig = strings.TrimSpace(sig)

	isValid := hmac.Equal([]byte(expectedSignature), []byte(sig))

	if !isValid {
		logging.Warn("Signature verification failed", map[string]interface{}{
			"expected_length": len(expectedSignature),
			"received_length": len(sig),
			"has_prefix":      strings.HasPrefix(signature, "sha256="),
		})
	}

	return isValid
}

func (b *BuyMeACoffeeService) ProcessMembershipEvent(event BMCWebhookEvent) error {

	membershipName := strings.TrimSpace(event.Data.Membership.Name)
	nickname := strings.TrimSpace(event.Data.User.Nickname)

	if nickname == "" {
		nickname = strings.TrimSpace(event.Data.User.Email)
		if nickname == "" {
			return fmt.Errorf("user nickname and email are both empty")
		}

		if strings.Contains(nickname, "@") {
			parts := strings.Split(nickname, "@")
			nickname = parts[0]
		}
	}

	nicknameNormalized := strings.ToLower(nickname)

	logging.Info("Processing BMC membership event", map[string]interface{}{
		"event_type":          event.Type,
		"user_id":             event.Data.User.ID,
		"user_nickname":       event.Data.User.Nickname,
		"nickname_normalized": nicknameNormalized,
		"membership_name":     membershipName,
		"membership_status":   event.Data.Membership.Status,
	})

	if !strings.EqualFold(membershipName, "Retreat") {
		logging.Info("Ignoring non-Retreat membership event", map[string]interface{}{
			"membership_name": membershipName,
			"user_nickname":   event.Data.User.Nickname,
			"event_type":      event.Type,
		})
		return nil
	}

	tx, err := b.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	var clerkUserID string
	query := `
		SELECT clerk_user_id 
		FROM user_clerk_mapping 
		WHERE LOWER(bmc_username) = $1 AND bmc_username IS NOT NULL
	`
	err = tx.QueryRow(query, nicknameNormalized).Scan(&clerkUserID)

	if err == sql.ErrNoRows {
		logging.Info("BMC member not linked to app user yet", map[string]interface{}{
			"bmc_username":            event.Data.User.Nickname,
			"bmc_username_original":   nickname,
			"bmc_username_normalized": nicknameNormalized,
			"bmc_id":                  event.Data.User.ID,
			"membership_name":         membershipName,
			"note":                    "User should link their BMC username via /api/v1/bmc/link-username endpoint",
		})

		tx.Commit()
		return nil
	} else if err != nil {
		logging.Error("Failed to find user for BMC username", map[string]interface{}{
			"bmc_username":            event.Data.User.Nickname,
			"bmc_username_normalized": nicknameNormalized,
			"error":                   err.Error(),
			"membership_name":         membershipName,
		})
		return fmt.Errorf("failed to find user: %w", err)
	}

	var storedUsername string
	verifyQuery := `SELECT bmc_username FROM user_clerk_mapping WHERE clerk_user_id = $1`
	err = tx.QueryRow(verifyQuery, clerkUserID).Scan(&storedUsername)
	if err != nil {
		logging.Error("Failed to verify stored BMC username", map[string]interface{}{
			"clerk_user_id":      clerkUserID,
			"webhook_username":   event.Data.User.Nickname,
			"webhook_normalized": nicknameNormalized,
			"error":              err.Error(),
		})
		return fmt.Errorf("failed to verify stored username: %w", err)
	}

	if strings.ToLower(storedUsername) != nicknameNormalized {
		logging.Warn("Webhook username mismatch with stored username", map[string]interface{}{
			"clerk_user_id":      clerkUserID,
			"stored_username":    storedUsername,
			"webhook_username":   event.Data.User.Nickname,
			"stored_normalized":  strings.ToLower(storedUsername),
			"webhook_normalized": nicknameNormalized,
			"membership_name":    membershipName,
		})
		tx.Commit()
		return fmt.Errorf("username mismatch: webhook username '%s' does not match stored username '%s'", event.Data.User.Nickname, storedUsername)
	}

	logging.Info("Username match verified for webhook", map[string]interface{}{
		"clerk_user_id":    clerkUserID,
		"stored_username":  storedUsername,
		"webhook_username": event.Data.User.Nickname,
		"membership_name":  membershipName,
		"event_type":       event.Type,
	})

	now := time.Now()
	nextMonth := now.AddDate(0, 1, 0)

	if event.Type == "membership.updated" {

		if strings.EqualFold(event.Data.Membership.Status, "cancelled") {
			event.Type = "membership.cancelled"
		} else {
			event.Type = "membership.started"
		}
	}

	switch event.Type {
	case "membership.started":

		var existingSubID string
		var existingStatus string
		subQuery := `
			SELECT id, status 
			FROM subscriptions 
			WHERE clerk_user_id = $1 AND plan = 'premium'
			ORDER BY created_at DESC 
			LIMIT 1
		`
		err = tx.QueryRow(subQuery, clerkUserID).Scan(&existingSubID, &existingStatus)

		if err == sql.ErrNoRows {

			var userUUID sql.NullString
			uuidQuery := `SELECT user_uuid FROM user_clerk_mapping WHERE clerk_user_id = $1`
			_ = tx.QueryRow(uuidQuery, clerkUserID).Scan(&userUUID)

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
			err = tx.QueryRow(insertQuery, userIDValue, clerkUserID, now, nextMonth, now, now).Scan(&existingSubID)
			if err != nil {
				return fmt.Errorf("failed to create subscription: %w", err)
			}
			logging.Info("Created premium subscription for BMC member", map[string]interface{}{
				"bmc_username":  event.Data.User.Nickname,
				"clerk_user_id": clerkUserID,
			})

			b.logAdminNotification(event.Type, event.Data.User.Nickname, membershipName, event.Data.User.Email)
		} else if err == nil {

			if existingStatus != "active" {
				updateQuery := `
					UPDATE subscriptions 
					SET status = 'active', 
					    current_period_start = $1,
					    current_period_end = $2,
					    updated_at = $3
					WHERE id = $4
				`
				_, err = tx.Exec(updateQuery, now, nextMonth, now, existingSubID)
				if err != nil {
					return fmt.Errorf("failed to update subscription: %w", err)
				}
				logging.Info("Reactivated premium subscription", map[string]interface{}{
					"bmc_username":  event.Data.User.Nickname,
					"clerk_user_id": clerkUserID,
				})
			} else {

				updateQuery := `
					UPDATE subscriptions 
					SET current_period_end = $1,
					    updated_at = $2
					WHERE id = $3
				`
				_, err = tx.Exec(updateQuery, nextMonth, now, existingSubID)
				if err != nil {
					return fmt.Errorf("failed to extend subscription: %w", err)
				}
				logging.Info("Extended premium subscription for BMC member", map[string]interface{}{
					"bmc_username":  event.Data.User.Nickname,
					"clerk_user_id": clerkUserID,
				})
			}
		}

	case "membership.cancelled":

		updateQuery := `
			UPDATE subscriptions 
			SET status = 'cancelled', 
			    updated_at = $1
			WHERE clerk_user_id = $2 AND plan = 'premium' AND status = 'active'
		`
		result, err := tx.Exec(updateQuery, now, clerkUserID)
		if err != nil {
			return fmt.Errorf("failed to cancel subscription: %w", err)
		}
		rowsAffected, _ := result.RowsAffected()
		if rowsAffected > 0 {
			logging.Info("Cancelled premium subscription for BMC member", map[string]interface{}{
				"bmc_username":  event.Data.User.Nickname,
				"clerk_user_id": clerkUserID,
			})

			b.logAdminNotification(event.Type, event.Data.User.Nickname, membershipName, event.Data.User.Email)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (b *BuyMeACoffeeService) logAdminNotification(eventType, username, membership, email string) {
	logging.Info("BMC Membership Event", map[string]interface{}{
		"event_type":      eventType,
		"bmc_username":    username,
		"membership_name": membership,
		"user_email":      email,
		"notification":    "Admin should be notified",
	})
}
