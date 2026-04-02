# JEE Prep Website — Design Specification

A web application for 11th and 12th class students to prepare for JEE Mains, JEE Advanced, and CBSE board exams through previous year questions and timed quizzes.

## Overview

- **Target users:** Up to 20 students (11th/12th class)
- **Subjects:** Physics, Chemistry, Mathematics
- **Sections:** Boards 11th, Boards 12th, JEE Mains, JEE Advanced
- **Modes:** Previous year questions (by year or by topic) and randomized quizzes
- **Admin:** Single seeded admin account for question management

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Backend | Go (net/http) |
| Database | MongoDB (self-hosted) |
| DB Admin UI | mongo-express |
| Reverse Proxy | Nginx |
| LaTeX Rendering | KaTeX |
| PDF Generation | gofpdf |
| Containerization | Docker Compose |
| Hosting | Oracle Cloud Free Tier (ARM VM) |

### Go Libraries

- `go.mongodb.org/mongo-driver` — MongoDB driver
- `github.com/golang-jwt/jwt/v5` — JWT authentication
- `golang.org/x/crypto/bcrypt` — password hashing
- `github.com/jung-kurt/gofpdf` — PDF generation
- `github.com/rs/cors` — CORS middleware

### Frontend Libraries

- `react-router-dom` — client-side routing
- `katex` + `react-katex` — LaTeX rendering
- `axios` — HTTP client

## System Architecture

```
┌─────────────────────────────────────────────────┐
│              Oracle Cloud VM (Docker)            │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Nginx   │  │ Go API   │  │   MongoDB    │  │
│  │ (static  │──│ :8080    │──│   :27017     │  │
│  │  + proxy)│  │          │  │              │  │
│  │  :80/443 │  └──────────┘  └──────────────┘  │
│  └──────────┘                 ┌──────────────┐  │
│                               │mongo-express │  │
│                               │  :8081       │  │
│                               └──────────────┘  │
└─────────────────────────────────────────────────┘
```

- **Nginx** serves the built React frontend as static files and reverse-proxies `/api/*` requests to the Go backend.
- **Go API** handles all business logic, auth, quiz engine, grading.
- **MongoDB** stores all data (users, questions, answers, sessions).
- **mongo-express** is accessible for admin DB management, protected behind basic auth.
- All 4 services run in a single `docker-compose.yml`.
- Local development and production use the same Docker Compose setup with environment-specific config.

## Database Schema (MongoDB Collections)

### `users`

```json
{
  "_id": "ObjectId",
  "username": "string (unique, immutable)",
  "name": "string (immutable)",
  "email": "string",
  "phone": "string",
  "password_hash": "string (bcrypt)",
  "role": "student | admin",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### `questions`

```json
{
  "_id": "ObjectId",
  "section": "boards_11 | boards_12 | jee_mains | jee_advanced",
  "subject": "physics | chemistry | mathematics",
  "topic": "string (e.g., 'Mechanics', 'Organic Chemistry')",
  "year": 2024,
  "question_text": "string (LaTeX markup)",
  "question_images": ["string (image URLs/paths)"],
  "options": [
    {"label": "A", "text": "string (LaTeX)"},
    {"label": "B", "text": "string (LaTeX)"},
    {"label": "C", "text": "string (LaTeX)"},
    {"label": "D", "text": "string (LaTeX)"}
  ],
  "correct_answer": "A",
  "difficulty": "easy | medium | hard"
}
```

### `answers` (solution bank)

```json
{
  "_id": "ObjectId",
  "question_id": "ObjectId",
  "final_answer": "string",
  "approaches": [
    {
      "title": "string (e.g., 'Using Energy Conservation')",
      "explanation": "string (LaTeX markup)",
      "images": ["string"]
    }
  ]
}
```

### `quiz_sessions`

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "section": "boards_11 | boards_12 | jee_mains | jee_advanced",
  "type": "quiz | pyq_year | pyq_topic",
  "questions": ["ObjectId"],
  "answers_given": {"question_id": "selected_option"},
  "status": "in_progress | completed | timed_out",
  "score": null,
  "topic_breakdown": {"Mechanics": {"correct": 3, "total": 5}},
  "started_at": "timestamp",
  "expires_at": "timestamp",
  "completed_at": "timestamp"
}
```

