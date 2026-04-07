package services

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/vjauhari-work/jee/backend/db"
	"github.com/vjauhari-work/jee/backend/models"
)

// QuizConfig defines question count and time limit per section
var QuizConfig = map[string]struct {
	QuestionCount int
	TimeLimitMins int
}{
	models.SectionBoards11:    {QuestionCount: 25, TimeLimitMins: 60},
	models.SectionBoards12:    {QuestionCount: 25, TimeLimitMins: 60},
	models.SectionJEEMains:    {QuestionCount: 30, TimeLimitMins: 60},
	models.SectionJEEAdvanced: {QuestionCount: 20, TimeLimitMins: 60},
}

var PYQYearTimeLimitMins = 180 // 3 hours for previous year papers

var subjects = []string{models.SubjectPhysics, models.SubjectChemistry, models.SubjectMathematics}

// SelectRandomQuestions picks random questions from a section, spread evenly across 3 subjects.
func SelectRandomQuestions(ctx context.Context, section string, totalCount int) ([]primitive.ObjectID, error) {
	perSubject := totalCount / len(subjects)
	remainder := totalCount % len(subjects)

	var allIDs []primitive.ObjectID

	for i, subj := range subjects {
		count := perSubject
		if i < remainder {
			count++
		}

		pipeline := bson.A{
			bson.D{{Key: "$match", Value: bson.M{"section": section, "subject": subj}}},
			bson.D{{Key: "$sample", Value: bson.M{"size": count}}},
			bson.D{{Key: "$project", Value: bson.M{"_id": 1}}},
		}

		cursor, err := db.Collection("questions").Aggregate(ctx, pipeline)
		if err != nil {
			return nil, err
		}

		var results []struct {
			ID primitive.ObjectID `bson:"_id"`
		}
		if err := cursor.All(ctx, &results); err != nil {
			cursor.Close(ctx)
			return nil, err
		}
		cursor.Close(ctx)

		for _, r := range results {
			allIDs = append(allIDs, r.ID)
		}
	}

	return allIDs, nil
}

// GetQuestionsByYear returns all question IDs for a section+year.
func GetQuestionsByYear(ctx context.Context, section string, year int) ([]primitive.ObjectID, error) {
	filter := bson.M{"section": section, "year": year}
	cursor, err := db.Collection("questions").Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	ids := make([]primitive.ObjectID, len(results))
	for i, r := range results {
		ids[i] = r.ID
	}
	return ids, nil
}

// CreateQuizSession creates a new quiz session document.
func CreateQuizSession(ctx context.Context, userID primitive.ObjectID, section, quizType string, questionIDs []primitive.ObjectID, timeLimitMins int) (*models.QuizSession, error) {
	now := time.Now()
	session := models.QuizSession{
		UserID:       userID,
		Section:      section,
		Type:         quizType,
		Questions:    questionIDs,
		AnswersGiven: make(map[string]string),
		Status:       models.StatusInProgress,
		StartedAt:    now,
		ExpiresAt:    now.Add(time.Duration(timeLimitMins) * time.Minute),
	}

	result, err := db.Collection("quiz_sessions").InsertOne(ctx, session)
	if err != nil {
		return nil, err
	}

	session.ID = result.InsertedID.(primitive.ObjectID)
	return &session, nil
}
