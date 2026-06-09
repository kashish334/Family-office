# Family Office — Premium Wealth Management Platform

A full-stack, production-ready family finance management application with AI-powered insights, real-time analytics, OCR receipt scanning, and collaborative budgeting.

---

## Screenshots

| Landing Page | Dashboard | AI Advisor |
|---|---|---|
| Clean marketing page with feature highlights | Real-time income/expense analytics | Multi-turn financial chatbot |

---

## Tech Stack

### Backend
```
FastAPI 0.115      Async Python web framework
PostgreSQL 16      Primary relational database (async via asyncpg)
Redis 7            Celery broker + result backend
Celery 5           Background task queue
SQLAlchemy 2.0     Async ORM with Alembic migrations
Pydantic v2        Request/response validation
OpenAI GPT-4o-mini AI financial advisor and summaries
scikit-learn       Isolation Forest anomaly detection
Pandas / NumPy     Analytics and forecasting
EasyOCR            Receipt image text extraction
ReportLab          PDF report generation
openpyxl           Excel export
Nginx 1.27         Reverse proxy + static file server
```

### Frontend
```
React 18 + TypeScript    Component-based UI
Vite 5                   Build tooling and dev server
React Router v6          Client-side routing
Recharts                 Data visualisation
Lucide React             Icon library
```

### Infrastructure
```
Docker + Compose    Containerised services
GitHub Actions      CI/CD pipeline
Railway             Backend deployment
Vercel              Frontend deployment
AWS S3 (optional)   File storage
```

---

## Features

### Core Financial Management
- **Multi-member family accounts** with role-based permissions (admin, member, dependent, advisor)
- **Transaction management** with full CRUD, 7-dimension filtering, and pagination
- **Income tracking** with recurring source management and trend analytics
- **Expense analytics** with category breakdown, daily spending heatmaps, and MoM comparisons
- **Budget planning** with interactive monthly limits and real-time budget vs. actual tracking
- **Savings goals** with progress tracking, contribution management, and deadline projections

### AI & Analytics
- **AI financial advisor** — conversational chatbot with live financial context injection
- **Spending anomaly detection** — Isolation Forest algorithm flags unusual transactions
- **Expense forecasting** — Linear Regression model projects 1–12 months ahead
- **Financial health score** — composite 0–100 score across savings rate, liquidity, and trend
- **AI monthly summaries** — auto-generated natural-language reports (Celery scheduled)
- **Smart recommendations** — rule-based quick insights (< 5ms) + AI deep analysis

### Automation
- **OCR receipt scanning** — upload receipt photos → auto-extract merchant, amount, date, category
- **Recurring transaction templates** — income/expense recurring entries with due-date tracking
- **Celery scheduled tasks** — bill reminders, monthly AI summaries, weekly anomaly scans
- **Notification system** — in-app notifications with 6 types (budget alerts, bill reminders, milestones)

### Reports & Exports
- **PDF monthly reports** — professional ReportLab-generated statements
- **Excel transaction exports** — formatted workbook with custom date ranges
- **Financial health reports** with score breakdown and recommendations

### Security
- JWT authentication with access (60 min) + refresh (30 day) token pair
- bcrypt password hashing (12 rounds)
- Per-family, per-member granular permission flags
- Rate limiting: 60 req/min general, 10 req/min auth endpoints
- CORS protection with domain allowlist
- Security response headers (X-Frame-Options, CSP, HSTS, etc.)
- Soft deletes — no data permanently destroyed
- Input validation via Pydantic v2 on all endpoints

---

## Project Structure

