"""
api/routes/notifications.py
"""
import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies import CurrentUser
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class MarkReadRequest(BaseModel):
    notification_ids: list[uuid.UUID]


@router.get("/")
async def list_notifications(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=200),
):
    service = NotificationService(db)
    return await service.list_for_user(current_user.id, unread_only=unread_only, limit=limit)


@router.post("/mark-read")
async def mark_read(
    body: MarkReadRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = NotificationService(db)
    count = await service.mark_read(current_user.id, body.notification_ids)
    return {"marked_read": count}


@router.post("/mark-all-read")
async def mark_all_read(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = NotificationService(db)
    count = await service.mark_all_read(current_user.id)
    return {"marked_read": count}
