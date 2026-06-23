"""
api/routes/families.py – Family CRUD and member management endpoints.
"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies import CurrentUser, get_family_membership
from app.core.permissions import assert_family_admin
from app.models.family_member import FamilyMember
from app.repositories.family_repository import FamilyRepository
from app.repositories.user_repository import UserRepository
from app.schemas.family import (
    FamilyCreate,
    FamilyResponse,
    FamilyUpdate,
    InviteMemberRequest,
    MemberResponse,
    MyMembershipResponse,
)

router = APIRouter(prefix="/families", tags=["Families"])


@router.get("/me", response_model=list[MyMembershipResponse])
async def list_my_families(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[MyMembershipResponse]:
    """List every family the current user belongs to (owned or invited into)."""
    repo = FamilyRepository(db)
    memberships = await repo.list_for_user(current_user.id)
    result: list[MyMembershipResponse] = []
    for m in memberships:
        family = await repo.get_by_id(m.family_id)
        if family:
            result.append(
                MyMembershipResponse(family_id=family.id, family_name=family.name, role=m.role)
            )
    return result


@router.post("/", response_model=FamilyResponse, status_code=201)
async def create_family(
    data: FamilyCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FamilyResponse:
    """Create a new family. Calling user becomes the admin."""
    repo = FamilyRepository(db)
    family = await repo.create(data, current_user.id)
    return FamilyResponse.model_validate(family)


@router.get("/{family_id}", response_model=FamilyResponse)
async def get_family(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FamilyResponse:
    repo = FamilyRepository(db)
    # Validate membership
    await get_family_membership(family_id, current_user, db)
    family = await repo.get_by_id(family_id)
    if not family:
        raise HTTPException(status_code=404, detail="Family not found.")
    return FamilyResponse.model_validate(family)


@router.patch("/{family_id}", response_model=FamilyResponse)
async def update_family(
    family_id: uuid.UUID,
    data: FamilyUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FamilyResponse:
    repo = FamilyRepository(db)
    membership = await get_family_membership(family_id, current_user, db)
    assert_family_admin(membership)
    family = await repo.get_by_id(family_id)
    if not family:
        raise HTTPException(status_code=404, detail="Family not found.")
    family = await repo.update(family, data)
    return FamilyResponse.model_validate(family)


@router.get("/{family_id}/members", response_model=list[MemberResponse])
async def list_members(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[MemberResponse]:
    await get_family_membership(family_id, current_user, db)
    repo = FamilyRepository(db)
    members = await repo.list_members(family_id)
    return [MemberResponse.model_validate(m) for m in members]


@router.post("/{family_id}/members", response_model=MemberResponse, status_code=201)
async def invite_member(
    family_id: uuid.UUID,
    data: InviteMemberRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MemberResponse:
    """Invite a user by email to join this family."""
    repo = FamilyRepository(db)
    membership = await get_family_membership(family_id, current_user, db)
    assert_family_admin(membership)

    user_repo = UserRepository(db)
    invitee = await user_repo.get_by_email(data.email)
    if not invitee:
        raise HTTPException(
            status_code=404,
            detail="No user found with that email address.",
        )

    # Check not already a member
    existing = await repo.get_member(family_id, invitee.id)
    if existing:
        raise HTTPException(
            status_code=409,
            detail="This user is already a member of the family.",
        )

    from app.models.family_member import FamilyMember
    new_member = FamilyMember(
        family_id=family_id,
        user_id=invitee.id,
        role=data.role,
        display_name=data.display_name,
    )
    db.add(new_member)
    await db.flush()
    await db.refresh(new_member)
    return MemberResponse.model_validate(new_member)


@router.delete("/{family_id}/members/{user_id}", status_code=204)
async def remove_member(
    family_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    repo = FamilyRepository(db)
    membership = await get_family_membership(family_id, current_user, db)
    assert_family_admin(membership)

    member = await repo.get_member(family_id, user_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself.")

    from datetime import datetime
    member.deleted_at = datetime.utcnow()
    await db.flush()