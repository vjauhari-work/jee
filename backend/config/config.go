package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	MongoURI       string
	MongoDBName    string
	JWTSecret      string
	AdminUsername  string
	AdminPassword  string
	AdminEmail     string
	Port           string
	AllowedOrigins []string
	CookieSecure   bool
}

const minJWTSecretLen = 32

func Load() *Config {
	return &Config{
		MongoURI:       getEnv("MONGO_URI", "mongodb://localhost:27017/jeeprep"),
		MongoDBName:    getEnv("MONGO_DB_NAME", "jeeprep"),
		JWTSecret:      os.Getenv("JWT_SECRET"),
		AdminUsername:  getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword:  os.Getenv("ADMIN_PASSWORD"),
		AdminEmail:     getEnv("ADMIN_EMAIL", "admin@jeeprep.local"),
		Port:           getEnv("PORT", "8080"),
		AllowedOrigins: splitList(os.Getenv("ALLOWED_ORIGINS")),
		CookieSecure:   os.Getenv("COOKIE_SECURE") == "true",
	}
}

// ValidateSecrets ensures the server never starts with missing or
// known-weak credentials. Called by the API server, not by CLI tools
// that only need database access.
func (c *Config) ValidateSecrets() error {
	if len(c.JWTSecret) < minJWTSecretLen {
		return fmt.Errorf("JWT_SECRET must be set and at least %d characters (generate one with: openssl rand -hex 32)", minJWTSecretLen)
	}
	if weakSecrets[c.JWTSecret] {
		return fmt.Errorf("JWT_SECRET is set to a known placeholder value; generate a real secret with: openssl rand -hex 32")
	}
	if len(c.AdminPassword) < 8 {
		return fmt.Errorf("ADMIN_PASSWORD must be set and at least 8 characters")
	}
	if weakSecrets[c.AdminPassword] {
		return fmt.Errorf("ADMIN_PASSWORD is set to a known weak value; choose a real password")
	}
	return nil
}

var weakSecrets = map[string]bool{
	"dev-secret-change-me":           true,
	"change-this-to-a-random-string": true,
	"changeme":                       true,
	"admin123":                       true,
	"password":                       true,
	"password123":                    true,
}

func splitList(val string) []string {
	if val == "" {
		return nil
	}
	var out []string
	for _, part := range strings.Split(val, ",") {
		if p := strings.TrimSpace(part); p != "" {
			out = append(out, p)
		}
	}
	return out
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
