"""
dependencies.py – Reusable FastAPI dependencies for auth, DB, and family context.
"""
import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.database.session import get_db
from app.models.family_member import FamilyMember, MemberRole
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)

# ── Token helpers ──────────────────────────────────────────────────────────

def _extract_bearer(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


# ── Current user ───────────────────────────────────────────────────────────

async def get_current_user(
    token: Annotated[str, Depends(_extract_bearer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Decode JWT and return the authenticated User (must be active + not deleted)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None or payload.get("type") != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user: User | None = result.scalar_one_or_none()

    if user is None or not user.is_active or user.is_deleted:
        raise credentials_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# ── Family membership ──────────────────────────────────────────────────────

async def get_family_membership(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FamilyMember:
    """
    Return the calling user's FamilyMember record for *family_id*.
    Raises 403 if they are not a member of that family.
    """
    result = await db.execute(
        select(FamilyMember).where(
            FamilyMember.family_id == family_id,
            FamilyMember.user_id == current_user.id,
            FamilyMember.deleted_at.is_(None),
        )
    )
    membership: FamilyMember | None = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this family.",
        )
    return membership


CurrentMembership = Annotated[FamilyMember, Depends(get_family_membership)]


def require_admin(membership: FamilyMember = Depends(get_family_membership)) -> FamilyMember:
    """Gate that enforces ADMIN role within a family."""
    if membership.role != MemberRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only family admins can perform this action.",
        )
    return membership
