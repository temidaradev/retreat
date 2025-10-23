package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB initializes the database connection
func InitDB() (*sql.DB, error) {
	// Get database URL from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Fallback to individual components
		host := os.Getenv("DB_HOST")
		if host == "" {
			host = "localhost"
		}
		port := os.Getenv("DB_PORT")
		if port == "" {
			port = "5432"
		}
		user := os.Getenv("DB_USER")
		if user == "" {
			user = "postgres"
		}
		password := os.Getenv("DB_PASSWORD")
		if password == "" {
			password = "password"
		}
		dbname := os.Getenv("DB_NAME")
		if dbname == "" {
			dbname = "receiptlocker"
		}

		dbURL = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
			host, port, user, password, dbname)
	}

	// Connect to database
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Run migrations
	if err := runMigrations(db); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	DB = db
	log.Println("Database connected successfully")
	return db, nil
}

// runMigrations creates the necessary tables
func runMigrations(db *sql.DB) error {
	createTableSQL := `
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

	CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
	CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
	CREATE INDEX IF NOT EXISTS idx_receipts_warranty_expiry ON receipts(warranty_expiry);
	`

	_, err := db.Exec(createTableSQL)
	if err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	log.Println("Database migrations completed")
	return nil
}
