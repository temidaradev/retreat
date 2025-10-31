package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"receiptlocker/internal/config"
	"receiptlocker/internal/logging"
	"receiptlocker/internal/types"
)

type EmailParserService struct {
	db     *sql.DB
	config *config.Config
}

func NewEmailParserService(db *sql.DB, cfg *config.Config) *EmailParserService {
	return &EmailParserService{
		db:     db,
		config: cfg,
	}
}

func (s *EmailParserService) ParseReceiptEmail(email *types.InboundEmailWebhook) (*types.ParsedReceiptData, error) {
	logging.Info("Parsing receipt email", map[string]interface{}{
		"from":    email.From,
		"subject": email.Subject,
	})

	content := email.Text
	if content == "" {
		content = s.stripHTML(email.HTML)
	}

	receipt := &types.ParsedReceiptData{
		Confidence: 0.0,
		Source:     "email_body",
	}

	if parsedFromLink := s.tryParseFromKnownInvoiceLinks(content, email.From); parsedFromLink != nil {
		return parsedFromLink, nil
	}

	if store := s.extractStore(email.Subject, content, email.From); store != "" {
		receipt.Store = store
		receipt.Confidence += 0.2
	}

	if item := s.extractItem(content); item != "" {
		receipt.Item = item
		receipt.Confidence += 0.2
	}

	if amount, currency := s.extractAmountAndCurrency(content); amount > 0 {
		receipt.Amount = amount
		receipt.Currency = currency
		receipt.Confidence += 0.2
	}

	if purchaseDate := s.extractDate(content); !purchaseDate.IsZero() {
		receipt.PurchaseDate = purchaseDate
		receipt.Confidence += 0.2
	} else {

		receipt.PurchaseDate = time.Now()
	}

	if warrantyExpiry := s.extractWarrantyDate(content); !warrantyExpiry.IsZero() {
		receipt.WarrantyExpiry = warrantyExpiry
		receipt.Confidence += 0.2
	} else {

		receipt.WarrantyExpiry = receipt.PurchaseDate.AddDate(1, 0, 0)
	}

	if receipt.Confidence < 0.3 {
		logging.Warn("Low confidence in email parsing", map[string]interface{}{
			"confidence": receipt.Confidence,
			"from":       email.From,
			"subject":    email.Subject,
		})
		return nil, fmt.Errorf("unable to extract sufficient receipt data from email (confidence: %.2f)", receipt.Confidence)
	}

	logging.Info("Successfully parsed receipt from email", map[string]interface{}{
		"confidence": receipt.Confidence,
		"store":      receipt.Store,
		"amount":     receipt.Amount,
	})

	return receipt, nil
}

func (s *EmailParserService) extractStore(subject, content, sender string) string {

	storePatterns := []string{
		`(?i)receipt from (.+?)(?:\s*-|\s*$)`,
		`(?i)order from (.+?)(?:\s*-|\s*$)`,
		`(?i)purchase at (.+?)(?:\s*-|\s*$)`,
		`(?i)thank you for shopping at (.+?)(?:\s|$)`,
		`(?i)your (.+?) order`,
	}

	for _, pattern := range storePatterns {
		re := regexp.MustCompile(pattern)
		if matches := re.FindStringSubmatch(subject); len(matches) > 1 {
			return s.cleanText(matches[1])
		}
	}

	contentPatterns := []string{
		`(?i)merchant:\s*(.+?)(?:\n|$)`,
		`(?i)store:\s*(.+?)(?:\n|$)`,
		`(?i)sold by:\s*(.+?)(?:\n|$)`,
	}

	for _, pattern := range contentPatterns {
		re := regexp.MustCompile(pattern)
		if matches := re.FindStringSubmatch(content); len(matches) > 1 {
			candidate := s.cleanText(matches[1])
			lowered := strings.ToLower(candidate)
			if lowered == "to" || lowered == "from" || lowered == "subject" || strings.Contains(candidate, ":") {
				continue
			}
			return candidate
		}
	}

	fromPattern := regexp.MustCompile(`@([\w-]+)\.`)
	if matches := fromPattern.FindStringSubmatch(sender); len(matches) > 1 {
		return s.cleanText(matches[1])
	}

	return "Unknown Store"
}

