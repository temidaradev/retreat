package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type SponsorshipService struct {
	db *sql.DB
}

func NewSponsorshipService(db *sql.DB) *SponsorshipService {
	return &SponsorshipService{db: db}
}

// SponsorshipPlatform represents different sponsorship platforms
type SponsorshipPlatform string

const (
	BuyMeACoffee   SponsorshipPlatform = "buymeacoffee"
	GitHubSponsors SponsorshipPlatform = "github"
)

// SponsorshipVerification represents a sponsorship verification request
type SponsorshipVerification struct {
	Platform SponsorshipPlatform `json:"platform"`
	Username string              `json:"username"`
	Email    string              `json:"email"`
	UserID   string              `json:"user_id"`
	Proof    string              `json:"proof"` // Screenshot URL or transaction ID
}

// VerifySponsorship verifies a user's sponsorship status
func (s *SponsorshipService) VerifySponsorship(verification SponsorshipVerification) (bool, error) {
	switch verification.Platform {
	case BuyMeACoffee:
		return s.verifyBuyMeACoffee(verification)
	case GitHubSponsors:
		return s.verifyGitHubSponsors(verification)
	default:
		return false, fmt.Errorf("unsupported platform: %s", verification.Platform)
	}
}

// verifyBuyMeACoffee verifies Buy Me a Coffee sponsorship
func (s *SponsorshipService) verifyBuyMeACoffee(verification SponsorshipVerification) (bool, error) {
	// Buy Me a Coffee doesn't have a public API for verification
	// This would typically require manual verification or webhook integration
	// For now, we'll implement a simple check based on username

	// You can implement webhook verification if you set up Buy Me a Coffee webhooks
	// For manual verification, you would check the proof field (screenshot, etc.)

	log.Printf("Manual verification needed for Buy Me a Coffee user: %s", verification.Username)

	// For development, you can manually approve by checking a list of known supporters
	supporters := s.getKnownSupporters()
	for _, supporter := range supporters {
		if strings.EqualFold(supporter.Username, verification.Username) &&
			strings.EqualFold(supporter.Email, verification.Email) {
			return true, nil
		}
	}

	return false, nil
}

// verifyGitHubSponsors verifies GitHub Sponsors status
func (s *SponsorshipService) verifyGitHubSponsors(verification SponsorshipVerification) (bool, error) {
	// GitHub Sponsors API requires authentication
	// You would need to set up a GitHub App or use personal access token

	githubToken := os.Getenv("GITHUB_TOKEN")
	if githubToken == "" {
		log.Printf("GitHub token not configured, manual verification needed for: %s", verification.Username)
		return false, nil
	}

	// Check if user is sponsoring you
	url := fmt.Sprintf("https://api.github.com/users/%s/sponsoring", verification.Username)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return false, err
	}

	req.Header.Set("Authorization", "token "+githubToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return false, fmt.Errorf("GitHub API error: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, err
	}

	var sponsorships []map[string]interface{}
	if err := json.Unmarshal(body, &sponsorships); err != nil {
		return false, err
	}

	// Check if any sponsorship is for your account
	yourGitHubUsername := os.Getenv("GITHUB_USERNAME") // Your GitHub username
	for _, sponsorship := range sponsorships {
		if sponsor, ok := sponsorship["sponsorable"].(map[string]interface{}); ok {
			if login, ok := sponsor["login"].(string); ok && login == yourGitHubUsername {
				return true, nil
			}
		}
	}

	return false, nil
}

// KnownSupporter represents a manually verified supporter
type KnownSupporter struct {
	Username string
	Email    string
	Platform SponsorshipPlatform
}

// getKnownSupporters returns a list of manually verified supporters
func (s *SponsorshipService) getKnownSupporters() []KnownSupporter {
	// In production, you might store this in a database or config file
	// For now, we'll use environment variables or a simple list

	supportersJSON := os.Getenv("KNOWN_SUPPORTERS")
	if supportersJSON == "" {
		return []KnownSupporter{}
	}

	var supporters []KnownSupporter
	if err := json.Unmarshal([]byte(supportersJSON), &supporters); err != nil {
		log.Printf("Failed to parse known supporters: %v", err)
		return []KnownSupporter{}
	}

	return supporters
}

// ActivateSubscription activates a subscription after verification
func (s *SponsorshipService) ActivateSubscription(userID string, platform SponsorshipPlatform) error {
	query := `
		UPDATE subscriptions 
		SET status = 'active', updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $1 AND status = 'pending'
	`

	result, err := s.db.Exec(query, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("no pending subscription found for user %s", userID)
	}

	log.Printf("Activated sponsorship subscription for user %s via %s", userID, platform)
	return nil
}

// GetPendingVerifications returns all pending sponsorship verifications
func (s *SponsorshipService) GetPendingVerifications() ([]SponsorshipVerification, error) {
	query := `
		SELECT s.user_id, u.email
		FROM subscriptions s
		JOIN users u ON s.user_id = u.id
		WHERE s.status = 'pending'
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var verifications []SponsorshipVerification
	for rows.Next() {
		var verification SponsorshipVerification
		var email string

		err := rows.Scan(&verification.UserID, &email)
		if err != nil {
			continue
		}

		verification.Email = email
		verifications = append(verifications, verification)
	}

	return verifications, nil
}

// ManualVerificationEndpoint handles manual verification requests
func (s *SponsorshipService) ManualVerificationEndpoint(verification SponsorshipVerification) error {
	// This would typically be called manually or via webhook
	// For now, we'll implement basic verification logic

	verified, err := s.VerifySponsorship(verification)
	if err != nil {
		return err
	}

	if verified {
		return s.ActivateSubscription(verification.UserID, verification.Platform)
	}

	return fmt.Errorf("sponsorship verification failed")
}
