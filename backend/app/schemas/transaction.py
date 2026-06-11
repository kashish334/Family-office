# backend/app/schemas/transaction.py
# CHANGED: Added CategoryInfo nested schema and `category` field to
#          TransactionResponse so the frontend receives t.category.name
#          properly instead of having to fall back to merchant_name.

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.models.transaction import TransactionType, TransactionStatus


# ── CHANGED: new nested schema for the category relationship ─────────────────
class CategoryInfo(BaseModel):
    id: uuid.UUID
    name: str
    model_config = {"from_attributes": True}
# ─────────────────────────────────────────────────────────────────────────────


class TransactionCreate(BaseModel):
    type: TransactionType
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    description: str = Field(..., min_length=1, max_length=500)
    notes: str | None = None
    category_id: uuid.UUID | None = None
    transaction_date: datetime
    merchant_name: str | None = None
    recurring_transaction_id: uuid.UUID | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive.")
        return v


class TransactionUpdate(BaseModel):
    description: str | None = None
    notes: str | None = None
    category_id: uuid.UUID | None = None
    amount: Decimal | None = None
    transaction_date: datetime | None = None
    merchant_name: str | None = None


class TransactionResponse(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    user_id: uuid.UUID | None
    category_id: uuid.UUID | None
    # ── CHANGED: expose the nested category object ────────────────────────
    category: CategoryInfo | None = None
    # ─────────────────────────────────────────────────────────────────────
    type: TransactionType
    status: TransactionStatus
    amount: Decimal
    currency: str
    description: str
    notes: str | None
    merchant_name: str | None
    transaction_date: datetime
    receipt_url: str | None
    is_anomaly: bool
    is_ocr_generated: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class TransactionFilter(BaseModel):
    """Query parameters for filtering transactions."""
    type: TransactionType | None = None
    category_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    min_amount: Decimal | None = None
    max_amount: Decimal | None = None
    search: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedTransactions(BaseModel):
    items: list[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int