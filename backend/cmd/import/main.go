package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/vjauhari-work/jee/backend/config"
	"github.com/vjauhari-work/jee/backend/db"
	"github.com/vjauhari-work/jee/backend/models"
)

type QuestionInput struct {
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

type AnswerInput struct {
	FinalAnswer string            `json:"final_answer"`
	Approaches  []models.Approach `json:"approaches"`
}

func main() {
	questionsFile := flag.String("file", "", "Path to questions JSON file (required)")
	answersFile := flag.String("answers", "", "Path to answers JSON file (optional, indexes match questions)")
	mongoURI := flag.String("mongo-uri", "", "MongoDB URI (default: from MONGO_URI env or config)")
	dbName := flag.String("db-name", "", "Database name (default: from MONGO_DB_NAME env or config)")
	seedAdmin := flag.Bool("seed", false, "Also run index creation and admin account seed")
	flag.Parse()

	if *questionsFile == "" {
		fmt.Println("Usage: go run ./cmd/import/main.go --file questions.json [--answers answers.json] [--seed]")
		fmt.Println()
		fmt.Println("Flags:")
		flag.PrintDefaults()
		fmt.Println()
		fmt.Println("Workflow:")
		fmt.Println("  1. Download a PDF question paper")
		fmt.Println("  2. Run: python3 tools/pdf_importer.py paper.pdf --section jee_mains --subject physics --year 2024 -o questions.json --answers-output answers.json")
		fmt.Println("  3. Run: go run ./cmd/import/main.go --file questions.json --answers answers.json")
		os.Exit(1)
	}

	// Load config
	cfg := config.Load()
	uri := cfg.MongoURI
	name := cfg.MongoDBName
	if *mongoURI != "" {
		uri = *mongoURI
	}
	if *dbName != "" {
		name = *dbName
	}

	// Connect to MongoDB
	if err := db.Connect(uri, name); err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer db.Disconnect()

	// Optionally seed indexes and admin
	if *seedAdmin {
		if err := db.Seed(cfg.AdminUsername, cfg.AdminPassword, cfg.AdminEmail); err != nil {
			log.Fatalf("Failed to seed database: %v", err)
		}
	}

	// Read questions file
	questionsData, err := os.ReadFile(*questionsFile)
	if err != nil {
		log.Fatalf("Failed to read questions file: %v", err)
	}

	var questions []QuestionInput
	if err := json.Unmarshal(questionsData, &questions); err != nil {
		log.Fatalf("Failed to parse questions JSON: %v", err)
	}

	fmt.Printf("Loaded %d questions from %s\n", len(questions), *questionsFile)

	// Read answers file if provided
	var answers []AnswerInput
	if *answersFile != "" {
		answersData, err := os.ReadFile(*answersFile)
		if err != nil {
			log.Fatalf("Failed to read answers file: %v", err)
		}
		if err := json.Unmarshal(answersData, &answers); err != nil {
			log.Fatalf("Failed to parse answers JSON: %v", err)
		}
		fmt.Printf("Loaded %d answers from %s\n", len(answers), *answersFile)
	}

	// Insert questions
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	questionIDs := make([]primitive.ObjectID, 0, len(questions))
	inserted := 0

	for _, q := range questions {
		doc := models.Question{
			Section:        q.Section,
			Subject:        q.Subject,
			Topic:          q.Topic,
			Year:           q.Year,
			QuestionText:   q.QuestionText,
			QuestionImages: q.QuestionImages,
			Options:        q.Options,
			CorrectAnswer:  q.CorrectAnswer,
			Difficulty:     q.Difficulty,
		}
		if doc.QuestionImages == nil {
			doc.QuestionImages = []string{}
		}

		result, err := db.Collection("questions").InsertOne(ctx, doc)
		if err != nil {
			log.Printf("Warning: Failed to insert question %d: %v", inserted+1, err)
			questionIDs = append(questionIDs, primitive.NilObjectID)
			continue
		}

		questionIDs = append(questionIDs, result.InsertedID.(primitive.ObjectID))
		inserted++
	}

	fmt.Printf("Inserted %d/%d questions\n", inserted, len(questions))

	// Insert answers
	if len(answers) > 0 {
		answersInserted := 0
		for i, a := range answers {
			if i >= len(questionIDs) {
				break
			}
			if questionIDs[i] == primitive.NilObjectID {
				continue
			}

			doc := models.Answer{
				QuestionID:  questionIDs[i],
				FinalAnswer: a.FinalAnswer,
				Approaches:  a.Approaches,
			}

			_, err := db.Collection("answers").InsertOne(ctx, doc)
			if err != nil {
				log.Printf("Warning: Failed to insert answer for question %d: %v", i+1, err)
				continue
			}
			answersInserted++
		}
		fmt.Printf("Inserted %d/%d answers\n", answersInserted, len(answers))
	}

	// Print summary
	fmt.Println("\n--- Import Summary ---")
	sectionCount := map[string]int{}
	subjectCount := map[string]int{}
	for _, q := range questions {
		sectionCount[q.Section]++
		subjectCount[q.Subject]++
	}
	for section, count := range sectionCount {
		fmt.Printf("  %s: %d questions\n", section, count)
	}
	for subject, count := range subjectCount {
		fmt.Printf("  %s: %d questions\n", subject, count)
	}
}
