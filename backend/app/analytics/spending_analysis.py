"""
analytics/spending_analysis.py – Category breakdown and spending analytics.

CHANGED: compute_category_breakdown() now reads the `name` field that the
         repository JOIN provides. Falls back to "Uncategorized" only when
         the transaction genuinely has no category (NULL category_id).
"""
from decimal import Decimal
import uuid
from app.schemas.analytics import CategoryBreakdown


def compute_category_breakdown(
    raw_cats: list[dict],
    total_expenses: Decimal,
) -> list[CategoryBreakdown]:
    """Convert raw DB aggregates into CategoryBreakdown schema objects."""
    result = []
    for row in raw_cats:
        pct = (
            round(float(row["total"]) / float(total_expenses) * 100, 2)
            if total_expenses and total_expenses > 0
            else 0.0
        )

        # ── CHANGED ──────────────────────────────────────────────────────────
        # The repo now JOINs the categories table, so row["name"] contains the
        # real category name (e.g. "Food", "Transport"). Only fall back to
        # "Uncategorized" when category_id is genuinely NULL (no category set).
        raw_name: str | None = row.get("name")
        if raw_name and raw_name.strip() and raw_name.lower() != "none":
            category_name = raw_name.strip()
        else:
            category_name = "Uncategorized"
        # ─────────────────────────────────────────────────────────────────────

        result.append(
            CategoryBreakdown(
                category_id=row["category_id"],
                category_name=category_name,
                total=Decimal(str(row["total"])),
                percentage=pct,
                transaction_count=row.get("count", 0),
            )
        )
    return result