func (s *EmailParserService) extractItem(content string) string {
	itemPatterns := []string{
		`(?i)item:\s*(.+?)(?:\n|$)`,
		`(?i)product:\s*(.+?)(?:\n|$)`,
		`(?i)description:\s*(.+?)(?:\n|$)`,
		`(?i)order details:\s*(.+?)(?:\n|$)`,
	}

	for _, pattern := range itemPatterns {
		re := regexp.MustCompile(pattern)
		if matches := re.FindStringSubmatch(content); len(matches) > 1 {
			return s.cleanText(matches[1])
		}
	}

	return "Product/Service"
}

func (s *EmailParserService) extractAmountAndCurrency(content string) (float64, string) {

	amountPatterns := []string{
		`(?i)total[:\s]*\$?([\d,]+\.?\d*)`,
		`(?i)amount[:\s]*\$?([\d,]+\.?\d*)`,
		`(?i)paid[:\s]*\$?([\d,]+\.?\d*)`,
		`(?i)price[:\s]*\$?([\d,]+\.?\d*)`,
		`\$\s*([\d,]+\.?\d*)`,
		`(?i)USD\s*([\d,]+\.?\d*)`,
		`(?i)€\s*([\d,]+\.?\d*)`,
		`(?i)£\s*([\d,]+\.?\d*)`,

		`₺\s*([\d\.\,]+)`,
		`(?i)TL\s*([\d\.\,]+)`,
		`(?i)TRY\s*([\d\.\,]+)`,
	}

	for _, pattern := range amountPatterns {
		re := regexp.MustCompile(pattern)
		if matches := re.FindStringSubmatch(content); len(matches) > 1 {
			amountStr := matches[1]

			amountStr = strings.ReplaceAll(amountStr, " ", "")

			if strings.Contains(amountStr, ",") && strings.Contains(amountStr, ".") {
				amountStr = strings.ReplaceAll(amountStr, ",", "")
			} else if strings.Contains(amountStr, ",") && !strings.Contains(amountStr, ".") {

				amountStr = strings.ReplaceAll(amountStr, ",", ".")
			}
			amountStr = strings.ReplaceAll(amountStr, "\u00A0", "")
			amountStr = strings.ReplaceAll(amountStr, ",", "")
			var amount float64
			if _, err := fmt.Sscanf(amountStr, "%f", &amount); err == nil {

				currency := "USD"
				if strings.Contains(content, "€") || strings.Contains(content, "EUR") {
					currency = "EUR"
				} else if strings.Contains(content, "£") || strings.Contains(content, "GBP") {
					currency = "GBP"
				} else if strings.Contains(content, "₺") || strings.Contains(strings.ToUpper(content), " TL") || strings.Contains(strings.ToUpper(content), "TRY") {
					currency = "TRY"
				}
				return amount, currency
			}
		}
	}

	return 0, "USD"
}

func (s *EmailParserService) tryParseFromKnownInvoiceLinks(content string, sender string) *types.ParsedReceiptData {
	urlRe := regexp.MustCompile(`https?://[^\s]+`)
	urls := urlRe.FindAllString(content, -1)
	for _, raw := range urls {

		cleaned := strings.TrimRight(raw, ".,;!?)]")
		u, err := url.Parse(cleaned)
		if err != nil || u.Host == "" {
			continue
		}
		host := strings.ToLower(u.Host)
		if strings.Contains(host, "efinans.com.tr") && strings.Contains(strings.ToLower(u.Path), "/earsiv/") {
			if receipt := s.fetchAndParseEfinansHTML(cleaned, sender); receipt != nil {
				return receipt
			}
		}
	}
	return nil
}

