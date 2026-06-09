"""repositories/family_repository.py"""
import uuid
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.family import Family
from app.models.family_member import FamilyMember, MemberRole
from app.schemas.family import FamilyCreate, FamilyUpdate


class FamilyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: FamilyCreate, owner_id: uuid.UUID) -> Family:
        family = Family(**data.model_dump())
        self.db.add(family)
        await self.db.flush()
        # Add owner as admin member
        membership = FamilyMember(
            family_id=family.id,
            user_id=owner_id,
            role=MemberRole.ADMIN,
            can_manage_budgets=True,
            can_invite_members=True,
        )
        self.db.add(membership)
        await self.db.flush()
        await self.db.refresh(family)
        return family

    async def get_by_id(self, family_id: uuid.UUID) -> Family | None:
        result = await self.db.execute(
            select(Family).where(Family.id == family_id, Family.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def update(self, family: Family, data: FamilyUpdate) -> Family:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(family, field, value)
        await self.db.flush()
        await self.db.refresh(family)
        return family

    async def get_member(self, family_id: uuid.UUID, user_id: uuid.UUID) -> FamilyMember | None:
        result = await self.db.execute(
            select(FamilyMember).where(
                FamilyMember.family_id == family_id,
                FamilyMember.user_id == user_id,
                FamilyMember.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_members(self, family_id: uuid.UUID) -> list[FamilyMember]:
        result = await self.db.execute(
            select(FamilyMember).where(
                FamilyMember.family_id == family_id,
                FamilyMember.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def soft_delete(self, family: Family) -> None:
        family.deleted_at = datetime.utcnow()
        await self.db.flush()


