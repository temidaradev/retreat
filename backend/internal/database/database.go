package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"receiptlocker/internal/config"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB initializes the database connection with connection pooling
func InitDB() (*sql.DB, error) {
	cfg := config.Load()

	// Get database URL from config
	dbURL := cfg.Database.URL
	if dbURL == "" {
		// Fallback to individual components
		dbURL = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			cfg.Database.Host,
			cfg.Database.Port,
			cfg.Database.User,
			cfg.Database.Password,
			cfg.Database.Name,
			cfg.Database.SSLMode)
	}

	// Connect to database
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	db.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.Database.ConnMaxLifetime)
	db.SetConnMaxIdleTime(cfg.Database.ConnMaxIdleTime)

	// Test connection with retry logic
	maxRetries := 5
	retryDelay := 2 * time.Second

	for i := 0; i < maxRetries; i++ {
		if err := db.Ping(); err != nil {
			if i == maxRetries-1 {
				return nil, fmt.Errorf("failed to ping database after %d retries: %w", maxRetries, err)
			}
			log.Printf("Database ping failed, retrying in %v (attempt %d/%d)", retryDelay, i+1, maxRetries)
			time.Sleep(retryDelay)
			continue
		}
		break
	}

	// Run migrations
	if err := runMigrations(db); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	DB = db
	log.Printf("Database connected successfully (max_open=%d, max_idle=%d)", cfg.Database.MaxOpenConns, cfg.Database.MaxIdleConns)
	return db, nil
}

// runMigrations creates the necessary tables
func runMigrations(db *sql.DB) error {
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		email VARCHAR(255) UNIQUE NOT NULL,
		subscription VARCHAR(20) DEFAULT 'free',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS subscriptions (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		plan VARCHAR(20) NOT NULL,
		status VARCHAR(20) DEFAULT 'active',
		current_period_start TIMESTAMP,
		current_period_end TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS receipts (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id VARCHAR(255) NOT NULL,
		store VARCHAR(255) NOT NULL,
		item VARCHAR(255) NOT NULL,
		purchase_date TIMESTAMP NOT NULL,
		warranty_expiry TIMESTAMP NOT NULL,
		amount DECIMAL(10,2) NOT NULL,
		currency VARCHAR(3) DEFAULT 'USD',
		status VARCHAR(20) DEFAULT 'active',
		original_email TEXT,
		parsed_data TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS sponsorship_verifications (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		platform VARCHAR(50) NOT NULL,
		username VARCHAR(255) NOT NULL,
		proof TEXT,
		status VARCHAR(20) DEFAULT 'pending',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
	CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
	CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
	CREATE INDEX IF NOT EXISTS idx_receipts_warranty_expiry ON receipts(warranty_expiry);
	CREATE INDEX IF NOT EXISTS idx_sponsorship_verifications_user_id ON sponsorship_verifications(user_id);
	CREATE INDEX IF NOT EXISTS idx_sponsorship_verifications_status ON sponsorship_verifications(status);
	CREATE INDEX IF NOT EXISTS idx_sponsorship_verifications_platform ON sponsorship_verifications(platform);
	`

	_, err := db.Exec(createTableSQL)
	if err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	log.Println("Database migrations completed")
	return nil
}
