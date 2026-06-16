"""
analytics/forecasting.py – Expense forecasting using Linear Regression + seasonal decomposition.
"""
from __future__ import annotations
from datetime import datetime, timedelta
from decimal import Decimal

import numpy as np
from app.schemas.analytics import SpendingForecast


def forecast_expenses(
    monthly_totals: list[dict],  # [{month: datetime, total: Decimal}]
    periods_ahead: int = 3,
) -> list[SpendingForecast]:
    """
    Fit a simple linear regression on historical monthly expense totals
    and project *periods_ahead* months forward.
    """
    if len(monthly_totals) < 3:
        return []

    try:
        from sklearn.linear_model import LinearRegression  # type: ignore
    except ImportError:
        return []

    amounts = np.array([float(r["total"]) for r in monthly_totals]).reshape(-1, 1)
    X = np.arange(len(amounts)).reshape(-1, 1)
    model = LinearRegression()
    model.fit(X, amounts)

    residuals = amounts.flatten() - model.predict(X).flatten()
    std = float(np.std(residuals))

    # Last month in data
    last_month = monthly_totals[-1]["month"]
    if isinstance(last_month, str):
        last_dt = datetime.strptime(last_month[:7], "%Y-%m")
    else:
        last_dt = last_month

    forecasts = []
    for i in range(1, periods_ahead + 1):
        future_idx = len(amounts) - 1 + i
        predicted = float(model.predict([[future_idx]])[0][0])
        predicted = max(0.0, predicted)

        # Advance month
        if last_dt.month + i > 12:
            year = last_dt.year + (last_dt.month + i - 1) // 12
            month = (last_dt.month + i - 1) % 12 + 1
        else:
            year, month = last_dt.year, last_dt.month + i

        forecasts.append(
            SpendingForecast(
                month=f"{year}-{month:02d}",
                predicted_expenses=Decimal(f"{predicted:.2f}"),
                confidence_interval_low=Decimal(f"{max(0, predicted - 1.96 * std):.2f}"),
                confidence_interval_high=Decimal(f"{predicted + 1.96 * std:.2f}"),
                model_used="linear_regression",
            )
        )
    return forecasts

def forecast_savings_goal(
    current_amount: float,
    target_amount: float,
    monthly_contribution: float,
    monthly_return_rate: float = 0.005,  # ~6% annually
) -> dict:
    """
    Project when a savings goal will be fully funded.
    Uses future value of a series formula.
    """
    if monthly_contribution <= 0:
        return {"months_to_goal": None, "projected_date": None}

    remaining = target_amount - current_amount
    if remaining <= 0:
        return {"months_to_goal": 0, "projected_date": datetime.utcnow().date().isoformat()}

    # FV of series: FV = PMT * ((1 + r)^n - 1) / r
    # Solve for n iteratively (simple approach)
    balance = current_amount
    months = 0
    while balance < target_amount and months < 600:  # max 50-year projection
        balance = balance * (1 + monthly_return_rate) + monthly_contribution
        months += 1

    projected = datetime.utcnow() + timedelta(days=months * 30)
    return {
        "months_to_goal": months,
        "projected_date": projected.date().isoformat(),
        "projected_total_with_returns": round(balance, 2),
    }
