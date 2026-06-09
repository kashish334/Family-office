#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  scripts/deploy.sh – Production deployment helper
#  Usage: bash scripts/deploy.sh [staging|production]
# ════════════════════════════════════════════════════════════════
set -euo pipefail

TARGET="${1:-staging}"
BLUE='\033[0;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[[ "$TARGET" == "staging" || "$TARGET" == "production" ]] || \
    error "Usage: $0 [staging|production]"

info "Deploying to: ${TARGET}"

# ── Pre-flight checks ─────────────────────────────────────────────
[ -f .env ] || error ".env file not found. Copy .env.example and configure."
grep -q "change-me" .env && error "Replace placeholder secrets in .env before deploying!"

# ── Build images ──────────────────────────────────────────────────
info "Building Docker images..."
docker compose -f docker-compose.yml build --no-cache
success "Images built."

# ── Run tests ─────────────────────────────────────────────────────
info "Running test suite..."
docker compose run --rm api sh -c "cd /app && pytest app/tests/ -v --tb=short -q"
success "Tests passed."

# ── Apply migrations ──────────────────────────────────────────────
info "Applying database migrations..."
docker compose run --rm api alembic upgrade head
success "Migrations applied."

# ── Deploy ────────────────────────────────────────────────────────
info "Starting services..."
docker compose up -d --remove-orphans
success "Services started."

# ── Health check ──────────────────────────────────────────────────
info "Waiting for API health check..."
for i in $(seq 1 30); do
    if curl -sf http://localhost/health &>/dev/null; then
        success "API is healthy!"
        break
    fi
    echo -n "."
    sleep 2
    [ "$i" -eq 30 ] && error "API failed health check after 60s."
done

echo ""
success "🎉 Deployment to ${TARGET} complete!"
docker compose ps
