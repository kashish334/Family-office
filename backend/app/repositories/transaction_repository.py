"""
repositories/transaction_repository.py
CHANGED:
  1. list_with_filter() builds a SEPARATE count query (no selectinload) to avoid
     the SQLAlchemy error from calling .subquery() on a query with loader options.
  2. list_with_filter() + get_by_id() use selectinload(Transaction.category) so
     the nested category object is available in TransactionResponse.
  3. sum_by_category() JOINs Category to return real names instead of raw UUIDs.
  4. monthly_totals() accepts optional `year` for year-scoped chart data.
"""
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.schemas.transaction import TransactionCreate, TransactionFilter, TransactionUpdate


class TransactionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Create ────────────────────────────────────────────────────────────────

    async def create(self, family_id: uuid.UUID, user_id: uuid.UUID, data: TransactionCreate) -> Transaction:
        tx = Transaction(family_id=family_id, user_id=user_id, **data.model_dump())
        self.db.add(tx)
        await self.db.flush()
        # Reload with category eagerly so the response includes t.category.name
        result = await self.db.execute(
            select(Transaction)
            .options(selectinload(Transaction.category))
            .where(Transaction.id == tx.id)
        )
        return result.scalar_one()

    # ── Read ──────────────────────────────────────────────────────────────────

    async def get_by_id(self, transaction_id: uuid.UUID, family_id: uuid.UUID) -> Transaction | None:
        result = await self.db.execute(
            select(Transaction)
            .options(selectinload(Transaction.category))   # ← eager load
            .where(
                Transaction.id == transaction_id,
                Transaction.family_id == family_id,
                Transaction.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_with_filter(
        self, family_id: uuid.UUID, filters: TransactionFilter
    ) -> tuple[list[Transaction], int]:
        """Return (page_items, total_count)."""

        # ── CHANGED: build filter conditions separately so we can reuse them
        # in BOTH the count query and the data query without duplicating logic.
        # Calling .subquery() on a query that has .options(selectinload(...))
        # raises a SQLAlchemy error, so the count query must NOT have loader options.
        conditions = [
            Transaction.family_id == family_id,
            Transaction.deleted_at.is_(None),
        ]
        if filters.type:
            conditions.append(Transaction.type == filters.type)
        if filters.category_id:
            conditions.append(Transaction.category_id == filters.category_id)
        if filters.user_id:
            conditions.append(Transaction.user_id == filters.user_id)
        if filters.date_from:
            conditions.append(Transaction.transaction_date >= filters.date_from)
        if filters.date_to:
            conditions.append(Transaction.transaction_date <= filters.date_to)
        if filters.min_amount:
            conditions.append(Transaction.amount >= filters.min_amount)
        if filters.max_amount:
            conditions.append(Transaction.amount <= filters.max_amount)
        if filters.search:
            pattern = f"%{filters.search}%"
            conditions.append(or_(
                Transaction.description.ilike(pattern),
                Transaction.merchant_name.ilike(pattern),
            ))

        # Count query — plain SELECT COUNT(*), no loader options
        count_result = await self.db.execute(
            select(func.count(Transaction.id)).where(*conditions)
        )
        total = count_result.scalar_one()

        # Data query — WITH selectinload so t.category is populated
        offset = (filters.page - 1) * filters.page_size
        items_result = await self.db.execute(
            select(Transaction)
            .options(selectinload(Transaction.category))
            .where(*conditions)
            .order_by(desc(Transaction.transaction_date))
            .offset(offset)
            .limit(filters.page_size)
        )
        return list(items_result.scalars().all()), total

    async def get_by_date_range(
        self,
        family_id: uuid.UUID,
        date_from: datetime,
        date_to: datetime,
        tx_type: TransactionType | None = None,
    ) -> list[Transaction]:
        q = select(Transaction).where(
            Transaction.family_id == family_id,
            Transaction.transaction_date >= date_from,
            Transaction.transaction_date <= date_to,
            Transaction.deleted_at.is_(None),
        )
        if tx_type:
            q = q.where(Transaction.type == tx_type)
        result = await self.db.execute(q.order_by(Transaction.transaction_date))
        return list(result.scalars().all())

    # ── Aggregation ───────────────────────────────────────────────────────────

    async def sum_by_type(
        self,
        family_id: uuid.UUID,
        tx_type: TransactionType,
        date_from: datetime,
        date_to: datetime,
    ) -> Decimal:
        result = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.family_id == family_id,
                Transaction.type == tx_type,
                Transaction.transaction_date >= date_from,
                Transaction.transaction_date <= date_to,
                Transaction.deleted_at.is_(None),
            )
        )
        return Decimal(str(result.scalar_one()))

    # ── CHANGED: outerjoin Category so name comes back with each row ──────────
    async def sum_by_category(
        self,
        family_id: uuid.UUID,
        date_from: datetime,
        date_to: datetime,
    ) -> list[dict]:
        result = await self.db.execute(
            select(
                Transaction.category_id,
                Category.name.label("name"),
                func.sum(Transaction.amount).label("total"),
                func.count(Transaction.id).label("count"),
            )
            .outerjoin(Category, Transaction.category_id == Category.id)
            .where(
                Transaction.family_id == family_id,
                Transaction.type == TransactionType.EXPENSE,
                Transaction.transaction_date >= date_from,
                Transaction.transaction_date <= date_to,
                Transaction.deleted_at.is_(None),
            )
            .group_by(Transaction.category_id, Category.name)
            .order_by(desc("total"))
        )
        return [
            {"category_id": r.category_id, "name": r.name, "total": r.total, "count": r.count}
            for r in result
        ]
    # ─────────────────────────────────────────────────────────────────────────

    async def monthly_totals(
        self,
        family_id: uuid.UUID,
        months: int = 12,
        year: int | None = None,
    ) -> list[dict]:
        q = (
            select(
                func.date_trunc("month", Transaction.transaction_date).label("month"),
                Transaction.type,
                func.sum(Transaction.amount).label("total"),
            )
            .where(Transaction.family_id == family_id, Transaction.deleted_at.is_(None))
            .group_by("month", Transaction.type)
            .order_by("month")
        )
        if year is not None:
            q = q.where(
                Transaction.transaction_date >= datetime(year, 1, 1),
                Transaction.transaction_date <= datetime(year, 12, 31, 23, 59, 59),
            )
        result = await self.db.execute(q)
        rows = [{"month": r.month, "type": r.type, "total": r.total} for r in result]
        if year is None:
            rows = rows[-months:]
        return rows

    # ── Update ────────────────────────────────────────────────────────────────

    async def update(self, tx: Transaction, data: TransactionUpdate) -> Transaction:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(tx, field, value)
        await self.db.flush()
        # Reload with category so updated response includes t.category.name
        result = await self.db.execute(
            select(Transaction)
            .options(selectinload(Transaction.category))
            .where(Transaction.id == tx.id)
        )
        return result.scalar_one()

    # ── Soft delete ───────────────────────────────────────────────────────────

    async def soft_delete(self, tx: Transaction) -> None:
        tx.deleted_at = datetime.utcnow()
        await self.db.flush()