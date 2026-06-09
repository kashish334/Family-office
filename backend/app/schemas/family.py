"""schemas/family.py"""
import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.family_member import MemberRole


class FamilyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    currency: str = Field(default="USD", min_length=3, max_length=3)
    timezone: str = "UTC"


class FamilyUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    currency: str | None = None
    timezone: str | None = None


class FamilyResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    currency: str
    timezone: str
    plan: str
    created_at: datetime
    model_config = {"from_attributes": True}


class InviteMemberRequest(BaseModel):
    email: str
    role: MemberRole = MemberRole.MEMBER
    display_name: str | None = None


class MemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    family_id: uuid.UUID
    role: MemberRole
    display_name: str | None
    joined_at: datetime
    model_config = {"from_attributes": True}
