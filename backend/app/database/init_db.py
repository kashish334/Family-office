"""
database/init_db.py – Creates all tables and seeds initial data.
Run once on first deploy: `python -m app.database.init_db`
"""
import asyncio
from loguru import logger

from app.database.base import Base
from app.database.session import engine
from app.core.security import hash_password

# Import ALL models so SQLAlchemy registers them before create_all()
from app.models.user import User, UserRole  # noqa: F401
from app.models.family import Family  # noqa: F401
from app.models.family_member import FamilyMember  # noqa: F401
from app.models.transaction import Transaction  # noqa: F401
from app.models.category import Category  # noqa: F401
from app.models.budget import Budget  # noqa: F401
from app.models.savings_goal import SavingsGoal  # noqa: F401
from app.models.ai_insight import AIInsight  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.uploaded_file import UploadedFile  # noqa: F401
from app.models.recurring_transaction import RecurringTransaction  # noqa: F401
from app.models.report import Report  # noqa: F401


DEFAULT_CATEGORIES = [
    # Income
    {"name": "Salary & Bonus", "type": "income", "icon": "💼", "color": "#5a7a5e"},
    {"name": "Dividends",       "type": "income", "icon": "📈", "color": "#5a7a5e"},
    {"name": "Rental Income",   "type": "income", "icon": "🏠", "color": "#5a7a5e"},
    {"name": "Business Income", "type": "income", "icon": "🏢", "color": "#5a7a5e"},
    {"name": "Interest",        "type": "income", "icon": "🏦", "color": "#5a7a5e"},
    # Expenses
    {"name": "Housing",          "type": "expense", "icon": "🏡", "color": "#c9a96e"},
    {"name": "Food & Dining",    "type": "expense", "icon": "🍽️", "color": "#c9a96e"},
    {"name": "Transport",        "type": "expense", "icon": "🚗", "color": "#c9a96e"},
    {"name": "Healthcare",       "type": "expense", "icon": "🏥", "color": "#c94a3a"},
    {"name": "Education",        "type": "expense", "icon": "📚", "color": "#c9a96e"},
    {"name": "Entertainment",    "type": "expense", "icon": "🎬", "color": "#c9a96e"},
    {"name": "Shopping",         "type": "expense", "icon": "🛍️", "color": "#c9a96e"},
    {"name": "Travel",           "type": "expense", "icon": "✈️", "color": "#c9a96e"},
    {"name": "Insurance",        "type": "expense", "icon": "🛡️", "color": "#c9a96e"},
    {"name": "Philanthropy",     "type": "expense", "icon": "❤️", "color": "#c9a96e"},
    {"name": "Staff & Services", "type": "expense", "icon": "👥", "color": "#c9a96e"},
    {"name": "Utilities",        "type": "expense", "icon": "⚡", "color": "#c9a96e"},
    {"name": "Memberships",      "type": "expense", "icon": "🏅", "color": "#c9a96e"},
]


async def create_tables() -> None:
    """Drop-and-recreate all tables (dev only). Use Alembic for production."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created.")


async def seed_categories(session) -> None:
    """Insert system-level default categories if they don't already exist."""
    from sqlalchemy import select
    from app.models.category import Category

    result = await session.execute(select(Category).where(Category.is_system == True))  # noqa: E712
    if result.scalars().first():
        logger.info("Categories already seeded – skipping.")
        return

    for cat in DEFAULT_CATEGORIES:
        session.add(Category(is_system=True, **cat))

    await session.commit()
    logger.info(f"Seeded {len(DEFAULT_CATEGORIES)} default categories.")


async def init_db() -> None:
    await create_tables()

    from app.database.session import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        await seed_categories(session)

    logger.info("Database initialised successfully.")


if __name__ == "__main__":
    asyncio.run(init_db())
