"""repositories/savings_repository.py"""
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.savings_goal import SavingsGoal
from app.schemas.savings import SavingsGoalCreate, SavingsGoalUpdate


class SavingsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, family_id: uuid.UUID, created_by: uuid.UUID, data: SavingsGoalCreate) -> SavingsGoal:
        goal = SavingsGoal(family_id=family_id, created_by=created_by, **data.model_dump())
        self.db.add(goal)
        await self.db.flush()
        await self.db.refresh(goal)
        return goal

    async def get_by_id(self, goal_id: uuid.UUID, family_id: uuid.UUID) -> SavingsGoal | None:
        result = await self.db.execute(
            select(SavingsGoal).where(
                SavingsGoal.id == goal_id,
                SavingsGoal.family_id == family_id,
                SavingsGoal.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_by_family(self, family_id: uuid.UUID) -> list[SavingsGoal]:
        result = await self.db.execute(
            select(SavingsGoal).where(
                SavingsGoal.family_id == family_id,
                SavingsGoal.deleted_at.is_(None),
            ).order_by(SavingsGoal.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, goal: SavingsGoal, data: SavingsGoalUpdate) -> SavingsGoal:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(goal, field, value)
        # Check if fully funded
        if goal.current_amount >= goal.target_amount:
            goal.is_fully_funded = True
        await self.db.flush()
        await self.db.refresh(goal)
        return goal

    async def contribute(self, goal: SavingsGoal, amount: Decimal) -> SavingsGoal:
        goal.current_amount = Decimal(str(goal.current_amount)) + amount
        if goal.current_amount >= goal.target_amount:
            goal.is_fully_funded = True
        await self.db.flush()
        await self.db.refresh(goal)
        return goal

    async def soft_delete(self, goal: SavingsGoal) -> None:
        goal.deleted_at = datetime.utcnow()
        await self.db.flush()
