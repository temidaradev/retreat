package services

import (
	"database/sql"
	"time"

	"receiptlocker/internal/config"
	"receiptlocker/internal/logging"

	"github.com/robfig/cron/v3"
)

type CronService struct {
	db           *sql.DB
	emailService *EmailService
	bmcService   *BuyMeACoffeeService
	cron         *cron.Cron
}

func NewCronService(db *sql.DB, cfg *config.Config) *CronService {
	emailService := NewEmailService(db)
	bmcService := NewBuyMeACoffeeService(db, cfg)
	c := cron.New(cron.WithLocation(time.UTC))

	return &CronService{
		db:           db,
		emailService: emailService,
		bmcService:   bmcService,
		cron:         c,
	}
}

// Start starts the cron service
func (c *CronService) Start() {
	// Run warranty reminders daily at 9 AM UTC
	c.cron.AddFunc("0 9 * * *", func() {
		logging.Info("Running daily warranty reminder check...")
		if err := c.emailService.CheckAndSendReminders(); err != nil {
			logging.Error("Failed to send warranty reminders", map[string]interface{}{
				"error": err.Error(),
			})
		}
	})

	// Run cleanup tasks weekly on Sunday at 2 AM UTC
	c.cron.AddFunc("0 2 * * 0", func() {
		logging.Info("Running weekly cleanup tasks...")
		if err := c.runCleanupTasks(); err != nil {
			logging.Error("Failed to run cleanup tasks", map[string]interface{}{
				"error": err.Error(),
			})
		}
	})

	// Note: Buy Me a Coffee integration now uses webhooks instead of scheduled sync
	// Webhooks are handled in real-time via /api/v1/bmc/webhook endpoint

	c.cron.Start()
	logging.Info("Cron service started")
}

// Stop stops the cron service
func (c *CronService) Stop() {
	c.cron.Stop()
	logging.Info("Cron service stopped")
}

// runCleanupTasks runs various cleanup tasks
// All operations are wrapped in transactions to ensure data integrity
func (c *CronService) runCleanupTasks() error {
	// Start a transaction for all cleanup operations to ensure atomicity
	tx, err := c.db.Begin()
	if err != nil {
		logging.Error("Failed to start transaction for cleanup tasks", map[string]interface{}{
			"error": err.Error(),
		})
		return err
	}
	defer tx.Rollback()

	// Update expired warranty statuses (only for non-deleted receipts)
	query := `UPDATE receipts SET status = 'expired' WHERE warranty_expiry < NOW() AND status != 'expired' AND deleted_at IS NULL`
	result, err := tx.Exec(query)
	if err != nil {
		logging.Error("Failed to update expired warranty statuses", map[string]interface{}{
			"error": err.Error(),
		})
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	logging.Info("Updated receipts to expired status", map[string]interface{}{
		"count": rowsAffected,
	})

	// Permanently delete receipts that have been soft-deleted for more than 30 days
	// Use a safety buffer to ensure we don't delete receipts that are less than 30 days old
	deleteOldQuery := `
		DELETE FROM receipts 
		WHERE deleted_at IS NOT NULL 
		AND deleted_at < NOW() - INTERVAL '30 days'
		AND deleted_at < NOW() - INTERVAL '29 days 23 hours'
	`
	result, err = tx.Exec(deleteOldQuery)
	if err != nil {
		logging.Error("Failed to permanently delete old receipts", map[string]interface{}{
			"error": err.Error(),
		})
		return err
	}

	rowsAffected, _ = result.RowsAffected()
	if rowsAffected > 0 {
		logging.Info("Permanently deleted old soft-deleted receipts", map[string]interface{}{
			"count": rowsAffected,
		})
	}

	// IMPORTANT: Removed the dangerous cleanup query that deleted active receipts
	// This was a potential data loss risk. If you need to limit receipts per user,
	// implement it at the application level (e.g., in CreateReceipt limit check)
	// or make it opt-in with explicit user consent.
	//
	// The previous cleanup query could have deleted active receipts unexpectedly:
	// - It didn't use transactions (now fixed)
	// - It could delete receipts users expect to keep
	// - It could race with user operations
	//
	// If retention limits are needed, consider:
	// 1. Warning users before cleanup
	// 2. Providing export functionality
	// 3. Using archival instead of deletion
	// 4. Making it user-configurable

	// Commit all cleanup operations atomically
	if err := tx.Commit(); err != nil {
		logging.Error("Failed to commit cleanup tasks transaction", map[string]interface{}{
			"error": err.Error(),
		})
		return err
	}

	return nil
}
