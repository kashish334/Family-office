"""schemas/savings.py"""
from decimal import Decimal
import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.models.savings_goal import GoalPriority, GoalStatus


class SavingsGoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    icon: str | None = None
    target_amount: Decimal = Field(..., gt=0)
    target_date: date | None = None
    priority: GoalPriority = GoalPriority.MEDIUM


class SavingsGoalUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    target_amount: Decimal | None = None
    target_date: date | None = None
    priority: GoalPriority | None = None
    status: GoalStatus | None = None


class SavingsGoalResponse(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    name: str
    description: str | None
    icon: str | None
    target_amount: Decimal
    current_amount: Decimal
    currency: str
    target_date: date | None
    priority: GoalPriority
    status: GoalStatus
    is_fully_funded: bool
    progress_pct: float
    created_at: datetime
    model_config = {"from_attributes": True}


class ContributeToGoal(BaseModel):
    amount: Decimal = Field(..., gt=0)
