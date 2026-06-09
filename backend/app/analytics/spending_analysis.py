"""
analytics/spending_analysis.py – Category breakdown and spending analytics.
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
        result.append(
            CategoryBreakdown(
                category_id=row["category_id"],
                category_name=str(row.get("name", row.get("category_id", "Uncategorised"))),
                total=Decimal(str(row["total"])),
                percentage=pct,
                transaction_count=row.get("count", 0),
            )
        )
    return result
