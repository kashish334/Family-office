"""
models/family.py – Top-level family account (the billing/grouping unit).
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Family(Base):
    __tablename__ = "families"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    currency: Mapped[str] = mapped_column(String(3), default="USD")  # ISO 4217
    timezone: Mapped[str] = mapped_column(String(100), default="UTC")
    logo_url: Mapped[str | None] = mapped_column(String(500))

    # Subscription / plan tier
    plan: Mapped[str] = mapped_column(String(50), default="free")  # free | premium | enterprise

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    members: Mapped[list["FamilyMember"]] = relationship(
        "FamilyMember", back_populates="family", lazy="selectin"
    )
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="family", lazy="noload"
    )
    budgets: Mapped[list["Budget"]] = relationship(
        "Budget", back_populates="family", lazy="noload"
    )
    savings_goals: Mapped[list["SavingsGoal"]] = relationship(
        "SavingsGoal", back_populates="family", lazy="noload"
    )
    categories: Mapped[list["Category"]] = relationship(
        "Category", back_populates="family", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<Family {self.name}>"
