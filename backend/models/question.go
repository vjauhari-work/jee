package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Option struct {
	Label string `bson:"label" json:"label"`
	Text  string `bson:"text" json:"text"`
}

type Question struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Section        string             `bson:"section" json:"section"`
	Subject        string             `bson:"subject" json:"subject"`
	Topic          string             `bson:"topic" json:"topic"`
	Year           int                `bson:"year" json:"year"`
	QuestionText   string             `bson:"question_text" json:"question_text"`
	QuestionImages []string           `bson:"question_images" json:"question_images"`
	Options        []Option           `bson:"options" json:"options"`
	CorrectAnswer  string             `bson:"correct_answer" json:"-"`
	Difficulty     string             `bson:"difficulty" json:"difficulty"`
}

const (
	SectionBoards11    = "boards_11"
	SectionBoards12    = "boards_12"
	SectionJEEMains    = "jee_mains"
	SectionJEEAdvanced = "jee_advanced"

	SubjectPhysics     = "physics"
	SubjectChemistry   = "chemistry"
	SubjectMathematics = "mathematics"
)
