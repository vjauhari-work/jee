package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/vjauhari-work/jee/backend/config"
	"github.com/vjauhari-work/jee/backend/db"
	"github.com/vjauhari-work/jee/backend/handlers"
	"github.com/vjauhari-work/jee/backend/middleware"
)

func main() {
	cfg := config.Load()
	if err := cfg.ValidateSecrets(); err != nil {
		log.Fatalf("Refusing to start: %v", err)
	}

	// Connect to MongoDB
	if err := db.Connect(cfg.MongoURI, cfg.MongoDBName); err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer db.Disconnect()

	// Seed database (indexes + admin account)
	if err := db.Seed(cfg.AdminUsername, cfg.AdminPassword, cfg.AdminEmail); err != nil {
		log.Fatalf("Failed to seed database: %v", err)
	}

	// Initialize handlers
	authHandler := &handlers.AuthHandler{JWTSecret: cfg.JWTSecret, CookieSecure: cfg.CookieSecure}
	profileHandler := &handlers.ProfileHandler{}
	questionsHandler := &handlers.QuestionsHandler{}
	quizHandler := &handlers.QuizHandler{}
	progressHandler := &handlers.ProgressHandler{}
	downloadHandler := &handlers.DownloadHandler{}
	adminHandler := &handlers.AdminHandler{}

	// Helper to wrap with auth
	auth := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.Auth(cfg.JWTSecret, h)
	}
	adminOnly := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.Auth(cfg.JWTSecret, middleware.AdminOnly(h))
	}

	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"ok"}`)
	})

	// Auth (public, rate limited against brute force)
	authLimiter := middleware.NewRateLimiter(10, time.Minute)
	mux.HandleFunc("/api/auth/register", authLimiter.Wrap(authHandler.Register))
	mux.HandleFunc("/api/auth/login", authLimiter.Wrap(authHandler.Login))
	mux.HandleFunc("/api/auth/logout", authHandler.Logout)

	// Profile (authenticated)
	mux.HandleFunc("/api/profile", auth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			profileHandler.GetProfile(w, r)
		case http.MethodPut:
			profileHandler.UpdateProfile(w, r)
		default:
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/api/profile/password", auth(profileHandler.ChangePassword))

	// Sections (authenticated)
	mux.HandleFunc("/api/sections", auth(questionsHandler.GetSections))

	// Questions (authenticated)
	mux.HandleFunc("/api/questions/by-year", auth(questionsHandler.GetByYear))
	mux.HandleFunc("/api/questions/by-topic", auth(questionsHandler.GetByTopic))
	mux.HandleFunc("/api/questions/topics", auth(questionsHandler.GetTopics))
	mux.HandleFunc("/api/questions/years", auth(questionsHandler.GetYears))
	mux.HandleFunc("/api/questions/", auth(questionsHandler.GetAnswer))

	// Quiz (authenticated)
	mux.HandleFunc("/api/quiz/start", auth(quizHandler.StartQuiz))
	mux.HandleFunc("/api/quiz/", auth(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case r.Method == http.MethodGet && !hasSubpath(path, "/api/quiz/"):
			quizHandler.GetQuiz(w, r)
		case r.Method == http.MethodPut && hasSuffix(path, "/answer"):
			quizHandler.SubmitAnswer(w, r)
		case r.Method == http.MethodPost && hasSuffix(path, "/submit"):
			quizHandler.SubmitQuiz(w, r)
		case r.Method == http.MethodGet && hasSuffix(path, "/results"):
			quizHandler.GetResults(w, r)
		default:
			quizHandler.GetQuiz(w, r)
		}
	}))

	// Progress (authenticated)
	mux.HandleFunc("/api/progress", auth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			progressHandler.GetProgress(w, r)
		case http.MethodPut:
			progressHandler.SaveProgress(w, r)
		default:
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	}))

	// Download (authenticated)
	mux.HandleFunc("/api/download/topic-pdf", auth(downloadHandler.TopicPDF))

	// Admin (admin only)
	mux.HandleFunc("/api/admin/questions/bulk", adminOnly(adminHandler.BulkImport))
	mux.HandleFunc("/api/admin/questions/", adminOnly(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			adminHandler.UpdateQuestion(w, r)
		case http.MethodDelete:
			adminHandler.DeleteQuestion(w, r)
		default:
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	}))
	mux.HandleFunc("/api/admin/questions", adminOnly(adminHandler.CreateQuestion))
	mux.HandleFunc("/api/admin/answers", adminOnly(adminHandler.UpsertAnswer))

	// Cap request bodies (nginx enforces the same limit in front)
	capped := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
		mux.ServeHTTP(w, r)
	})

	// Wrap with CORS
	handler := middleware.CORS(cfg.AllowedOrigins, capped)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	log.Printf("Starting server on :%s", cfg.Port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}

func hasSuffix(path, suffix string) bool {
	return len(path) >= len(suffix) && path[len(path)-len(suffix):] == suffix
}

func hasSubpath(path, prefix string) bool {
	rest := path[len(prefix):]
	for _, c := range rest {
		if c == '/' {
			return true
		}
	}
	return false
}
