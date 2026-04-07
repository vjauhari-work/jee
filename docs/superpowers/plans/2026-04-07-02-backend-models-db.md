# Backend Models & DB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up MongoDB connection, define all Go data models, create indexes, and seed the admin account.

**Architecture:** The `db` package manages the MongoDB connection lifecycle. The `models` package defines Go structs that map to MongoDB documents. The `seed` package creates indexes and the admin account on startup.

**Tech Stack:** Go 1.22, mongo-go-driver, bcrypt

---

### Task 1: Install Go Dependencies

**Files:**
- Modify: `backend/go.mod`

- [ ] **Step 1: Add required Go modules**

Run:
```bash
cd /home/user/jee/backend
go get go.mongodb.org/mongo-driver/mongo
go get go.mongodb.org/mongo-driver/bson
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto/bcrypt
go get github.com/rs/cors
go get github.com/jung-kurt/gofpdf
```

- [ ] **Step 2: Tidy modules**

Run: `cd /home/user/jee/backend && go mod tidy`
Expected: go.mod and go.sum updated with all dependencies

- [ ] **Step 3: Commit**

```bash
git add backend/go.mod backend/go.sum
git commit -m "feat: add Go dependencies for MongoDB, JWT, bcrypt, CORS, PDF"
```

---

### Task 2: MongoDB Connection Package

**Files:**
- Create: `backend/db/mongo.go`

- [ ] **Step 1: Create MongoDB connection manager**

```go
package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client
var database *mongo.Database

func Connect(uri, dbName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Client().ApplyURI(uri)
	c, err := mongo.Connect(ctx, opts)
	if err != nil {
		return err
	}

	if err := c.Ping(ctx, nil); err != nil {
		return err
	}

	client = c
	database = c.Database(dbName)
	log.Printf("Connected to MongoDB database: %s", dbName)
	return nil
}

func GetDB() *mongo.Database {
	return database
}

func Collection(name string) *mongo.Collection {
	return database.Collection(name)
}

func Disconnect() {
	if client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := client.Disconnect(ctx); err != nil {
			log.Printf("Error disconnecting from MongoDB: %v", err)
		}
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/db/mongo.go
git commit -m "feat: add MongoDB connection package"
```

---

### Task 3: User Model

**Files:**
- Create: `backend/models/user.go`

- [ ] **Step 1: Create user model**

```go
package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username     string             `bson:"username" json:"username"`
	Name         string             `bson:"name" json:"name"`
	Email        string             `bson:"email" json:"email"`
	Phone        string             `bson:"phone" json:"phone"`
	PasswordHash string             `bson:"password_hash" json:"-"`
	Role         string             `bson:"role" json:"role"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at" json:"updated_at"`
}

const (
	RoleStudent = "student"
	RoleAdmin   = "admin"
)
```

- [ ] **Step 2: Commit**

```bash
git add backend/models/user.go
git commit -m "feat: add User model"
```

---

### Task 4: Question Model

**Files:**
- Create: `backend/models/question.go`

- [ ] **Step 1: Create question model**

```go
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
	SectionBoards11   = "boards_11"
	SectionBoards12   = "boards_12"
	SectionJEEMains   = "jee_mains"
	SectionJEEAdvanced = "jee_advanced"

	SubjectPhysics     = "physics"
	SubjectChemistry   = "chemistry"
	SubjectMathematics = "mathematics"
)
```

- [ ] **Step 2: Commit**

```bash
git add backend/models/question.go
git commit -m "feat: add Question model with section/subject constants"
```

---

### Task 5: Answer Model

**Files:**
- Create: `backend/models/answer.go`

- [ ] **Step 1: Create answer model**

```go
package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Approach struct {
	Title       string   `bson:"title" json:"title"`
	Explanation string   `bson:"explanation" json:"explanation"`
	Images      []string `bson:"images" json:"images"`
}

