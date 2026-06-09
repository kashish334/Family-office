"""
repositories/user_repository.py
"""
import uuid
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: UserCreate) -> User:
        user = User(
            full_name=data.full_name,
            email=data.email,
            hashed_password=hash_password(data.password),
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def update_last_login(self, user: User) -> None:
        user.last_login_at = datetime.utcnow()
        await self.db.flush()

    async def soft_delete(self, user: User) -> None:
        user.deleted_at = datetime.utcnow()
        user.is_active = False
        await self.db.flush()