```
family-budget-tracker/
│
├── backend/                        # FastAPI application
│   ├── app/
│   │   ├── main.py                 # App factory, middleware, lifespan
│   │   ├── config.py               # Pydantic settings (env vars)
│   │   ├── dependencies.py         # FastAPI dependency injection
│   │   │
│   │   ├── api/routes/             # Route handlers (14 modules)
│   │   │   ├── auth.py             # Register, login, refresh, /me
│   │   │   ├── families.py         # Family CRUD + member management
│   │   │   ├── transactions.py     # Transaction CRUD + filtering
│   │   │   ├── analytics.py        # Dashboard, health score, forecast
│   │   │   ├── ai.py               # Chat, summaries, recommendations
│   │   │   ├── savings.py          # Savings goals + contributions
│   │   │   ├── budgets.py          # Monthly budget limits
│   │   │   ├── reports.py          # PDF/Excel generation + download
│   │   │   ├── notifications.py    # User notification inbox
│   │   │   └── uploads.py          # Receipt OCR upload
│   │   │
│   │   ├── core/                   # Cross-cutting concerns
│   │   │   ├── security.py         # JWT creation/verification + bcrypt
│   │   │   ├── permissions.py      # Role guards and permission helpers
│   │   │   ├── middleware.py       # Request logging + security headers
│   │   │   ├── rate_limiter.py     # SlowAPI limiter instance
│   │   │   └── logging.py          # Loguru configuration
│   │   │
│   │   ├── database/
│   │   │   ├── base.py             # SQLAlchemy DeclarativeBase
│   │   │   ├── session.py          # Async engine + session factory
│   │   │   ├── init_db.py          # Table creation + category seeding
│   │   │   └── migrations/         # Alembic async migration environment
│   │   │
│   │   ├── models/                 # SQLAlchemy ORM models (12)
│   │   │   ├── user.py             # User + UserRole enum
│   │   │   ├── family.py           # Family account
│   │   │   ├── family_member.py    # Membership + permissions
│   │   │   ├── transaction.py      # Core financial record
│   │   │   ├── category.py         # Transaction categories
│   │   │   ├── budget.py           # Monthly limits
│   │   │   ├── savings_goal.py     # Savings milestones
│   │   │   ├── recurring_transaction.py
│   │   │   ├── ai_insight.py       # Stored AI insights
│   │   │   ├── notification.py     # User notifications
│   │   │   ├── uploaded_file.py    # File metadata
│   │   │   └── report.py           # Generated report records
│   │   │
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── repositories/           # Database access layer
│   │   ├── services/               # Business logic layer
│   │   ├── analytics/              # Data science modules
│   │   │   ├── financial_health.py # Health score computation
│   │   │   ├── spending_analysis.py# Category breakdown
│   │   │   ├── forecasting.py      # Linear regression forecast
│   │   │   ├── anomaly_detection.py# Isolation Forest
│   │   │   └── trend_analysis.py   # Pandas trend metrics
│   │   │
│   │   ├── ai/                     # AI modules
│   │   │   ├── prompts.py          # System prompts + context builders
│   │   │   ├── chatbot.py          # Conversation formatting
│   │   │   └── recommendations.py  # Rule-based quick recommendations
│   │   │
│   │   ├── tasks/                  # Celery background tasks
│   │   │   ├── celery_worker.py    # Celery app + beat schedule
│   │   │   ├── reminders.py        # Bill reminder notifications
│   │   │   ├── monthly_reports.py  # Monthly AI summary generation
│   │   │   └── notifications.py    # Anomaly detection scan
│   │   │
│   │   ├── utils/                  # Shared utilities
│   │   └── tests/                  # Pytest test suite
│   │
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/                       # React + Vite application
│   ├── src/
│   │   ├── App.tsx                 # Router configuration
│   │   ├── main.tsx                # React entry point
│   │   ├── components/ui/          # Shared UI components
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   └── Navbar.tsx          # Top navigation bar
│   │   ├── pages/                  # Page components (11 pages)
│   │   │   ├── LandingPage.tsx     # Marketing / home page
│   │   │   ├── Login.tsx           # Authentication
│   │   │   ├── Dashboard.tsx       # Main overview dashboard
│   │   │   ├── Transactions.tsx    # Transaction list + filters
│   │   │   ├── Income.tsx          # Income management
│   │   │   ├── Expenses.tsx        # Expense analytics
│   │   │   ├── SavingsGoals.tsx    # Savings architecture
│   │   │   ├── BudgetPlanning.tsx  # Interactive budget sliders
│   │   │   ├── AIAdvisor.tsx       # Chat interface
│   │   │   ├── Reports.tsx         # Intelligence & reports
│   │   │   └── OtherPages.tsx      # Members, Bills, Settings, 404
│   │   ├── layouts/                # Page layout wrappers
│   │   ├── data/                   # Mock data for development
│   │   └── styles/                 # Global CSS variables + fonts
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── docker/
│   ├── backend/Dockerfile          # Multi-stage Python build
│   ├── frontend/Dockerfile         # Node builder + Nginx runtime
│   └── nginx/nginx.conf            # Reverse proxy + security config
│
├── docs/
│   ├── API_DOCUMENTATION.md        # Full REST API reference
│   ├── DATABASE_SCHEMA.md          # All tables, columns, indexes
│   ├── DEPLOYMENT_GUIDE.md         # Railway + Vercel + self-hosted
│   ├── AI_ARCHITECTURE.md          # AI/ML design decisions
│   └── SYSTEM_DESIGN.md            # Architecture + data flows
│
├── scripts/
│   ├── setup_dev.sh                # One-command dev environment setup
│   ├── deploy.sh                   # Production deployment helper
│   └── init_db.sql                 # PostgreSQL extensions + roles
│
├── docker-compose.yml              # Full stack orchestration
├── .env                            # Environment variables (gitignored)
├── .gitignore
└── README.md
```