func (s *EmailParserService) fetchAndParseEfinansHTML(link string, sender string) *types.ParsedReceiptData {
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", link, nil)
	if err != nil {
		return nil
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (ReceiptStore Parser)")

	resp, err := client.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil
	}
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}
	html := string(bodyBytes)
	text := s.stripHTML(html)

	store := ""
	storePatterns := []string{
		`(?i)(?:Ünvan|Unvan|Şirket|Firma)[:\s]+(.{3,80}?)\s{0,5}(?:\n|$)`,
		`(?i)<title>\s*(.+?)\s*-\s*e-?Arşiv`,
	}
	for _, p := range storePatterns {
		re := regexp.MustCompile(p)
		if m := re.FindStringSubmatch(html); len(m) > 1 {
			store = s.cleanText(m[1])
			break
		}
		re2 := regexp.MustCompile(p)
		if m := re2.FindStringSubmatch(text); store == "" && len(m) > 1 {
			store = s.cleanText(m[1])
			break
		}
	}
	if store == "" {
		store = s.extractStore("", text, sender)
	}

	amount, currency := 0.0, "TRY"
	amountPatterns := []string{
		`(?i)(?:Ödenecek\s*Tutar|Odenecek\s*Tutar)[:\s]*([\d\.,]+)\s*(?:TL|TRY|₺)?`,
		`(?i)(?:Genel\s*Toplam|Vergiler\s*Dahil\s*Toplam|Toplam)[:\s]*([\d\.,]+)\s*(?:TL|TRY|₺)?`,
		`([\d\.,]+)\s*(?:TL|TRY|₺)`,
	}
	picked := ""
	for _, p := range amountPatterns {
		re := regexp.MustCompile(p)
		if m := re.FindAllStringSubmatch(text, -1); len(m) > 0 {

			picked = m[len(m)-1][1]
			break
		}
		if m := re.FindAllStringSubmatch(html, -1); picked == "" && len(m) > 0 {
			picked = m[len(m)-1][1]
		}
	}
	if picked != "" {
		amt := picked
		amt = strings.ReplaceAll(amt, " ", "")
		if strings.Contains(amt, ",") && strings.Contains(amt, ".") {
			amt = strings.ReplaceAll(amt, ",", "")
		} else if strings.Contains(amt, ",") && !strings.Contains(amt, ".") {
			amt = strings.ReplaceAll(amt, ",", ".")
		}
		amt = strings.ReplaceAll(amt, "\u00A0", "")
		amt = strings.ReplaceAll(amt, ",", "")
		var a float64
		if _, err := fmt.Sscanf(amt, "%f", &a); err == nil {
			amount = a
		}
	}
	if amount == 0 {

		amount, currency = s.extractAmountAndCurrency(text)
		if currency == "USD" {
			currency = "TRY"
		}
	}
	if currency == "USD" {
		if strings.Contains(text, "₺") || strings.Contains(strings.ToUpper(text), " TL") || strings.Contains(strings.ToUpper(text), "TRY") {
			currency = "TRY"
		}
	}

	purchaseDate := time.Time{}
	datePatterns := []string{
		`(?i)(?:Fatura\s*Tarihi|Düzenleme\s*Tarihi|Duzenleme\s*Tarihi)[:\s]*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4})`,
		`([0-9]{4}-[0-9]{2}-[0-9]{2})`,
	}
	for _, p := range datePatterns {
		re := regexp.MustCompile(p)
		if m := re.FindStringSubmatch(text); len(m) > 1 {
			dateStr := m[1]
			formats := []string{"2006-01-02", "02/01/2006", "2/1/2006", "02-01-2006", "2-1-2006", "01/02/2006", "1/2/2006"}
			for _, f := range formats {
				if t, err := time.Parse(f, dateStr); err == nil {
					purchaseDate = t
					break
				}
			}
		}
		if !purchaseDate.IsZero() {
			break
		}
	}
	if purchaseDate.IsZero() {
		purchaseDate = s.extractDate(text)
	}
	if purchaseDate.IsZero() {
		purchaseDate = time.Now()
	}

	confidence := 0.4
	if store != "" {
		confidence += 0.3
	}
	if amount > 0 {
		confidence += 0.3
	}

	return &types.ParsedReceiptData{
		Store:          store,
		Item:           "Receipt",
		Amount:         amount,
		Currency:       currency,
		PurchaseDate:   purchaseDate,
		WarrantyExpiry: purchaseDate.AddDate(1, 0, 0),
		Confidence:     confidence,
		Source:         "efinans_link",
	}
}

func (s *EmailParserService) extractDate(content string) time.Time {
	datePatterns := []string{
		`(?i)purchase date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})`,
		`(?i)order date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})`,
		`(?i)date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})`,
		`(\d{4}-\d{2}-\d{2})`,
		`(?i)(\w+ \d{1,2},? \d{4})`,
	}

	for _, pattern := range datePatterns {
		re := regexp.MustCompile(pattern)
		if matches := re.FindStringSubmatch(content); len(matches) > 1 {
			dateStr := matches[1]

			formats := []string{
				"2006-01-02",
				"01/02/2006",
				"1/2/2006",
				"01-02-2006",
				"1-2-2006",
				"02/01/2006",
				"2/1/2006",
				"January 2, 2006",
				"Jan 2, 2006",
			}

			for _, format := range formats {
				if t, err := time.Parse(format, dateStr); err == nil {
					return t
				}
			}
		}
	}

	return time.Time{}
}

