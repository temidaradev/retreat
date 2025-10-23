package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"receiptlocker/internal/models"
)

type ReceiptHandler struct {
	db *sql.DB
}

func NewReceiptHandler(db *sql.DB) *ReceiptHandler {
	return &ReceiptHandler{db: db}
}

// GetReceipts retrieves all receipts for a user
func (h *ReceiptHandler) GetReceipts(c *gin.Context) {
	// TODO: Get user ID from Clerk JWT token
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		userID = "demo-user" // For demo purposes
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch receipts"})
		return
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan receipt"})
			return
		}

		if parsedData.Valid {
			receipt.ParsedData = parsedData.String
		}

		// Update status based on warranty expiry
		receipt.Status = h.calculateStatus(receipt.WarrantyExpiry)

		receipts = append(receipts, receipt)
	}

	c.JSON(http.StatusOK, gin.H{"receipts": receipts})
}

// GetReceipt retrieves a specific receipt by ID
func (h *ReceiptHandler) GetReceipt(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		userID = "demo-user"
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
			c.JSON(http.StatusNotFound, gin.H{"error": "Receipt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch receipt"})
		return
	}

	if parsedData.Valid {
		receipt.ParsedData = parsedData.String
	}

	receipt.Status = h.calculateStatus(receipt.WarrantyExpiry)

	c.JSON(http.StatusOK, receipt)
}

// CreateReceipt creates a new receipt
func (h *ReceiptHandler) CreateReceipt(c *gin.Context) {
	var req models.CreateReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		userID = "demo-user"
	}

	// Parse dates
	purchaseDate, err := time.Parse("2006-01-02", req.PurchaseDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid purchase date format"})
		return
	}

	warrantyExpiry, err := time.Parse("2006-01-02", req.WarrantyExpiry)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warranty expiry format"})
		return
	}

	// Set default currency
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create receipt"})
		return
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

	c.JSON(http.StatusCreated, receipt)
}

// UpdateReceipt updates an existing receipt
func (h *ReceiptHandler) UpdateReceipt(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		userID = "demo-user"
	}

	var req models.CreateReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse dates
	purchaseDate, err := time.Parse("2006-01-02", req.PurchaseDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid purchase date format"})
		return
	}

	warrantyExpiry, err := time.Parse("2006-01-02", req.WarrantyExpiry)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warranty expiry format"})
		return
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
			c.JSON(http.StatusNotFound, gin.H{"error": "Receipt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update receipt"})
		return
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

	c.JSON(http.StatusOK, receipt)
}

// DeleteReceipt deletes a receipt
func (h *ReceiptHandler) DeleteReceipt(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		userID = "demo-user"
	}

	query := `DELETE FROM receipts WHERE id = $1 AND user_id = $2`
	result, err := h.db.Exec(query, id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete receipt"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Receipt not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Receipt deleted successfully"})
}

// ParseEmail parses email content to extract receipt information
func (h *ReceiptHandler) ParseEmail(c *gin.Context) {
	var req models.ParseEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Simple email parsing logic (in production, use ML/NLP)
	parsedData := h.parseEmailContent(req.EmailContent)

	c.JSON(http.StatusOK, gin.H{"parsed_data": parsedData})
}

// parseEmailContent extracts receipt information from email content
func (h *ReceiptHandler) parseEmailContent(emailContent string) models.ParsedEmailData {
	// This is a simplified parser - in production, you'd use ML/NLP
	content := strings.ToLower(emailContent)
	
	var parsed models.ParsedEmailData
	parsed.Currency = "USD"
	parsed.Confidence = 0.7 // Default confidence

	// Extract store name (look for common patterns)
	storePatterns := []string{"from", "purchased from", "store:", "merchant:"}
	for _, pattern := range storePatterns {
		if idx := strings.Index(content, pattern); idx != -1 {
			// Extract text after the pattern
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

	// Extract amount (look for $ patterns)
	amountPatterns := []string{"$", "total:", "amount:", "price:"}
	for _, pattern := range amountPatterns {
		if idx := strings.Index(content, pattern); idx != -1 {
			afterPattern := content[idx:]
			// Look for numbers after the pattern
			words := strings.Fields(afterPattern)
			for i, word := range words {
				if strings.Contains(word, "$") || (i > 0 && strings.Contains(words[i-1], "$")) {
					// Extract number
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

	// Extract item name (look for common patterns)
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

	// Set default dates (current date for purchase, 1 year for warranty)
	now := time.Now()
	parsed.PurchaseDate = now.Format("2006-01-02")
	parsed.WarrantyExpiry = now.AddDate(1, 0, 0).Format("2006-01-02")

	return parsed
}

// calculateStatus determines the warranty status based on expiry date
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
