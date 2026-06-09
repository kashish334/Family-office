# System Design

**Architecture:** Three-tier web application with async backend, task queue, and CDN-served SPA.

---

## High-Level Architecture

```
                         ┌──────────────────────────────────────┐
                         │           CLIENT LAYER               │
                         │  Browser / Mobile (React + Vite)     │
                         │  Served from Vercel CDN              │
                         └──────────────────┬───────────────────┘
                                            │ HTTPS
                         ┌──────────────────▼───────────────────┐
                         │           EDGE / PROXY               │
                         │  Nginx (reverse proxy + static)      │
                         │  Rate limiting · gzip · security hdrs│
                         └──────────────────┬───────────────────┘
                                            │ HTTP/1.1 (keep-alive)
          ┌──────────────┬──────────────────▼──────────────┐
          │              │        APPLICATION LAYER         │
          │              │   FastAPI (4 Uvicorn workers)    │
          │              │   Async SQLAlchemy · Pydantic v2 │
          │              └──────────────────┬───────────────┘
          │                                 │
          │              ┌──────────────────▼──────────────┐
          │              │        SERVICE LAYER             │
          │              │ Auth · Transactions · Analytics  │
          │              │ AI · OCR · Reports · Notifications│
          │              └───────────┬──────────┬──────────┘
          │                          │          │
          │              ┌───────────▼──┐   ┌───▼──────────┐
          │              │  PostgreSQL  │   │    Redis      │
          │              │  (primary)  │   │ Cache · Queue │
          │              └─────────────┘   └───────────────┘
          │                                        │
          │              ┌──────────────────────────▼──────────┐
          │              │        ASYNC TASK LAYER              │
          │              │  Celery Worker · Celery Beat         │
          │              │  Bill reminders · Monthly reports    │
          │              │  Anomaly detection · Notifications   │
          │              └─────────────────────────────────────┘
          │
          │  External Services
          │  ┌──────────────────────────────────────────────┐
          └─►│  OpenAI API  ·  AWS S3  ·  SMTP / SendGrid  │
             └──────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
| Component          | Technology               | Why                                                  |
|--------------------|--------------------------|------------------------------------------------------|
| Web framework      | FastAPI 0.115            | Native async, automatic OpenAPI docs, Pydantic v2    |
| ASGI server        | Uvicorn + uvloop         | Fastest Python async runtime                         |
| ORM                | SQLAlchemy 2.0 (async)   | Type-safe, async-first, Alembic migrations           |
| Validation         | Pydantic v2              | Fast Rust-based validation, schema generation        |
| Authentication     | python-jose + passlib    | Industry-standard JWT + bcrypt                       |
| Task queue         | Celery + Redis           | Reliable async tasks, beat scheduler                 |
| Analytics          | Pandas + NumPy + sklearn | Mature data science stack                            |
| OCR                | EasyOCR                  | No Tesseract dependency, good accuracy on receipts   |
| PDF generation     | ReportLab                | Production-grade PDF layout engine                   |
| Rate limiting      | SlowAPI                  | FastAPI-native, Redis-backed                         |
| Logging            | Loguru                   | Structured, colorised, rotation built-in             |

### Frontend
| Component     | Technology            | Why                                          |
|---------------|-----------------------|----------------------------------------------|
| Framework     | React 18              | Component model, hooks, wide ecosystem       |
| Build tool    | Vite 5                | Near-instant HMR, optimised production build |
| Language      | TypeScript            | Type safety, better IDE support              |
| Routing       | React Router v6       | Nested routes, loaders                       |
| Charts        | Recharts              | React-native, composable, accessible         |
| Icons         | Lucide React          | Consistent, tree-shakeable                   |
| HTTP client   | fetch (native)        | No extra dependency; used via service layer  |

### Infrastructure
| Component  | Technology           | Role                                    |
|------------|----------------------|-----------------------------------------|
| Proxy      | Nginx 1.27           | Reverse proxy, TLS termination, gzip    |
| Database   | PostgreSQL 16        | Primary relational data store           |
| Cache/Queue| Redis 7              | Celery broker, result backend, sessions |
| Container  | Docker + Compose     | Local dev and self-hosted production    |
| CI/CD      | GitHub Actions       | Automated testing and deployment        |

---

## Request Lifecycle

### Authenticated API Request

```
1. Client           → HTTPS POST /api/v1/families/{id}/transactions
2. Nginx             → Validates rate limit (60/min), proxies to api:8000
3. FastAPI router    → Matches route pattern, extracts path params
4. Middleware        → RequestLoggingMiddleware assigns request ID, starts timer
5. Dependency       → HTTPBearer extracts Authorization header
6. get_current_user  → Decodes JWT, loads User from PostgreSQL
7. get_family_membership → Verifies user is a member of {family_id}
8. Route handler    → Calls TransactionService.create_transaction()
9. Service layer    → Validates business rules, calls repository
10. Repository      → Executes INSERT via async SQLAlchemy session
11. DB session      → Commits transaction, refreshes model
12. Response        → Pydantic serialisation → JSON
13. Middleware      → Attaches X-Request-ID, X-Response-Time headers
14. Nginx           → Returns response to client
Total: ~15–40ms
```

### Async Background Task

```
1. Celery Beat scheduler → Triggers send_bill_reminders() every 24h
2. Task function         → Opens new AsyncSession
3. Query                 → SELECT recurring_transactions WHERE next_due_date <= today+3
4. For each due item     → SELECT admin members of family
5. NotificationService   → INSERT into notifications table
6. Session commit        → All notifications persisted atomically
7. Task success          → Result stored in Redis
```

---

## Data Flow: Transaction Creation with OCR

```
User uploads receipt image
    │
    ▼
