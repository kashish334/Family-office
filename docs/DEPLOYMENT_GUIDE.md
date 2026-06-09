# Deployment Guide

**Stack:** FastAPI backend · React frontend · PostgreSQL · Redis · Celery · Nginx

---

## Overview

| Component     | Platform          | URL Pattern                              |
|---------------|-------------------|------------------------------------------|
| Frontend      | Vercel            | `https://family-office.vercel.app`       |
| Backend API   | Railway           | `https://family-office-api.railway.app`  |
| Database      | Railway (Postgres)| Internal Railway connection              |
| Redis         | Railway (Redis)   | Internal Railway connection              |
| Celery Worker | Railway           | Background service                       |
| Full stack    | Self-hosted VPS   | Via Docker Compose + Nginx               |

---

## Option A: Railway (Backend) + Vercel (Frontend) — Recommended

### 1. Prerequisites
- Railway account at [railway.app](https://railway.app)
- Vercel account at [vercel.com](https://vercel.com)
- GitHub repository with this project

### 2. Deploy Backend to Railway

#### Step 1 – Create Railway project
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
```

#### Step 2 – Add PostgreSQL
1. In Railway dashboard → **+ New** → **Database** → **PostgreSQL**
2. Note the `DATABASE_URL` from the Variables tab

#### Step 3 – Add Redis
1. In Railway dashboard → **+ New** → **Database** → **Redis**
2. Note the `REDIS_URL`

#### Step 4 – Configure backend service
1. In Railway dashboard → **+ New** → **GitHub Repo** → select your repo
2. Set **Root Directory** to `backend`
3. Set **Dockerfile Path** to `../docker/backend/Dockerfile`

#### Step 5 – Set environment variables in Railway
```
ENVIRONMENT=production
SECRET_KEY=<openssl rand -hex 32>
JWT_SECRET_KEY=<openssl rand -hex 32>
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
CELERY_BROKER_URL=${{Redis.REDIS_URL}}
CELERY_RESULT_BACKEND=${{Redis.REDIS_URL}}
OPENAI_API_KEY=sk-...
ALLOWED_ORIGINS=https://your-app.vercel.app
STORAGE_BACKEND=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=family-office-uploads
LOG_LEVEL=info
UVICORN_WORKERS=2
```

#### Step 6 – Add Celery worker service
1. **+ New** → **GitHub Repo** → same repo
2. Root Directory: `backend`
3. Override start command:
   ```
   celery -A app.tasks.celery_worker worker --loglevel=info --concurrency=2
   ```
4. Add same environment variables as API service

#### Step 7 – Deploy
```bash
railway up
```

Railway auto-runs `alembic upgrade head` on deploy via the Dockerfile CMD.

---

### 3. Deploy Frontend to Vercel

#### Step 1 – Import project
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Framework preset: **Vite**

#### Step 2 – Environment variables in Vercel
```
VITE_API_URL=https://your-api.railway.app/api
VITE_APP_NAME=Family Office
```

#### Step 3 – Deploy
Vercel auto-deploys on every push to `main`.

Build command (auto-detected):
```bash
npm run build
```

Output directory: `dist`

---

## Option B: Full Self-Hosted (VPS / Docker Compose)

### Prerequisites
- Ubuntu 22.04 VPS (minimum 2 vCPU, 4 GB RAM)
- Docker Engine 24+ and Docker Compose v2
- Domain name with DNS A record pointing to your server
- (Optional) SSL certificate from Let's Encrypt

### 1. Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose plugin
sudo apt-get install docker-compose-plugin

# Clone repository
git clone https://github.com/your-org/family-budget-tracker.git
cd family-budget-tracker
```

### 2. Configure environment

```bash
cp .env .env.production
# Edit .env.production with production values:
nano .env.production
```

Required changes for production:
```bash
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
ALLOWED_ORIGINS=https://your-domain.com
```

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Certs will be at:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

Mount certs in docker-compose.yml:
```yaml
nginx:
  volumes:
    - /etc/letsencrypt/live/your-domain.com:/etc/ssl:ro
```

Uncomment the HTTPS server block in `docker/nginx/nginx.conf`.

### 4. Deploy

```bash
# Build and start all services
docker compose --env-file .env.production up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f api
docker compose logs -f nginx

# Run migrations manually if needed
docker compose exec api alembic upgrade head
```

### 5. Auto-renewal of SSL

```bash
# Add cron job
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet && docker compose -f /path/to/family-budget-tracker/docker-compose.yml restart nginx
```

---

## Option C: Kubernetes (Advanced)

For enterprise deployments needing horizontal scaling.

### Helm chart values overview

```yaml
# values.yaml
replicaCount:
  api: 3
  celeryWorker: 2

image:
  api:
    repository: your-registry/family-office-api
    tag: "1.0.0"

resources:
  api:
    requests: { cpu: "250m", memory: "512Mi" }
    limits:   { cpu: "1000m", memory: "1Gi" }

postgresql:
  enabled: true
  auth:
    database: family_office

redis:
  enabled: true
  auth:
    enabled: true
```

```bash
helm install family-office ./charts/family-office -f values.yaml
```

---

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r backend/requirements.txt
      - run: pytest backend/app/tests/ -v

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railway/cli-action@v2
        with:
          args: up --service api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: "--prod"
```

---

## Production Checklist

### Security
- [ ] `SECRET_KEY` is cryptographically random (32+ bytes)
- [ ] `JWT_SECRET_KEY` is cryptographically random (32+ bytes)
- [ ] `POSTGRES_PASSWORD` is strong and unique
- [ ] `DEBUG=false` and `ENVIRONMENT=production`
- [ ] HTTPS enabled with valid SSL certificate
- [ ] `.env` is NOT committed to version control
- [ ] API docs (`/docs`) disabled in production
- [ ] CORS `ALLOWED_ORIGINS` limited to your frontend domain only
- [ ] S3 bucket has appropriate IAM permissions (no public write)

### Performance
- [ ] `UVICORN_WORKERS` set to `2 * CPU_count + 1`
- [ ] PostgreSQL connection pool sized for worker count
- [ ] Redis `maxmemory` and eviction policy configured
- [ ] Nginx gzip enabled (already in config)
- [ ] Static assets have long `Cache-Control` headers (already in nginx.conf)

### Monitoring
- [ ] Application logs aggregated (Datadog / Papertrail / Logtail)
- [ ] Database backups scheduled (Railway auto-backups or pg_dump cron)
- [ ] Uptime monitoring configured (Better Uptime / Pingdom)
- [ ] Error tracking enabled (Sentry: `pip install sentry-sdk[fastapi]`)
- [ ] Celery Flower accessible for task monitoring

### Database
- [ ] `alembic upgrade head` run before starting new version
- [ ] Database backups tested and restorable
- [ ] `pg_stat_statements` extension enabled (in `init_db.sql`)
- [ ] Read replica configured for analytics queries (production)

---

## Rollback Procedure

```bash
# Railway – rollback to previous deployment
railway rollback

# Docker Compose – rollback to previous image tag
docker compose pull api:<previous-tag>
docker compose up -d api

# Database – rollback one migration
docker compose exec api alembic downgrade -1
```

---

## Useful Commands

```bash
# View running containers
docker compose ps

# Tail API logs
docker compose logs -f api --tail=100

# Enter API container shell
docker compose exec api bash

# Run database migrations
docker compose exec api alembic upgrade head

# Create a new Alembic migration
docker compose exec api alembic revision --autogenerate -m "description"

# Restart a single service
docker compose restart api

# View Celery task queue
docker compose --profile tools up flower -d
# Open http://localhost:5555

# Backup database
docker compose exec db pg_dump -U postgres family_office > backup_$(date +%F).sql

# Restore database
docker compose exec -T db psql -U postgres family_office < backup.sql
```
