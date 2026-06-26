"""
main.py – FastAPI application factory with full middleware stack.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.api_router import api_router
from app.config import get_settings
from app.core.logging import configure_logging
from app.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.core.rate_limiter import limiter

settings = get_settings()
configure_logging()


# ── Application lifespan ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    from loguru import logger
    logger.info(f"🚀 Starting {settings.app_name} v{settings.app_version} [{settings.environment}]")

    # Run migrations on every startup (safe — alembic skips already-applied ones)
    try:
        import subprocess
        import os
        db_url = (
            f"postgresql+asyncpg://{settings.postgres_user}:{settings.postgres_password}"
            f"@{settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}"
        )
        result = subprocess.run(
            ["python", "-m", "alembic", "-x", f"sqlalchemy.url={db_url}", "upgrade", "head"],
            capture_output=True, text=True, cwd="/app"
        )
        logger.info(f"Migrations: {result.stdout}")
        if result.returncode != 0:
            logger.error(f"Migration error: {result.stderr}")
    except Exception as e:
        logger.error(f"Could not run migrations: {e}")

    yield

    logger.info("🛑 Shutting down gracefully.")

# ── App factory ───────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Family Office – Premium Wealth Management API. "
            "Provides endpoints for authentication, family management, "
            "transactions, analytics, AI insights, OCR, and reports."
        ),
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ── Rate limiter ──────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── CORS ──────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Response-Time"],
    )

    # ── Custom middleware (applied in reverse order) ───────────────────────
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # ── Routes ───────────────────────────────────────────────────────────
    app.include_router(api_router)

    # ── Global exception handlers ─────────────────────────────────────────
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        from loguru import logger
        logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_server_error",
                "message": "An unexpected error occurred." if settings.is_production else str(exc),
            },
        )

    # ── Health check ──────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"], include_in_schema=False)
    async def health_check():
        return {
            "status": "healthy",
            "version": settings.app_version,
            "environment": settings.environment,
        }

    @app.get("/", tags=["Root"], include_in_schema=False)
    async def root():
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs",
        }

    return app


app = create_app()
