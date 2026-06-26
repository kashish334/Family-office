# Family Office — Premium Wealth Management Platform

A full-stack, production-ready family finance management application with AI-powered insights, real-time analytics, collaborative budgeting, and multi-member family workspaces.

**Live:** [https://family-office-ten-weld.vercel.app](https://family-office-ten-weld.vercel.app)  
**API:** [https://family-office-backend-z1u0.onrender.com](https://family-office-backend-z1u0.onrender.com)

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
SQLAlchemy 2.0     Async ORM with table auto-creation via init_db
Pydantic v2        Request/response validation
Google Gemini      AI financial advisor and summaries
scikit-learn       Isolation Forest anomaly detection
Pandas / NumPy     Analytics and forecasting
EasyOCR            Receipt image text extraction
ReportLab          PDF report generation
openpyxl           Excel export
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
Docker              Containerised backend
Render              Backend deployment (free tier)
Vercel              Frontend deployment
PostgreSQL          Render managed database
```

---

## Features

### Core Financial Management
- **Multi-member family accounts** with role-based permissions (admin, member, dependent, advisor)
- **Transaction management** with full CRUD, filtering, and pagination
- **Income tracking** with recurring source management and trend analytics
- **Expense analytics** with category breakdown and MoM comparisons
- **Budget planning** with interactive monthly limits and real-time budget vs. actual tracking
- **Savings goals** with progress tracking, contribution management, and deadline projections

### Family Management (New)
- **Create family workspace** from the UI — new users are prompted to name their family on first login instead of silent auto-creation
- **Invite members by email** — admins can add family members from Settings → Family Members
- **Member roles** — assign admin, member, dependent, or advisor roles
- **Remove members** — admins can remove members from the family workspace
- **Join via invite** — invited members automatically join the correct family on next login
- **`GET /families/me`** — new endpoint returns all families a user belongs to across any device

### AI & Analytics
- **AI financial advisor** — conversational chatbot with live financial context injection (Google Gemini)
- **Spending anomaly detection** — Isolation Forest algorithm flags unusual transactions
- **Expense forecasting** — Linear Regression model projects 1–12 months ahead
- **Financial health score** — composite 0–100 score across savings rate, liquidity, and trend
- **Smart recommendations** — rule-based quick insights + AI deep analysis

### Security
- JWT authentication with access tokens
- bcrypt password hashing
- Per-family, per-member granular permission flags
- Rate limiting: 60 req/min general, 10 req/min auth endpoints
- CORS configured for production frontend domain
- Soft deletes — no data permanently destroyed
- Input validation via Pydantic v2 on all endpoints

### UI/UX
- **Dark mode** — full dark theme support via CSS variables and `data-theme` attribute
- **Family Setup page** — guided onboarding for new users (create or join a family)
- **Responsive design** — works on desktop and mobile

---

## Project Structure

```
Family-office/
│
├── backend/                        # FastAPI application
│   ├── app/
│   │   ├── main.py                 # App factory, CORS, lifespan (runs init_db on startup)
│   │   ├── config.py               # Pydantic settings (env vars)
│   │   ├── dependencies.py         # FastAPI dependency injection
│   │   │
│   │   ├── api/routes/             # Route handlers
│   │   │   ├── auth.py             # Register, login, /me
│   │   │   ├── families.py         # Family CRUD + member management + GET /me
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
│   │   │   ├── init_db.py          # Table creation + category seeding (runs on startup)
│   │   │   └── migrations/         # Alembic migration environment
│   │   │
│   │   ├── models/                 # SQLAlchemy ORM models (12)
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── repositories/           # Database access layer
│   │   └── services/               # Business logic layer
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/                       # React + Vite application
│   ├── src/
│   │   ├── App.tsx                 # Router + ProtectedLayout + family-setup guard
│   │   ├── context/
│   │   │   ├── AuthContext.tsx     # Auth state + family resolution logic
│   │   │   └── ThemeContext.tsx    # Dark/light mode toggle
│   │   ├── services/
│   │   │   └── api.ts              # All API calls incl. families.mine/listMembers/inviteMember
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx     # Marketing / home page
│   │   │   ├── Login.tsx           # Authentication
│   │   │   ├── Register.tsx        # Registration
│   │   │   ├── FamilySetup.tsx     # New user onboarding — create or join a family
│   │   │   ├── Dashboard.tsx       # Main overview dashboard
│   │   │   ├── Transactions.tsx    # Transaction list + filters (income/expense)
│   │   │   ├── SavingsGoals.tsx    # Savings architecture
│   │   │   ├── BudgetPlanning.tsx  # Interactive budget sliders
│   │   │   ├── AIAdvisor.tsx       # Chat interface
│   │   │   ├── Settings.tsx        # Profile + Family Members management + dark mode
│   │   │   └── Reports.tsx         # Intelligence & reports
│   │   └── styles/
│   │       └── globals.css         # CSS variables incl. full dark mode theme
│   │
│   ├── vercel.json                 # SPA rewrite rules for Vercel
│   └── package.json
│
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── AI_ARCHITECTURE.md
│   └── SYSTEM_DESIGN.md
│
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Local)

### Prerequisites
- Docker Engine 24+ and Docker Compose v2
- Node.js 20+
- Python 3.12+

### 1. Clone and configure

```bash
git clone https://github.com/kashish334/Family-office.git
cd Family-office

cp .env.example .env
# Edit .env with your values
```

### 2. Start the backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL (or use a local one)
docker compose up db -d

# Run the app — tables are auto-created on startup
uvicorn app.main:app --reload
```

### 3. Start the frontend

```bash
cd frontend
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev
```

### 4. Access the application

| Service   | URL                       |
|-----------|---------------------------|
| Frontend  | http://localhost:5173      |
| API       | http://localhost:8000      |
| API Docs  | http://localhost:8000/docs |

---

## Deployment

### Backend → Render

1. Push repo to GitHub
2. Render → **New → Web Service** → connect repo
3. Set **Runtime** to `Docker`
4. Set **Dockerfile Path** to `backend/Dockerfile`
5. Set **Docker Build Context** to `backend`
6. Add environment variables:

```
ENVIRONMENT=production
SECRET_KEY=<random 32-char string>
JWT_SECRET_KEY=<random 32-char string>
POSTGRES_HOST=<from Render DB>
POSTGRES_PORT=5432
POSTGRES_DB=family_office
POSTGRES_USER=<from Render DB>
POSTGRES_PASSWORD=<from Render DB>
ALLOWED_ORIGINS=https://your-app.vercel.app
GEMINI_API_KEY=<your key>
```

> Tables are auto-created on startup via `init_db()` — no migration command needed.

### Frontend → Vercel

1. Vercel → **New Project** → import repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:

```
VITE_API_URL=https://your-api.onrender.com
```

4. Deploy — `vercel.json` handles SPA routing automatically

---

## How Family Management Works

### New user flow
1. User registers → lands on `/family-setup`
2. Chooses **"Create a Family"** → enters name → goes to dashboard
3. Or chooses **"Join via Invite"** → waits for admin to add them

### Inviting a member
1. The new member registers their own account first
2. Admin goes to **Settings → Family Members**
3. Enters member's email + selects role → clicks **Add**
4. Member logs out and back in → automatically joins admin's family

### API endpoints
```
GET    /api/v1/families/me                          # List all families current user belongs to
POST   /api/v1/families/                            # Create a new family
GET    /api/v1/families/{id}/members                # List family members
POST   /api/v1/families/{id}/members                # Invite member by email
DELETE /api/v1/families/{id}/members/{user_id}      # Remove a member
```

---

## Environment Variables

### Backend (Render)
| Variable | Description |
|---|---|
| `ENVIRONMENT` | `production` or `development` |
| `SECRET_KEY` | Random secret for token signing |
| `JWT_SECRET_KEY` | Random secret for JWT |
| `POSTGRES_HOST` | Database host |
| `POSTGRES_PORT` | Database port (5432) |
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend URLs |
| `GEMINI_API_KEY` | Google Gemini API key for AI features |

### Frontend (Vercel)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL e.g. `https://your-api.onrender.com` |

---

## API Reference

Interactive docs (development): http://localhost:8000/docs

Full documentation: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

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
curl -X POST http://localhost:8000/api/v1/families/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"The Sharma Family"}'

# Invite a member
curl -X POST http://localhost:8000/api/v1/families/<id>/members \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"member@example.com","role":"member"}'
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/add-csv-import`
3. Make changes and commit: `git commit -m "feat: add CSV transaction import"`
4. Push and open a Pull Request

### Commit convention
```
feat:     new feature
fix:      bug fix
docs:     documentation changes
refactor: code restructure
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
- [Google Gemini](https://ai.google.dev/) — AI financial advisor
- [Recharts](https://recharts.org/) — React charting library
- [Render](https://render.com/) — backend hosting
- [Vercel](https://vercel.com/) — frontend hosting
