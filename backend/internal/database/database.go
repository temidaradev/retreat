package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"receiptlocker/internal/config"
	"receiptlocker/internal/logging"

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
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		if err := db.PingContext(ctx); err != nil {
			cancel()
			if i == maxRetries-1 {
				return nil, fmt.Errorf("failed to ping database after %d retries: %w", maxRetries, err)
			}
			logging.Warn("Database ping failed, retrying", map[string]interface{}{
				"attempt":     i + 1,
				"max_retries": maxRetries,
				"retry_delay": retryDelay.String(),
				"error":       err.Error(),
			})
			time.Sleep(retryDelay)
			continue
		}
		cancel()
		break
	}

	// Run migrations
	if err := runMigrations(db); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	DB = db
	logging.Info("Database connected successfully", map[string]interface{}{
		"max_open_conns": cfg.Database.MaxOpenConns,
		"max_idle_conns": cfg.Database.MaxIdleConns,
	})
	return db, nil
}

// runMigrations creates the necessary tables
func runMigrations(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

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
		deleted_at TIMESTAMP,
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

	_, err := db.ExecContext(ctx, createTableSQL)
	if err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	// Run additional migrations for existing databases
	alterTableSQL := `
	-- Add deleted_at column if it doesn't exist (for existing databases)
	DO $$ 
	BEGIN 
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
					   WHERE table_name = 'receipts' AND column_name = 'deleted_at') THEN
			ALTER TABLE receipts ADD COLUMN deleted_at TIMESTAMP;
		END IF;
	END $$;
	
	-- Create index on deleted_at (will succeed whether column existed before or was just added)
	CREATE INDEX IF NOT EXISTS idx_receipts_deleted_at ON receipts(deleted_at);
	
	-- Add bmc_username column to users table for Buy Me a Coffee integration
	DO $$
	BEGIN
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
					   WHERE table_name = 'users' AND column_name = 'bmc_username') THEN
			ALTER TABLE users ADD COLUMN bmc_username VARCHAR(255);
		END IF;
	END $$;
	
	-- Create index on bmc_username
	CREATE INDEX IF NOT EXISTS idx_users_bmc_username ON users(bmc_username);
	
	-- Update subscriptions table to support Clerk user IDs (VARCHAR) in addition to UUID
	-- This allows subscriptions to work with the same user_id format as receipts
	DO $$
	BEGIN
		-- Check if user_id column already supports VARCHAR (for Clerk IDs)
		-- If subscriptions.user_id is UUID and we need to support Clerk IDs,
		-- we'll create a separate column or modify the approach
		-- For now, we'll create subscriptions that work directly with Clerk user IDs
		-- by ensuring the user_id field can handle VARCHAR(255)
		IF EXISTS (
			SELECT 1 FROM information_schema.columns 
			WHERE table_name = 'subscriptions' 
			AND column_name = 'user_id' 
			AND data_type = 'uuid'
		) THEN
			-- Note: Cannot directly change UUID to VARCHAR, so we'll handle this
			-- by matching receipts.user_id (which stores Clerk IDs) directly
			-- In the sync function, we'll update/create subscriptions using Clerk IDs
		END IF;
	END $$;
	
	-- Create a linking table to map Clerk user IDs to subscriptions
	-- This allows us to handle both UUID-based users and Clerk ID-based receipts
	CREATE TABLE IF NOT EXISTS user_clerk_mapping (
		clerk_user_id VARCHAR(255) PRIMARY KEY,
		user_uuid UUID REFERENCES users(id) ON DELETE SET NULL,
		bmc_username VARCHAR(255),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	
	CREATE INDEX IF NOT EXISTS idx_user_clerk_mapping_bmc_username ON user_clerk_mapping(bmc_username);
	
	-- Create unique index on LOWER(bmc_username) to prevent duplicate username links (case-insensitive)
	-- This ensures only one user can link to a specific BMC username
	DO $$
	BEGIN
		IF NOT EXISTS (
			SELECT 1 FROM pg_indexes 
			WHERE indexname = 'idx_user_clerk_mapping_bmc_username_unique' 
			AND tablename = 'user_clerk_mapping'
		) THEN
			CREATE UNIQUE INDEX idx_user_clerk_mapping_bmc_username_unique 
			ON user_clerk_mapping(LOWER(bmc_username)) 
			WHERE bmc_username IS NOT NULL;
		END IF;
	END $$;
	
	-- Add clerk_user_id column to subscriptions to support Clerk authentication
	DO $$
	BEGIN
		IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
					   WHERE table_name = 'subscriptions' AND column_name = 'clerk_user_id') THEN
			ALTER TABLE subscriptions ADD COLUMN clerk_user_id VARCHAR(255);
		END IF;
	END $$;
	
	CREATE INDEX IF NOT EXISTS idx_subscriptions_clerk_user_id ON subscriptions(clerk_user_id);
	`

	_, err = db.ExecContext(ctx, alterTableSQL)
	if err != nil {
		logging.Warn("Failed to run alter table migrations", map[string]interface{}{
			"error": err.Error(),
		})
	}

	logging.Info("Database migrations completed successfully")
	return nil
}
