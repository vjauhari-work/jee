package config

import (
	"os"
	"strings"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	cfg := Load()
	if cfg.Port != "8080" {
		t.Errorf("expected default port 8080, got %s", cfg.Port)
	}
	if cfg.MongoDBName != "jeeprep" {
		t.Errorf("expected default db name jeeprep, got %s", cfg.MongoDBName)
	}
	if cfg.CookieSecure {
		t.Error("expected CookieSecure to default to false")
	}
	if cfg.AllowedOrigins != nil {
		t.Errorf("expected no allowed origins by default, got %v", cfg.AllowedOrigins)
	}
}

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("PORT", "9090")
	os.Setenv("ALLOWED_ORIGINS", "http://localhost:5173, https://example.com")
	os.Setenv("COOKIE_SECURE", "true")
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("ALLOWED_ORIGINS")
		os.Unsetenv("COOKIE_SECURE")
	}()

	cfg := Load()
	if cfg.Port != "9090" {
		t.Errorf("expected port 9090 from env, got %s", cfg.Port)
	}
	if len(cfg.AllowedOrigins) != 2 || cfg.AllowedOrigins[0] != "http://localhost:5173" || cfg.AllowedOrigins[1] != "https://example.com" {
		t.Errorf("expected parsed origins list, got %v", cfg.AllowedOrigins)
	}
	if !cfg.CookieSecure {
		t.Error("expected CookieSecure true from env")
	}
}

func TestValidateSecrets(t *testing.T) {
	valid := &Config{
		JWTSecret:     strings.Repeat("a", 64),
		AdminPassword: "a-strong-password",
	}
	if err := valid.ValidateSecrets(); err != nil {
		t.Errorf("expected valid secrets to pass, got %v", err)
	}

	cases := []struct {
		name string
		cfg  Config
	}{
		{"missing jwt secret", Config{AdminPassword: "a-strong-password"}},
		{"short jwt secret", Config{JWTSecret: "short", AdminPassword: "a-strong-password"}},
		{"placeholder jwt secret", Config{JWTSecret: "change-this-to-a-random-string", AdminPassword: "a-strong-password"}},
		{"missing admin password", Config{JWTSecret: strings.Repeat("a", 64)}},
		{"short admin password", Config{JWTSecret: strings.Repeat("a", 64), AdminPassword: "abc"}},
		{"weak admin password", Config{JWTSecret: strings.Repeat("a", 64), AdminPassword: "admin123"}},
	}
	for _, tc := range cases {
		if err := tc.cfg.ValidateSecrets(); err == nil {
			t.Errorf("%s: expected validation error, got nil", tc.name)
		}
	}
}
