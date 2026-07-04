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

### Full stack with Docker Compose (recommended)

```bash
# One-time setup: copy the env template and fill in real secrets
cp .env.example .env
# JWT_SECRET must be >= 32 chars (openssl rand -hex 32);
# the backend refuses to start with missing or weak secrets.

# Build and start everything (MongoDB, backend, frontend+nginx)
docker compose up -d --build

# App is served at http://localhost
# Optional DB admin UI (http://127.0.0.1:8081):
docker compose --profile debug up -d
```

MongoDB (127.0.0.1:27017) and the backend API (127.0.0.1:8080) are
bound to loopback only; all public traffic goes through nginx on port 80.

### Dev mode (hot reload)

```bash
# Start MongoDB only
docker compose up -d mongodb

# Start backend (secrets are required even in dev)
cd backend
MONGO_URI="mongodb://admin:<db-password>@localhost:27017/jeeprep?authSource=admin" \
JWT_SECRET="$(openssl rand -hex 32)" \
ADMIN_PASSWORD="<admin-password>" \
ALLOWED_ORIGINS="http://localhost:5173" \
go run .

# Start frontend (dev mode, http://localhost:5173)
cd frontend
npm run dev
```

## Deploying

See **DEPLOY.md** for the full free-hosting walkthrough (Oracle Cloud
Always Free VM + DuckDNS + automatic HTTPS). In short, on any server:

```bash
cp .env.example .env   # fill in secrets, DOMAIN, COOKIE_SECURE=true
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

- The prod override adds Caddy, which terminates HTTPS for `$DOMAIN` with automatic Let's Encrypt certificates and fronts nginx.
- Set `COOKIE_SECURE=true` so the session cookie is never sent over plain HTTP.
- Do not enable the `debug` profile (mongo-express) in production.
- MongoDB and the backend are bound to loopback and are not reachable from outside the host; only Caddy's ports 80/443 are public.

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

# Integration (builds and boots the docker compose stack, then
# exercises the HTTP surface through nginx; generates .env if missing)
./scripts/integration-test.sh
```

## CI

GitHub Actions run on every PR and push to `main`:

- `CI` (.github/workflows/ci.yml): gofmt/vet/staticcheck, TypeScript
  typecheck, backend and frontend unit tests, and the docker compose
  integration test.
- `Security` (.github/workflows/security.yml): gosec and semgrep SAST,
  govulncheck and `npm audit` dependency scans; also runs weekly so new
  advisories surface without a code change.
