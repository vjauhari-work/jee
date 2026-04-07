package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Approach struct {
	Title       string   `bson:"title" json:"title"`
	Explanation string   `bson:"explanation" json:"explanation"`
	Images      []string `bson:"images" json:"images"`
}

type Answer struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	QuestionID  primitive.ObjectID `bson:"question_id" json:"question_id"`
	FinalAnswer string             `bson:"final_answer" json:"final_answer"`
	Approaches  []Approach         `bson:"approaches" json:"approaches"`
}
