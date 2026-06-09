"""
analytics/financial_health.py – Financial health score computation.
Score 0-100 based on savings rate, trends, and liquidity heuristics.
"""
from __future__ import annotations
import math
from app.schemas.analytics import MonthlyTrend, FinancialHealthScore


def compute_financial_health_score(
    savings_rate: float,
    monthly_trends: list[MonthlyTrend],
) -> float:
    """
    Lightweight rule-based health score. Returns 0-100.
    Used for the dashboard badge; full version in FinancialHealthScore endpoint.
    """
    score = 0.0

    # 1. Savings rate contribution (40 pts max)
    if savings_rate >= 30:
        score += 40
    elif savings_rate >= 20:
        score += 30
    elif savings_rate >= 10:
        score += 20
    elif savings_rate > 0:
        score += 10

    # 2. Consistency – is spending trending down? (30 pts)
    if len(monthly_trends) >= 3:
        recent_expenses = [float(t.expenses) for t in monthly_trends[-3:]]
        if recent_expenses[-1] < recent_expenses[0]:
            score += 30
        elif recent_expenses[-1] < recent_expenses[0] * 1.05:
            score += 15

    # 3. Income growth (20 pts)
    if len(monthly_trends) >= 3:
        recent_income = [float(t.income) for t in monthly_trends[-3:]]
        if recent_income[-1] > recent_income[0]:
            score += 20
        elif recent_income[-1] >= recent_income[0] * 0.95:
            score += 10

    # 4. Net positive every month (10 pts)
    if monthly_trends and all(t.net >= 0 for t in monthly_trends[-3:]):
        score += 10

    return min(100.0, round(score, 1))


def compute_detailed_health_score(
    savings_rate: float,
    monthly_trends: list[MonthlyTrend],
    debt_to_income: float = 0.0,
    liquid_months: float = 3.0,
) -> FinancialHealthScore:
    """Full health score with per-dimension breakdown."""
    # Savings rate score (0-35)
    sr_score = min(35.0, savings_rate * 1.2)

    # Debt-to-income score (0-25): lower is better
    dti_score = max(0.0, 25.0 - debt_to_income * 50)

    # Liquidity score (0-20): 6+ months = full score
    liq_score = min(20.0, liquid_months / 6 * 20)

    # Trend score (0-20): improving over last 3 months
    trend_score = 0.0
    if len(monthly_trends) >= 3:
        rates = [t.savings_rate for t in monthly_trends[-3:]]
        if rates[-1] > rates[0]:
            trend_score = 20.0
        elif rates[-1] > 0:
            trend_score = 10.0

    total = sr_score + dti_score + liq_score + trend_score
    grade = (
        "Excellent" if total >= 80
        else "Good" if total >= 60
        else "Fair" if total >= 40
        else "Poor"
    )

    recs = []
    if sr_score < 20:
        recs.append("Aim for a savings rate of at least 20% per month.")
    if dti_score < 15:
        recs.append("Work on reducing your debt-to-income ratio.")
    if liq_score < 10:
        recs.append("Build an emergency fund covering 3-6 months of expenses.")
    if trend_score < 10:
        recs.append("Review monthly spending trends and target consistent improvement.")

    return FinancialHealthScore(
        score=round(total, 1),
        grade=grade,
        savings_rate_score=round(sr_score, 1),
        debt_to_income_score=round(dti_score, 1),
        liquidity_score=round(liq_score, 1),
        trend_score=round(trend_score, 1),
        recommendations=recs,
    )
