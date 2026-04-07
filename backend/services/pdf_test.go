package services

import "testing"

func TestStripLaTeX(t *testing.T) {
	tests := []struct {
		input, expected string
	}{
		{`$x^2 + y^2 = r^2$`, `x^2 + y^2 = r^2`},
		{`\frac{a}{b}`, `a`},
		{`plain text`, `plain text`},
		{`\sqrt{16}`, `16`},
		{`The value of $\pi$ is`, `The value of \pi is`},
	}

	for _, tt := range tests {
		result := StripLaTeX(tt.input)
		if result != tt.expected {
			t.Errorf("StripLaTeX(%q) = %q, want %q", tt.input, result, tt.expected)
		}
	}
}
