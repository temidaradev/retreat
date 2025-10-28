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
	Sub      string `json:"sub"`      // User ID
	Email    string `json:"email"`    // User email
	Username string `json:"username"` // User username (e.g., "temidara")
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
			c.Locals("username", "demo") // Default username for development
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
		c.Locals("username", claims.Username)

		// Debug: Log what we extracted (you can remove this later)
		if claims.Email == "" && claims.Username == "" {
			log.Printf("[DEBUG] Clerk token for user %s - email and username not present in token (this is normal for Clerk v2 unless JWT template is customized)", claims.Sub)
		}

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
	// Determine JWKS URL - check environment variables in order of precedence
	var jwksURL string

	// 1. Check for explicit JWKS URL (highest priority)
	if explicitURL := os.Getenv("CLERK_JWKS_URL"); explicitURL != "" {
		jwksURL = explicitURL
		log.Printf("Using explicit JWKS URL from CLERK_JWKS_URL: %s", jwksURL)
	} else if frontendAPI := os.Getenv("CLERK_FRONTEND_API"); frontendAPI != "" {
		// 2. Construct URL from Clerk Frontend API (e.g., heroic-dragon-8.clerk.accounts.dev)
		jwksURL = fmt.Sprintf("https://%s/.well-known/jwks.json", frontendAPI)
		log.Printf("Constructing JWKS URL from CLERK_FRONTEND_API: %s", jwksURL)
	} else {
		return nil, fmt.Errorf("CLERK_FRONTEND_API or CLERK_JWKS_URL environment variable must be set")
	}

	// Fetch JWKS from Clerk
	log.Printf("Fetching JWKS from: %s (for kid: %s)", jwksURL, kid)
	resp, err := http.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS from %s: %v", jwksURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch JWKS from %s: status %d", jwksURL, resp.StatusCode)
	}

	var jwks ClerkJWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, fmt.Errorf("failed to decode JWKS from %s: %v", jwksURL, err)
	}

	log.Printf("Successfully fetched JWKS with %d keys", len(jwks.Keys))

	// Find the key with matching kid
	var jwk ClerkJWK
	found := false
	for _, key := range jwks.Keys {
		if key.Kid == kid {
			jwk = key
			found = true
			log.Printf("Found matching key for kid: %s", kid)
			break
		}
	}

	if !found {
		availableKids := make([]string, len(jwks.Keys))
		for i, key := range jwks.Keys {
			availableKids[i] = key.Kid
		}
		return nil, fmt.Errorf("key with kid %s not found (available kids: %v)", kid, availableKids)
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
