"""
api/routes/budgets.py
"""
import uuid
from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies import CurrentUser, get_family_membership
from app.models.budget import Budget
from app.core.permissions import assert_can_manage_budgets

router = APIRouter(prefix="/families/{family_id}/budgets", tags=["Budgets"])


class BudgetUpsert(BaseModel):
    category_id: uuid.UUID
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)
    limit_amount: Decimal = Field(..., gt=0)


@router.get("/")
async def list_budgets(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    year: int = 2024,
    month: int = 1,
):
    await get_family_membership(family_id, current_user, db)
    result = await db.execute(
        select(Budget).where(
            Budget.family_id == family_id,
            Budget.year == year,
            Budget.month == month,
        )
    )
    return list(result.scalars().all())


@router.put("/")
async def upsert_budget(
    family_id: uuid.UUID,
    data: BudgetUpsert,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    membership = await get_family_membership(family_id, current_user, db)
    assert_can_manage_budgets(membership)

    result = await db.execute(
        select(Budget).where(
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
    await db.refresh(budget)
    return budget
