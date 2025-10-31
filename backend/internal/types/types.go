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
	PhotoURL       string     `json:"photo_url,omitempty" db:"photo_url"`
	PhotoMIME      string     `json:"photo_mime,omitempty" db:"photo_mime"`
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

type InboundEmailWebhook struct {
	From        string            `json:"from"`
	To          string            `json:"to"`
	Subject     string            `json:"subject"`
	Text        string            `json:"text"`
	HTML        string            `json:"html"`
	Headers     map[string]string `json:"headers"`
	Attachments []EmailAttachment `json:"attachments"`
}

type EmailAttachment struct {
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
	Content     []byte `json:"content"`
	Size        int64  `json:"size"`
}

type ParsedReceiptData struct {
	Store          string    `json:"store"`
	Item           string    `json:"item"`
	PurchaseDate   time.Time `json:"purchase_date"`
	WarrantyExpiry time.Time `json:"warranty_expiry"`
	Amount         float64   `json:"amount"`
	Currency       string    `json:"currency"`
	Confidence     float64   `json:"confidence"`
	Source         string    `json:"source"`
}

type UserEmail struct {
	ID                    string     `json:"id" db:"id"`
	UserID                string     `json:"user_id" db:"user_id"`
	Email                 string     `json:"email" db:"email"`
	Verified              bool       `json:"verified" db:"verified"`
	IsPrimary             bool       `json:"is_primary" db:"is_primary"`
	VerificationToken     *string    `json:"-" db:"verification_token"`
	VerificationExpiresAt *time.Time `json:"-" db:"verification_expires_at"`
	CreatedAt             time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at" db:"updated_at"`
}

type AddEmailRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type VerifyEmailRequest struct {
	Token string `json:"token" validate:"required"`
}
