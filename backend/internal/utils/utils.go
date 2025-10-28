package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"
	"time"
)

func GenerateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func ParseDate(dateStr string) (time.Time, error) {
	formats := []string{
		"2006-01-02",
		"2006/01/02",
		"01/02/2006",
		"02/01/2006",
		"January 2, 2006",
		"Jan 2, 2006",
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05-07:00",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, dateStr); err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date: %s", dateStr)
}

func FormatDate(t time.Time) string {
	return t.Format("January 2, 2006")
}

func CalculateWarrantyStatus(expiryDate time.Time) string {
	now := time.Now()

	if now.After(expiryDate) {
		return "expired"
	}

	thirtyDaysFromNow := now.AddDate(0, 0, 30)
	if expiryDate.Before(thirtyDaysFromNow) {
		return "expiring"
	}

	return "active"
}

func ValidateEmail(email string) bool {
	pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	matched, _ := regexp.MatchString(pattern, email)
	return matched
}

func SanitizeString(input string) string {

	input = strings.ReplaceAll(input, "\x00", "")
	input = strings.ReplaceAll(input, "\r", "")
	input = strings.ReplaceAll(input, "\n", " ")
	input = strings.ReplaceAll(input, "\t", " ")

	input = strings.TrimSpace(input)

	return input
}

func TruncateString(str string, maxLen int) string {
	if len(str) <= maxLen {
		return str
	}
	return str[:maxLen-3] + "..."
}

func Contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func RemoveDuplicates(slice []string) []string {
	keys := make(map[string]bool)
	result := []string{}

	for _, item := range slice {
		if !keys[item] {
			keys[item] = true
			result = append(result, item)
		}
	}

	return result
}

func GetDaysUntilExpiry(expiryDate time.Time) int {
	now := time.Now()
	duration := expiryDate.Sub(now)
	return int(duration.Hours() / 24)
}

func FormatCurrency(amount float64, currency string) string {
	switch strings.ToUpper(currency) {
	case "USD":
		return fmt.Sprintf("$%.2f", amount)
	case "EUR":
		return fmt.Sprintf("€%.2f", amount)
	case "GBP":
		return fmt.Sprintf("£%.2f", amount)
	default:
		return fmt.Sprintf("%.2f %s", amount, currency)
	}
}

func ValidateUUID(uuid string) bool {
	pattern := `^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`
	matched, _ := regexp.MatchString(pattern, uuid)
	return matched
}
