package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserProgress struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID            primitive.ObjectID `bson:"user_id" json:"user_id"`
	Section           string             `bson:"section" json:"section"`
	Type              string             `bson:"type" json:"type"`
	FilterValue       string             `bson:"filter_value" json:"filter_value"`
	LastQuestionIndex int                `bson:"last_question_index" json:"last_question_index"`
	QuizSessionID     primitive.ObjectID `bson:"quiz_session_id,omitempty" json:"quiz_session_id"`
	UpdatedAt         time.Time          `bson:"updated_at" json:"updated_at"`
}
