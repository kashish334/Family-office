"""
models/user.py – User account model with role-based access control.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class UserRole(str, enum.Enum):
    # Values are UPPERCASE to match the existing PostgreSQL enum type.
    SUPER_ADMIN = "SUPER_ADMIN"   # platform-level (internal)
    FAMILY_ADMIN = "FAMILY_ADMIN" # controls their family account
    MEMBER = "MEMBER"             # regular family member
    DEPENDENT = "DEPENDENT"       # restricted view (e.g. child)
    ADVISOR = "ADVISOR"           # read-only financial advisor


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        # name="userrole"  → matches the type already in Postgres
        # create_type=True → let SQLAlchemy manage the type
        # checkfirst=True  → emits CREATE TYPE IF NOT EXISTS, preventing
        #                    duplicate-type errors when multiple workers
        #                    start simultaneously
        Enum(UserRole, name="userrole", create_type=True, checkfirst=True),
        default=UserRole.MEMBER,
        nullable=False,
    )
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    phone: Mapped[str | None] = mapped_column(String(50))

    # Status flags
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Soft delete
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    family_memberships: Mapped[list["FamilyMember"]] = relationship(
        "FamilyMember", back_populates="user", lazy="selectin"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<User {self.email} [{self.role}]>"

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None