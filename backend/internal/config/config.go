package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Server ServerConfig

	Database DatabaseConfig

	Auth AuthConfig

	Email EmailConfig

	BuyMeACoffee BuyMeACoffeeConfig

	Admin AdminConfig

	Security SecurityConfig

	Logging LoggingConfig
}

type ServerConfig struct {
	Port            string
	GinMode         string
	DevMode         bool
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration
}

type DatabaseConfig struct {
	URL             string
	Host            string
	Port            string
	User            string
	Password        string
	Name            string
	SSLMode         string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
}

type AuthConfig struct {
	ClerkSecretKey string
}

type EmailConfig struct {
	SMTPHost             string
	SMTPPort             int
	SMTPUsername         string
	SMTPPassword         string
	FromEmail            string
	InboundEmail         string
	InboundWebhookSecret string

	VerificationBaseURL string

	VerifyRequired bool
}

type BuyMeACoffeeConfig struct {
	WebhookSecret string
}

type AdminConfig struct {
	Emails    []string
	UserIDs   []string
	Usernames []string
}

type SecurityConfig struct {
	JWTSecret         string
	RateLimitRequests int
	RateLimitWindow   int
	MaxFileSize       int64
	UploadPath        string
	TrustedProxies    []string
}

type LoggingConfig struct {
	Level  string
	Format string
}

func Load() *Config {
	cfg := &Config{
		Server: ServerConfig{
			Port:            getEnv("PORT", "8080"),
			GinMode:         getEnv("GIN_MODE", "release"),
			DevMode:         getEnvBool("DEV_MODE", false),
			ReadTimeout:     getEnvDuration("READ_TIMEOUT", 10*time.Second),
			WriteTimeout:    getEnvDuration("WRITE_TIMEOUT", 30*time.Second),
			IdleTimeout:     getEnvDuration("IDLE_TIMEOUT", 120*time.Second),
			ShutdownTimeout: getEnvDuration("SHUTDOWN_TIMEOUT", 30*time.Second),
		},
		Database: DatabaseConfig{
			URL:             getEnv("DATABASE_URL", ""),
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnv("DB_PORT", "5432"),
			User:            getEnv("DB_USER", "postgres"),
			Password:        getEnv("DB_PASSWORD", ""),
			Name:            getEnv("DB_NAME", "receiptlocker"),
			SSLMode:         getEnv("DB_SSLMODE", "require"),
			MaxOpenConns:    getEnvInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:    getEnvInt("DB_MAX_IDLE_CONNS", 5),
			ConnMaxLifetime: getEnvDuration("DB_CONN_MAX_LIFETIME", 5*time.Minute),
			ConnMaxIdleTime: getEnvDuration("DB_CONN_MAX_IDLE_TIME", 1*time.Minute),
		},
		Auth: AuthConfig{
			ClerkSecretKey: getEnv("CLERK_SECRET_KEY", ""),
		},
		Email: EmailConfig{
			SMTPHost:             getEnv("SMTP_HOST", "smtp.gmail.com"),
			SMTPPort:             getEnvInt("SMTP_PORT", 587),
			SMTPUsername:         getEnv("SMTP_USERNAME", ""),
			SMTPPassword:         getEnv("SMTP_PASSWORD", ""),
			FromEmail:            getEnv("FROM_EMAIL", "noreply@retreat-app.tech"),
			InboundEmail:         getEnv("INBOUND_EMAIL", "save@retreat-app.tech"),
			InboundWebhookSecret: getEnv("INBOUND_EMAIL_WEBHOOK_SECRET", ""),
			VerificationBaseURL:  getEnv("VERIFICATION_BASE_URL", "https://api.retreat-app.tech/api/v1"),
			VerifyRequired:       getEnvBool("VERIFY_EMAILS_REQUIRED", true),
		},
		BuyMeACoffee: BuyMeACoffeeConfig{
			WebhookSecret: getEnv("BUYMEACOFFEE_WEBHOOK_SECRET", ""),
		},

		Admin: AdminConfig{
			Emails:    getEnvSlice("ADMIN_EMAILS", []string{}),
			UserIDs:   getEnvSlice("ADMIN_USER_IDS", []string{}),
			Usernames: getEnvSlice("ADMIN_USERNAMES", []string{}),
		},
		Security: SecurityConfig{
			JWTSecret:         getEnv("JWT_SECRET", ""),
			RateLimitRequests: getEnvInt("RATE_LIMIT_REQUESTS", 100),
			RateLimitWindow:   getEnvInt("RATE_LIMIT_WINDOW", 60),
			MaxFileSize:       getEnvInt64("MAX_FILE_SIZE", 10485760),
			UploadPath:        getEnv("UPLOAD_PATH", "/tmp/uploads"),
			TrustedProxies:    getEnvSlice("TRUSTED_PROXIES", []string{}),
		},
		Logging: LoggingConfig{
			Level:  getEnv("LOG_LEVEL", "info"),
			Format: getEnv("LOG_FORMAT", "json"),
		},
	}

	return cfg
}

func (c *Config) Validate() error {

	if !c.Server.DevMode {
		if c.Database.URL == "" && c.Database.Password == "" {
			return fmt.Errorf("database password is required in production mode")
		}
		if c.Auth.ClerkSecretKey == "" {
			return fmt.Errorf("CLERK_SECRET_KEY is required in production mode")
		}
	}

	if c.Database.MaxOpenConns < 1 {
		return fmt.Errorf("DB_MAX_OPEN_CONNS must be at least 1")
	}
	if c.Database.MaxIdleConns < 1 {
		return fmt.Errorf("DB_MAX_IDLE_CONNS must be at least 1")
	}
	if c.Database.MaxIdleConns > c.Database.MaxOpenConns {
		return fmt.Errorf("DB_MAX_IDLE_CONNS cannot exceed DB_MAX_OPEN_CONNS")
	}

	if c.Server.ReadTimeout < 1*time.Second {
		return fmt.Errorf("READ_TIMEOUT must be at least 1 second")
	}
	if c.Server.WriteTimeout < 1*time.Second {
		return fmt.Errorf("WRITE_TIMEOUT must be at least 1 second")
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseInt(value, 10, 64); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if parsed, err := time.ParseDuration(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {

		result := []string{}
		for _, item := range splitByComma(value) {
			if trimmed := trim(item); trimmed != "" {
				result = append(result, trimmed)
			}
		}
		if len(result) > 0 {
			return result
		}
	}
	return defaultValue
}

func splitByComma(s string) []string {
	result := []string{}
	current := ""
	for _, char := range s {
		if char == ',' {
			result = append(result, current)
			current = ""
		} else {
			current += string(char)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

func trim(s string) string {

	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n') {
		end--
	}
	return s[start:end]
}
