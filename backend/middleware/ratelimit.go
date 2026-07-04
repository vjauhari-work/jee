package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"
)

// RateLimiter is a fixed-window per-client limiter intended for
// brute-force-sensitive endpoints such as login and register.
type RateLimiter struct {
	mu       sync.Mutex
	window   time.Duration
	limit    int
	counts   map[string]*windowCount
	now      func() time.Time
	lastSwep time.Time
}

type windowCount struct {
	start time.Time
	n     int
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		window: window,
		limit:  limit,
		counts: make(map[string]*windowCount),
		now:    time.Now,
	}
}

// Wrap limits requests per client IP. Behind nginx the backend sees
// nginx's address, so the X-Real-IP header set by the proxy is
// preferred; the backend port must not be reachable except through
// the proxy for that header to be trustworthy.
func (rl *RateLimiter) Wrap(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !rl.allow(clientIP(r)) {
			w.Header().Set("Retry-After", "60")
			http.Error(w, `{"error":"too many requests, try again later"}`, http.StatusTooManyRequests)
			return
		}
		next(w, r)
	}
}

func (rl *RateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := rl.now()
	// Drop expired windows occasionally so the map cannot grow unbounded.
	if now.Sub(rl.lastSwep) > rl.window {
		for k, wc := range rl.counts {
			if now.Sub(wc.start) > rl.window {
				delete(rl.counts, k)
			}
		}
		rl.lastSwep = now
	}

	wc, ok := rl.counts[key]
	if !ok || now.Sub(wc.start) > rl.window {
		rl.counts[key] = &windowCount{start: now, n: 1}
		return true
	}
	wc.n++
	return wc.n <= rl.limit
}

func clientIP(r *http.Request) string {
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
