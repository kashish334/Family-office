"""
services/notification_service.py – Create and deliver user notifications.
"""
import uuid
from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from loguru import logger


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: uuid.UUID,
        family_id: uuid.UUID | None,
        type: str,
        title: str,
        body: str,
        action_url: str | None = None,
        data: dict | None = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            family_id=family_id,
            type=type,
            title=title,
            body=body,
            action_url=action_url,
            data=data,
            sent_at=datetime.utcnow(),
        )
        self.db.add(notif)
        await self.db.flush()
        return notif

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        unread_only: bool = False,
        limit: int = 50,
    ) -> list[Notification]:
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.is_read == False)  # noqa: E712
        q = q.order_by(Notification.created_at.desc()).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def mark_read(self, user_id: uuid.UUID, notification_ids: list[uuid.UUID]) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.id.in_(notification_ids))
            .values(is_read=True, read_at=datetime.utcnow())
        )
        await self.db.flush()
        return result.rowcount

    async def mark_all_read(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
            .values(is_read=True, read_at=datetime.utcnow())
        )
        await self.db.flush()
        return result.rowcount

    async def send_budget_alert(
        self,
        user_id: uuid.UUID,
        family_id: uuid.UUID,
        category_name: str,
        spent: float,
        limit: float,
    ) -> None:
        pct = round(spent / limit * 100) if limit else 0
        await self.create(
            user_id=user_id,
            family_id=family_id,
            type="budget_alert",
            title=f"Budget Alert – {category_name}",
            body=f"You've used {pct}% of your {category_name} budget (${spent:,.2f} of ${limit:,.2f}).",
            action_url="/budget",
        )

    async def send_bill_reminder(
        self,
        user_id: uuid.UUID,
        family_id: uuid.UUID,
        bill_name: str,
        due_date: datetime,
        amount: float,
    ) -> None:
        await self.create(
            user_id=user_id,
            family_id=family_id,
            type="bill_reminder",
            title=f"Bill Due: {bill_name}",
            body=f"${amount:,.2f} is due on {due_date.strftime('%b %d, %Y')}.",
            action_url="/bills",
        )

    async def send_goal_milestone(
        self,
        user_id: uuid.UUID,
        family_id: uuid.UUID,
        goal_name: str,
        progress_pct: float,
    ) -> None:
        await self.create(
            user_id=user_id,
            family_id=family_id,
            type="goal_milestone",
            title=f"Savings Milestone – {goal_name}",
            body=f"Great progress! You've reached {progress_pct:.0f}% of your '{goal_name}' goal.",
            action_url="/savings",
        )
