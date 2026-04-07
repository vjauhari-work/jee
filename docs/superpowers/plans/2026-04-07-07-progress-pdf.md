# Progress & PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement user progress tracking (resume from where they left off) and PDF download for topic-wise questions.

**Architecture:** Progress handler uses upsert to save/load the last question index per section+type+filter. PDF service uses gofpdf to generate a formatted document with questions and options (LaTeX stripped to plain text for PDF since gofpdf doesn't render LaTeX natively).

**Tech Stack:** Go 1.22, mongo-go-driver, gofpdf

---

### Task 1: Progress Handler

**Files:**
- Create: `backend/handlers/progress.go`

- [ ] **Step 1: Create progress handler**

```go
package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/vjauhari-work/jee/backend/db"
	"github.com/vjauhari-work/jee/backend/middleware"
	"github.com/vjauhari-work/jee/backend/models"
)

type ProgressHandler struct{}

type saveProgressRequest struct {
	Section           string `json:"section"`
	Type              string `json:"type"`
	FilterValue       string `json:"filter_value"`
	LastQuestionIndex int    `json:"last_question_index"`
	QuizSessionID     string `json:"quiz_session_id,omitempty"`
}

func (h *ProgressHandler) GetProgress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	userID := middleware.GetUserID(r)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	section := r.URL.Query().Get("section")

	if section == "" {
		http.Error(w, `{"error":"section is required"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	filter := bson.M{"user_id": userObjID, "section": section}
	cursor, err := db.Collection("user_progress").Find(ctx, filter)
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var progress []models.UserProgress
	if err := cursor.All(ctx, &progress); err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(progress)
}

func (h *ProgressHandler) SaveProgress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	userID := middleware.GetUserID(r)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	var req saveProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Section == "" || req.Type == "" {
		http.Error(w, `{"error":"section and type are required"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"user_id": userObjID,
		"section": req.Section,
		"type":    req.Type,
	}

	update := bson.M{
		"$set": bson.M{
			"filter_value":       req.FilterValue,
			"last_question_index": req.LastQuestionIndex,
			"updated_at":         time.Now(),
		},
		"$setOnInsert": bson.M{
			"user_id": userObjID,
			"section": req.Section,
			"type":    req.Type,
		},
	}

	if req.QuizSessionID != "" {
		sessionObjID, err := primitive.ObjectIDFromHex(req.QuizSessionID)
		if err == nil {
			update["$set"].(bson.M)["quiz_session_id"] = sessionObjID
		}
	}

	opts := options.Update().SetUpsert(true)
	_, err := db.Collection("user_progress").UpdateOne(ctx, filter, update, opts)
	if err != nil {
		http.Error(w, `{"error":"failed to save progress"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "progress saved"})
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/user/jee/backend && go build ./handlers/`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add backend/handlers/progress.go
git commit -m "feat: add progress handlers (get/save resume point)"
```

---

### Task 2: PDF Service

**Files:**
- Create: `backend/services/pdf.go`

- [ ] **Step 1: Create PDF generation service**

```go
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
var latexPattern = regexp.MustCompile(`\\[a-zA-Z]+\{([^}]*)\}|\\[a-zA-Z]+|\$([^$]*)\$`)

func StripLaTeX(s string) string {
	result := latexPattern.ReplaceAllStringFunc(s, func(match string) string {
		// Extract content from \cmd{content}
		if idx := strings.Index(match, "{"); idx >= 0 {
			end := strings.LastIndex(match, "}")
			if end > idx {
				return match[idx+1 : end]
			}
		}
		// Extract content from $...$
		if strings.HasPrefix(match, "$") && strings.HasSuffix(match, "$") {
			return strings.Trim(match, "$")
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
```

- [ ] **Step 2: Write test for StripLaTeX**

Create: `backend/services/pdf_test.go`

```go
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
```

- [ ] **Step 3: Run tests**

Run: `cd /home/user/jee/backend && go test ./services/ -v -run TestStripLaTeX`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add backend/services/pdf.go backend/services/pdf_test.go
git commit -m "feat: add PDF generation service with LaTeX stripping"
```

---

### Task 3: Download Handler

**Files:**
- Create: `backend/handlers/download.go`

- [ ] **Step 1: Create download handler**

```go
package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"

	"github.com/vjauhari-work/jee/backend/db"
	"github.com/vjauhari-work/jee/backend/models"
	"github.com/vjauhari-work/jee/backend/services"
)

type DownloadHandler struct{}

func (h *DownloadHandler) TopicPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	section := r.URL.Query().Get("section")
	subject := r.URL.Query().Get("subject")
	topic := r.URL.Query().Get("topic")

	if section == "" || subject == "" || topic == "" {
		http.Error(w, `{"error":"section, subject, and topic are required"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	filter := bson.M{"section": section, "subject": subject, "topic": topic}
	cursor, err := db.Collection("questions").Find(ctx, filter)
	if err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var questions []models.Question
	if err := cursor.All(ctx, &questions); err != nil {
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}

	if len(questions) == 0 {
		http.Error(w, `{"error":"no questions found"}`, http.StatusNotFound)
		return
	}

	pdfBytes, err := services.GenerateTopicPDF(section, subject, topic, questions)
	if err != nil {
		http.Error(w, `{"error":"failed to generate PDF"}`, http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("%s_%s_%s.pdf", section, subject, topic)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	w.Write(pdfBytes)
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/user/jee/backend && go build ./handlers/`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add backend/handlers/download.go
git commit -m "feat: add PDF download handler for topic-wise questions"
```
