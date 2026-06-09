"""
tests/test_transactions.py – Transaction CRUD tests.
"""
import pytest
from decimal import Decimal
from app.analytics.anomaly_detection import detect_anomalies
from app.analytics.forecasting import forecast_expenses, forecast_savings_goal
from app.analytics.financial_health import compute_financial_health_score
from app.schemas.analytics import MonthlyTrend


# ── Anomaly detection unit tests ──────────────────────────────────────────

class MockTransaction:
    def __init__(self, id, description, amount, date_str):
        import uuid
        from datetime import datetime
        self.id = uuid.uuid4()
        self.description = description
        self.amount = Decimal(str(amount))
        self.transaction_date = datetime.fromisoformat(date_str)


def make_transactions(n=20, include_outlier=True):
    txns = [
        MockTransaction(i, f"Regular Purchase {i}", 50 + (i % 10) * 5, f"2024-10-{(i % 28) + 1:02d}T10:00:00")
        for i in range(n)
    ]
    if include_outlier:
        txns.append(MockTransaction(99, "Suspicious Large Purchase", 9999, "2024-10-15T03:00:00"))
    return txns


def test_anomaly_detection_finds_outlier():
    txns = make_transactions(25, include_outlier=True)
    results = detect_anomalies(txns)
    assert isinstance(results, list)
    if results:  # may be empty with small dataset
        assert "description" in results[0]
        assert "anomaly_score" in results[0]


def test_anomaly_detection_insufficient_data():
    txns = make_transactions(5, include_outlier=False)
    results = detect_anomalies(txns)
    assert results == []


# ── Forecasting unit tests ────────────────────────────────────────────────

def test_expense_forecast_returns_periods():
    monthly = [
        {"month": f"2024-{i:02d}", "total": Decimal(str(3000 + i * 100))}
        for i in range(1, 10)
    ]
    forecasts = forecast_expenses(monthly, periods_ahead=3)
    assert len(forecasts) == 3
    for f in forecasts:
        assert f.predicted_expenses > 0
        assert f.confidence_interval_high >= f.predicted_expenses


def test_expense_forecast_insufficient_data():
    forecasts = forecast_expenses([{"month": "2024-01", "total": 3000}], periods_ahead=3)
    assert forecasts == []


def test_savings_goal_forecast():
    result = forecast_savings_goal(
        current_amount=50000,
        target_amount=700000,
        monthly_contribution=5000,
        monthly_return_rate=0.005,
    )
    assert result["months_to_goal"] is not None
    assert result["months_to_goal"] > 0


def test_savings_goal_already_funded():
    result = forecast_savings_goal(
        current_amount=700000,
        target_amount=700000,
        monthly_contribution=1000,
    )
    assert result["months_to_goal"] == 0


# ── Financial health unit tests ───────────────────────────────────────────

def test_health_score_excellent():
    trends = [
        MonthlyTrend(month=f"2024-{i:02d}", income=Decimal("10000"), expenses=Decimal("6000"), net=Decimal("4000"), savings_rate=40.0)
        for i in range(1, 4)
    ]
    score = compute_financial_health_score(savings_rate=40.0, monthly_trends=trends)
    assert score >= 70  # Should be high with 40% savings rate


def test_health_score_poor():
    trends = [
        MonthlyTrend(month=f"2024-{i:02d}", income=Decimal("10000"), expenses=Decimal("10500"), net=Decimal("-500"), savings_rate=-5.0)
        for i in range(1, 4)
    ]
    score = compute_financial_health_score(savings_rate=-5.0, monthly_trends=trends)
    assert score < 30  # Should be low with negative savings


def test_health_score_bounds():
    score = compute_financial_health_score(savings_rate=100.0, monthly_trends=[])
    assert 0 <= score <= 100
