"""
tasks/reminders.py – Periodic bill reminder notifications.
"""
from loguru import logger
from app.tasks.celery_worker import celery_app


@celery_app.task(name="app.tasks.reminders.send_bill_reminders", bind=True, max_retries=3)
def send_bill_reminders(self):
    """
    Query all active recurring transactions due in the next 3 days
    and send reminder notifications to family admins.
    """
    import asyncio
    from datetime import date, timedelta

    async def _run():
        from app.database.session import AsyncSessionLocal
        from sqlalchemy import select
        from app.models.recurring_transaction import RecurringTransaction
        from app.models.family_member import FamilyMember, MemberRole
        from app.services.notification_service import NotificationService

        today = date.today()
        due_soon = today + timedelta(days=3)

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(RecurringTransaction).where(
                    RecurringTransaction.next_due_date <= due_soon,
                    RecurringTransaction.next_due_date >= today,
                    RecurringTransaction.is_active == True,
                    RecurringTransaction.deleted_at.is_(None),
                )
            )
            due_items = result.scalars().all()

            notif_service = NotificationService(db)
            for item in due_items:
                # Find family admins
                admins = await db.execute(
                    select(FamilyMember).where(
                        FamilyMember.family_id == item.family_id,
                        FamilyMember.role == MemberRole.ADMIN,
                        FamilyMember.deleted_at.is_(None),
                    )
                )
                for admin in admins.scalars().all():
                    from datetime import datetime
                    await notif_service.send_bill_reminder(
                        user_id=admin.user_id,
                        family_id=item.family_id,
                        bill_name=item.description,
                        due_date=datetime.combine(item.next_due_date, datetime.min.time()),
                        amount=float(item.amount),
                    )
                    logger.info(f"Bill reminder sent: {item.description} to user {admin.user_id}")

            await db.commit()

    asyncio.run(_run())