### `user_progress` (resume tracking)

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "section": "string",
  "type": "string",
  "filter_value": "string (topic name or year)",
  "last_question_index": 5,
  "quiz_session_id": "ObjectId",
  "updated_at": "timestamp"
}
```

### Indexes

- `questions`: compound index on `{section, subject, topic}` and `{section, year}`
- `quiz_sessions`: index on `{user_id, status}`
- `user_progress`: index on `{user_id, section, type}`
- `users`: unique index on `username`
- `answers`: index on `question_id`

## Authentication & Authorization

- JWT-based auth with 12-hour token expiry.
- Passwords hashed with bcrypt before storing.
- Login endpoint returns a JWT in an httpOnly cookie.
- Every API request includes the JWT; Go middleware validates it and injects user context.
- Two roles: `student` (default on registration) and `admin` (single seeded account).
- Admin routes (question CRUD, user management) are protected by role-check middleware.
- Registration requires: `username`, `name`, `email`, `phone`, `password`.

## API Endpoints

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create student account |
| POST | `/api/auth/login` | Returns JWT in httpOnly cookie |
| POST | `/api/auth/logout` | Clears cookie |

### Profile

| Method | Path | Description |
|---|---|---|
| GET | `/api/profile` | Get current user's profile |
| PUT | `/api/profile` | Update email/phone |
| PUT | `/api/profile/password` | Change password (requires current password) |

### Sections & Questions

| Method | Path | Description |
|---|---|---|
| GET | `/api/sections` | List all sections |
| GET | `/api/questions/by-year?section=&year=` | Full paper for a year |
| GET | `/api/questions/by-topic?section=&subject=&topic=` | All questions for a topic |
| GET | `/api/questions/topics?section=&subject=` | List available topics |
| GET | `/api/questions/years?section=` | List available years |
| GET | `/api/questions/:id/answer` | Get solution for a question |

### Quiz

| Method | Path | Description |
|---|---|---|
| POST | `/api/quiz/start` | Start quiz (body: `{section}`) |
| GET | `/api/quiz/:session_id` | Get quiz state (questions, time remaining) |
| PUT | `/api/quiz/:session_id/answer` | Submit answer for one question |
| POST | `/api/quiz/:session_id/submit` | Submit entire quiz for grading |
| GET | `/api/quiz/:session_id/results` | Score + topic breakdown |

### Progress

| Method | Path | Description |
|---|---|---|
| GET | `/api/progress?section=` | Get resume point for a section |
| PUT | `/api/progress` | Save current position |

### Download

| Method | Path | Description |
|---|---|---|
| GET | `/api/download/topic-pdf?section=&subject=&topic=` | Download topic questions as PDF |

### Admin

| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/questions` | Add question |
| PUT | `/api/admin/questions/:id` | Edit question |
| DELETE | `/api/admin/questions/:id` | Delete question |
| POST | `/api/admin/questions/bulk` | Bulk import from JSON |
| POST | `/api/admin/answers` | Add/update answer for a question |

## Quiz Engine

### Questions per Quiz

| Section | Questions | Time Limit | Rationale |
|---|---|---|---|
| Boards 11th | 25 | 1 hour | Moderate difficulty, fewer topics |
| Boards 12th | 25 | 1 hour | Moderate difficulty, fewer topics |
| JEE Mains | 30 | 1 hour | Mirrors JEE Mains density |
| JEE Advanced | 20 | 1 hour | Harder questions, more time per question |

### Quiz Flow

1. Student picks a section and hits "Start Quiz".
2. Backend selects random questions from that section's pool, spread evenly across Physics/Chemistry/Math.
3. Creates a `quiz_session` doc with `expires_at = now + 1 hour`.
4. Frontend shows a countdown timer, one question at a time with a navigation panel to jump between questions.
5. Student can answer, skip, and revisit questions before submitting.
6. On submit (or auto-submit on timeout), backend grades the quiz:
   - Compares `answers_given` against `correct_answer` in each question.
   - Calculates overall score and per-topic breakdown.
   - Stores results in the `quiz_session` doc.
7. Results page shows: total score, per-topic percentage, weak topics flagged (any topic below 50%).

### Previous Year Paper (by Year)

- Loads all questions from a specific year for the selected section.
- 3-hour time limit.
- Same grading and topic breakdown on submit.

### Previous Year Questions (by Topic)

