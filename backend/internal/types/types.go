package types

import (
	"time"
)

type Receipt struct {
	ID             string     `json:"id" db:"id"`
	UserID         string     `json:"user_id" db:"user_id"`
	Store          string     `json:"store" db:"store"`
	Item           string     `json:"item" db:"item"`
	PurchaseDate   time.Time  `json:"purchase_date" db:"purchase_date"`
	WarrantyExpiry time.Time  `json:"warranty_expiry" db:"warranty_expiry"`
	Amount         float64    `json:"amount" db:"amount"`
	Currency       string     `json:"currency" db:"currency"`
	Status         string     `json:"status" db:"status"`
	OriginalEmail  string     `json:"original_email" db:"original_email"`
	ParsedData     string     `json:"parsed_data" db:"parsed_data"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
}

type User struct {
	ID           string    `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	Subscription string    `json:"subscription" db:"subscription"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type Subscription struct {
	ID                 string    `json:"id" db:"id"`
	UserID             string    `json:"user_id" db:"user_id"`
	Plan               string    `json:"plan" db:"plan"`
	Status             string    `json:"status" db:"status"`
	CurrentPeriodStart time.Time `json:"current_period_start" db:"current_period_start"`
	CurrentPeriodEnd   time.Time `json:"current_period_end" db:"current_period_end"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

type SponsorshipVerificationRequest struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Platform  string    `json:"platform" db:"platform"`
	Username  string    `json:"username" db:"username"`
	Proof     string    `json:"proof" db:"proof"`
	Status    string    `json:"status" db:"status"`
	Reason    string    `json:"reason" db:"reason"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type ReceiptInfo struct {
	Store          string
	Item           string
	WarrantyExpiry time.Time
	UserEmail      string
}

type CreateReceiptRequest struct {
	Store          string  `json:"store" validate:"required"`
	Item           string  `json:"item" validate:"required"`
	PurchaseDate   string  `json:"purchase_date" validate:"required"`
	WarrantyExpiry string  `json:"warranty_expiry" validate:"required"`
	Amount         float64 `json:"amount" validate:"required"`
	Currency       string  `json:"currency"`
	OriginalEmail  string  `json:"original_email"`
}

type ParseEmailRequest struct {
	EmailContent string `json:"email_content" validate:"required"`
}

type ParsedEmailData struct {
	Store          string  `json:"store"`
	Item           string  `json:"item"`
	PurchaseDate   string  `json:"purchase_date"`
	WarrantyExpiry string  `json:"warranty_expiry"`
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	Confidence     float64 `json:"confidence"`
}

type ParsePDFRequest struct {
	PDFContent string `json:"pdf_content" validate:"required"`
}

type ParsedPDFData struct {
	Store          string  `json:"store"`
	Item           string  `json:"item"`
	PurchaseDate   string  `json:"purchase_date"`
	WarrantyExpiry string  `json:"warranty_expiry"`
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	Confidence     float64 `json:"confidence"`
}

type CreateSubscriptionRequest struct {
	Plan string `json:"plan" validate:"required"`
}

type SponsorshipInfo struct {
	Benefits  []string `json:"benefits"`
	Platforms []struct {
		ID           string `json:"id"`
		Name         string `json:"name"`
		Description  string `json:"description"`
		Instructions string `json:"instructions"`
	} `json:"platforms"`
}

type SponsorshipStatus struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

type SponsorshipVerificationRequestPayload struct {
	Platform string `json:"platform" validate:"required"`
	Username string `json:"username" validate:"required"`
	Proof    string `json:"proof"`
}
