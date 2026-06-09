"""
analytics/trend_analysis.py – Spending trend analysis using pandas.
"""
from __future__ import annotations
from decimal import Decimal
from datetime import datetime


def compute_spending_trends(monthly_totals: list[dict]) -> dict:
    """
    Analyse monthly spending and income trends.
    Returns trend direction, growth rates, and moving averages.
    """
    if len(monthly_totals) < 2:
        return {"status": "insufficient_data"}

    try:
        import pandas as pd
        import numpy as np

        df = pd.DataFrame(monthly_totals)
        df["month"] = pd.to_datetime(df["month"])
        df = df.sort_values("month")
        df["total"] = df["total"].astype(float)

        # 3-month moving average
        df["ma3"] = df["total"].rolling(window=3, min_periods=1).mean()

        # Month-over-month growth rate
        df["mom_growth"] = df["total"].pct_change() * 100

        # Linear trend slope
        X = np.arange(len(df))
        coeffs = np.polyfit(X, df["total"].values, 1)
        slope = float(coeffs[0])

        # Volatility (standard deviation of month-over-month changes)
        volatility = float(df["mom_growth"].std())

        # Peak and trough
        peak_idx = df["total"].idxmax()
        trough_idx = df["total"].idxmin()

        return {
            "trend_direction": "increasing" if slope > 0 else "decreasing",
            "slope_per_month": round(slope, 2),
            "average_monthly": round(float(df["total"].mean()), 2),
            "volatility": round(volatility, 2),
            "peak_month": df.loc[peak_idx, "month"].strftime("%Y-%m") if peak_idx is not None else None,
            "peak_amount": round(float(df.loc[peak_idx, "total"]), 2) if peak_idx is not None else None,
            "trough_month": df.loc[trough_idx, "month"].strftime("%Y-%m") if trough_idx is not None else None,
            "latest_mom_growth": round(float(df["mom_growth"].iloc[-1]), 2) if not df.empty else 0,
            "moving_averages": [
                {"month": row["month"].strftime("%Y-%m"), "ma3": round(row["ma3"], 2)}
                for _, row in df.iterrows()
            ],
        }
    except ImportError:
        # Fallback without pandas
        totals = [float(r["total"]) for r in monthly_totals]
        avg = sum(totals) / len(totals)
        return {
            "trend_direction": "increasing" if totals[-1] > totals[0] else "decreasing",
            "average_monthly": round(avg, 2),
            "slope_per_month": round((totals[-1] - totals[0]) / max(len(totals) - 1, 1), 2),
        }


def compute_category_trends(
    category_data_by_month: list[dict],
) -> list[dict]:
    """
    For each category, compute MoM trend direction and 3-month moving average.
    Input: [{month: str, category_id: uuid, total: Decimal}]
    """
    try:
        import pandas as pd

        if not category_data_by_month:
            return []

        df = pd.DataFrame(category_data_by_month)
        df["total"] = df["total"].astype(float)
        results = []

        for cat_id, group in df.groupby("category_id"):
            group = group.sort_values("month")
            trend = "stable"
            if len(group) >= 2:
                slope = float(group["total"].iloc[-1] - group["total"].iloc[-2])
                trend = "increasing" if slope > 0 else "decreasing"

            results.append({
                "category_id": str(cat_id),
                "trend": trend,
                "latest_total": round(float(group["total"].iloc[-1]), 2),
                "average": round(float(group["total"].mean()), 2),
            })

        return results
    except ImportError:
        return []
