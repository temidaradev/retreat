package services

import (
	"bytes"
	"database/sql"
	"fmt"
	"html/template"
	"log"
	"net/smtp"
	"os"
	"strings"
	"time"

	"receiptlocker/internal/config"
)

type EmailService struct {
	db     *sql.DB
	config *config.Config
}

func NewEmailService(db *sql.DB, cfg *config.Config) *EmailService {
	return &EmailService{
		db:     db,
		config: cfg,
	}
}

func (e *EmailService) SendWarrantyReminder(userEmail string, receipt ReceiptInfo) error {

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Warranty Expiry Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8fafc; }
        .receipt-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .warning { color: #f59e0b; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Warranty Expiry Reminder</h1>
        </div>
        <div class="content">
            <p>Hello!</p>
            <p>This is a friendly reminder that your warranty for the following item will expire soon:</p>
            
            <div class="receipt-info">
                <h3>{{.Item}}</h3>
                <p><strong>Store:</strong> {{.Store}}</p>
                <p><strong>Purchase Date:</strong> {{.PurchaseDate}}</p>
                <p><strong>Warranty Expires:</strong> <span class="warning">{{.WarrantyExpiry}}</span></p>
                <p><strong>Amount:</strong> ${{.Amount}}</p>
            </div>
            
            <p>Don't forget to:</p>
            <ul>
                <li>Check if you need any repairs or replacements</li>
                <li>Contact the store for warranty claims</li>
                <li>Keep your receipt safe for warranty purposes</li>
            </ul>
            
            <p>Best regards,<br>The Retreat Team</p>
        </div>
        <div class="footer">
            <p>This email was sent by Retreat - Your Receipt & Warranty Manager</p>
            <p><a href="https://retreat.com">Visit Retreat</a> | <a href="#">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("reminder").Parse(tmpl)
	if err != nil {
		return fmt.Errorf("failed to parse template: %v", err)
	}

	var body bytes.Buffer
	err = t.Execute(&body, receipt)
	if err != nil {
		return fmt.Errorf("failed to execute template: %v", err)
	}

	return e.SendEmail(userEmail, "Warranty Expiry Reminder", body.String())
}

func (e *EmailService) CheckAndSendReminders() error {

	query := `
		SELECT r.id, r.user_id, r.store, r.item, r.purchase_date, 
		       r.warranty_expiry, r.amount, u.email
		FROM receipts r
		JOIN users u ON r.user_id = u.id
		WHERE r.warranty_expiry BETWEEN NOW() AND NOW() + INTERVAL '30 days'
		AND r.status = 'active'
		AND r.deleted_at IS NULL
		AND u.email IS NOT NULL
	`

	rows, err := e.db.Query(query)
	if err != nil {
		return fmt.Errorf("failed to query expiring receipts: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var receipt ReceiptInfo
		var userEmail string
		var purchaseDate, warrantyExpiry time.Time

		err := rows.Scan(
			&receipt.ID, &receipt.UserID, &receipt.Store, &receipt.Item,
			&purchaseDate, &warrantyExpiry, &receipt.Amount, &userEmail,
		)
		if err != nil {
			log.Printf("Failed to scan receipt: %v", err)
			continue
		}

		receipt.PurchaseDate = purchaseDate.Format("January 2, 2006")
		receipt.WarrantyExpiry = warrantyExpiry.Format("January 2, 2006")

		if err := e.SendWarrantyReminder(userEmail, receipt); err != nil {
			log.Printf("Failed to send reminder to %s: %v", userEmail, err)
			continue
		}

		log.Printf("Sent warranty reminder to %s for %s", userEmail, receipt.Item)
	}

	return nil
}

func (e *EmailService) SendEmail(to, subject, body string) error {

	smtpHost := e.config.Email.SMTPHost
	smtpPort := fmt.Sprintf("%d", e.config.Email.SMTPPort)
	smtpUser := e.config.Email.SMTPUsername
	smtpPass := e.config.Email.SMTPPassword
	fromEmail := e.config.Email.FromEmail

	if smtpHost == "" || smtpPort == "" || smtpUser == "" || smtpPass == "" || fromEmail == "" {
		return fmt.Errorf("SMTP configuration missing")
	}

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		fromEmail, to, subject, body)

	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	err := smtp.SendMail(addr, auth, fromEmail, []string{to}, []byte(msg))
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}

