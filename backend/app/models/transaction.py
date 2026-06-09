"""
models/transaction.py – Core financial transaction record.
Covers both income and expenses, supports recurring links and receipt attachments.
"""
import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Index,
    Numeric, String, Text, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    family_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    recurring_transaction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recurring_transactions.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Core fields
    type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus), default=TransactionStatus.COMPLETED
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    # Merchant / payee info
    merchant_name: Mapped[str | None] = mapped_column(String(255))
    merchant_logo: Mapped[str | None] = mapped_column(String(500))

    # Dates
    transaction_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # OCR / receipt
    receipt_url: Mapped[str | None] = mapped_column(String(500))
    is_ocr_generated: Mapped[bool] = mapped_column(Boolean, default=False)

    # AI tagging
    ai_category_confidence: Mapped[float | None] = mapped_column(Numeric(5, 4))
    is_anomaly: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    family: Mapped["Family"] = relationship("Family", back_populates="transactions")
    user: Mapped["User"] = relationship("User")
    category: Mapped["Category"] = relationship("Category", back_populates="transactions")
    uploaded_files: Mapped[list["UploadedFile"]] = relationship(
        "UploadedFile", back_populates="transaction", lazy="noload"
    )

    __table_args__ = (
        Index("ix_transactions_family_date", "family_id", "transaction_date"),
        Index("ix_transactions_family_type", "family_id", "type"),
        Index("ix_transactions_family_category", "family_id", "category_id"),
    )

    def __repr__(self) -> str:
        return f"<Transaction {self.type} {self.amount} {self.currency} – {self.description[:30]}>"
