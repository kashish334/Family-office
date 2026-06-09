# ════════════════════════════════════════════════════════════════
#  Makefile – Developer convenience commands
#  Usage: make <target>
# ════════════════════════════════════════════════════════════════

.PHONY: help setup up down restart logs \
        test lint format migrate seed \
        shell-api shell-db \
        build push clean

DOCKER_COMPOSE = docker compose
API_SERVICE     = api
DB_SERVICE      = db

# Default target: show help
help:
	@echo ""
	@echo "  Family Office – Developer Commands"
	@echo "  ══════════════════════════════════"
	@echo ""
	@echo "  Setup"
	@echo "    make setup          One-command dev environment setup"
	@echo ""
	@echo "  Docker"
	@echo "    make up             Start all services"
	@echo "    make up-infra       Start DB + Redis only"
	@echo "    make up-tools       Start with pgAdmin + Flower"
	@echo "    make down           Stop all services"
	@echo "    make restart        Restart all services"
	@echo "    make logs           Tail all service logs"
	@echo "    make logs-api       Tail API logs only"
	@echo ""
	@echo "  Development"
	@echo "    make dev-api        Run API with hot-reload (local)"
	@echo "    make dev-frontend   Run frontend dev server (local)"
	@echo ""
	@echo "  Database"
	@echo "    make migrate        Run Alembic migrations"
	@echo "    make migrate-new m='description'  Create new migration"
	@echo "    make rollback       Rollback last migration"
	@echo "    make seed           Seed database with default data"
	@echo "    make db-backup      Backup database to file"
	@echo "    make db-restore f=backup.sql  Restore from file"
	@echo ""
	@echo "  Quality"
	@echo "    make test           Run full test suite"
	@echo "    make test-cov       Run tests with HTML coverage report"
	@echo "    make lint           Lint Python + TypeScript"
	@echo "    make format         Auto-format Python code"
	@echo ""
	@echo "  Utilities"
	@echo "    make shell-api      Open shell in API container"
	@echo "    make shell-db       Open psql in DB container"
	@echo "    make build          Build all Docker images"
	@echo "    make clean          Remove containers, volumes, images"
	@echo ""

# ── Setup ─────────────────────────────────────────────────────────

setup:
	@bash scripts/setup_dev.sh

# ── Docker ────────────────────────────────────────────────────────

up:
	$(DOCKER_COMPOSE) up -d
	@echo "✅  All services started. API: http://localhost:8000/docs"

up-infra:
	$(DOCKER_COMPOSE) up db redis -d
	@echo "✅  DB + Redis started."

up-tools:
	$(DOCKER_COMPOSE) --profile tools up -d
	@echo "✅  Services + tools started."
	@echo "   pgAdmin: http://localhost:5050"
	@echo "   Flower:  http://localhost:5555"

down:
	$(DOCKER_COMPOSE) down

restart:
	$(DOCKER_COMPOSE) restart

logs:
	$(DOCKER_COMPOSE) logs -f

logs-api:
	$(DOCKER_COMPOSE) logs -f api --tail=100

# ── Local development (no Docker for app services) ────────────────

dev-api:
	@cd backend && \
	  source .venv/bin/activate 2>/dev/null || python3 -m venv .venv && source .venv/bin/activate && \
	  pip install -r requirements.txt -q && \
	  uvicorn app.main:app --reload --port 8000

dev-frontend:
	@cd frontend && npm run dev

# ── Database ──────────────────────────────────────────────────────

migrate:
	$(DOCKER_COMPOSE) exec $(API_SERVICE) alembic upgrade head

migrate-new:
	@[ -n "$(m)" ] || (echo "Usage: make migrate-new m='description'" && exit 1)
	$(DOCKER_COMPOSE) exec $(API_SERVICE) alembic revision --autogenerate -m "$(m)"

rollback:
	$(DOCKER_COMPOSE) exec $(API_SERVICE) alembic downgrade -1

seed:
	$(DOCKER_COMPOSE) exec $(API_SERVICE) python -m app.database.init_db

db-backup:
	@FILENAME="backup_$$(date +%Y%m%d_%H%M%S).sql" && \
	$(DOCKER_COMPOSE) exec -T $(DB_SERVICE) \
	  pg_dump -U postgres family_office > $$FILENAME && \
	echo "✅  Backup saved to $$FILENAME"

db-restore:
	@[ -n "$(f)" ] || (echo "Usage: make db-restore f=backup.sql" && exit 1)
	$(DOCKER_COMPOSE) exec -T $(DB_SERVICE) \
	  psql -U postgres family_office < $(f)
	@echo "✅  Restored from $(f)"

# ── Quality ───────────────────────────────────────────────────────

test:
	$(DOCKER_COMPOSE) exec $(API_SERVICE) \
	  pytest app/tests/ -v --tb=short -q

test-cov:
	$(DOCKER_COMPOSE) exec $(API_SERVICE) \
	  pytest app/tests/ -v --cov=app --cov-report=html --cov-report=term
	@echo "Coverage report: backend/htmlcov/index.html"

lint:
	@echo "── Python ──────────────────────────────────"
	$(DOCKER_COMPOSE) exec $(API_SERVICE) \
	  sh -c "flake8 app/ --max-line-length=120 && echo '✅ flake8 passed'"
	@echo "── TypeScript ──────────────────────────────"
	@cd frontend && npx tsc --noEmit && echo "✅ TypeScript passed"

format:
	$(DOCKER_COMPOSE) exec $(API_SERVICE) \
	  sh -c "black app/ && isort app/"
	@echo "✅  Code formatted."

# ── Utilities ─────────────────────────────────────────────────────

shell-api:
	$(DOCKER_COMPOSE) exec $(API_SERVICE) bash

shell-db:
	$(DOCKER_COMPOSE) exec $(DB_SERVICE) psql -U postgres family_office

build:
	$(DOCKER_COMPOSE) build --no-cache

clean:
	$(DOCKER_COMPOSE) down -v --rmi local --remove-orphans
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	@echo "✅  Cleaned."