func (e *EmailService) SendSponsorshipVerificationNotification(verification SponsorshipVerificationRequest) error {

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Sponsorship Verification Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8fafc; }
        .verification-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .proof-section { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .action-buttons { text-align: center; margin: 20px 0; }
        .btn { display: inline-block; padding: 10px 20px; margin: 5px; text-decoration: none; border-radius: 5px; color: white; }
        .btn-approve { background: #10b981; }
        .btn-reject { background: #ef4444; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 New Sponsorship Verification Request</h1>
        </div>
        <div class="content">
            <p>Hello Admin,</p>
            <p>A new sponsorship verification request has been submitted:</p>
            
            <div class="verification-info">
                <h3>Verification Details</h3>
                <p><strong>Platform:</strong> {{.Platform}}</p>
                <p><strong>Username:</strong> {{.Username}}</p>
                <p><strong>User Email:</strong> {{.UserEmail}}</p>
                <p><strong>User ID:</strong> {{.UserID}}</p>
                <p><strong>Request Date:</strong> {{.RequestDate}}</p>
            </div>
            
            {{if .Proof}}
            <div class="proof-section">
                <h3>Additional Proof</h3>
                <p>{{.Proof}}</p>
            </div>
            {{end}}
            
            {{if .ScreenshotPath}}
            <div class="proof-section">
                <h3>Screenshot Uploaded</h3>
                <p>A screenshot has been uploaded for verification. File path: {{.ScreenshotPath}}</p>
                <p><strong>Note:</strong> Please check the server uploads directory to view the screenshot.</p>
            </div>
            {{end}}
            
            <p>Please review the verification request manually.</p>
            
            <p>Best regards,<br>Receipt Store System</p>
        </div>
        <div class="footer">
            <p>This email was sent by Receipt Store - Sponsorship Verification System</p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("sponsorship_notification").Parse(tmpl)
	if err != nil {
		return fmt.Errorf("failed to parse template: %v", err)
	}

	var body bytes.Buffer
	err = t.Execute(&body, verification)
	if err != nil {
		return fmt.Errorf("failed to execute template: %v", err)
	}

	adminEmail := e.getAdminEmail()
	if adminEmail == "" {
		return fmt.Errorf("ADMIN_EMAIL not configured, cannot send notification")
	}
	return e.SendEmail(adminEmail, "New Sponsorship Verification Request", body.String())
}

func (e *EmailService) SendBMCMembershipNotification(eventType, userNickname, membershipName, userEmail string) error {
	adminEmail := e.getAdminEmail()
	if adminEmail == "" {
		return fmt.Errorf("ADMIN_EMAIL not configured, cannot send notification")
	}

	var subject string
	var statusText string
	var statusColor string

	switch eventType {
	case "membership.started":
		subject = "🎉 New Buy Me a Coffee Member - Retreat"
		statusText = "New Membership Started"
		statusColor = "#10b981"
	case "membership.cancelled":
		subject = "⚠️ Buy Me a Coffee Member Cancelled - Retreat"
		statusText = "Membership Cancelled"
		statusColor = "#ef4444"
	case "membership.updated":
		subject = "📝 Buy Me a Coffee Member Updated - Retreat"
		statusText = "Membership Updated"
		statusColor = "#3b82f6"
	default:
		subject = "📋 Buy Me a Coffee Membership Event - Retreat"
		statusText = "Membership Event"
		statusColor = "#6b7280"
	}

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{.Subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: {{.StatusColor}}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8fafc; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{.StatusText}}</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>A Buy Me a Coffee membership event has occurred:</p>
            
            <div class="info-box">
                <h3>Event Details</h3>
                <p><strong>Event Type:</strong> {{.EventType}}</p>
                <p><strong>Membership:</strong> {{.MembershipName}}</p>
                <p><strong>User Nickname:</strong> {{.UserNickname}}</p>
                {{if .UserEmail}}
                <p><strong>User Email:</strong> {{.UserEmail}}</p>
                {{end}}
            </div>
            
            {{if eq .EventType "membership.started"}}
            <p>✅ A new member has subscribed to your "Retreat" membership!</p>
            <p>Their premium access should be automatically granted if they've linked their BMC username in the app.</p>
            {{else if eq .EventType "membership.cancelled"}}
            <p>⚠️ A member has cancelled their "Retreat" membership.</p>
            <p>Their premium access will be automatically revoked.</p>
            {{end}}
            
            <p>Best regards,<br>Retreat Receipt Store System</p>
        </div>
        <div class="footer">
            <p>This email was sent by Retreat - Buy Me a Coffee Integration</p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("bmc_notification").Parse(tmpl)
	if err != nil {
		return fmt.Errorf("failed to parse template: %v", err)
	}

	var body bytes.Buffer
	err = t.Execute(&body, map[string]interface{}{
		"Subject":        subject,
		"StatusText":     statusText,
		"StatusColor":    statusColor,
		"EventType":      eventType,
		"MembershipName": membershipName,
		"UserNickname":   userNickname,
		"UserEmail":      userEmail,
	})
	if err != nil {
		return fmt.Errorf("failed to execute template: %v", err)
	}

	return e.SendEmail(adminEmail, subject, body.String())
}

func (e *EmailService) SendVerificationStatusUpdate(userEmail string, status string, reason string) error {
	var subject string
	var statusText string
	var statusColor string

	switch status {
	case "approved":
		subject = "✅ Sponsorship Verification Approved"
		statusText = "Your sponsorship verification has been approved!"
		statusColor = "#10b981"
	case "rejected":
		subject = "❌ Sponsorship Verification Rejected"
		statusText = "Your sponsorship verification has been rejected."
		statusColor = "#ef4444"
	default:
		subject = "📋 Sponsorship Verification Update"
		statusText = "Your sponsorship verification status has been updated."
		statusColor = "#6b7280"
	}

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{.Subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: {{.StatusColor}}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8fafc; }
        .status-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{.StatusText}}</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            
            <div class="status-info">
                <h3>Verification Status: {{.Status}}</h3>
                {{if .Reason}}
                <p><strong>Reason:</strong> {{.Reason}}</p>
                {{end}}
            </div>
            
            {{if eq .Status "approved"}}
            <p>🎉 Congratulations! You now have access to premium features:</p>
            <ul>
                <li>Up to 50 receipts (10x more than free tier)</li>
                <li>PDF receipt parsing</li>
                <li>Early access to new features</li>
                <li>Advanced email parsing</li>
                <li>Priority support</li>
            </ul>
            {{else if eq .Status "rejected"}}
            <p>If you believe this is an error, please contact support with additional proof of your sponsorship.</p>
            {{end}}
            
            <p>Best regards,<br>The Receipt Store Team</p>
        </div>
        <div class="footer">
            <p>This email was sent by Receipt Store - Sponsorship Verification System</p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("status_update").Parse(tmpl)
	if err != nil {
		return fmt.Errorf("failed to parse template: %v", err)
	}

	var body bytes.Buffer
	err = t.Execute(&body, map[string]interface{}{
		"Subject":     subject,
		"StatusText":  statusText,
		"Status":      status,
		"StatusColor": statusColor,
		"Reason":      reason,
	})
	if err != nil {
		return fmt.Errorf("failed to execute template: %v", err)
	}

	return e.SendEmail(userEmail, subject, body.String())
}

func (e *EmailService) getAdminEmail() string {
	adminEmail := os.Getenv("ADMIN_EMAIL")
	if adminEmail != "" {
		return strings.TrimSpace(adminEmail)
	}

	adminEmails := os.Getenv("ADMIN_EMAILS")
	if adminEmails != "" {
		emails := strings.Split(adminEmails, ",")
		if len(emails) > 0 {
			return strings.TrimSpace(emails[0])
		}
	}

	return ""
}

type ReceiptInfo struct {
	ID             string
	UserID         string
	Store          string
	Item           string
	PurchaseDate   string
	WarrantyExpiry string
	Amount         float64
}

type SponsorshipVerificationRequest struct {
	Platform       string
	Username       string
	UserEmail      string
	UserID         string
	RequestDate    string
	Proof          string
	ScreenshotPath string
}
