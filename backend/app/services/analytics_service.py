"""
services/analytics_service.py – Aggregation and analytics business logic.
Delegates heavy computation to app/analytics/ modules.

CHANGED: get_dashboard_summary() now passes `year` to monthly_totals() so the
         chart always shows all 12 months of the selected year (with zero-fill
         for months that have no data) instead of a rolling last-12 window.
"""
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.transaction_repository import TransactionRepository
from app.models.transaction import TransactionType
from app.schemas.analytics import (
    CategoryBreakdown,
    DashboardSummary,
    MonthlyTrend,
)
from app.analytics.financial_health import compute_financial_health_score
from app.analytics.spending_analysis import compute_category_breakdown

# Short month names used to build the full-year scaffold
_ALL_MONTHS = [f"{m:02d}" for m in range(1, 13)]


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.repo = TransactionRepository(db)

    async def get_dashboard_summary(
        self,
        family_id: uuid.UUID,
        year: int,
        month: int,
    ) -> DashboardSummary:
        """Build the main dashboard aggregates for a given month."""

        # Current period
        date_from = datetime(year, month, 1)
        if month == 12:
            date_to = datetime(year + 1, 1, 1) - timedelta(seconds=1)
        else:
            date_to = datetime(year, month + 1, 1) - timedelta(seconds=1)

        # Previous period
        prev_date_to = date_from - timedelta(seconds=1)
        prev_date_from = datetime(
            prev_date_to.year, prev_date_to.month, 1
        )

        # Current totals
        income = await self.repo.sum_by_type(
            family_id, TransactionType.INCOME, date_from, date_to
        )
        expenses = await self.repo.sum_by_type(
            family_id, TransactionType.EXPENSE, date_from, date_to
        )

        # Previous totals (for % change)
        prev_income = await self.repo.sum_by_type(
            family_id, TransactionType.INCOME, prev_date_from, prev_date_to
        )
        prev_expenses = await self.repo.sum_by_type(
            family_id, TransactionType.EXPENSE, prev_date_from, prev_date_to
        )

        def pct_change(curr: Decimal, prev: Decimal) -> float:
            if prev == 0:
                return 0.0
            return round(float((curr - prev) / prev * 100), 2)

        net = income - expenses
        savings_rate = round(float(net / income * 100), 2) if income > 0 else 0.0

        # ── CHANGED ───────────────────────────────────────────────────────
        # Pass `year` so the repo scopes the query to that calendar year.
        # _build_monthly_trends() then zero-fills any missing months so the
        # chart always has 12 bars (Jan–Dec) for the selected year.
        raw_monthly = await self.repo.monthly_totals(family_id, year=year)
        trends = self._build_monthly_trends(raw_monthly, year=year)
        # ─────────────────────────────────────────────────────────────────

        # Category breakdown (already scoped to the selected month)
        raw_cats = await self.repo.sum_by_category(family_id, date_from, date_to)
        cat_breakdown = compute_category_breakdown(raw_cats, expenses)

        # Financial health score (lightweight heuristic)
        health_score = compute_financial_health_score(
            savings_rate=savings_rate,
            monthly_trends=trends,
        )

        return DashboardSummary(
            total_income=income,
            total_expenses=expenses,
            net_savings=net,
            savings_rate=savings_rate,
            income_change_pct=pct_change(income, prev_income),
            expense_change_pct=pct_change(expenses, prev_expenses),
            monthly_trends=trends,
            category_breakdown=cat_breakdown,
            financial_health_score=health_score,
        )

    # ── CHANGED ───────────────────────────────────────────────────────────
    # Added `year` parameter. When provided the method builds a full 12-slot
    # scaffold (Jan–Dec of that year) and fills in actual data where it exists,
    # leaving zeroes for months with no transactions. This guarantees the
    # frontend always receives exactly 12 data points for the year chart.
    def _build_monthly_trends(
        self,
        raw: list[dict],
        year: int | None = None,
    ) -> list[MonthlyTrend]:
        """Pivot raw (month, type, total) rows into MonthlyTrend objects."""
        pivot: dict[str, dict] = {}

        # Pre-fill all 12 months of the year with zeros so the chart has
        # a complete scaffold even if some months have no transactions.
        if year is not None:
            for m in _ALL_MONTHS:
                pivot[f"{year}-{m}"] = {"income": Decimal("0"), "expenses": Decimal("0")}

        for row in raw:
            key = (
                row["month"].strftime("%Y-%m")
                if hasattr(row["month"], "strftime")
                else str(row["month"])[:7]
            )
            if key not in pivot:
                pivot[key] = {"income": Decimal("0"), "expenses": Decimal("0")}
            if row["type"] == TransactionType.INCOME:
                pivot[key]["income"] += Decimal(str(row["total"]))
            else:
                pivot[key]["expenses"] += Decimal(str(row["total"]))

        trends = []
        for month_key, vals in sorted(pivot.items()):
            income   = vals["income"]
            expenses = vals["expenses"]
            net      = income - expenses
            rate     = round(float(net / income * 100), 2) if income > 0 else 0.0
            trends.append(
                MonthlyTrend(
                    month=month_key,
                    income=income,
                    expenses=expenses,
                    net=net,
                    savings_rate=rate,
                )
            )

        # When no year is given (legacy callers) keep the old 12-month cap
        if year is None:
            trends = trends[-12:]

        return trends
    # ─────────────────────────────────────────────────────────────────────