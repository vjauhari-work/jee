package handlers

import "testing"

func TestExtractLastPathSegment(t *testing.T) {
	tests := []struct {
		path, prefix, expected string
	}{
		{"/api/quiz/abc123", "/api/quiz/", "abc123"},
		{"/api/quiz/abc123/submit", "/api/quiz/", "abc123"},
		{"/api/quiz/abc123/results", "/api/quiz/", "abc123"},
		{"/api/quiz/", "/api/quiz/", ""},
		{"/other/path", "/api/quiz/", ""},
		{"", "/api/quiz/", ""},
		{"/api/quiz/sess456/answer", "/api/quiz/", "sess456"},
	}

	for _, tt := range tests {
		result := extractLastPathSegment(tt.path, tt.prefix)
		if result != tt.expected {
			t.Errorf("extractLastPathSegment(%q, %q) = %q, want %q",
				tt.path, tt.prefix, result, tt.expected)
		}
	}
}
