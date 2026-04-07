package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/vjauhari-work/jee/backend/db"
	"github.com/vjauhari-work/jee/backend/models"
)

type AdminHandler struct{}

type createQuestionRequest struct {
	Section        string          `json:"section"`
	Subject        string          `json:"subject"`
	Topic          string          `json:"topic"`
	Year           int             `json:"year"`
	QuestionText   string          `json:"question_text"`
	QuestionImages []string        `json:"question_images"`
	Options        []models.Option `json:"options"`
	CorrectAnswer  string          `json:"correct_answer"`
	Difficulty     string          `json:"difficulty"`
}

type upsertAnswerRequest struct {
	QuestionID  string            `json:"question_id"`
	FinalAnswer string            `json:"final_answer"`
	Approaches  []models.Approach `json:"approaches"`
}

func (h *AdminHandler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req createQuestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Section == "" || req.Subject == "" || req.Topic == "" || req.QuestionText == "" {
		http.Error(w, `{"error":"section, subject, topic, and question_text are required"}`, http.StatusBadRequest)
		return
	}

	question := models.Question{
		Section:        req.Section,
		Subject:        req.Subject,
		Topic:          req.Topic,
		Year:           req.Year,
		QuestionText:   req.QuestionText,
		QuestionImages: req.QuestionImages,
		Options:        req.Options,
		CorrectAnswer:  req.CorrectAnswer,
		Difficulty:     req.Difficulty,
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	result, err := db.Collection("questions").InsertOne(ctx, question)
	if err != nil {
		http.Error(w, `{"error":"failed to create question"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "question created",
		"id":      result.InsertedID,
	})
}

func (h *AdminHandler) UpdateQuestion(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Path: /api/admin/questions/{id}
	id := strings.TrimPrefix(r.URL.Path, "/api/admin/questions/")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, `{"error":"invalid question id"}`, http.StatusBadRequest)
		return
	}

	var req createQuestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	update := bson.M{"$set": bson.M{
		"section":         req.Section,
		"subject":         req.Subject,
		"topic":           req.Topic,
		"year":            req.Year,
		"question_text":   req.QuestionText,
		"question_images": req.QuestionImages,
		"options":         req.Options,
		"correct_answer":  req.CorrectAnswer,
		"difficulty":      req.Difficulty,
	}}

	result, err := db.Collection("questions").UpdateByID(ctx, objID, update)
	if err != nil {
		http.Error(w, `{"error":"failed to update question"}`, http.StatusInternalServerError)
		return
	}
	if result.MatchedCount == 0 {
		http.Error(w, `{"error":"question not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "question updated"})
}

func (h *AdminHandler) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/admin/questions/")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, `{"error":"invalid question id"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	result, err := db.Collection("questions").DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		http.Error(w, `{"error":"failed to delete question"}`, http.StatusInternalServerError)
		return
	}
	if result.DeletedCount == 0 {
		http.Error(w, `{"error":"question not found"}`, http.StatusNotFound)
		return
	}

	// Also delete associated answer
	db.Collection("answers").DeleteOne(ctx, bson.M{"question_id": objID})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "question deleted"})
}

func (h *AdminHandler) BulkImport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var questions []models.Question
	if err := json.NewDecoder(r.Body).Decode(&questions); err != nil {
		http.Error(w, `{"error":"invalid request body, expected array of questions"}`, http.StatusBadRequest)
		return
	}

	if len(questions) == 0 {
		http.Error(w, `{"error":"no questions provided"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	docs := make([]interface{}, len(questions))
	for i, q := range questions {
		docs[i] = q
	}

	result, err := db.Collection("questions").InsertMany(ctx, docs)
	if err != nil {
		http.Error(w, `{"error":"failed to import questions"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":  "questions imported",
		"imported": len(result.InsertedIDs),
	})
}

func (h *AdminHandler) UpsertAnswer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req upsertAnswerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	questionObjID, err := primitive.ObjectIDFromHex(req.QuestionID)
	if err != nil {
		http.Error(w, `{"error":"invalid question_id"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	filter := bson.M{"question_id": questionObjID}
	update := bson.M{
		"$set": bson.M{
			"final_answer": req.FinalAnswer,
			"approaches":   req.Approaches,
		},
		"$setOnInsert": bson.M{
			"question_id": questionObjID,
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err = db.Collection("answers").UpdateOne(ctx, filter, update, opts)
	if err != nil {
		http.Error(w, `{"error":"failed to save answer"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "answer saved"})
}
