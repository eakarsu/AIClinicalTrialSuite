#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   AI Clinical Trial Suite                            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Load env unless a disposable validation environment was explicitly supplied.
if [ "${SKIP_PROJECT_ENV:-false}" != "true" ] && [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

BACKEND_PORT=${BACKEND_PORT:-3051}
FRONTEND_PORT=${FRONTEND_PORT:-3050}
BACKEND_HOST=${BACKEND_HOST:-127.0.0.1}
FRONTEND_HOST=${FRONTEND_HOST:-127.0.0.1}

echo -e "${YELLOW}Checking ports $BACKEND_PORT and $FRONTEND_PORT...${NC}"
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo -e "${RED}Port $port is already occupied; refusing to terminate another process.${NC}" >&2
    exit 1
  fi
done
echo -e "${GREEN}Ports are available${NC}"

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${RED}PostgreSQL is not installed. Please install it first.${NC}"
  exit 1
fi

if ! pg_isready -h "${DB_HOST:-127.0.0.1}" -p "${DB_PORT:-5432}" > /dev/null 2>&1; then
  echo -e "${RED}PostgreSQL is unavailable; provision an isolated database before startup.${NC}" >&2
  exit 1
fi
echo -e "${GREEN}PostgreSQL is running${NC}"

# Require a pre-provisioned database; startup must not create shared state.
echo -e "${YELLOW}Checking database...${NC}"
if ! psql -h "${DB_HOST:-127.0.0.1}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME:-clinical_trial_suite}'" | grep -q 1; then
  echo -e "${RED}Database ${DB_NAME:-clinical_trial_suite} does not exist.${NC}" >&2
  exit 1
fi
echo -e "${GREEN}Database ready${NC}"

for dependency_dir in backend/node_modules frontend/node_modules; do
  [ -d "$dependency_dir" ] || { echo -e "${RED}Missing $dependency_dir; run the documented bootstrap step first.${NC}" >&2; exit 1; }
done

# Start backend with nodemon (auto-reload)
echo -e "${BLUE}Starting backend on port $BACKEND_PORT...${NC}"
( cd backend && exec env BACKEND_HOST="$BACKEND_HOST" BACKEND_PORT="$BACKEND_PORT" node server.js ) &
BACKEND_PID=$!

sleep 2

# Start frontend (React dev server auto-reloads)
echo -e "${MAGENTA}Starting frontend on port $FRONTEND_PORT...${NC}"
( cd frontend && exec env BROWSER=none DANGEROUSLY_DISABLE_HOST_CHECK=true HOST="$FRONTEND_HOST" PORT="$FRONTEND_PORT" ./node_modules/.bin/react-scripts start ) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Application is starting...                          ║${NC}"
echo -e "${GREEN}║  Frontend: http://$FRONTEND_HOST:$FRONTEND_PORT                  ║${NC}"
echo -e "${GREEN}║  Backend:  http://$BACKEND_HOST:$BACKEND_PORT                  ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  Both servers auto-reload on file changes            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  echo -e "${GREEN}Shutdown complete${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

wait
