"""
api/routes/analytics.py – Dashboard and financial analytics endpoints.
"""
import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies import CurrentUser, get_family_membership
from app.schemas.analytics import DashboardSummary, FinancialHealthScore, SpendingForecast
from app.services.analytics_service import AnalyticsService
from app.analytics.financial_health import compute_detailed_health_score
from app.analytics.forecasting import forecast_expenses
from app.analytics.anomaly_detection import detect_anomalies
from app.repositories.transaction_repository import TransactionRepository

router = APIRouter(prefix="/families/{family_id}/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardSummary)
async def get_dashboard(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    year: int = Query(default=datetime.utcnow().year),
    month: int = Query(default=datetime.utcnow().month, ge=1, le=12),
) -> DashboardSummary:
    """Return full dashboard summary for a given month."""
    await get_family_membership(family_id, current_user, db)
    service = AnalyticsService(db)
    return await service.get_dashboard_summary(family_id, year, month)


@router.get("/health-score", response_model=FinancialHealthScore)
async def get_health_score(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FinancialHealthScore:
    """Return detailed financial health score with per-dimension breakdown."""
    await get_family_membership(family_id, current_user, db)
    service = AnalyticsService(db)
    year, month = datetime.utcnow().year, datetime.utcnow().month
    summary = await service.get_dashboard_summary(family_id, year, month)
    return compute_detailed_health_score(
        savings_rate=summary.savings_rate,
        monthly_trends=summary.monthly_trends,
    )


@router.get("/forecast", response_model=list[SpendingForecast])
async def get_expense_forecast(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    periods: int = Query(default=3, ge=1, le=12),
) -> list[SpendingForecast]:
    """Forecast expense totals for the next N months."""
    await get_family_membership(family_id, current_user, db)
    repo = TransactionRepository(db)
    monthly = await repo.monthly_totals(family_id, months=12)
    expense_series = [
        {"month": r["month"], "total": r["total"]}
        for r in monthly
        if str(r.get("type", "")) == "expense"
    ]
    return forecast_expenses(expense_series, periods_ahead=periods)


@router.get("/anomalies")
async def get_anomalies(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    """Detect anomalous transactions using Isolation Forest."""
    await get_family_membership(family_id, current_user, db)
    from datetime import timedelta
    repo = TransactionRepository(db)
    now = datetime.utcnow()
    transactions = await repo.get_by_date_range(family_id, now - timedelta(days=90), now)
    return detect_anomalies(transactions)
