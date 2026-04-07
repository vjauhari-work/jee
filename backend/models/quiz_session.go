package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TopicScore struct {
	Correct int `bson:"correct" json:"correct"`
	Total   int `bson:"total" json:"total"`
}

type QuizSession struct {
	ID             primitive.ObjectID    `bson:"_id,omitempty" json:"id"`
	UserID         primitive.ObjectID    `bson:"user_id" json:"user_id"`
	Section        string                `bson:"section" json:"section"`
	Type           string                `bson:"type" json:"type"`
	Questions      []primitive.ObjectID  `bson:"questions" json:"questions"`
	AnswersGiven   map[string]string     `bson:"answers_given" json:"answers_given"`
	Status         string                `bson:"status" json:"status"`
	Score          *float64              `bson:"score" json:"score"`
	TopicBreakdown map[string]TopicScore `bson:"topic_breakdown" json:"topic_breakdown"`
	StartedAt      time.Time             `bson:"started_at" json:"started_at"`
	ExpiresAt      time.Time             `bson:"expires_at" json:"expires_at"`
	CompletedAt    *time.Time            `bson:"completed_at,omitempty" json:"completed_at"`
}

const (
	QuizTypeQuiz     = "quiz"
	QuizTypePYQYear  = "pyq_year"
	QuizTypePYQTopic = "pyq_topic"

	StatusInProgress = "in_progress"
	StatusCompleted  = "completed"
	StatusTimedOut   = "timed_out"
)