POST /api/v1/families/{id}/uploads/receipt
    │
    ├── File validation (type, size)
    ├── Save to disk / S3
    │
    ▼
OCRService.extract_from_image()
    │
    ├── EasyOCR reads image → [(bbox, text, confidence)]
    ├── extract_merchant()   → "Whole Foods Market"
    ├── extract_total()      → Decimal("245.50")
    ├── extract_date()       → "10/24/2024"
    └── suggest_category()   → "Grocery"
    │
    ▼
Response to client:
{
  "ocr_extracted": {
    "merchant_name": "Whole Foods Market",
    "total_amount": "245.50",
    "date": "10/24/2024",
    "suggested_category": "Grocery",
    "confidence": 0.87
  }
}
    │
    ▼ (User confirms/edits, then submits)
POST /api/v1/families/{id}/transactions
{
  "description": "Whole Foods Market",
  "amount": 245.50,
  "category_id": "<grocery-cat-id>",
  "is_ocr_generated": true
}
```

---

## Security Architecture

### Authentication Flow

```
                    ┌─────────────────────────────────────┐
                    │   POST /auth/login                   │
                    │   email + password                   │
                    └────────────────┬────────────────────┘
                                     │
                    ┌────────────────▼────────────────────┐
                    │   UserRepository.get_by_email()      │
                    │   verify_password(plain, hash)       │
                    └────────────────┬────────────────────┘
                                     │  ✓ valid
                    ┌────────────────▼────────────────────┐
                    │   create_access_token(user_id)       │
                    │   create_refresh_token(user_id)      │
                    │   Signed with HS256 + JWT_SECRET_KEY │
                    └────────────────┬────────────────────┘
                                     │
                    ┌────────────────▼────────────────────┐
                    │   TokenResponse{                      │
                    │     access_token  (60 min)           │
                    │     refresh_token (30 days)          │
                    │   }                                   │
                    └─────────────────────────────────────┘

