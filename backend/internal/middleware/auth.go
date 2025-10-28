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

type ClerkClaims struct {
	Sub      string `json:"sub"`
	Email    string `json:"email"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

type ClerkJWKS struct {
	Keys []ClerkJWK `json:"keys"`
}

type ClerkJWK struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
	Alg string `json:"alg"`
}

func ClerkAuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {

		clerkSecretKey := os.Getenv("CLERK_SECRET_KEY")
		devMode := os.Getenv("DEV_MODE")
		if clerkSecretKey == "" || devMode == "true" {

			userID := c.Get("X-User-ID")
			if userID == "" {
				userID = "demo-user"
			}
			c.Locals("userID", userID)
			c.Locals("userEmail", "demo@example.com")
			c.Locals("username", "demo")
			return c.Next()
		}

		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header required",
			})
		}

		if !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		claims, err := validateClerkToken(tokenString)
		if err != nil {
			log.Printf("Token validation error: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token",
			})
		}

		c.Locals("userID", claims.Sub)
		c.Locals("userEmail", claims.Email)
		c.Locals("username", claims.Username)

		if claims.Email == "" && claims.Username == "" {
			log.Printf("[DEBUG] Clerk token for user %s - email and username not present in token (this is normal for Clerk v2 unless JWT template is customized)", claims.Sub)
		}

		return c.Next()
	}
}

func validateClerkToken(tokenString string) (*ClerkClaims, error) {

	token, err := jwt.ParseWithClaims(tokenString, &ClerkClaims{}, func(token *jwt.Token) (interface{}, error) {

		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("kid not found in token header")
		}

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

func getClerkPublicKey(kid string) (*rsa.PublicKey, error) {

	var jwksURL string

	if explicitURL := os.Getenv("CLERK_JWKS_URL"); explicitURL != "" {
		jwksURL = explicitURL
		log.Printf("Using explicit JWKS URL from CLERK_JWKS_URL: %s", jwksURL)
	} else if frontendAPI := os.Getenv("CLERK_FRONTEND_API"); frontendAPI != "" {

		jwksURL = fmt.Sprintf("https://%s/.well-known/jwks.json", frontendAPI)
		log.Printf("Constructing JWKS URL from CLERK_FRONTEND_API: %s", jwksURL)
	} else {
		return nil, fmt.Errorf("CLERK_FRONTEND_API or CLERK_JWKS_URL environment variable must be set")
	}

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

	return parseRSAPublicKey(jwk.N, jwk.E)
}

func parseRSAPublicKey(n, e string) (*rsa.PublicKey, error) {

	nBytes, err := base64.RawURLEncoding.DecodeString(n)
	if err != nil {
		return nil, fmt.Errorf("failed to decode modulus: %v", err)
	}

	eBytes, err := base64.RawURLEncoding.DecodeString(e)
	if err != nil {
		return nil, fmt.Errorf("failed to decode exponent: %v", err)
	}

	nBig := new(big.Int)
	nBig.SetBytes(nBytes)

	eBig := new(big.Int)
	eBig.SetBytes(eBytes)

	publicKey := &rsa.PublicKey{
		N: nBig,
		E: int(eBig.Int64()),
	}

	return publicKey, nil
}