func (s *EmailParserService) extractWarrantyDate(content string) time.Time {
	warrantyPatterns := []string{
		`(?i)warranty[:\s]+(\d+)\s*(year|yr|month|mo)s?`,
		`(?i)guarantee[:\s]+(\d+)\s*(year|yr|month|mo)s?`,
		`(?i)warranty expires?[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})`,
	}

	for _, pattern := range warrantyPatterns {
		re := regexp.MustCompile(pattern)
		if matches := re.FindStringSubmatch(content); len(matches) > 1 {

			if len(matches) > 2 {
				var duration int
				fmt.Sscanf(matches[1], "%d", &duration)

				baseDate := time.Now()
				if strings.Contains(strings.ToLower(matches[2]), "year") || strings.Contains(strings.ToLower(matches[2]), "yr") {
					return baseDate.AddDate(duration, 0, 0)
				} else if strings.Contains(strings.ToLower(matches[2]), "month") || strings.Contains(strings.ToLower(matches[2]), "mo") {
					return baseDate.AddDate(0, duration, 0)
				}
			}

			if dateStr := matches[1]; len(dateStr) > 5 {
				formats := []string{
					"2006-01-02",
					"01/02/2006",
					"01-02-2006",
				}
				for _, format := range formats {
					if t, err := time.Parse(format, dateStr); err == nil {
						return t
					}
				}
			}
		}
	}

	return time.Time{}
}

func (s *EmailParserService) stripHTML(html string) string {

	re := regexp.MustCompile(`<[^>]*>`)
	text := re.ReplaceAllString(html, " ")

	text = strings.ReplaceAll(text, "&nbsp;", " ")
	text = strings.ReplaceAll(text, "&amp;", "&")
	text = strings.ReplaceAll(text, "&lt;", "<")
	text = strings.ReplaceAll(text, "&gt;", ">")
	text = strings.ReplaceAll(text, "&quot;", "\"")

	re = regexp.MustCompile(`\s+`)
	text = re.ReplaceAllString(text, " ")

	return strings.TrimSpace(text)
}

func (s *EmailParserService) cleanText(text string) string {

	re := regexp.MustCompile(`\s+`)
	text = re.ReplaceAllString(text, " ")

	text = strings.TrimSpace(text)

	if len(text) > 100 {
		text = text[:100]
	}

	return text
}

func (s *EmailParserService) GetUserByEmail(email string) (string, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	var userID string

	query := `SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`
	err := s.db.QueryRow(query, email).Scan(&userID)

	if err == nil {
		return userID, nil
	}

	if err != sql.ErrNoRows {
		return "", fmt.Errorf("database error: %w", err)
	}

	linkedQuery := `SELECT user_id FROM user_emails WHERE LOWER(email) = $1 LIMIT 1`
	err = s.db.QueryRow(linkedQuery, email).Scan(&userID)

	if err == sql.ErrNoRows {
		return "", fmt.Errorf("no user found with email: %s", email)
	}
	if err != nil {
		return "", fmt.Errorf("database error: %w", err)
	}

	return userID, nil
}

func (s *EmailParserService) CreateReceiptFromParsedData(userID string, receipt *types.ParsedReceiptData, originalEmail string) (string, error) {

	tx, err := s.db.Begin()
	if err != nil {
		return "", fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	parsedDataJSON, err := json.Marshal(receipt)
	if err != nil {
		return "", fmt.Errorf("failed to marshal parsed data: %w", err)
	}

	var receiptID string
	query := `
		INSERT INTO receipts (
			user_id, store, item, purchase_date, warranty_expiry,
			amount, currency, status, original_email, parsed_data,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
		) RETURNING id
	`

	status := "active"
	if receipt.WarrantyExpiry.Before(time.Now()) {
		status = "expired"
	} else if receipt.WarrantyExpiry.Before(time.Now().AddDate(0, 0, 30)) {
		status = "expiring"
	}

	err = tx.QueryRow(
		query,
		userID,
		receipt.Store,
		receipt.Item,
		receipt.PurchaseDate,
		receipt.WarrantyExpiry,
		receipt.Amount,
		receipt.Currency,
		status,
		originalEmail,
		string(parsedDataJSON),
	).Scan(&receiptID)

	if err != nil {
		return "", fmt.Errorf("failed to insert receipt: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return "", fmt.Errorf("failed to commit transaction: %w", err)
	}

	logging.Info("Created receipt from email", map[string]interface{}{
		"receipt_id": receiptID,
		"user_id":    userID,
		"store":      receipt.Store,
		"confidence": receipt.Confidence,
	})

	return receiptID, nil
}
