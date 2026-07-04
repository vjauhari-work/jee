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

	filename := fmt.Sprintf("%s_%s_%s.pdf", safeFilePart(section), safeFilePart(subject), safeFilePart(topic))
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	// gofpdf-generated binary served as application/pdf, not reflected markup
	w.Write(pdfBytes) // #nosec G705
}

// safeFilePart restricts a user-supplied value to characters that are
// safe inside a Content-Disposition filename.
func safeFilePart(s string) string {
	out := make([]rune, 0, len(s))
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9', r == '-', r == '_':
			out = append(out, r)
		default:
			out = append(out, '_')
		}
	}
	return string(out)
}