type Answer struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	QuestionID primitive.ObjectID `bson:"question_id" json:"question_id"`
	FinalAnswer string            `bson:"final_answer" json:"final_answer"`
	Approaches  []Approach        `bson:"approaches" json:"approaches"`
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/models/answer.go
git commit -m "feat: add Answer model with approaches"
```

---

### Task 6: Quiz Session Model

**Files:**
- Create: `backend/models/quiz_session.go`

- [ ] **Step 1: Create quiz session model**

```go
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
	ID             primitive.ObjectID        `bson:"_id,omitempty" json:"id"`
	UserID         primitive.ObjectID        `bson:"user_id" json:"user_id"`
	Section        string                    `bson:"section" json:"section"`
	Type           string                    `bson:"type" json:"type"`
	Questions      []primitive.ObjectID      `bson:"questions" json:"questions"`
	AnswersGiven   map[string]string         `bson:"answers_given" json:"answers_given"`
	Status         string                    `bson:"status" json:"status"`
	Score          *float64                  `bson:"score" json:"score"`
	TopicBreakdown map[string]TopicScore     `bson:"topic_breakdown" json:"topic_breakdown"`
	StartedAt      time.Time                 `bson:"started_at" json:"started_at"`
	ExpiresAt      time.Time                 `bson:"expires_at" json:"expires_at"`
	CompletedAt    *time.Time                `bson:"completed_at,omitempty" json:"completed_at"`
}

const (
	QuizTypeQuiz     = "quiz"
	QuizTypePYQYear  = "pyq_year"
	QuizTypePYQTopic = "pyq_topic"

	StatusInProgress = "in_progress"
	StatusCompleted  = "completed"
	StatusTimedOut   = "timed_out"
)
```

- [ ] **Step 2: Commit**

```bash
git add backend/models/quiz_session.go
git commit -m "feat: add QuizSession model with status constants"
```

---

### Task 7: Progress Model

**Files:**
- Create: `backend/models/progress.go`

- [ ] **Step 1: Create progress model**

```go
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/models/progress.go
git commit -m "feat: add UserProgress model for resume tracking"
```

---

### Task 8: Database Seed (Indexes + Admin Account)

**Files:**
- Create: `backend/db/seed.go`

- [ ] **Step 1: Create seed function**

```go
package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"

	"github.com/vjauhari-work/jee/backend/models"
)

func Seed(adminUsername, adminPassword, adminEmail string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := createIndexes(ctx); err != nil {
		return err
	}

	if err := seedAdmin(ctx, adminUsername, adminPassword, adminEmail); err != nil {
		return err
	}

	return nil
}

func createIndexes(ctx context.Context) error {
	// Users: unique username
	_, err := Collection("users").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "username", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

	// Questions: compound index on section+subject+topic
	_, err = Collection("questions").Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{
			{Key: "section", Value: 1},
			{Key: "subject", Value: 1},
			{Key: "topic", Value: 1},
		}},
		{Keys: bson.D{
			{Key: "section", Value: 1},
			{Key: "year", Value: 1},
		}},
	})
	if err != nil {
		return err
	}

	// Answers: index on question_id
	_, err = Collection("answers").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "question_id", Value: 1}},
	})
	if err != nil {
		return err
	}

	// Quiz sessions: index on user_id+status
	_, err = Collection("quiz_sessions").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "user_id", Value: 1},
			{Key: "status", Value: 1},
		},
	})
	if err != nil {
		return err
	}

	// User progress: index on user_id+section+type
	_, err = Collection("user_progress").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "user_id", Value: 1},
			{Key: "section", Value: 1},
			{Key: "type", Value: 1},
		},
	})
	if err != nil {
		return err
	}

	log.Println("Database indexes created")
	return nil
}

func seedAdmin(ctx context.Context, username, password, email string) error {
	coll := Collection("users")

	count, err := coll.CountDocuments(ctx, bson.M{"username": username, "role": models.RoleAdmin})
	if err != nil {
		return err
	}
	if count > 0 {
		log.Println("Admin account already exists, skipping seed")
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	now := time.Now()
	admin := models.User{
		Username:     username,
		Name:         "Admin",
		Email:        email,
		Phone:        "",
		PasswordHash: string(hash),
		Role:         models.RoleAdmin,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	_, err = coll.InsertOne(ctx, admin)
	if err != nil {
		return err
	}

	log.Printf("Admin account seeded: %s", username)
	return nil
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/user/jee/backend && go build ./db/`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add backend/db/seed.go
git commit -m "feat: add database seed with indexes and admin account"
```
