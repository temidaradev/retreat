package handlers

import (
	"bytes"
	"database/sql"
	"encoding/base64"
	"fmt"
	"io"
	"mime/multipart"
	"regexp"
	"strconv"
	"strings"
	"time"

	"receiptlocker/internal/logging"
	"receiptlocker/internal/models"
	"receiptlocker/internal/services"
	"receiptlocker/internal/types"
	"receiptlocker/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/ledongthuc/pdf"
)

type ReceiptHandler struct {
	db     *sql.DB
	parser *services.EmailParserService
}

func NewReceiptHandler(db *sql.DB) *ReceiptHandler {
	return &ReceiptHandler{db: db, parser: services.NewEmailParserService(db, nil)}
}

func (h *ReceiptHandler) GetReceipts(c *fiber.Ctx) error {

	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found"})
	}

	query := `
		SELECT id, user_id, store, item, purchase_date, warranty_expiry, 
		       amount, currency, status, original_email, parsed_data,
		       photo_url, photo_mime, created_at, updated_at
		FROM receipts 
		WHERE user_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch receipts"})
	}
	defer rows.Close()

	receipts := []models.Receipt{}
	for rows.Next() {
		var receipt models.Receipt
		var parsedData sql.NullString
		var photoURL sql.NullString
		var photoMIME sql.NullString

		err := rows.Scan(
			&receipt.ID, &receipt.UserID, &receipt.Store, &receipt.Item,
			&receipt.PurchaseDate, &receipt.WarrantyExpiry, &receipt.Amount,
			&receipt.Currency, &receipt.Status, &receipt.OriginalEmail,
			&parsedData, &photoURL, &photoMIME, &receipt.CreatedAt, &receipt.UpdatedAt,
		)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to scan receipt"})
		}

		if parsedData.Valid {
			receipt.ParsedData = parsedData.String
		}

		if photoURL.Valid {
			receipt.PhotoURL = photoURL.String
		}
		if photoMIME.Valid {
			receipt.PhotoMIME = photoMIME.String
		}

		receipt.Status = h.calculateStatus(receipt.WarrantyExpiry)

		receipts = append(receipts, receipt)
	}

	return c.JSON(fiber.Map{"receipts": receipts})
}

func (h *ReceiptHandler) GetReceipt(c *fiber.Ctx) error {
	id := c.Params("id")
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found"})
	}

	query := `
		SELECT id, user_id, store, item, purchase_date, warranty_expiry, 
		       amount, currency, status, original_email, parsed_data,
		       photo_url, photo_mime, created_at, updated_at
		FROM receipts 
		WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
	`

	var receipt models.Receipt
	var parsedData sql.NullString

	var photoURL sql.NullString
	var photoMIME sql.NullString
	err := h.db.QueryRow(query, id, userID).Scan(
		&receipt.ID, &receipt.UserID, &receipt.Store, &receipt.Item,
		&receipt.PurchaseDate, &receipt.WarrantyExpiry, &receipt.Amount,
		&receipt.Currency, &receipt.Status, &receipt.OriginalEmail,
		&parsedData, &photoURL, &photoMIME, &receipt.CreatedAt, &receipt.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Receipt not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch receipt"})
	}

	if parsedData.Valid {
		receipt.ParsedData = parsedData.String
	}

	if photoURL.Valid {
		receipt.PhotoURL = photoURL.String
	}
	if photoMIME.Valid {
		receipt.PhotoMIME = photoMIME.String
	}

	receipt.Status = h.calculateStatus(receipt.WarrantyExpiry)

	return c.JSON(receipt)
}

func (h *ReceiptHandler) CreateReceipt(c *fiber.Ctx) error {
	contentType := c.Get("Content-Type")

	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found"})
	}

	if !strings.Contains(strings.ToLower(contentType), "multipart/form-data") {
		var req models.CreateReceiptRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		purchaseDate, err := time.Parse("2006-01-02", req.PurchaseDate)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid purchase date format"})
		}
		warrantyExpiry, err := time.Parse("2006-01-02", req.WarrantyExpiry)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid warranty expiry format"})
		}
		if req.Currency == "" {
			req.Currency = "USD"
		}

		tx, err := h.db.Begin()
		if err != nil {
			logging.Error("Failed to start transaction for receipt creation", map[string]interface{}{"error": err.Error(), "user_id": userID})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create receipt"})
		}
		defer tx.Rollback()

		atLimit, err := h.checkReceiptLimitInTx(tx, userID)
		if err != nil {
			logging.Error("Failed to check receipt limit in transaction", map[string]interface{}{"error": err.Error(), "user_id": userID})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check receipt limit"})
		}
		if atLimit {
			var sponsorshipStatus string
			sponsorCheckQuery := `
                SELECT status FROM subscriptions 
                WHERE (clerk_user_id = $1 OR user_id::text = $1) AND status = 'active'
                ORDER BY created_at DESC LIMIT 1
            `
			err := tx.QueryRow(sponsorCheckQuery, userID).Scan(&sponsorshipStatus)
			isSponsor := err == nil && sponsorshipStatus == "active"
			if isSponsor {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Sponsor receipt limit reached (50 receipts). Please delete some receipts to add more.", "sponsorship_required": false, "current_limit": 50})
			}
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Free tier receipt limit reached (5 receipts). Become a sponsor to get up to 50 receipts!", "sponsorship_required": true, "current_limit": 5})
		}

		query := `
            INSERT INTO receipts (user_id, store, item, purchase_date, warranty_expiry, 
                                 amount, currency, original_email)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, created_at, updated_at
        `
		var id string
		var createdAt, updatedAt time.Time
		err = tx.QueryRow(query, userID, req.Store, req.Item, purchaseDate, warrantyExpiry, req.Amount, req.Currency, req.OriginalEmail).Scan(&id, &createdAt, &updatedAt)
		if err != nil {
			logging.Error("Failed to insert receipt in transaction", map[string]interface{}{"error": err.Error(), "user_id": userID})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create receipt"})
		}
		if err := tx.Commit(); err != nil {
			logging.Error("Failed to commit receipt creation transaction", map[string]interface{}{"error": err.Error(), "user_id": userID})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create receipt"})
		}

		receipt := models.Receipt{ID: id, UserID: userID, Store: req.Store, Item: req.Item, PurchaseDate: purchaseDate, WarrantyExpiry: warrantyExpiry, Amount: req.Amount, Currency: req.Currency, Status: h.calculateStatus(warrantyExpiry), OriginalEmail: req.OriginalEmail, CreatedAt: createdAt, UpdatedAt: updatedAt}
		return c.Status(fiber.StatusCreated).JSON(receipt)
	}

	var req models.CreateReceiptRequest
	req.Store = c.FormValue("store")
	req.Item = c.FormValue("item")
	req.PurchaseDate = c.FormValue("purchase_date")
	req.WarrantyExpiry = c.FormValue("warranty_expiry")
	amountStr := c.FormValue("amount")
	if amountStr != "" {
		if v, err := strconv.ParseFloat(amountStr, 64); err == nil {
			req.Amount = v
		} else {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid amount"})
		}
	}
	req.Currency = c.FormValue("currency")
	req.OriginalEmail = c.FormValue("original_email")
	if req.Currency == "" {
		req.Currency = "USD"
	}

	purchaseDate, err := time.Parse("2006-01-02", req.PurchaseDate)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid purchase date format"})
	}
	warrantyExpiry, err := time.Parse("2006-01-02", req.WarrantyExpiry)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid warranty expiry format"})
	}

	var photoURL, photoMIME string
	var fileHeader *multipart.FileHeader
	fileHeader, err = c.FormFile("photo")
	if err == nil && fileHeader != nil {

		if fileHeader.Size > 5*1024*1024 {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{"error": "File too large (max 5MB)"})
		}

	}

	tx, err := h.db.Begin()
	if err != nil {
		logging.Error("Failed to start transaction for receipt creation", map[string]interface{}{"error": err.Error(), "user_id": userID})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create receipt"})
	}
	defer tx.Rollback()

	atLimit, err := h.checkReceiptLimitInTx(tx, userID)
	if err != nil {
		logging.Error("Failed to check receipt limit in transaction", map[string]interface{}{"error": err.Error(), "user_id": userID})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check receipt limit"})
	}
	if atLimit {
		var sponsorshipStatus string
		sponsorCheckQuery := `
            SELECT status FROM subscriptions 
            WHERE (clerk_user_id = $1 OR user_id::text = $1) AND status = 'active'
            ORDER BY created_at DESC LIMIT 1
        `
		err := tx.QueryRow(sponsorCheckQuery, userID).Scan(&sponsorshipStatus)
		isSponsor := err == nil && sponsorshipStatus == "active"
		if isSponsor {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Sponsor receipt limit reached (50 receipts). Please delete some receipts to add more.", "sponsorship_required": false, "current_limit": 50})
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Free tier receipt limit reached (5 receipts). Become a sponsor to get up to 50 receipts!", "sponsorship_required": true, "current_limit": 5})
	}

	insertQuery := `
        INSERT INTO receipts (user_id, store, item, purchase_date, warranty_expiry, amount, currency, original_email)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at, updated_at
    `
	var id string
	var createdAt, updatedAt time.Time
	if err := tx.QueryRow(insertQuery, userID, req.Store, req.Item, purchaseDate, warrantyExpiry, req.Amount, req.Currency, req.OriginalEmail).Scan(&id, &createdAt, &updatedAt); err != nil {
		logging.Error("Failed to insert receipt in transaction", map[string]interface{}{"error": err.Error(), "user_id": userID})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create receipt"})
	}

	if fileHeader != nil {
		f, _ := fileHeader.Open()
		defer f.Close()
		url, mimeType, saveErr := utils.SavePhoto(userID, id, fileHeader.Header.Get("Content-Type"), f)
		if saveErr != nil {
			msg := saveErr.Error()
			if strings.Contains(msg, "too large") {
				return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{"error": "File too large (max 5MB)"})
			}
			if strings.Contains(msg, "unsupported media type") {
				return c.Status(fiber.StatusUnsupportedMediaType).JSON(fiber.Map{"error": "Unsupported image type. Allowed: JPEG, PNG, WEBP"})
			}
			logging.Error("Failed to save photo (post-insert)", map[string]interface{}{"error": saveErr.Error(), "user_id": userID, "receipt_id": id})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save photo"})
		}
		photoURL = url
		photoMIME = mimeType
		if _, err := tx.Exec(`UPDATE receipts SET photo_url = $1, photo_mime = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4`, photoURL, photoMIME, id, userID); err != nil {
			logging.Error("Failed to update receipt photo columns", map[string]interface{}{"error": err.Error(), "user_id": userID, "receipt_id": id})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save photo"})
		}
	}

	if err := tx.Commit(); err != nil {
		logging.Error("Failed to commit receipt creation transaction", map[string]interface{}{"error": err.Error(), "user_id": userID})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create receipt"})
	}

	receipt := models.Receipt{ID: id, UserID: userID, Store: req.Store, Item: req.Item, PurchaseDate: purchaseDate, WarrantyExpiry: warrantyExpiry, Amount: req.Amount, Currency: req.Currency, Status: h.calculateStatus(warrantyExpiry), OriginalEmail: req.OriginalEmail, PhotoURL: photoURL, PhotoMIME: photoMIME, CreatedAt: createdAt, UpdatedAt: updatedAt}
	return c.Status(fiber.StatusCreated).JSON(receipt)
}

func (h *ReceiptHandler) UpdateReceipt(c *fiber.Ctx) error {
	id := c.Params("id")
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found"})
	}

	if !utils.ValidateUUID(id) {
		logging.Warn("Update receipt attempt with invalid UUID", map[string]interface{}{
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid receipt ID",
			"message": "The receipt ID must be a valid UUID",
		})
	}

	var req models.CreateReceiptRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	purchaseDate, err := time.Parse("2006-01-02", req.PurchaseDate)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid purchase date format"})
	}

	warrantyExpiry, err := time.Parse("2006-01-02", req.WarrantyExpiry)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid warranty expiry format"})
	}

	if req.Currency == "" {
		req.Currency = "USD"
	}

	tx, err := h.db.Begin()
	if err != nil {
		logging.Error("Failed to start transaction for receipt update", map[string]interface{}{
			"error":      err.Error(),
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update receipt"})
	}
	defer tx.Rollback()

	var existingUserID string
	var deletedAt sql.NullTime
	checkQuery := `SELECT user_id, deleted_at FROM receipts WHERE id = $1`
	err = tx.QueryRow(checkQuery, id).Scan(&existingUserID, &deletedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Receipt not found"})
		}
		logging.Error("Failed to check receipt existence", map[string]interface{}{
			"error":      err.Error(),
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update receipt"})
	}

	if deletedAt.Valid {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Receipt not found"})
	}

	if existingUserID != userID {
		logging.Warn("Update receipt attempt for unauthorized receipt", map[string]interface{}{
			"receipt_id":    id,
			"user_id":       userID,
			"receipt_owner": existingUserID,
		})
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Access denied"})
	}

	query := `
		UPDATE receipts 
		SET store = $1, item = $2, purchase_date = $3, warranty_expiry = $4,
		    amount = $5, currency = $6, original_email = $7, updated_at = CURRENT_TIMESTAMP
		WHERE id = $8 AND user_id = $9 AND deleted_at IS NULL
		RETURNING updated_at
	`

	var updatedAt time.Time
	err = tx.QueryRow(query, req.Store, req.Item, purchaseDate, warrantyExpiry,
		req.Amount, req.Currency, req.OriginalEmail, id, userID).Scan(&updatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Receipt not found"})
		}
		logging.Error("Failed to update receipt in transaction", map[string]interface{}{
			"error":      err.Error(),
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update receipt"})
	}

	if err := tx.Commit(); err != nil {
		logging.Error("Failed to commit receipt update transaction", map[string]interface{}{
			"error":      err.Error(),
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update receipt"})
	}

	receipt := models.Receipt{
		ID:             id,
		UserID:         userID,
		Store:          req.Store,
		Item:           req.Item,
		PurchaseDate:   purchaseDate,
		WarrantyExpiry: warrantyExpiry,
		Amount:         req.Amount,
		Currency:       req.Currency,
		Status:         h.calculateStatus(warrantyExpiry),
		OriginalEmail:  req.OriginalEmail,
		UpdatedAt:      updatedAt,
	}

	return c.JSON(receipt)
}

func (h *ReceiptHandler) DeleteReceipt(c *fiber.Ctx) error {
	id := c.Params("id")
	userID := c.Locals("userID").(string)

	if userID == "" {
		logging.Warn("Delete receipt attempt without authentication", map[string]interface{}{
			"receipt_id": id,
			"ip":         c.IP(),
		})
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Authentication required",
			"message": "You must be authenticated to delete a receipt",
		})
	}

	if !utils.ValidateUUID(id) {
		logging.Warn("Delete receipt attempt with invalid UUID", map[string]interface{}{
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid receipt ID",
			"message": "The receipt ID must be a valid UUID",
		})
	}

	tx, err := h.db.Begin()
	if err != nil {
		logging.Error("Failed to start transaction for receipt deletion", map[string]interface{}{
			"error":      err.Error(),
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database transaction error",
			"message": "Failed to initiate delete operation",
		})
	}
	defer tx.Rollback()

	var existingUserID string
	var deletedAt sql.NullTime
	checkQuery := `SELECT user_id, deleted_at FROM receipts WHERE id = $1`
	err = tx.QueryRow(checkQuery, id).Scan(&existingUserID, &deletedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			logging.Warn("Delete receipt attempt for non-existent receipt", map[string]interface{}{
				"receipt_id": id,
				"user_id":    userID,
			})
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Receipt not found",
				"message": "The receipt you are trying to delete does not exist",
			})
		}
		logging.Error("Failed to check receipt existence", map[string]interface{}{
			"error":      err.Error(),
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database query error",
			"message": "Failed to verify receipt",
		})
	}

	if deletedAt.Valid {
		logging.Warn("Delete receipt attempt for already deleted receipt", map[string]interface{}{
			"receipt_id": id,
			"user_id":    userID,
			"deleted_at": deletedAt.Time,
		})
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   "Receipt not found",
			"message": "The receipt has already been deleted",
		})
	}

	if existingUserID != userID {
		logging.Warn("Delete receipt attempt for unauthorized receipt", map[string]interface{}{
			"receipt_id":    id,
			"user_id":       userID,
			"receipt_owner": existingUserID,
		})
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Access denied",
			"message": "You do not have permission to delete this receipt",
		})
	}

	deleteQuery := `
		UPDATE receipts 
		SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
	`
	result, err := tx.Exec(deleteQuery, id, userID)
	if err != nil {
		logging.Error("Failed to soft delete receipt", map[string]interface{}{
			"error":      err.Error(),
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database update error",
			"message": "Failed to delete receipt",
		})
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		logging.Error("Failed to get rows affected", map[string]interface{}{
			"error":      err.Error(),
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database verification error",
			"message": "Failed to confirm deletion",
		})
	}

	if rowsAffected == 0 {

		logging.Error("No rows affected during receipt deletion", map[string]interface{}{
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Deletion failed",
			"message": "Receipt could not be deleted",
		})
	}

	if err := tx.Commit(); err != nil {
		logging.Error("Failed to commit receipt deletion transaction", map[string]interface{}{
			"error":      err.Error(),
			"receipt_id": id,
			"user_id":    userID,
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Transaction commit error",
			"message": "Failed to finalize deletion",
		})
	}

	logging.Info("Receipt successfully deleted", map[string]interface{}{
		"receipt_id":  id,
		"user_id":     userID,
		"timestamp":   time.Now().UTC(),
		"soft_delete": true,
	})

	return c.JSON(fiber.Map{
		"message":    "Receipt deleted successfully",
		"receipt_id": id,
		"note":       "Receipt will be permanently removed after 30 days",
	})
}

func (h *ReceiptHandler) UploadReceiptPhoto(c *fiber.Ctx) error {
	id := c.Params("id")
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	if !utils.ValidateUUID(id) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid receipt ID"})
	}

	var owner string
	var deletedAt sql.NullTime
	if err := h.db.QueryRow(`SELECT user_id, deleted_at FROM receipts WHERE id = $1`, id).Scan(&owner, &deletedAt); err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Receipt not found"})
		}
		logging.Error("Failed to check receipt for photo upload", map[string]interface{}{"error": err.Error(), "user_id": userID, "receipt_id": id})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify receipt"})
	}
	if deletedAt.Valid {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Receipt not found"})
	}
	if owner != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Access denied"})
	}

	fileHeader, err := c.FormFile("photo")
	if err != nil || fileHeader == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing photo file"})
	}
	if fileHeader.Size > 5*1024*1024 {
		return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{"error": "File too large (max 5MB)"})
	}
	f, err := fileHeader.Open()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to read uploaded file"})
	}
	defer f.Close()

	url, mimeType, saveErr := utils.SavePhoto(userID, id, fileHeader.Header.Get("Content-Type"), f)
	if saveErr != nil {
		msg := saveErr.Error()
		if strings.Contains(msg, "too large") {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{"error": "File too large (max 5MB)"})
		}
		if strings.Contains(msg, "unsupported media type") {
			return c.Status(fiber.StatusUnsupportedMediaType).JSON(fiber.Map{"error": "Unsupported image type. Allowed: JPEG, PNG, WEBP"})
		}
		logging.Error("Failed to save photo (upload endpoint)", map[string]interface{}{"error": saveErr.Error(), "user_id": userID, "receipt_id": id})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save photo"})
	}

	if _, err := h.db.Exec(`UPDATE receipts SET photo_url = $1, photo_mime = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4`, url, mimeType, id, userID); err != nil {
		logging.Error("Failed to update photo columns", map[string]interface{}{"error": err.Error(), "user_id": userID, "receipt_id": id})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update receipt"})
	}

	return c.JSON(fiber.Map{"message": "Photo uploaded", "photo_url": url})
}

func (h *ReceiptHandler) ParseEmail(c *fiber.Ctx) error {
	var req models.ParseEmailRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	parsedData := h.parseEmailContent(req.EmailContent)

	return c.JSON(fiber.Map{"parsed_data": parsedData})
}

func (h *ReceiptHandler) ParsePDF(c *fiber.Ctx) error {
	var req models.ParsePDFRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	pdfBytes, err := base64.StdEncoding.DecodeString(req.PDFContent)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid PDF content"})
	}

	pdfText, err := h.extractTextFromPDF(bytes.NewReader(pdfBytes))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to extract text from PDF"})
	}

	parsedData := h.parsePDFContent(pdfText)

	return c.JSON(fiber.Map{"parsed_data": parsedData})
}

func (h *ReceiptHandler) ParseLink(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var payload struct {
		Link string `json:"link"`
	}
	if err := c.BodyParser(&payload); err != nil || strings.TrimSpace(payload.Link) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid link payload"})
	}

	emailLike := &types.InboundEmailWebhook{From: "", Text: payload.Link}
	parsed, err := h.parser.ParseReceiptEmail(emailLike)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	receiptID, err := h.parser.CreateReceiptFromParsedData(userID, parsed, payload.Link)
	if err != nil {
		logging.Error("Failed to create receipt from link", map[string]interface{}{"error": err.Error()})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create receipt"})
	}

	return c.JSON(fiber.Map{"receipt_id": receiptID})
}

func (h *ReceiptHandler) extractTextFromPDF(pdfReader io.Reader) (string, error) {

	pdfBytes, err := io.ReadAll(pdfReader)
	if err != nil {
		return "", fmt.Errorf("failed to read PDF: %v", err)
	}

	reader := bytes.NewReader(pdfBytes)
	pdfReaderObj, err := pdf.NewReader(reader, int64(len(pdfBytes)))
	if err != nil {
		return "", fmt.Errorf("failed to create PDF reader: %v", err)
	}

	var text strings.Builder

	for i := 1; i <= pdfReaderObj.NumPage(); i++ {
		page := pdfReaderObj.Page(i)
		if page.V.IsNull() {
			continue
		}

		content, _ := page.GetPlainText(nil)
		text.WriteString(content)
		text.WriteString("\n")
	}

	return text.String(), nil
}

func (h *ReceiptHandler) parsePDFContent(pdfText string) models.ParsedPDFData {

	fmt.Printf("\n=== DEBUG: PDF Text Extraction ===\n")
	fmt.Printf("Extracted text length: %d\n", len(pdfText))
	fmt.Printf("First 500 chars:\n%s\n", pdfText[:min(500, len(pdfText))])
	fmt.Printf("=================================\n\n")

	var parsed models.ParsedPDFData
	parsed.Currency = "USD"
	parsed.Confidence = 0.8

	if idx := strings.Index(strings.ToUpper(pdfText), "RECEIPT"); idx != -1 {
		storePart := pdfText[:idx]

		storePart = strings.Split(storePart, "(")[0]
		storePart = strings.Split(storePart, ",")[0]

		words := strings.Fields(storePart)
		if len(words) > 0 {

			for _, word := range words {

				if _, err := strconv.Atoi(word); err != nil {
					parsed.Store = word
					fmt.Printf("DEBUG: Found store name: '%s'\n", parsed.Store)
					break
				}
			}
		}
	}

	if parsed.Store == "" {
		storePatterns := []string{"merchant:", "vendor:", "from:"}
		for _, pattern := range storePatterns {
			if idx := strings.Index(strings.ToLower(pdfText), pattern); idx != -1 {
				afterPattern := pdfText[idx+len(pattern):]
				words := strings.Fields(afterPattern)
				if len(words) > 0 {
					parsed.Store = words[0]
					break
				}
			}
		}
	}

	totalPattern := `TOTAL:\s*\$([0-9,]+\.?[0-9]{0,2})`
	if matches := regexp.MustCompile(totalPattern).FindStringSubmatch(pdfText); len(matches) > 1 {
		amountStr := strings.ReplaceAll(matches[1], ",", "")
		if amount, err := strconv.ParseFloat(amountStr, 64); err == nil {
			parsed.Amount = amount
			fmt.Printf("DEBUG: Found TOTAL amount: $%.2f\n", amount)
		}
	}

	if parsed.Amount == 0 {
		amountKeywords := []string{"total", "amount", "price"}
		for _, keyword := range amountKeywords {
			if idx := strings.Index(strings.ToLower(pdfText), keyword); idx != -1 {
				afterKeyword := pdfText[idx:]
				dollarPattern := `\$([0-9,]+\.?[0-9]{0,2})`
				if matches := regexp.MustCompile(dollarPattern).FindStringSubmatch(afterKeyword); len(matches) > 1 {
					amountStr := strings.ReplaceAll(matches[1], ",", "")
					if amount, err := strconv.ParseFloat(amountStr, 64); err == nil {
						parsed.Amount = amount
						break
					}
				}
			}
		}
	}

	if priceIdx := strings.Index(pdfText, "PRICE"); priceIdx != -1 {
		afterPrice := pdfText[priceIdx+5:]
		if dollarIdx := strings.Index(afterPrice, "$"); dollarIdx != -1 {
			itemText := strings.TrimSpace(afterPrice[:dollarIdx])

			itemText = strings.ReplaceAll(itemText, "ITEM DESCRIPTION", "")
			itemText = strings.TrimSpace(itemText)
			if len(itemText) > 0 && len(itemText) < 200 {
				parsed.Item = itemText
				fmt.Printf("DEBUG: Found item: '%s'\n", parsed.Item)
			}
		}
	}

	if parsed.Item == "" {
		itemPatterns := []string{"item:", "product:", "description:", "purchased:"}
		for _, pattern := range itemPatterns {
			if idx := strings.Index(strings.ToLower(pdfText), pattern); idx != -1 {
				afterPattern := pdfText[idx+len(pattern):]

				words := []string{}
				for _, word := range strings.Fields(afterPattern) {
					if strings.Contains(word, "$") || len(words) > 10 {
						break
					}
					words = append(words, word)
				}
				if len(words) > 0 {
					parsed.Item = strings.Join(words, " ")
					break
				}
			}
		}
	}

	purchaseDatePattern := `Purchase Date:\s*(\d{1,2})/(\d{1,2})/(\d{4})`
	if matches := regexp.MustCompile(purchaseDatePattern).FindStringSubmatch(pdfText); len(matches) > 3 {
		month := matches[1]
		day := matches[2]
		year := matches[3]
		if len(month) == 1 {
			month = "0" + month
		}
		if len(day) == 1 {
			day = "0" + day
		}
		parsed.PurchaseDate = fmt.Sprintf("%s-%s-%s", year, month, day)
		fmt.Printf("DEBUG: Found purchase date: %s\n", parsed.PurchaseDate)
	}

	if parsed.PurchaseDate == "" {
		if idx := strings.Index(pdfText, "Date:"); idx != -1 {
			afterDate := pdfText[idx+5:]

			datePattern := `(\d{1,2})/(\d{1,2})/(\d{4})`
			if matches := regexp.MustCompile(datePattern).FindStringSubmatch(afterDate); len(matches) > 3 {
				month := matches[1]
				day := matches[2]
				year := matches[3]
				if len(month) == 1 {
					month = "0" + month
				}
				if len(day) == 1 {
					day = "0" + day
				}
				parsed.PurchaseDate = fmt.Sprintf("%s-%s-%s", year, month, day)
			}
		}
	}

	warrantyPattern := `Warranty Expires:\s*(\d{1,2})/(\d{1,2})/(\d{4})`
	if matches := regexp.MustCompile(warrantyPattern).FindStringSubmatch(pdfText); len(matches) > 3 {
		month := matches[1]
		day := matches[2]
		year := matches[3]
		if len(month) == 1 {
			month = "0" + month
		}
		if len(day) == 1 {
			day = "0" + day
		}
		parsed.WarrantyExpiry = fmt.Sprintf("%s-%s-%s", year, month, day)
		fmt.Printf("DEBUG: Found warranty expiry: %s\n", parsed.WarrantyExpiry)
	}

	if parsed.PurchaseDate == "" {
		now := time.Now()
		parsed.PurchaseDate = now.Format("2006-01-02")
	}
	if parsed.WarrantyExpiry == "" {
		if purchaseDate, err := time.Parse("2006-01-02", parsed.PurchaseDate); err == nil {
			parsed.WarrantyExpiry = purchaseDate.AddDate(1, 0, 0).Format("2006-01-02")
		} else {
			parsed.WarrantyExpiry = time.Now().AddDate(1, 0, 0).Format("2006-01-02")
		}
	}

	if parsed.Store == "" {
		parsed.Store = "Unknown Store"
		parsed.Confidence = 0.3
	}
	if parsed.Item == "" {
		parsed.Item = "Unknown Item"
		parsed.Confidence = 0.3
	}

	return parsed
}

func findDateInText(text, pattern string) string {

	lines := strings.Split(text, " ")
	for _, word := range lines {

		if strings.Count(word, "/") == 2 {
			parts := strings.Split(word, "/")
			if len(parts) == 3 {
				month := parts[0]
				day := parts[1]
				year := parts[2]
				if len(month) <= 2 && len(day) <= 2 && len(year) == 4 {

					if len(month) == 1 {
						month = "0" + month
					}
					if len(day) == 1 {
						day = "0" + day
					}
					return fmt.Sprintf("%s-%s-%s", year, month, day)
				}
			}
		}

		if strings.Count(word, "-") == 2 {
			parts := strings.Split(word, "-")
			if len(parts) == 3 && len(parts[0]) == 4 && len(parts[1]) <= 2 && len(parts[2]) <= 2 {
				return word
			}
		}
	}
	return ""
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (h *ReceiptHandler) parseEmailContent(emailContent string) models.ParsedEmailData {

	content := strings.ToLower(emailContent)

	var parsed models.ParsedEmailData
	parsed.Currency = "USD"
	parsed.Confidence = 0.7

	storePatterns := []string{"from", "purchased from", "store:", "merchant:"}
	for _, pattern := range storePatterns {
		if idx := strings.Index(content, pattern); idx != -1 {

			afterPattern := content[idx+len(pattern):]
			lines := strings.Split(afterPattern, "\n")
			if len(lines) > 0 {
				store := strings.TrimSpace(lines[0])
				if len(store) > 0 && len(store) < 100 {
					parsed.Store = strings.Title(store)
					break
				}
			}
		}
	}

	amountPatterns := []string{"$", "total:", "amount:", "price:"}
	for _, pattern := range amountPatterns {
		if idx := strings.Index(content, pattern); idx != -1 {
			afterPattern := content[idx:]

			words := strings.Fields(afterPattern)
			for i, word := range words {
				if strings.Contains(word, "$") || (i > 0 && strings.Contains(words[i-1], "$")) {

					amountStr := strings.Trim(word, "$,")
					if amount, err := strconv.ParseFloat(amountStr, 64); err == nil {
						parsed.Amount = amount
						break
					}
				}
			}
			if parsed.Amount > 0 {
				break
			}
		}
	}

	itemPatterns := []string{"item:", "product:", "description:", "name:"}
	for _, pattern := range itemPatterns {
		if idx := strings.Index(content, pattern); idx != -1 {
			afterPattern := content[idx+len(pattern):]
			lines := strings.Split(afterPattern, "\n")
			if len(lines) > 0 {
				item := strings.TrimSpace(lines[0])
				if len(item) > 0 && len(item) < 200 {
					parsed.Item = strings.Title(item)
					break
				}
			}
		}
	}

	now := time.Now()
	parsed.PurchaseDate = now.Format("2006-01-02")
	parsed.WarrantyExpiry = now.AddDate(1, 0, 0).Format("2006-01-02")

	return parsed
}

func (h *ReceiptHandler) calculateStatus(expiryDate time.Time) string {
	now := time.Now()
	daysUntilExpiry := int(expiryDate.Sub(now).Hours() / 24)

	if daysUntilExpiry < 0 {
		return "expired"
	} else if daysUntilExpiry <= 30 {
		return "expiring"
	}
	return "active"
}

func (h *ReceiptHandler) checkReceiptLimit(userID string) (bool, error) {
	tx, err := h.db.Begin()
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	atLimit, err := h.checkReceiptLimitInTx(tx, userID)
	return atLimit, err
}

func (h *ReceiptHandler) checkReceiptLimitInTx(tx *sql.Tx, userID string) (bool, error) {
	countQuery := `SELECT COUNT(*) FROM receipts WHERE user_id = $1 AND deleted_at IS NULL`
	var count int
	err := tx.QueryRow(countQuery, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	var sponsorshipStatus string
	sponsorQuery := `
		SELECT status FROM subscriptions 
		WHERE (clerk_user_id = $1 OR user_id::text = $1) AND status = 'active'
		ORDER BY created_at DESC LIMIT 1
	`
	err = tx.QueryRow(sponsorQuery, userID).Scan(&sponsorshipStatus)

	if err == nil && sponsorshipStatus == "active" {
		return count >= 50, nil
	}

	return count >= 5, nil
}
