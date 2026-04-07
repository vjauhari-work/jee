package services

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/vjauhari-work/jee/backend/db"
	"github.com/vjauhari-work/jee/backend/models"
)

type GradeResult struct {
	Score          float64                      `json:"score"`
	TopicBreakdown map[string]models.TopicScore `json:"topic_breakdown"`
	WeakTopics     []string                     `json:"weak_topics"`
}

// GradeQuiz grades a quiz session by comparing answers_given to correct_answer.
func GradeQuiz(ctx context.Context, session *models.QuizSession) (*GradeResult, error) {
	// Fetch all questions in the session
	filter := bson.M{"_id": bson.M{"$in": session.Questions}}
	cursor, err := db.Collection("questions").Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var questions []struct {
		ID            primitive.ObjectID `bson:"_id"`
		Topic         string             `bson:"topic"`
		CorrectAnswer string             `bson:"correct_answer"`
	}
	if err := cursor.All(ctx, &questions); err != nil {
		return nil, err
	}

	topicBreakdown := make(map[string]models.TopicScore)
	totalCorrect := 0

	for _, q := range questions {
		ts := topicBreakdown[q.Topic]
		ts.Total++

		givenAnswer, answered := session.AnswersGiven[q.ID.Hex()]
		if answered && givenAnswer == q.CorrectAnswer {
			ts.Correct++
			totalCorrect++
		}

		topicBreakdown[q.Topic] = ts
	}

	totalQuestions := len(questions)
	score := 0.0
	if totalQuestions > 0 {
		score = float64(totalCorrect) / float64(totalQuestions) * 100
	}

	// Find weak topics (below 50%)
	var weakTopics []string
	for topic, ts := range topicBreakdown {
		if ts.Total > 0 && float64(ts.Correct)/float64(ts.Total) < 0.5 {
			weakTopics = append(weakTopics, topic)
		}
	}

	return &GradeResult{
		Score:          score,
		TopicBreakdown: topicBreakdown,
		WeakTopics:     weakTopics,
	}, nil
}
