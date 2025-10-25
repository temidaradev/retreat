package middleware

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// ClerkClaims represents the JWT claims from Clerk
type ClerkClaims struct {
	Sub   string `json:"sub"`   // User ID
	Email string `json:"email"` // User email
	jwt.RegisteredClaims
}

// ClerkJWKS represents the JWKS response from Clerk
type ClerkJWKS struct {
	Keys []ClerkJWK `json:"keys"`
}

// ClerkJWK represents a single JWK
type ClerkJWK struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
	Alg string `json:"alg"`
}

// ClerkAuthMiddleware validates Clerk JWT tokens
func ClerkAuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Development mode bypass - check if CLERK_SECRET_KEY is not set OR if DEV_MODE is set
		clerkSecretKey := os.Getenv("CLERK_SECRET_KEY")
		devMode := os.Getenv("DEV_MODE")
		if clerkSecretKey == "" || devMode == "true" {
			// Development mode - use X-User-ID header
			userID := c.Get("X-User-ID")
			if userID == "" {
				userID = "demo-user" // Default user for development
			}
			c.Locals("userID", userID)
			c.Locals("userEmail", "demo@example.com")
			return c.Next()
		}

		// Get the Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header required",
			})
		}

		// Check if it starts with "Bearer "
		if !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		// Extract the token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Parse and validate the token
		claims, err := validateClerkToken(tokenString)
		if err != nil {
			log.Printf("Token validation error: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token",
			})
		}

		// Store user information in context
		c.Locals("userID", claims.Sub)
		c.Locals("userEmail", claims.Email)

		return c.Next()
	}
}

// validateClerkToken validates a Clerk JWT token
func validateClerkToken(tokenString string) (*ClerkClaims, error) {
	// Parse the token without verification first to get the kid
	token, err := jwt.ParseWithClaims(tokenString, &ClerkClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify the signing method
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Get the kid from the token header
		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("kid not found in token header")
		}

		// Get the public key for this kid
		publicKey, err := getClerkPublicKey(kid)
		if err != nil {
			return nil, fmt.Errorf("failed to get public key: %v", err)
		}

		return publicKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*ClerkClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// getClerkPublicKey fetches and parses the public key from Clerk
func getClerkPublicKey(kid string) (*rsa.PublicKey, error) {
	// Get Clerk JWKS URL from environment (e.g., https://your-instance.clerk.accounts.dev/.well-known/jwks.json)
	jwksURL := os.Getenv("CLERK_JWKS_URL")
	if jwksURL == "" {
		// Default to extracting from secret key environment variable
		clerkSecretKey := os.Getenv("CLERK_SECRET_KEY")
		if clerkSecretKey == "" {
			return nil, fmt.Errorf("CLERK_SECRET_KEY or CLERK_JWKS_URL environment variable not set")
		}

		// For Clerk, we can derive the JWKS URL from the frontend domain
		// This is a fallback - it's better to set CLERK_JWKS_URL explicitly
		// The JWKS is at: https://<clerk-frontend-api>/.well-known/jwks.json
		clerkFrontendAPI := os.Getenv("CLERK_FRONTEND_API")
		if clerkFrontendAPI == "" {
			return nil, fmt.Errorf("CLERK_FRONTEND_API environment variable not set (e.g., heroic-dragon-8.clerk.accounts.dev)")
		}
		jwksURL = fmt.Sprintf("https://%s/.well-known/jwks.json", clerkFrontendAPI)
	}

	log.Printf("Fetching JWKS from: %s", jwksURL)

	// Fetch JWKS from Clerk
	resp, err := http.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch JWKS: status %d", resp.StatusCode)
	}

	var jwks ClerkJWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, fmt.Errorf("failed to decode JWKS: %v", err)
	}

	// Find the key with matching kid
	var jwk ClerkJWK
	found := false
	for _, key := range jwks.Keys {
		if key.Kid == kid {
			jwk = key
			found = true
			break
		}
	}

	if !found {
		return nil, fmt.Errorf("key with kid %s not found in JWKS", kid)
	}

	// Parse the RSA public key
	return parseRSAPublicKey(jwk.N, jwk.E)
}

// parseRSAPublicKey parses RSA public key from modulus and exponent
func parseRSAPublicKey(n, e string) (*rsa.PublicKey, error) {
	// Decode base64url encoded values
	nBytes, err := base64.RawURLEncoding.DecodeString(n)
	if err != nil {
		return nil, fmt.Errorf("failed to decode modulus: %v", err)
	}

	eBytes, err := base64.RawURLEncoding.DecodeString(e)
	if err != nil {
		return nil, fmt.Errorf("failed to decode exponent: %v", err)
	}

	// Convert to big integers
	nBig := new(big.Int)
	nBig.SetBytes(nBytes)

	eBig := new(big.Int)
	eBig.SetBytes(eBytes)

	// Create RSA public key
	publicKey := &rsa.PublicKey{
		N: nBig,
		E: int(eBig.Int64()),
	}

	return publicKey, nil
}
