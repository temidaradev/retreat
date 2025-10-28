package middleware

import (
	"os"
	"regexp"
	"strings"

	"receiptlocker/internal/config"
	"receiptlocker/internal/logging"

	"github.com/gofiber/fiber/v2"
)

func AdminAuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {

		userID := c.Locals("userID")
		userEmail := c.Locals("userEmail")

		if userID == nil {
			logging.Warn("Admin access attempt without authentication", map[string]interface{}{
				"ip":   c.IP(),
				"path": c.Path(),
			})
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authentication required",
			})
		}

		userIDStr, _ := userID.(string)
		userEmailStr, _ := userEmail.(string)
		usernameStr, _ := c.Locals("username").(string)

		logging.Info("Admin check - extracted user info", map[string]interface{}{
			"user_id":  userIDStr,
			"email":    userEmailStr,
			"username": usernameStr,
		})

		var adminEmails []string
		var adminUserIDs []string
		var adminUsernames []string

		if cfg, ok := c.Locals("config").(*config.Config); ok {
			adminEmails = cfg.Admin.Emails
			adminUserIDs = cfg.Admin.UserIDs
			adminUsernames = cfg.Admin.Usernames
			logging.Info("Admin config loaded from app config", map[string]interface{}{
				"admin_emails_count":    len(adminEmails),
				"admin_user_ids_count":  len(adminUserIDs),
				"admin_usernames_count": len(adminUsernames),
			})
		} else {

			adminEmailsEnv := os.Getenv("ADMIN_EMAILS")
			adminUserIDsEnv := os.Getenv("ADMIN_USER_IDS")
			adminUsernamesEnv := os.Getenv("ADMIN_USERNAMES")

			if adminEmailsEnv != "" {
				adminEmails = strings.Split(adminEmailsEnv, ",")
				for i := range adminEmails {
					adminEmails[i] = strings.TrimSpace(adminEmails[i])
				}
			}

			if adminUserIDsEnv != "" {
				adminUserIDs = strings.Split(adminUserIDsEnv, ",")
				for i := range adminUserIDs {
					adminUserIDs[i] = strings.TrimSpace(adminUserIDs[i])
				}
			}

			if adminUsernamesEnv != "" {
				adminUsernames = strings.Split(adminUsernamesEnv, ",")
				for i := range adminUsernames {
					adminUsernames[i] = strings.TrimSpace(adminUsernames[i])
				}
			}
		}

		isAdmin := false
		for _, email := range adminEmails {
			emailTrimmed := strings.TrimSpace(email)

			if strings.EqualFold(emailTrimmed, userEmailStr) {
				isAdmin = true
				break
			}

			if strings.Contains(emailTrimmed, "*") {
				pattern := strings.ToLower(emailTrimmed)
				pattern = strings.ReplaceAll(pattern, ".", "\\.")
				pattern = strings.ReplaceAll(pattern, "*", ".*")
				matched, _ := regexp.MatchString("^"+pattern+"$", strings.ToLower(userEmailStr))
				if matched {
					isAdmin = true
					break
				}
			}
		}

		if !isAdmin {
			for _, id := range adminUserIDs {
				if strings.TrimSpace(id) == userIDStr {
					isAdmin = true
					break
				}
			}
		}

		if !isAdmin && usernameStr != "" {
			usernameLower := strings.ToLower(usernameStr)
			for _, username := range adminUsernames {
				if strings.EqualFold(strings.TrimSpace(username), usernameLower) {
					isAdmin = true
					logging.Info("Admin access granted via username match", map[string]interface{}{
						"username": usernameStr,
						"matched":  username,
					})
					break
				}
			}
		}

		if !isAdmin {
			logging.Warn("Unauthorized admin access attempt", map[string]interface{}{
				"user_id":         userIDStr,
				"email":           userEmailStr,
				"username":        usernameStr,
				"ip":              c.IP(),
				"path":            c.Path(),
				"admin_emails":    adminEmails,
				"admin_user_ids":  adminUserIDs,
				"admin_usernames": adminUsernames,
			})
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Admin access required",
			})
		}

		c.Locals("isAdmin", true)

		logging.Info("Admin access granted", map[string]interface{}{
			"user_id":  userIDStr,
			"email":    userEmailStr,
			"username": usernameStr,
			"path":     c.Path(),
		})

		return c.Next()
	}
}