---

## Quick Start

### Prerequisites
- Docker Engine 24+ and Docker Compose v2
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### 1. Clone and configure

```bash
git clone https://github.com/your-org/family-budget-tracker.git
cd family-budget-tracker

# Auto-setup development environment
bash scripts/setup_dev.sh
```

This script:
- Generates cryptographically random secrets in `.env`
- Creates Python virtualenv and installs dependencies
- Installs frontend Node modules
- Starts PostgreSQL + Redis via Docker
- Runs Alembic migrations
- Seeds default categories

### 2. Start the full stack

```bash
# Start everything
docker compose up

# Or start infrastructure only and run services locally:
docker compose up db redis -d

# Backend (with hot-reload)
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Frontend (with HMR)
cd frontend && npm run dev
```

### 3. Access the application

| Service         | URL                          |
|-----------------|------------------------------|
| Frontend        | http://localhost:5173         |
| API             | http://localhost:8000         |
| API Docs        | http://localhost:8000/docs    |
| pgAdmin         | http://localhost:5050 (tools) |
| Flower (Celery) | http://localhost:5555 (tools) |

Start with tools profile:
```bash
docker compose --profile tools up
```

---

## Development

### Running tests

```bash
cd backend
source .venv/bin/activate
pytest app/tests/ -v --cov=app --cov-report=html

# View coverage report
open htmlcov/index.html
```

### Creating a database migration

```bash
cd backend
source .venv/bin/activate

# After modifying a model file:
alembic revision --autogenerate -m "add invoice_number to transactions"

# Review the generated migration, then apply:
alembic upgrade head
```

### Adding a new API endpoint

1. Create/update the model in `app/models/`
2. Add Pydantic schemas in `app/schemas/`
3. Add repository methods in `app/repositories/`
4. Add business logic in `app/services/`
5. Create the route in `app/api/routes/`
6. Register the router in `app/api/api_router.py`
7. Generate and apply a migration
8. Write tests in `app/tests/`

### Code style

```bash
cd backend
black app/            # Format Python
isort app/            # Sort imports
flake8 app/           # Lint

cd frontend
npm run lint          # ESLint
```

---

## Deployment

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for full instructions.

### Quick deploy to Railway + Vercel

```bash
# 1. Push to GitHub
git push origin main

# 2. GitHub Actions runs tests automatically

# 3. On success, deploys:
#    - Backend → Railway (auto-migrates DB)
#    - Frontend → Vercel (builds and CDN-distributes)
```

### Environment variables

Copy `.env` to `.env.production` and update:

```bash
ENVIRONMENT=production
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
OPENAI_API_KEY=sk-...
DATABASE_URL=<production-postgres-url>
REDIS_URL=<production-redis-url>
ALLOWED_ORIGINS=https://your-domain.com
STORAGE_BACKEND=s3
```

---

## API Reference

Full documentation: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

Interactive docs (development only): http://localhost:8000/docs

### Quick reference

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test@example.com","password":"Password123!"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Create family
curl -X POST http://localhost:8000/api/v1/families \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Family","currency":"USD"}'

# Get dashboard
curl http://localhost:8000/api/v1/families/<id>/analytics/dashboard?year=2024&month=10 \
  -H "Authorization: Bearer <token>"
```

---

## Architecture

See [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) for the full architecture documentation including:
- High-level architecture diagram
- Request lifecycle (step-by-step)
- Security architecture and permission model
- Database connection pooling strategy
- Scalability path from single node to horizontal

See [docs/AI_ARCHITECTURE.md](docs/AI_ARCHITECTURE.md) for:
- AI feature layers and their latency/cost profiles
- Prompt design and hallucination prevention
- Isolation Forest anomaly detection implementation
- Token cost estimation

---

## Database Schema

See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for all 12 table definitions with columns, types, constraints, and index strategy.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/add-csv-import`
3. Make changes and add tests
4. Run the test suite: `pytest app/tests/ -v`
5. Commit with conventional commits: `git commit -m "feat: add CSV transaction import"`
6. Push and open a Pull Request

### Commit convention
```
feat:     new feature
fix:      bug fix
docs:     documentation changes
style:    formatting (no logic change)
refactor: code restructure
test:     add/update tests
chore:    build, deps, config changes
```

---

## License

MIT License — see LICENSE file for details.

---

## Acknowledgements

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) — modern Python web framework
- [SQLAlchemy](https://www.sqlalchemy.org/) — Python SQL toolkit
- [OpenAI](https://openai.com/) — GPT-4o-mini for AI features
- [EasyOCR](https://github.com/JaidedAI/EasyOCR) — receipt text extraction
- [Recharts](https://recharts.org/) — React charting library
