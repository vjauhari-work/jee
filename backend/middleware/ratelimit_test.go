package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func doLimitedRequest(handler http.HandlerFunc, ip string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
	req.Header.Set("X-Real-IP", ip)
	rr := httptest.NewRecorder()
	handler(rr, req)
	return rr
}

func TestRateLimiter_AllowsUnderLimit(t *testing.T) {
	rl := NewRateLimiter(3, time.Minute)
	handler := rl.Wrap(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	for i := 0; i < 3; i++ {
		if rr := doLimitedRequest(handler, "1.2.3.4"); rr.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i+1, rr.Code)
		}
	}
}

func TestRateLimiter_BlocksOverLimit(t *testing.T) {
	rl := NewRateLimiter(2, time.Minute)
	handler := rl.Wrap(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	doLimitedRequest(handler, "1.2.3.4")
	doLimitedRequest(handler, "1.2.3.4")
	if rr := doLimitedRequest(handler, "1.2.3.4"); rr.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429 after limit exceeded, got %d", rr.Code)
	}
}

func TestRateLimiter_SeparateClients(t *testing.T) {
	rl := NewRateLimiter(1, time.Minute)
	handler := rl.Wrap(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	doLimitedRequest(handler, "1.1.1.1")
	if rr := doLimitedRequest(handler, "2.2.2.2"); rr.Code != http.StatusOK {
		t.Errorf("expected separate client to be allowed, got %d", rr.Code)
	}
}

func TestRateLimiter_WindowResets(t *testing.T) {
	rl := NewRateLimiter(1, time.Minute)
	current := time.Unix(1000, 0)
	rl.now = func() time.Time { return current }

	if !rl.allow("1.2.3.4") {
		t.Fatal("first request should be allowed")
	}
	if rl.allow("1.2.3.4") {
		t.Fatal("second request in window should be blocked")
	}

	current = current.Add(2 * time.Minute)
	if !rl.allow("1.2.3.4") {
		t.Error("request after window expiry should be allowed")
	}
}
