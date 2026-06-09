"""
models/family_member.py – Membership link between User and Family.
Encodes per-family roles and permission flags.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class MemberRole(str, enum.Enum):
    ADMIN = "admin"         # full access to family data
    MEMBER = "member"       # can add own transactions
    DEPENDENT = "dependent" # view-only; cannot add transactions
    ADVISOR = "advisor"     # read-only, no PII access


class FamilyMember(Base):
    __tablename__ = "family_members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    family_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[MemberRole] = mapped_column(
        Enum(MemberRole), default=MemberRole.MEMBER
    )
    display_name: Mapped[str | None] = mapped_column(String(100))  # nickname within family
    color: Mapped[str | None] = mapped_column(String(7))           # hex colour for UI avatars

    # Permission flags (granular overrides)
    can_view_all_transactions: Mapped[bool] = mapped_column(Boolean, default=True)
    can_add_transactions: Mapped[bool] = mapped_column(Boolean, default=True)
    can_manage_budgets: Mapped[bool] = mapped_column(Boolean, default=False)
    can_invite_members: Mapped[bool] = mapped_column(Boolean, default=False)
    can_view_reports: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    family: Mapped["Family"] = relationship("Family", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="family_memberships")

    def __repr__(self) -> str:
        return f"<FamilyMember user={self.user_id} family={self.family_id} role={self.role}>"
