"""
services/transaction_service.py – Business logic for transaction management.
"""
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.transaction_repository import TransactionRepository
from app.schemas.transaction import (
    TransactionCreate,
    TransactionFilter,
    TransactionUpdate,
    PaginatedTransactions,
    TransactionResponse,
)
from app.models.transaction import Transaction
import math


class TransactionService:
    def __init__(self, db: AsyncSession):
        self.repo = TransactionRepository(db)

    async def create_transaction(
        self,
        family_id: uuid.UUID,
        user_id: uuid.UUID,
        data: TransactionCreate,
    ) -> Transaction:
        return await self.repo.create(family_id, user_id, data)

    async def get_transaction(
        self,
        transaction_id: uuid.UUID,
        family_id: uuid.UUID,
    ) -> Transaction:
        tx = await self.repo.get_by_id(transaction_id, family_id)
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found.",
            )
        return tx

    async def list_transactions(
        self,
        family_id: uuid.UUID,
        filters: TransactionFilter,
    ) -> PaginatedTransactions:
        items, total = await self.repo.list_with_filter(family_id, filters)
        total_pages = math.ceil(total / filters.page_size) if total > 0 else 1
        return PaginatedTransactions(
            items=[TransactionResponse.model_validate(t) for t in items],
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=total_pages,
        )

    async def update_transaction(
        self,
        transaction_id: uuid.UUID,
        family_id: uuid.UUID,
        data: TransactionUpdate,
    ) -> Transaction:
        tx = await self.get_transaction(transaction_id, family_id)
        return await self.repo.update(tx, data)

    async def delete_transaction(
        self,
        transaction_id: uuid.UUID,
        family_id: uuid.UUID,
    ) -> None:
        tx = await self.get_transaction(transaction_id, family_id)
        await self.repo.soft_delete(tx)
