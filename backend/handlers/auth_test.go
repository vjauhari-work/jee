package handlers

import (
	"errors"
	"testing"
)

func TestIsDuplicateKeyError(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		expected bool
	}{
		{"nil error", nil, false},
		{"duplicate key error", errors.New("duplicate key error"), true},
		{"E11000 mongo error", errors.New("E11000 duplicate key error collection"), true},
		{"unrelated error", errors.New("connection refused"), false},
		{"empty error message", errors.New(""), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isDuplicateKeyError(tt.err)
			if result != tt.expected {
				t.Errorf("isDuplicateKeyError(%v) = %v, want %v", tt.err, result, tt.expected)
			}
		})
	}
}

func TestContains(t *testing.T) {
	tests := []struct {
		s, sub   string
		expected bool
	}{
		{"hello world", "world", true},
		{"hello world", "hello", true},
		{"hello world", "lo wo", true},
		{"hello world", "xyz", false},
		{"hello", "hello world", false},
		{"", "x", false},
		{"hello", "", true},
		{"", "", true},
	}

	for _, tt := range tests {
		result := contains(tt.s, tt.sub)
		if result != tt.expected {
			t.Errorf("contains(%q, %q) = %v, want %v", tt.s, tt.sub, result, tt.expected)
		}
	}
}

func TestSearchString(t *testing.T) {
	tests := []struct {
		s, sub   string
		expected bool
	}{
		{"abcdef", "bcd", true},
		{"abcdef", "abc", true},
		{"abcdef", "def", true},
		{"abcdef", "xyz", false},
		{"abcdef", "abcdef", true},
		{"abcdef", "abcdefg", false},
		{"hello", "ello", true},
		{"duplicate key error", "duplicate key", true},
	}

	for _, tt := range tests {
		result := searchString(tt.s, tt.sub)
		if result != tt.expected {
			t.Errorf("searchString(%q, %q) = %v, want %v", tt.s, tt.sub, result, tt.expected)
		}
	}
}
