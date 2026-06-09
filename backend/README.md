# Family Office – Backend API

Production-ready FastAPI backend for the Family Office wealth management platform.

## Architecture

```
FastAPI  →  Service Layer  →  Repository Layer  →  PostgreSQL (async)
                ↓
         AI Service (OpenAI)  +  Analytics (Pandas/NumPy/sklearn)
                ↓
         Celery Worker  →  Redis  (periodic tasks, notifications)
```

## Quick Start (Docker)

```bash
cp .env.example .env
# Fill in OPENAI_API_KEY, SECRET_KEY, JWT_SECRET_KEY

docker compose up --build
```

API docs available at: http://localhost:8000/docs
Celery Flower at: http://localhost:5555

## Local Development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL and Redis (via Docker or locally)
docker compose up db redis -d

# Run DB migrations
alembic upgrade head

# Start API
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.tasks.celery_worker worker --loglevel=info
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Get JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET  | `/api/v1/auth/me` | Current user profile |
| POST | `/api/v1/families/` | Create family |
| GET  | `/api/v1/families/{id}` | Get family |
| POST | `/api/v1/families/{id}/members` | Invite member |
| GET  | `/api/v1/families/{id}/transactions` | List transactions |
| POST | `/api/v1/families/{id}/transactions` | Create transaction |
| GET  | `/api/v1/families/{id}/analytics/dashboard` | Dashboard summary |
| GET  | `/api/v1/families/{id}/analytics/health-score` | Financial health |
| GET  | `/api/v1/families/{id}/analytics/forecast` | Expense forecast |
| GET  | `/api/v1/families/{id}/analytics/anomalies` | Anomaly detection |
| POST | `/api/v1/families/{id}/ai/chat` | AI advisor chat |
| POST | `/api/v1/families/{id}/ai/monthly-summary` | AI monthly summary |
| GET  | `/api/v1/families/{id}/ai/recommendations` | Smart recommendations |
| GET  | `/api/v1/families/{id}/savings` | Savings goals |
| POST | `/api/v1/families/{id}/savings/{id}/contribute` | Add to goal |
| GET  | `/api/v1/families/{id}/reports/monthly-pdf` | Download PDF report |
| GET  | `/api/v1/families/{id}/reports/excel-export` | Download Excel |
| POST | `/api/v1/families/{id}/uploads/receipt` | OCR receipt scan |
| GET  | `/api/v1/notifications/` | User notifications |
| POST | `/api/v1/notifications/mark-read` | Mark as read |

## Running Tests

```bash
pytest --cov=app --cov-report=html -v
```

## Database Migrations

```bash
# Generate migration after model changes
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## Production Deployment (Railway)

1. Push to GitHub
2. Connect Railway to repo
3. Set environment variables in Railway dashboard
4. Add PostgreSQL and Redis plugins
5. Deploy → Railway handles the rest

### Key environment variables for production:
```
ENVIRONMENT=production
SECRET_KEY=<long-random-string>
JWT_SECRET_KEY=<long-random-string>
DATABASE_URL=<railway-postgres-url>
REDIS_URL=<railway-redis-url>
OPENAI_API_KEY=<your-key>
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

## Security Features

- ✅ JWT authentication with refresh tokens
- ✅ bcrypt password hashing (12 rounds)
- ✅ Role-based access control (family admin / member / dependent / advisor)
- ✅ Per-member permission flags
- ✅ Rate limiting (60/min default, 10/min auth)
- ✅ CORS protection
- ✅ Security response headers (X-Frame-Options, CSP, etc.)
- ✅ Request logging with unique request IDs
- ✅ Soft deletes (no data permanently destroyed)
- ✅ Input validation via Pydantic v2
- ✅ File type and size validation on uploads
- ✅ SQL injection prevention via SQLAlchemy ORM