Subsequent requests:
  Authorization: Bearer <access_token>
        │
        ▼
  decode_token() → validate exp, type="access"
        │
        ▼
  User loaded from DB → is_active check
        │
        ▼
  Request proceeds
```

### Permission Model

```
Platform level (UserRole):
  super_admin → internal use only
  family_admin → manages their family account
  member → regular family member
  dependent → view-only
  advisor → read-only, no PII

Family level (MemberRole):
  admin → full access to family data
  member → can add own transactions
  dependent → view-only
  advisor → read-only, no PII

Permission flags (per FamilyMember row):
  can_view_all_transactions
  can_add_transactions
  can_manage_budgets
  can_invite_members
  can_view_reports
```

---

## Database Connection Architecture

```
FastAPI App (4 workers)
    │
    ├── Worker 1 → AsyncSession pool (10 connections)
    ├── Worker 2 → AsyncSession pool (10 connections)
    ├── Worker 3 → AsyncSession pool (10 connections)
    └── Worker 4 → AsyncSession pool (10 connections)
              │
              ▼
    SQLAlchemy async engine
    (pool_size=10, max_overflow=20)
              │
              ▼  asyncpg driver
         PostgreSQL 16
```

Each request uses a single AsyncSession (dependency-injected). The session auto-commits on success and auto-rolls back on exception.

---

## Caching Strategy

Currently: **no application-level cache** (reads go directly to PostgreSQL).

**Rationale for current approach:**
- Family data is highly personal — cache invalidation is complex
- PostgreSQL with proper indexes handles the current scale (<10k transactions/family)
- Analytics queries are fast enough (<100ms) with composite indexes

**Recommended additions for scale:**

| Endpoint                   | Cache Strategy            | TTL    |
|----------------------------|---------------------------|--------|
| `/analytics/dashboard`     | Redis per (family, month) | 5 min  |
| `/analytics/health-score`  | Redis per family          | 1 hour |
| `/ai/recommendations`      | Redis per family          | 10 min |
| Category list              | In-memory per worker      | 1 hour |

---

## Scalability

### Current (single node)
- 4 Uvicorn workers handle ~200 concurrent connections
- PostgreSQL handles up to ~200 simultaneous connections (limited by pool)
- Celery processes background tasks asynchronously (non-blocking for API)

### Horizontal scaling path

```
Load Balancer (Railway / AWS ALB)
        │
        ├── API instance 1 (2 workers)
        ├── API instance 2 (2 workers)
        └── API instance 3 (2 workers)
                    │
                    ▼
            PostgreSQL Primary
                    │
                    └── Read Replica (analytics queries)
```

**Required changes for horizontal scale:**
1. Move session storage to Redis (already using stateless JWT — no change needed)
2. Move file uploads from local disk to S3 (already implemented, toggle `STORAGE_BACKEND=s3`)
3. Add Redis-backed rate limiter (already using SlowAPI, configure Redis backend)
4. Add database read replica for analytics endpoints

---

## Monitoring & Observability

### Structured Logging

Every request logs:
```json
{
  "time": "2024-10-24 10:30:15",
  "level": "INFO",
  "message": "[a1b2c3] ▶ POST /api/v1/families/xxx/transactions (client=192.168.1.1)"
}
{
  "time": "2024-10-24 10:30:15",
  "level": "INFO",
  "message": "[a1b2c3] ◀ 201 (18.3ms)"
}
```

### Recommended Integrations

```python
# Sentry error tracking (add to main.py)
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=settings.sentry_dsn,
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
)

# Prometheus metrics (add to main.py)
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app)
```

### Key Metrics to Monitor

| Metric                     | Alert Threshold          |
|----------------------------|--------------------------|
| API P95 response time      | > 500ms                  |
| Database query time        | > 200ms                  |
| Error rate (5xx)           | > 1%                     |
| Celery queue depth         | > 100 tasks              |
| Redis memory usage         | > 80%                    |
| PostgreSQL connection pool | > 80% utilised           |
