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

func (c *CronService) Start() {

	c.cron.AddFunc("0 9 * * *", func() {
		logging.Info("Running daily warranty reminder check...")
		if err := c.emailService.CheckAndSendReminders(); err != nil {
			logging.Error("Failed to send warranty reminders", map[string]interface{}{
				"error": err.Error(),
			})
		}
	})

	c.cron.AddFunc("0 2 * * 0", func() {
		logging.Info("Running weekly cleanup tasks...")
		if err := c.runCleanupTasks(); err != nil {
			logging.Error("Failed to run cleanup tasks", map[string]interface{}{
				"error": err.Error(),
			})
		}
	})

	c.cron.Start()
	logging.Info("Cron service started")
}

func (c *CronService) Stop() {
	c.cron.Stop()
	logging.Info("Cron service stopped")
}

func (c *CronService) runCleanupTasks() error {

	tx, err := c.db.Begin()
	if err != nil {
		logging.Error("Failed to start transaction for cleanup tasks", map[string]interface{}{
			"error": err.Error(),
		})
		return err
	}
	defer tx.Rollback()

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

	if err := tx.Commit(); err != nil {
		logging.Error("Failed to commit cleanup tasks transaction", map[string]interface{}{
			"error": err.Error(),
		})
		return err
	}

	return nil
}
