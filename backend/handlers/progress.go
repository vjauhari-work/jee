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
			"filter_value":        req.FilterValue,
			"last_question_index": req.LastQuestionIndex,
			"updated_at":          time.Now(),
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
