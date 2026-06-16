"""
api/routes/auth.py  (UPDATED)
CHANGED: Added two new endpoints:
  PATCH /auth/me        – update profile (full_name, phone)
  POST  /auth/change-password – change password (requires current password)
"""
from typing import Annotated
from fastapi import APIRouter, Depends, Request, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.core.rate_limiter import limiter
from app.database.session import get_db
from app.dependencies import CurrentUser
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse, UserUpdate
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, data: RegisterRequest, db: Annotated[AsyncSession, Depends(get_db)]) -> UserResponse:
    service = AuthService(db)
    return await service.register(data)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, data: LoginRequest, db: Annotated[AsyncSession, Depends(get_db)]) -> TokenResponse:
    service = AuthService(db)
    return await service.login(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: Annotated[AsyncSession, Depends(get_db)]) -> TokenResponse:
    service = AuthService(db)
    return await service.refresh(data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)


# ── NEW: update profile ───────────────────────────────────────────────────────
@router.patch("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """Update the current user's profile (full_name, phone)."""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    await db.flush()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


# ── NEW: change password ──────────────────────────────────────────────────────
class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str     = Field(..., min_length=8)

@router.post("/change-password", status_code=200)
async def change_password(
    data: ChangePasswordRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Verify current password and set a new one."""
    if not pwd_context.verify(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    current_user.hashed_password = pwd_context.hash(data.new_password)
    await db.flush()
    return {"message": "Password changed successfully."}
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/logout")
async def logout(current_user: CurrentUser) -> dict:
    return {"message": "Logged out successfully."}