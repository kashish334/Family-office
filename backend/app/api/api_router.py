"""
api/api_router.py – Mount all route modules under /api/v1.
CHANGED: Added categories_router so GET /api/v1/categories/ works.
"""
from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.families import router as families_router
from app.api.routes.transactions import router as transactions_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.ai import router as ai_router
from app.api.routes.savings import router as savings_router
from app.api.routes.budgets import router as budgets_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.reports import router as reports_router, uploads_router
from app.api.routes.categories import router as categories_router  # ← NEW

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(families_router)
api_router.include_router(transactions_router)
api_router.include_router(analytics_router)
api_router.include_router(ai_router)
api_router.include_router(savings_router)
api_router.include_router(budgets_router)
api_router.include_router(notifications_router)
api_router.include_router(reports_router)
api_router.include_router(uploads_router)
api_router.include_router(categories_router)  # ← NEW