- No time limit, no auto-submit.
- Student browses questions and can check answers one at a time.
- Download as PDF option available.
- Progress saved so they can resume later.

## Grading & Analysis

After quiz/paper submission:
- **Overall score:** correct answers / total questions as percentage.
- **Topic-level breakdown:** percentage score per topic (e.g., "Mechanics: 80%, Thermodynamics: 40%").
- **Weak topics:** any topic scoring below 50% is flagged as weak.
- Results are stored in the `quiz_session` doc for historical reference.

## Frontend Pages

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Email/username + password form |
| Register | `/register` | Registration form (username, name, email, phone, password) |
| Home | `/` | 4 section cards in 2x2 grid with PYQ/Quiz buttons |
| Section | `/section/:id` | Choose "Previous Year Questions" or "Quiz" |
| PYQ by Year | `/section/:id/pyq/years` | List of available years, click to start timed paper |
| PYQ by Topic | `/section/:id/pyq/topics` | Subject tabs, topic list, click for questions + PDF download |
| Quiz | `/quiz/:session_id` | Timed quiz with question nav panel |
| Quiz Results | `/quiz/:session_id/results` | Score, topic bars, weak point flags |
| Edit Profile | `/profile/edit` | Edit email/phone, change password |
| Admin Panel | `/admin` | Question CRUD form, bulk import |

### Layout

- **Left sidebar (fixed):** User avatar + name + username, "Edit Profile" link, section nav links (Boards 11, Boards 12, JEE Mains, JEE Advanced), logout at bottom.
- **Main content area:** Renders the active page.
- **Dark theme** throughout.
- Login and Register pages are full-screen centered forms (no sidebar).

## Project Structure

### Backend

```
backend/
├── main.go
├── go.mod / go.sum
├── config/
│   └── config.go
├── middleware/
│   ├── auth.go
│   └── cors.go
├── handlers/
│   ├── auth.go
│   ├── profile.go
│   ├── questions.go
│   ├── quiz.go
│   ├── progress.go
│   ├── download.go
│   └── admin.go
├── models/
│   ├── user.go
│   ├── question.go
│   ├── answer.go
│   ├── quiz_session.go
│   └── progress.go
├── services/
│   ├── quiz.go
│   ├── pdf.go
│   └── analysis.go
└── db/
    ├── mongo.go
    └── seed.go
```

### Frontend

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── Timer.tsx
│   │   ├── QuizNavPanel.tsx
│   │   └── TopicBreakdown.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Home.tsx
│   │   ├── Section.tsx
│   │   ├── PYQByYear.tsx
│   │   ├── PYQByTopic.tsx
│   │   ├── Quiz.tsx
│   │   ├── QuizResults.tsx
│   │   ├── EditProfile.tsx
│   │   └── AdminPanel.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   └── types/
│       └── index.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Docker Compose

```yaml
services:
  nginx:      # port 80 → static frontend + proxy /api to backend
  backend:    # port 8080
  mongodb:    # port 27017, persistent volume
  mongo-express:  # port 8081, basic auth protected
```

## Deployment

### Local Development

- `docker-compose up` runs all 4 services.
- Frontend hot-reloads via Vite dev server (bypasses Nginx in dev).
- mongo-express available at `localhost:8081` for DB inspection.

### Production (Oracle Cloud)

- Single ARM VM on Oracle Cloud Free Tier (4 OCPUs, 24GB RAM — free forever).
- Same `docker-compose.yml` with production environment variables.
- MongoDB data persisted via Docker volume.
- Nginx handles SSL termination (Let's Encrypt via certbot).
- mongo-express restricted to localhost or VPN access only.

## Admin Features

- **Single admin account** seeded on first run via `db/seed.go`.
- **Admin panel** at `/admin` for adding/editing/deleting questions through a web form.
- **Bulk import** endpoint accepts a JSON file with an array of question documents.
- **mongo-express** available for direct DB inspection and management.

## Question Format

- Questions stored with LaTeX markup for math/science notation.
- Rendered on the frontend using KaTeX.
- Each question supports optional image attachments.
- Images stored on the local filesystem under `backend/uploads/` and served by Nginx at `/uploads/*`. The `question_images` field stores relative paths (e.g., `"questions/2024/phys_01.png"`).
- All questions are objective (multiple choice with 4 options: A, B, C, D).
- Questions tagged with `section`, `subject`, `topic`, `year`, and `difficulty`.
