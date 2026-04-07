package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/vjauhari-work/jee/backend/db"
	"github.com/vjauhari-work/jee/backend/middleware"
	"github.com/vjauhari-work/jee/backend/models"
	"github.com/vjauhari-work/jee/backend/services"
)

type QuizHandler struct{}

type startQuizRequest struct {
	Section string `json:"section"`
	Year    int    `json:"year,omitempty"` // Only for pyq_year type
	Type    string `json:"type"`           // "quiz" or "pyq_year"
}

type answerRequest struct {
	QuestionID string `json:"question_id"`
	Answer     string `json:"answer"`
}

func (h *QuizHandler) StartQuiz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	userID := middleware.GetUserID(r)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	var req startQuizRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Section == "" {
		http.Error(w, `{"error":"section is required"}`, http.StatusBadRequest)
		return
	}

	if req.Type == "" {
		req.Type = models.QuizTypeQuiz
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var questionIDs []primitive.ObjectID
	var timeLimitMins int
	var err error

	switch req.Type {
	case models.QuizTypeQuiz:
		cfg, ok := services.QuizConfig[req.Section]
		if !ok {
			http.Error(w, `{"error":"invalid section"}`, http.StatusBadRequest)
			return
		}
		questionIDs, err = services.SelectRandomQuestions(ctx, req.Section, cfg.QuestionCount)
		timeLimitMins = cfg.TimeLimitMins

	case models.QuizTypePYQYear:
		if req.Year == 0 {
			http.Error(w, `{"error":"year is required for pyq_year type"}`, http.StatusBadRequest)
			return
		}
		questionIDs, err = services.GetQuestionsByYear(ctx, req.Section, req.Year)
		timeLimitMins = services.PYQYearTimeLimitMins

	default:
		http.Error(w, `{"error":"invalid type, must be quiz or pyq_year"}`, http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, `{"error":"failed to select questions"}`, http.StatusInternalServerError)
		return
	}

	if len(questionIDs) == 0 {
		http.Error(w, `{"error":"no questions found for this section"}`, http.StatusNotFound)
		return
	}

	session, err := services.CreateQuizSession(ctx, userObjID, req.Section, req.Type, questionIDs, timeLimitMins)
	if err != nil {
		http.Error(w, `{"error":"failed to create quiz session"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(session)
}

func (h *QuizHandler) GetQuiz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	sessionID := extractLastPathSegment(r.URL.Path, "/api/quiz/")
	objID, err := primitive.ObjectIDFromHex(sessionID)
	if err != nil {
		http.Error(w, `{"error":"invalid session id"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var session models.QuizSession
	err = db.Collection("quiz_sessions").FindOne(ctx, bson.M{"_id": objID}).Decode(&session)
	if err != nil {
		http.Error(w, `{"error":"quiz session not found"}`, http.StatusNotFound)
		return
	}

	// Check if timed out
	if session.Status == models.StatusInProgress && time.Now().After(session.ExpiresAt) {
		session.Status = models.StatusTimedOut
		now := time.Now()
		session.CompletedAt = &now
		db.Collection("quiz_sessions").UpdateByID(ctx, objID, bson.M{
			"$set": bson.M{"status": models.StatusTimedOut, "completed_at": now},
		})
	}

	// Fetch the actual question documents
	filter := bson.M{"_id": bson.M{"$in": session.Questions}}
	cursor, err := db.Collection("questions").Find(ctx, filter)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch questions"}`, http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var questions []models.Question
	if err := cursor.All(ctx, &questions); err != nil {
		http.Error(w, `{"error":"failed to decode questions"}`, http.StatusInternalServerError)
		return
	}

	// Calculate time remaining
	timeRemaining := time.Until(session.ExpiresAt).Seconds()
	if timeRemaining < 0 {
		timeRemaining = 0
	}

	response := map[string]interface{}{
		"session":        session,
		"questions":      questions,
		"time_remaining": int(timeRemaining),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *QuizHandler) SubmitAnswer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Path: /api/quiz/{session_id}/answer
	sessionID := extractPathParam(r.URL.Path, "/api/quiz/", "/answer")
	objID, err := primitive.ObjectIDFromHex(sessionID)
	if err != nil {
		http.Error(w, `{"error":"invalid session id"}`, http.StatusBadRequest)
		return
	}

	var req answerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Check session exists and is in progress
	var session models.QuizSession
	err = db.Collection("quiz_sessions").FindOne(ctx, bson.M{"_id": objID}).Decode(&session)
	if err != nil {
		http.Error(w, `{"error":"quiz session not found"}`, http.StatusNotFound)
		return
	}

	if session.Status != models.StatusInProgress {
		http.Error(w, `{"error":"quiz is no longer active"}`, http.StatusBadRequest)
		return
	}

	if time.Now().After(session.ExpiresAt) {
		http.Error(w, `{"error":"quiz has timed out"}`, http.StatusBadRequest)
		return
	}

	// Save the answer
	key := "answers_given." + req.QuestionID
	_, err = db.Collection("quiz_sessions").UpdateByID(ctx, objID, bson.M{
		"$set": bson.M{key: req.Answer},
	})
	if err != nil {
		http.Error(w, `{"error":"failed to save answer"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "answer saved"})
}

func (h *QuizHandler) SubmitQuiz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Path: /api/quiz/{session_id}/submit
	sessionID := extractPathParam(r.URL.Path, "/api/quiz/", "/submit")
	objID, err := primitive.ObjectIDFromHex(sessionID)
	if err != nil {
		http.Error(w, `{"error":"invalid session id"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var session models.QuizSession
	err = db.Collection("quiz_sessions").FindOne(ctx, bson.M{"_id": objID}).Decode(&session)
	if err != nil {
		http.Error(w, `{"error":"quiz session not found"}`, http.StatusNotFound)
		return
	}

	if session.Status != models.StatusInProgress {
		http.Error(w, `{"error":"quiz already submitted"}`, http.StatusBadRequest)
		return
	}

	// Grade
	gradeResult, err := services.GradeQuiz(ctx, &session)
	if err != nil {
		http.Error(w, `{"error":"failed to grade quiz"}`, http.StatusInternalServerError)
		return
	}

	// Determine status
	status := models.StatusCompleted
	if time.Now().After(session.ExpiresAt) {
		status = models.StatusTimedOut
	}

	now := time.Now()
	_, err = db.Collection("quiz_sessions").UpdateByID(ctx, objID, bson.M{
		"$set": bson.M{
			"status":          status,
			"score":           gradeResult.Score,
			"topic_breakdown": gradeResult.TopicBreakdown,
			"completed_at":    now,
		},
	})
	if err != nil {
		http.Error(w, `{"error":"failed to save results"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(gradeResult)
}

func (h *QuizHandler) GetResults(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Path: /api/quiz/{session_id}/results
	sessionID := extractPathParam(r.URL.Path, "/api/quiz/", "/results")
	objID, err := primitive.ObjectIDFromHex(sessionID)
	if err != nil {
		http.Error(w, `{"error":"invalid session id"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var session models.QuizSession
	err = db.Collection("quiz_sessions").FindOne(ctx, bson.M{"_id": objID}).Decode(&session)
	if err != nil {
		http.Error(w, `{"error":"quiz session not found"}`, http.StatusNotFound)
		return
	}

	if session.Status == models.StatusInProgress {
		http.Error(w, `{"error":"quiz not yet submitted"}`, http.StatusBadRequest)
		return
	}

	// Recalculate weak topics from stored breakdown
	var weakTopics []string
	for topic, ts := range session.TopicBreakdown {
		if ts.Total > 0 && float64(ts.Correct)/float64(ts.Total) < 0.5 {
			weakTopics = append(weakTopics, topic)
		}
	}

	response := map[string]interface{}{
		"session_id":      session.ID,
		"section":         session.Section,
		"type":            session.Type,
		"score":           session.Score,
		"topic_breakdown": session.TopicBreakdown,
		"weak_topics":     weakTopics,
		"completed_at":    session.CompletedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// extractLastPathSegment returns everything after prefix, stopping at '/' or end.
// e.g., extractLastPathSegment("/api/quiz/abc123", "/api/quiz/") returns "abc123"
// e.g., extractLastPathSegment("/api/quiz/abc123/submit", "/api/quiz/") returns "abc123/submit"
func extractLastPathSegment(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	rest := path[len(prefix):]
	// For simple GET /api/quiz/{id}, return just the ID (no trailing slash components)
	if idx := strings.Index(rest, "/"); idx >= 0 {
		return rest[:idx]
	}
	return rest
}

// strconv import needed for potential year parsing
var _ = strconv.Atoi
