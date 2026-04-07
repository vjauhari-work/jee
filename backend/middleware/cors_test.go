package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORS_OptionsRequest(t *testing.T) {
	handler := CORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Should not be called for OPTIONS
		t.Error("next handler should not be called for OPTIONS request")
	}))

	req := httptest.NewRequest(http.MethodOptions, "/api/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 for OPTIONS, got %d", rr.Code)
	}

	if rr.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
		t.Errorf("expected Access-Control-Allow-Origin to be set, got %q", rr.Header().Get("Access-Control-Allow-Origin"))
	}

	if rr.Header().Get("Access-Control-Allow-Methods") == "" {
		t.Error("expected Access-Control-Allow-Methods to be set")
	}
}

func TestCORS_NonOptionsPassthrough(t *testing.T) {
	nextCalled := false
	handler := CORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	req.Header.Set("Origin", "http://example.com")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if !nextCalled {
		t.Error("expected next handler to be called for non-OPTIONS request")
	}

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}

	if rr.Header().Get("Access-Control-Allow-Origin") != "http://example.com" {
		t.Errorf("expected Access-Control-Allow-Origin to be http://example.com, got %q", rr.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestCORS_AllowCredentials(t *testing.T) {
	handler := CORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Header().Get("Access-Control-Allow-Credentials") != "true" {
		t.Errorf("expected Access-Control-Allow-Credentials to be \"true\", got %q", rr.Header().Get("Access-Control-Allow-Credentials"))
	}
}
