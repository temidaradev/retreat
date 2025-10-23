package models

import (
	"time"
)

// Receipt represents a receipt/warranty record
type Receipt struct {
	ID              string    `json:"id" db:"id"`
	UserID          string    `json:"user_id" db:"user_id"`
	Store           string    `json:"store" db:"store"`
	Item            string    `json:"item" db:"item"`
	PurchaseDate    time.Time `json:"purchase_date" db:"purchase_date"`
	WarrantyExpiry  time.Time `json:"warranty_expiry" db:"warranty_expiry"`
	Amount          float64   `json:"amount" db:"amount"`
	Currency        string    `json:"currency" db:"currency"`
	Status          string    `json:"status" db:"status"` // active, expiring, expired
	OriginalEmail   string    `json:"original_email" db:"original_email"`
	ParsedData      string    `json:"parsed_data" db:"parsed_data"` // JSON string of extracted data
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// CreateReceiptRequest represents the request to create a new receipt
type CreateReceiptRequest struct {
	Store          string  `json:"store" binding:"required"`
	Item           string  `json:"item" binding:"required"`
	PurchaseDate   string  `json:"purchase_date" binding:"required"`
	WarrantyExpiry string  `json:"warranty_expiry" binding:"required"`
	Amount         float64 `json:"amount" binding:"required"`
	Currency       string  `json:"currency"`
	OriginalEmail  string  `json:"original_email"`
}

// ParseEmailRequest represents the request to parse an email
type ParseEmailRequest struct {
	EmailContent string `json:"email_content" binding:"required"`
}

// ParsedEmailData represents the extracted data from an email
type ParsedEmailData struct {
	Store          string  `json:"store"`
	Item           string  `json:"item"`
	PurchaseDate   string  `json:"purchase_date"`
	WarrantyExpiry string  `json:"warranty_expiry"`
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	Confidence     float64 `json:"confidence"` // 0-1 confidence score
}
