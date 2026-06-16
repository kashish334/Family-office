"""
api/routes/budgets.py
CHANGED:
  - Added BudgetResponse schema with `category` (nested name) and computed
    `spent_amount` (sum of actual expense transactions for that category in
    that month/year). Previously list_budgets returned raw ORM objects with
    no response_model — category relationship wasn't serialized and there was
    no "spent" figure at all, which is why the Budget Planning page showed
    "Spent: ₹0" / blank category names.
  - list_budgets now eagerly loads `category` via selectinload and computes
    spent_amount per budget using TransactionRepository.sum_by_category.
"""
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies import CurrentUser, get_family_membership
from app.models.budget import Budget
from app.models.transaction import Transaction, TransactionType
from app.core.permissions import assert_can_manage_budgets

router = APIRouter(prefix="/families/{family_id}/budgets", tags=["Budgets"])


class BudgetUpsert(BaseModel):
    category_id: uuid.UUID
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)
    limit_amount: Decimal = Field(..., gt=0)


# ── NEW: nested category info + computed spent_amount ────────────────────────
class CategoryInfo(BaseModel):
    id: uuid.UUID
    name: str
    icon: str | None = None
    model_config = {"from_attributes": True}


class BudgetResponse(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    category_id: uuid.UUID
    category: CategoryInfo | None = None
    month: int
    year: int
    limit_amount: Decimal
    spent_amount: Decimal = Decimal("0")
    model_config = {"from_attributes": True}
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/", response_model=list[BudgetResponse])
async def list_budgets(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    year: int = 2024,
    month: int = 1,
):
    await get_family_membership(family_id, current_user, db)

    result = await db.execute(
        select(Budget)
        .options(selectinload(Budget.category))  # ← eager load category name
        .where(
            Budget.family_id == family_id,
            Budget.year == year,
            Budget.month == month,
        )
    )
    budgets = list(result.scalars().all())

    if not budgets:
        return []

    # ── NEW: compute actual spend per category for this month/year ───────────
    date_from = datetime(year, month, 1)
    if month == 12:
        date_to = datetime(year + 1, 1, 1) - timedelta(seconds=1)
    else:
        date_to = datetime(year, month + 1, 1) - timedelta(seconds=1)

    spend_result = await db.execute(
        select(
            Transaction.category_id,
            func.sum(Transaction.amount).label("total"),
        )
        .where(
            Transaction.family_id == family_id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.transaction_date >= date_from,
            Transaction.transaction_date <= date_to,
            Transaction.deleted_at.is_(None),
        )
        .group_by(Transaction.category_id)
    )
    spend_by_category = {row.category_id: Decimal(str(row.total)) for row in spend_result}
    # ─────────────────────────────────────────────────────────────────────────

    responses = []
    for b in budgets:
        responses.append(
            BudgetResponse(
                id=b.id,
                family_id=b.family_id,
                category_id=b.category_id,
                category=CategoryInfo.model_validate(b.category) if b.category else None,
                month=b.month,
                year=b.year,
                limit_amount=b.limit_amount,
                spent_amount=spend_by_category.get(b.category_id, Decimal("0")),
            )
        )
    return responses


@router.put("/", response_model=BudgetResponse)
async def upsert_budget(
    family_id: uuid.UUID,
    data: BudgetUpsert,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    membership = await get_family_membership(family_id, current_user, db)
    assert_can_manage_budgets(membership)

    result = await db.execute(
        select(Budget)
        .options(selectinload(Budget.category))
        .where(
            Budget.family_id == family_id,
            Budget.category_id == data.category_id,
            Budget.year == data.year,
            Budget.month == data.month,
        )
    )
    budget = result.scalar_one_or_none()
    if budget:
        budget.limit_amount = data.limit_amount
    else:
        budget = Budget(family_id=family_id, **data.model_dump())
        db.add(budget)
    await db.flush()

    # Reload with category eagerly for the response
    result = await db.execute(
        select(Budget)
        .options(selectinload(Budget.category))
        .where(Budget.id == budget.id)
    )
    budget = result.scalar_one()

    return BudgetResponse(
        id=budget.id,
        family_id=budget.family_id,
        category_id=budget.category_id,
        category=CategoryInfo.model_validate(budget.category) if budget.category else None,
        month=budget.month,
        year=budget.year,
        limit_amount=budget.limit_amount,
        spent_amount=Decimal("0"),  # caller will reload list to get updated spend
    )