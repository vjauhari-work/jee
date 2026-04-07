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

func TestStripLaTeX_EmptyString(t *testing.T) {
	result := StripLaTeX("")
	if result != "" {
		t.Errorf("StripLaTeX(\"\") = %q, want \"\"", result)
	}
}

func TestStripLaTeX_NoLatex(t *testing.T) {
	input := "The acceleration due to gravity is 9.8 m/s^2 on Earth."
	result := StripLaTeX(input)
	if result != input {
		t.Errorf("StripLaTeX(%q) = %q, want %q", input, result, input)
	}
}

func TestStripLaTeX_NestedCommands(t *testing.T) {
	// \frac{a}{b} should return the numerator (first brace group)
	tests := []struct {
		input, expected string
	}{
		{`\frac{x}{y}`, `x`},
		{`\frac{2}{3}`, `2`},
		{`\sqrt{x^2}`, `x^2`},
	}

	for _, tt := range tests {
		result := StripLaTeX(tt.input)
		if result != tt.expected {
			t.Errorf("StripLaTeX(%q) = %q, want %q", tt.input, result, tt.expected)
		}
	}
}

func TestStripLaTeX_MultipleDollarExpressions(t *testing.T) {
	// Each $...$ expression should have its delimiters stripped
	input := `Find $x$ and $y$ such that $x + y = 10$`
	result := StripLaTeX(input)
	expected := `Find x and y such that x + y = 10`
	if result != expected {
		t.Errorf("StripLaTeX(%q) = %q, want %q", input, result, expected)
	}
}
