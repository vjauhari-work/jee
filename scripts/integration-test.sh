#!/usr/bin/env bash
# End-to-end integration test: builds and boots the full docker compose
# stack, then exercises the real HTTP surface through nginx.
# Usage: ./scripts/integration-test.sh [--no-build]
set -euo pipefail
cd "$(dirname "$0")/.."

BASE_URL="${BASE_URL:-http://localhost}"
COMPOSE_ARGS=(up -d --wait)
[[ "${1:-}" == "--no-build" ]] || COMPOSE_ARGS=(up -d --build --wait)

PASS=0
FAIL=0

check() { # check <name> <expected> <actual>
  if [[ "$2" == "$3" ]]; then
    echo "  ok: $1"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $1 (expected '$2', got '$3')"
    FAIL=$((FAIL + 1))
  fi
}

status_of() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

if [[ ! -f .env ]]; then
  echo "==> Generating .env with random secrets"
  DBPW=$(openssl rand -hex 16)
  cat > .env <<EOF
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=$DBPW
MONGO_DB_NAME=jeeprep
MONGO_URI=mongodb://admin:$DBPW@mongodb:27017/jeeprep?authSource=admin
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$(openssl rand -hex 12)
ADMIN_EMAIL=admin@jeeprep.local
ALLOWED_ORIGINS=
COOKIE_SECURE=false
ME_CONFIG_MONGODB_ADMINUSERNAME=admin
ME_CONFIG_MONGODB_ADMINPASSWORD=$DBPW
ME_CONFIG_BASICAUTH_USERNAME=admin
ME_CONFIG_BASICAUTH_PASSWORD=$(openssl rand -hex 12)
EOF
fi

echo "==> Starting stack: docker compose ${COMPOSE_ARGS[*]}"
if ! docker compose "${COMPOSE_ARGS[@]}"; then
  echo "==> Stack failed to become healthy; dumping logs"
  docker compose ps
  docker compose logs --tail 100
  exit 1
fi

COOKIES=$(mktemp)
USERNAME="it_user_$(openssl rand -hex 4)"
PASSWORD="integration-pass-$(openssl rand -hex 4)"
ADMIN_PASSWORD=$(grep '^ADMIN_PASSWORD=' .env | cut -d= -f2-)

echo "==> Running assertions against $BASE_URL"

check "SPA served" "200" "$(status_of "$BASE_URL/")"
check "backend healthy" "ok" "$(docker compose exec -T backend wget -qO- http://127.0.0.1:8080/health 2>/dev/null | grep -o ok || echo down)"

HEADERS=$(curl -sI "$BASE_URL/")
check "nosniff header" "1" "$(grep -ci '^x-content-type-options: nosniff' <<<"$HEADERS")"
check "frame-options header" "1" "$(grep -ci '^x-frame-options: sameorigin' <<<"$HEADERS")"
check "server tokens hidden" "0" "$(grep -cioE '^server: nginx/[0-9]' <<<"$HEADERS")"

check "API requires auth" "401" "$(status_of "$BASE_URL/api/profile")"

check "register" "201" "$(status_of -X POST "$BASE_URL/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$USERNAME\",\"name\":\"IT User\",\"email\":\"$USERNAME@test.local\",\"phone\":\"1234567890\",\"password\":\"$PASSWORD\"}")"

check "weak password rejected" "400" "$(status_of -X POST "$BASE_URL/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"username":"weakpw","name":"W","email":"w@test.local","phone":"1","password":"short"}')"

check "login" "200" "$(status_of -c "$COOKIES" -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")"

check "cookie is HttpOnly" "1" "$(grep -c '#HttpOnly_' "$COOKIES")"

check "authed profile" "200" "$(status_of -b "$COOKIES" "$BASE_URL/api/profile")"

check "admin login" "200" "$(status_of -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"admin\",\"password\":\"$ADMIN_PASSWORD\"}")"

echo "==> Rate limit: hammering login until 429"
LIMITED=0
for _ in $(seq 1 15); do
  CODE=$(status_of -X POST "$BASE_URL/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"username":"nosuchuser","password":"wrongwrong"}')
  [[ "$CODE" == "429" ]] && LIMITED=1 && break
done
check "rate limiting kicks in" "1" "$LIMITED"

check "logout" "200" "$(status_of -b "$COOKIES" -X POST "$BASE_URL/api/auth/logout")"

rm -f "$COOKIES"
echo
echo "==> $PASS passed, $FAIL failed"
if [[ $FAIL -gt 0 ]]; then
  docker compose logs --tail 50 backend
  exit 1
fi
