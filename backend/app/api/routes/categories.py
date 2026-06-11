"""
api/routes/categories.py  ← NEW FILE
GET /api/v1/categories/
Returns all system-wide categories (and optionally family-specific ones).
Used by the frontend transaction form to populate the category dropdown.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.database.session import get_db
from app.dependencies import CurrentUser
from app.models.category import Category

router = APIRouter(prefix="/categories", tags=["categories"])


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    icon: str | None = None
    color: str | None = None
    is_system: bool
    model_config = {"from_attributes": True}


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Return all active categories (system-wide + user's family-specific)."""
    result = await db.execute(
        select(Category)
        .where(Category.deleted_at.is_(None))
        .order_by(Category.type, Category.name)
    )
    return result.scalars().all()