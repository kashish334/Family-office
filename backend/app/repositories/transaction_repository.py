"""
repositories/transaction_repository.py – Database access layer for transactions.
All DB queries live here; services call this layer, never raw SQL directly.
"""
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate, TransactionFilter, TransactionUpdate


class TransactionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Create ────────────────────────────────────────────────────────────

    async def create(
        self,
        family_id: uuid.UUID,
        user_id: uuid.UUID,
        data: TransactionCreate,
    ) -> Transaction:
        tx = Transaction(
            family_id=family_id,
            user_id=user_id,
            **data.model_dump(),
        )
        self.db.add(tx)
        await self.db.flush()
        await self.db.refresh(tx)
        return tx

    # ── Read ──────────────────────────────────────────────────────────────

    async def get_by_id(self, transaction_id: uuid.UUID, family_id: uuid.UUID) -> Transaction | None:
        result = await self.db.execute(
            select(Transaction).where(
                Transaction.id == transaction_id,
                Transaction.family_id == family_id,
                Transaction.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_with_filter(
        self,
        family_id: uuid.UUID,
        filters: TransactionFilter,
    ) -> tuple[list[Transaction], int]:
        """Return (page_items, total_count)."""
        base_query = select(Transaction).where(
            Transaction.family_id == family_id,
            Transaction.deleted_at.is_(None),
        )

        # Apply optional filters
        if filters.type:
            base_query = base_query.where(Transaction.type == filters.type)
        if filters.category_id:
            base_query = base_query.where(Transaction.category_id == filters.category_id)
        if filters.user_id:
            base_query = base_query.where(Transaction.user_id == filters.user_id)
        if filters.date_from:
            base_query = base_query.where(Transaction.transaction_date >= filters.date_from)
        if filters.date_to:
            base_query = base_query.where(Transaction.transaction_date <= filters.date_to)
        if filters.min_amount:
            base_query = base_query.where(Transaction.amount >= filters.min_amount)
        if filters.max_amount:
            base_query = base_query.where(Transaction.amount <= filters.max_amount)
        if filters.search:
            pattern = f"%{filters.search}%"
            base_query = base_query.where(
                or_(
                    Transaction.description.ilike(pattern),
                    Transaction.merchant_name.ilike(pattern),
                )
            )

        # Count total
        count_result = await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        # Paginate
        offset = (filters.page - 1) * filters.page_size
        items_result = await self.db.execute(
            base_query.order_by(desc(Transaction.transaction_date))
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

    # ── Aggregation ──────────────────────────────────────────────────────

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

    async def sum_by_category(
        self,
        family_id: uuid.UUID,
        date_from: datetime,
        date_to: datetime,
    ) -> list[dict]:
        result = await self.db.execute(
            select(
                Transaction.category_id,
                func.sum(Transaction.amount).label("total"),
                func.count(Transaction.id).label("count"),
            )
            .where(
                Transaction.family_id == family_id,
                Transaction.type == TransactionType.EXPENSE,
                Transaction.transaction_date >= date_from,
                Transaction.transaction_date <= date_to,
                Transaction.deleted_at.is_(None),
            )
            .group_by(Transaction.category_id)
            .order_by(desc("total"))
        )
        return [{"category_id": r.category_id, "total": r.total, "count": r.count} for r in result]

    async def monthly_totals(
        self,
        family_id: uuid.UUID,
        months: int = 12,
    ) -> list[dict]:
        """Return monthly income and expense totals for the last N months."""
        result = await self.db.execute(
            select(
                func.date_trunc("month", Transaction.transaction_date).label("month"),
                Transaction.type,
                func.sum(Transaction.amount).label("total"),
            )
            .where(
                Transaction.family_id == family_id,
                Transaction.deleted_at.is_(None),
            )
            .group_by("month", Transaction.type)
            .order_by("month")
        )
        return [{"month": r.month, "type": r.type, "total": r.total} for r in result]

    # ── Update ────────────────────────────────────────────────────────────

    async def update(self, tx: Transaction, data: TransactionUpdate) -> Transaction:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(tx, field, value)
        await self.db.flush()
        await self.db.refresh(tx)
        return tx

    # ── Soft delete ───────────────────────────────────────────────────────

    async def soft_delete(self, tx: Transaction) -> None:
        tx.deleted_at = datetime.utcnow()
        await self.db.flush()
