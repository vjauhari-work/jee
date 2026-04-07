package services

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"

	"github.com/jung-kurt/gofpdf"

	"github.com/vjauhari-work/jee/backend/models"
)

// StripLaTeX removes common LaTeX commands for plain-text PDF rendering.
// Matches \cmd{arg1}{arg2} (two-arg commands like \frac), \cmd{arg}, bare \cmd, and $...$
var latexPattern = regexp.MustCompile(`\\[a-zA-Z]+\{([^}]*)\}\{([^}]*)\}|\\[a-zA-Z]+\{([^}]*)\}|\\[a-zA-Z]+|\$([^$]*)\$`)

func StripLaTeX(s string) string {
	result := latexPattern.ReplaceAllStringFunc(s, func(match string) string {
		// Extract content from $...$
		if strings.HasPrefix(match, "$") && strings.HasSuffix(match, "$") {
			return strings.Trim(match, "$")
		}
		// Extract content from \cmd{...}: return first brace group's content
		if idx := strings.Index(match, "{"); idx >= 0 {
			end := strings.Index(match[idx:], "}")
			if end >= 0 {
				return match[idx+1 : idx+end]
			}
		}
		return match
	})
	return strings.TrimSpace(result)
}

// GenerateTopicPDF creates a PDF document with questions for a given topic.
func GenerateTopicPDF(section, subject, topic string, questions []models.Question) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 15)

	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	title := fmt.Sprintf("%s — %s — %s", formatSection(section), strings.Title(subject), topic)
	pdf.CellFormat(0, 10, title, "", 1, "C", false, 0, "")
	pdf.Ln(5)

	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(0, 6, fmt.Sprintf("Total Questions: %d", len(questions)), "", 1, "C", false, 0, "")
	pdf.Ln(10)

	for i, q := range questions {
		// Check if we need a new page (if less than 40mm remaining)
		if pdf.GetY() > 250 {
			pdf.AddPage()
		}

		pdf.SetFont("Arial", "B", 11)
		qText := StripLaTeX(q.QuestionText)
		pdf.MultiCell(0, 6, fmt.Sprintf("Q%d. (%d) %s", i+1, q.Year, qText), "", "L", false)
		pdf.Ln(2)

		pdf.SetFont("Arial", "", 10)
		for _, opt := range q.Options {
			optText := StripLaTeX(opt.Text)
			pdf.CellFormat(0, 6, fmt.Sprintf("  (%s) %s", opt.Label, optText), "", 1, "L", false, 0, "")
		}
		pdf.Ln(5)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func formatSection(s string) string {
	switch s {
	case models.SectionBoards11:
		return "Boards Class 11"
	case models.SectionBoards12:
		return "Boards Class 12"
	case models.SectionJEEMains:
		return "JEE Mains"
	case models.SectionJEEAdvanced:
		return "JEE Advanced"
	default:
		return s
	}
}
