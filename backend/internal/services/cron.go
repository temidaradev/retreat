package services

import (
	"database/sql"
	"log"
	"time"

	"github.com/robfig/cron/v3"
)

type CronService struct {
	db           *sql.DB
	emailService *EmailService
	cron         *cron.Cron
}

func NewCronService(db *sql.DB) *CronService {
	emailService := NewEmailService(db)
	c := cron.New(cron.WithLocation(time.UTC))

	return &CronService{
		db:           db,
		emailService: emailService,
		cron:         c,
	}
}

// Start starts the cron service
func (c *CronService) Start() {
	// Run warranty reminders daily at 9 AM UTC
	c.cron.AddFunc("0 9 * * *", func() {
		log.Println("Running daily warranty reminder check...")
		if err := c.emailService.CheckAndSendReminders(); err != nil {
			log.Printf("Failed to send warranty reminders: %v", err)
		}
	})

	// Run cleanup tasks weekly on Sunday at 2 AM UTC
	c.cron.AddFunc("0 2 * * 0", func() {
		log.Println("Running weekly cleanup tasks...")
		if err := c.runCleanupTasks(); err != nil {
			log.Printf("Failed to run cleanup tasks: %v", err)
		}
	})

	c.cron.Start()
	log.Println("Cron service started")
}

// Stop stops the cron service
func (c *CronService) Stop() {
	c.cron.Stop()
	log.Println("Cron service stopped")
}

// runCleanupTasks runs various cleanup tasks
func (c *CronService) runCleanupTasks() error {
	// Update expired warranty statuses
	query := `UPDATE receipts SET status = 'expired' WHERE warranty_expiry < NOW() AND status != 'expired'`
	result, err := c.db.Exec(query)
	if err != nil {
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	log.Printf("Updated %d receipts to expired status", rowsAffected)

	// Clean up old parsed data (keep only last 1000 records per user)
	cleanupQuery := `
		DELETE FROM receipts 
		WHERE id IN (
			SELECT id FROM (
				SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
				FROM receipts
			) t 
			WHERE rn > 1000
		)
	`
	result, err = c.db.Exec(cleanupQuery)
	if err != nil {
		return err
	}

	rowsAffected, _ = result.RowsAffected()
	log.Printf("Cleaned up %d old receipt records", rowsAffected)

	return nil
}
