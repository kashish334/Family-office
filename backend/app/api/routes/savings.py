"""
api/routes/savings.py
"""
import uuid
from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies import CurrentUser, get_family_membership
from app.repositories.savings_repository import SavingsRepository
from app.schemas.savings import SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse

router = APIRouter(prefix="/families/{family_id}/savings", tags=["Savings Goals"])


class ContributeRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)


@router.post("/", status_code=201)
async def create_goal(
    family_id: uuid.UUID,
    data: SavingsGoalCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await get_family_membership(family_id, current_user, db)
    repo = SavingsRepository(db)
    goal = await repo.create(family_id, current_user.id, data)
    return goal


@router.get("/")
async def list_goals(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await get_family_membership(family_id, current_user, db)
    repo = SavingsRepository(db)
    return await repo.list_by_family(family_id)


@router.patch("/{goal_id}")
async def update_goal(
    family_id: uuid.UUID,
    goal_id: uuid.UUID,
    data: SavingsGoalUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await get_family_membership(family_id, current_user, db)
    repo = SavingsRepository(db)
    from fastapi import HTTPException
    goal = await repo.get_by_id(goal_id, family_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")
    return await repo.update(goal, data)


@router.post("/{goal_id}/contribute")
async def contribute_to_goal(
    family_id: uuid.UUID,
    goal_id: uuid.UUID,
    body: ContributeRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await get_family_membership(family_id, current_user, db)
    repo = SavingsRepository(db)
    from fastapi import HTTPException
    goal = await repo.get_by_id(goal_id, family_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")
    return await repo.contribute(goal, body.amount)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    family_id: uuid.UUID,
    goal_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await get_family_membership(family_id, current_user, db)
    repo = SavingsRepository(db)
    from fastapi import HTTPException
    goal = await repo.get_by_id(goal_id, family_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")
    await repo.soft_delete(goal)
