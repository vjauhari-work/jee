package handlers

import "testing"

func TestExtractPathParam(t *testing.T) {
	tests := []struct {
		path, prefix, suffix, expected string
	}{
		{"/api/questions/abc123/answer", "/api/questions/", "/answer", "abc123"},
		{"/api/questions//answer", "/api/questions/", "/answer", ""},
		{"/api/quiz/sess456", "/api/quiz/", "", "sess456"},
		{"", "/api/", "/end", ""},
	}

	for _, tt := range tests {
		result := extractPathParam(tt.path, tt.prefix, tt.suffix)
		if result != tt.expected {
			t.Errorf("extractPathParam(%q, %q, %q) = %q, want %q",
				tt.path, tt.prefix, tt.suffix, result, tt.expected)
		}
	}
}
