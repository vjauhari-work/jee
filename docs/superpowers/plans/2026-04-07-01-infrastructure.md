# Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Docker Compose with MongoDB, mongo-express, Go backend, Nginx reverse proxy, and development/production configs.

**Architecture:** Four Docker services orchestrated by docker-compose.yml. Nginx serves built React static files and proxies /api/* to the Go backend. MongoDB persists data via Docker volume. mongo-express provides a web UI for DB management.

**Tech Stack:** Docker Compose, Nginx, MongoDB 7, mongo-express, Go 1.22

---

### Task 1: Docker Compose File

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.gitignore` (root level)

- [ ] **Step 1: Create root .gitignore**

```gitignore
# Environment
.env

# Docker volumes
mongo-data/

# IDE
.idea/
.vscode/

# OS
.DS_Store

# Superpowers
.superpowers/

# Backend binary
backend/jee-backend

# Frontend build
frontend/dist/
frontend/node_modules/

# Uploads
backend/uploads/
```

- [ ] **Step 2: Create .env.example**

```env
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=changeme
MONGO_DB_NAME=jeeprep

# mongo-express
ME_CONFIG_MONGODB_ADMINUSERNAME=admin
ME_CONFIG_MONGODB_ADMINPASSWORD=changeme
ME_CONFIG_BASICAUTH_USERNAME=admin
ME_CONFIG_BASICAUTH_PASSWORD=changeme

# Backend
JWT_SECRET=change-this-to-a-random-string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@jeeprep.local
MONGO_URI=mongodb://admin:changeme@mongodb:27017/jeeprep?authSource=admin

# Nginx
DOMAIN=localhost
```

- [ ] **Step 3: Create docker-compose.yml**

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:7
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

  mongo-express:
    image: mongo-express:latest
    restart: unless-stopped
    depends_on:
      - mongodb
    environment:
      ME_CONFIG_MONGODB_SERVER: mongodb
      ME_CONFIG_MONGODB_ADMINUSERNAME: ${ME_CONFIG_MONGODB_ADMINUSERNAME}
      ME_CONFIG_MONGODB_ADMINPASSWORD: ${ME_CONFIG_MONGODB_ADMINPASSWORD}
      ME_CONFIG_BASICAUTH_USERNAME: ${ME_CONFIG_BASICAUTH_USERNAME}
      ME_CONFIG_BASICAUTH_PASSWORD: ${ME_CONFIG_BASICAUTH_PASSWORD}
    ports:
      - "8081:8081"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      - mongodb
    environment:
      MONGO_URI: ${MONGO_URI}
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_USERNAME: ${ADMIN_USERNAME}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      MONGO_DB_NAME: ${MONGO_DB_NAME}
    volumes:
      - ./backend/uploads:/app/uploads
    ports:
      - "8080:8080"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    depends_on:
      - backend
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./backend/uploads:/usr/share/nginx/uploads:ro
    ports:
      - "80:80"

volumes:
  mongo-data:
```

- [ ] **Step 4: Verify docker-compose.yml is valid YAML**

Run: `cd /home/user/jee && docker compose config --quiet 2>&1 || echo "YAML invalid"`
Expected: no output (valid) or env var warnings (acceptable at this stage)

- [ ] **Step 5: Commit**

```bash
git add .gitignore .env.example docker-compose.yml
git commit -m "feat: add Docker Compose with MongoDB, mongo-express, backend, nginx"
```

---

### Task 2: Backend Dockerfile

**Files:**
- Create: `backend/Dockerfile`

- [ ] **Step 1: Create backend Dockerfile**

```dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o jee-backend .

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/jee-backend .
RUN mkdir -p /app/uploads
EXPOSE 8080
CMD ["./jee-backend"]
```

- [ ] **Step 2: Commit**

```bash
git add backend/Dockerfile
git commit -m "feat: add multi-stage Go backend Dockerfile"
```

---

### Task 3: Nginx Configuration

**Files:**
- Create: `nginx/nginx.conf`

- [ ] **Step 1: Create nginx directory and config**

```nginx
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;
    client_max_body_size 10M;

    server {
        listen 80;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        # API proxy
        location /api/ {
            proxy_pass http://backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Uploaded images
        location /uploads/ {
            alias /usr/share/nginx/uploads/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # SPA fallback — serve index.html for all non-file routes
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add nginx/nginx.conf
git commit -m "feat: add Nginx config with API proxy, uploads, and SPA fallback"
```

---

### Task 4: Backend Config Package

**Files:**
- Create: `backend/config/config.go`

- [ ] **Step 1: Create config package that reads env vars**

```go
package config

import "os"

type Config struct {
	MongoURI      string
	MongoDBName   string
	JWTSecret     string
	AdminUsername string
	AdminPassword string
	AdminEmail    string
	Port          string
}

func Load() *Config {
	return &Config{
		MongoURI:      getEnv("MONGO_URI", "mongodb://localhost:27017/jeeprep"),
		MongoDBName:   getEnv("MONGO_DB_NAME", "jeeprep"),
		JWTSecret:     getEnv("JWT_SECRET", "dev-secret-change-me"),
		AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "admin123"),
		AdminEmail:    getEnv("ADMIN_EMAIL", "admin@jeeprep.local"),
		Port:          getEnv("PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
```

- [ ] **Step 2: Write test for config loading**

Create: `backend/config/config_test.go`

```go
package config

import (
	"os"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	cfg := Load()
	if cfg.Port != "8080" {
		t.Errorf("expected default port 8080, got %s", cfg.Port)
	}
	if cfg.MongoDBName != "jeeprep" {
		t.Errorf("expected default db name jeeprep, got %s", cfg.MongoDBName)
	}
}

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("PORT", "9090")
	defer os.Unsetenv("PORT")

	cfg := Load()
	if cfg.Port != "9090" {
		t.Errorf("expected port 9090 from env, got %s", cfg.Port)
	}
}
```

- [ ] **Step 3: Run tests**

Run: `cd /home/user/jee/backend && go test ./config/ -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add backend/config/
git commit -m "feat: add backend config package with env var loading"
```
