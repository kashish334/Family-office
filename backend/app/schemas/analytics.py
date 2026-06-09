"""schemas/analytics.py"""
from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel


class CategoryBreakdown(BaseModel):
    category_id: uuid.UUID | None
    category_name: str
    total: Decimal
    percentage: float
    transaction_count: int


class MonthlyTrend(BaseModel):
    month: str        # "2024-10"
    income: Decimal
    expenses: Decimal
    net: Decimal
    savings_rate: float


class DashboardSummary(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net_savings: Decimal
    savings_rate: float
    income_change_pct: float
    expense_change_pct: float
    monthly_trends: list[MonthlyTrend]
    category_breakdown: list[CategoryBreakdown]
    financial_health_score: float


class FinancialHealthScore(BaseModel):
    score: float               # 0–100
    grade: str                 # Excellent / Good / Fair / Poor
    savings_rate_score: float
    debt_to_income_score: float
    liquidity_score: float
    trend_score: float
    recommendations: list[str]


class SpendingForecast(BaseModel):
    month: str
    predicted_expenses: Decimal
    confidence_interval_low: Decimal
    confidence_interval_high: Decimal
    model_used: str


class AnomalyResult(BaseModel):
    transaction_id: uuid.UUID
    description: str
    amount: Decimal
    anomaly_score: float
    reason: str


