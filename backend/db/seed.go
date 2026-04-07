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
	_, err := Collection("users").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "username", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

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

	_, err = Collection("answers").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "question_id", Value: 1}},
	})
	if err != nil {
		return err
	}

	_, err = Collection("quiz_sessions").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "user_id", Value: 1},
			{Key: "status", Value: 1},
		},
	})
	if err != nil {
		return err
	}

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
