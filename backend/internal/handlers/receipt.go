package handlers

import (
	"bytes"
	"database/sql"
	"encoding/base64"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"receiptlocker/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/ledongthuc/pdf"
)

type ReceiptHandler struct {
	db *sql.DB
}

func NewReceiptHandler(db *sql.DB) *ReceiptHandler {
	return &ReceiptHandler{db: db}
}

func (h *ReceiptHandler) GetReceipts(c *fiber.Ctx) error {

	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found"})
	}

	query := `
		SELECT id, user_id, store, item, purchase_date, warranty_expiry, 
		       amount, currency, status, original_email, parsed_data, 
		       created_at, updated_at
		FROM receipts 
		WHERE user_id = $1 
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

		err := rows.Scan(
			&receipt.ID, &receipt.UserID, &receipt.Store, &receipt.Item,
			&receipt.PurchaseDate, &receipt.WarrantyExpiry, &receipt.Amount,
			&receipt.Currency, &receipt.Status, &receipt.OriginalEmail,
			&parsedData, &receipt.CreatedAt, &receipt.UpdatedAt,
		)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to scan receipt"})
		}

		if parsedData.Valid {
			receipt.ParsedData = parsedData.String
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
		       created_at, updated_at
		FROM receipts 
		WHERE id = $1 AND user_id = $2
	`

	var receipt models.Receipt
	var parsedData sql.NullString

	err := h.db.QueryRow(query, id, userID).Scan(
		&receipt.ID, &receipt.UserID, &receipt.Store, &receipt.Item,
		&receipt.PurchaseDate, &receipt.WarrantyExpiry, &receipt.Amount,
		&receipt.Currency, &receipt.Status, &receipt.OriginalEmail,
		&parsedData, &receipt.CreatedAt, &receipt.UpdatedAt,
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

	receipt.Status = h.calculateStatus(receipt.WarrantyExpiry)

	return c.JSON(receipt)
}

func (h *ReceiptHandler) CreateReceipt(c *fiber.Ctx) error {
	var req models.CreateReceiptRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found"})
	}

	atLimit, err := h.checkReceiptLimit(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check receipt limit"})
	}
	if atLimit {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":                "Receipt limit reached. Support us to get unlimited receipts!",
			"sponsorship_required": true,
		})
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

	query := `
		INSERT INTO receipts (user_id, store, item, purchase_date, warranty_expiry, 
		                     amount, currency, original_email)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`

	var id string
	var createdAt, updatedAt time.Time

	err = h.db.QueryRow(query, userID, req.Store, req.Item, purchaseDate,
		warrantyExpiry, req.Amount, req.Currency, req.OriginalEmail).Scan(&id, &createdAt, &updatedAt)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create receipt"})
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
		CreatedAt:      createdAt,
		UpdatedAt:      updatedAt,
	}

	return c.Status(fiber.StatusCreated).JSON(receipt)
}

func (h *ReceiptHandler) UpdateReceipt(c *fiber.Ctx) error {
	id := c.Params("id")
	userID := c.Locals("userID").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found"})
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

	query := `
		UPDATE receipts 
		SET store = $1, item = $2, purchase_date = $3, warranty_expiry = $4,
		    amount = $5, currency = $6, original_email = $7, updated_at = CURRENT_TIMESTAMP
		WHERE id = $8 AND user_id = $9
		RETURNING updated_at
	`

	var updatedAt time.Time
	err = h.db.QueryRow(query, req.Store, req.Item, purchaseDate, warrantyExpiry,
		req.Amount, req.Currency, req.OriginalEmail, id, userID).Scan(&updatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Receipt not found"})
		}
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
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found"})
	}

	query := `DELETE FROM receipts WHERE id = $1 AND user_id = $2`
	result, err := h.db.Exec(query, id, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete receipt"})
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get rows affected"})
	}

	if rowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Receipt not found"})
	}

	return c.JSON(fiber.Map{"message": "Receipt deleted successfully"})
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

	content := strings.ToLower(pdfText)

	var parsed models.ParsedPDFData
	parsed.Currency = "USD"
	parsed.Confidence = 0.6

	storePatterns := []string{"store:", "merchant:", "vendor:", "from", "purchased from", "receipt from"}
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

	amountPatterns := []string{"total:", "amount:", "price:", "cost:", "$"}
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

	itemPatterns := []string{"item:", "product:", "description:", "name:", "purchased:"}
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

	var sponsorshipStatus string
	query := `
		SELECT status FROM subscriptions 
		WHERE user_id = $1 AND status = 'active'
		ORDER BY created_at DESC LIMIT 1
	`
	err := h.db.QueryRow(query, userID).Scan(&sponsorshipStatus)

	if err == nil && sponsorshipStatus == "active" {
		return false, nil
	}

	countQuery := `SELECT COUNT(*) FROM receipts WHERE user_id = $1`
	var count int
	err = h.db.QueryRow(countQuery, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count >= 10, nil
}
