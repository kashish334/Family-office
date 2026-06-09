"""
api/routes/transactions.py – Full CRUD for family transactions.
"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies import CurrentUser, get_family_membership
from app.schemas.transaction import (
    PaginatedTransactions,
    TransactionCreate,
    TransactionFilter,
    TransactionResponse,
    TransactionUpdate,
)
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/families/{family_id}/transactions", tags=["Transactions"])


@router.post("/", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    family_id: uuid.UUID,
    data: TransactionCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TransactionResponse:
    """Record a new transaction for the family."""
    membership = await get_family_membership(family_id, current_user, db)
    if not membership.can_add_transactions:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="You cannot add transactions to this family.")

    service = TransactionService(db)
    tx = await service.create_transaction(family_id, current_user.id, data)
    return TransactionResponse.model_validate(tx)


@router.get("/", response_model=PaginatedTransactions)
async def list_transactions(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    type: str | None = Query(default=None),
    category_id: uuid.UUID | None = Query(default=None),
    user_id: uuid.UUID | None = Query(default=None),
) -> PaginatedTransactions:
    """List transactions with filtering and pagination."""
    await get_family_membership(family_id, current_user, db)

    from app.models.transaction import TransactionType
    filters = TransactionFilter(
        page=page,
        page_size=page_size,
        search=search,
        type=TransactionType(type) if type else None,
        category_id=category_id,
        user_id=user_id,
    )
    service = TransactionService(db)
    return await service.list_transactions(family_id, filters)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    family_id: uuid.UUID,
    transaction_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TransactionResponse:
    await get_family_membership(family_id, current_user, db)
    service = TransactionService(db)
    tx = await service.get_transaction(transaction_id, family_id)
    return TransactionResponse.model_validate(tx)


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    family_id: uuid.UUID,
    transaction_id: uuid.UUID,
    data: TransactionUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TransactionResponse:
    await get_family_membership(family_id, current_user, db)
    service = TransactionService(db)
    tx = await service.update_transaction(transaction_id, family_id, data)
    return TransactionResponse.model_validate(tx)


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(
    family_id: uuid.UUID,
    transaction_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await get_family_membership(family_id, current_user, db)
    service = TransactionService(db)
    await service.delete_transaction(transaction_id, family_id)
