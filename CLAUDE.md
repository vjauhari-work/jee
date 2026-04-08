# JEE Prep Website

## Branch Policy

- **`main`** is the protected default branch. Never push directly to `main`.
- All changes to `main` must go through a Pull Request.
- Create feature branches for all work, then open a PR to merge into `main`.
- PRs require passing tests before merge.

## Development Workflow

1. Create a feature branch from `main`
2. Make changes, commit, push to the feature branch
3. Create a PR targeting `main`
4. Merge after review

## Running Locally

```bash
# Start MongoDB
docker compose up -d mongodb

# Start backend
cd backend
MONGO_URI="mongodb://admin:changeme@localhost:27017/jeeprep?authSource=admin" go run .

# Start frontend (dev mode)
cd frontend
npm run dev
```

## Importing Questions from PDF

```bash
cd backend

# Parse PDF to JSON
python3 tools/pdf_importer.py paper.pdf --section jee_mains --subject physics --year 2024 -o questions.json --answers-output answers.json

# Import into MongoDB
go run ./cmd/import/main.go --file questions.json --answers answers.json --seed
```

## Running Tests

```bash
# Backend
cd backend && go test ./...

# Frontend
cd frontend && npm test
```
