#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  scripts/setup_dev.sh – One-command local development setup
#  Usage: bash scripts/setup_dev.sh
# ════════════════════════════════════════════════════════════════
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Check prerequisites ───────────────────────────────────────────
info "Checking prerequisites..."
command -v docker    &>/dev/null || error "Docker not found. Install from https://docs.docker.com/get-docker/"
command -v python3   &>/dev/null || error "Python 3 not found."
command -v node      &>/dev/null || error "Node.js not found. Install from https://nodejs.org/"
command -v npm       &>/dev/null || error "npm not found."
success "All prerequisites satisfied."

# ── Copy .env ─────────────────────────────────────────────────────
if [ ! -f .env ]; then
    info "Creating .env from .env.example..."
    cp .env.example .env 2>/dev/null || cp .env .env.bak
    # Generate secrets automatically
    SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    sed -i.bak "s/change-me-generate-with-openssl-rand-hex-32/${SECRET}/" .env
    sed -i.bak "s/change-me-another-openssl-rand-hex-32/${JWT_SECRET}/" .env
    rm -f .env.bak
    success ".env created with auto-generated secrets."
else
    warn ".env already exists – skipping."
fi

# ── Backend Python environment ────────────────────────────────────
info "Setting up Python virtual environment..."
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
success "Python dependencies installed."
cd ..

# ── Frontend Node dependencies ────────────────────────────────────
info "Installing frontend Node.js dependencies..."
cd frontend
npm install --silent
success "Frontend dependencies installed."
cd ..

# ── Start infrastructure (DB + Redis only) ────────────────────────
info "Starting PostgreSQL and Redis..."
docker compose up db redis -d --wait
success "Infrastructure services are healthy."

# ── Run migrations ────────────────────────────────────────────────
info "Running database migrations..."
cd backend
source .venv/bin/activate
alembic upgrade head
success "Database migrations applied."
cd ..

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Family Office – Development environment ready!  🚀${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Backend API:  ${BLUE}cd backend && uvicorn app.main:app --reload${NC}"
echo -e "  Frontend:     ${BLUE}cd frontend && npm run dev${NC}"
echo -e "  Full stack:   ${BLUE}docker compose up${NC}"
echo -e "  API Docs:     ${BLUE}http://localhost:8000/docs${NC}"
echo ""
