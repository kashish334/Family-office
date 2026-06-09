"""
tasks/notifications.py – Weekly anomaly detection run.
"""
from app.tasks.celery_worker import celery_app
from loguru import logger


@celery_app.task(name="app.tasks.notifications.run_anomaly_detection")
def run_anomaly_detection():
    """Scan last 30 days of transactions for anomalies and notify families."""
    import asyncio
    from datetime import datetime, timedelta

    async def _run():
        from app.database.session import AsyncSessionLocal
        from sqlalchemy import select
        from app.models.family import Family
        from app.models.family_member import FamilyMember, MemberRole
        from app.repositories.transaction_repository import TransactionRepository
        from app.analytics.anomaly_detection import detect_anomalies
        from app.services.notification_service import NotificationService

        now = datetime.utcnow()
        date_from = now - timedelta(days=30)

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Family).where(Family.deleted_at.is_(None)))
            families = result.scalars().all()

            for family in families:
                repo = TransactionRepository(db)
                txns = await repo.get_by_date_range(family.id, date_from, now)
                anomalies = detect_anomalies(txns)

                if not anomalies:
                    continue

                # Notify admin
                admins = await db.execute(
                    select(FamilyMember).where(
                        FamilyMember.family_id == family.id,
                        FamilyMember.role == MemberRole.ADMIN,
                        FamilyMember.deleted_at.is_(None),
                    )
                )
                notif_service = NotificationService(db)
                for admin in admins.scalars().all():
                    top = anomalies[0]
                    await notif_service.create(
                        user_id=admin.user_id,
                        family_id=family.id,
                        type="anomaly_detected",
                        title=f"{len(anomalies)} Unusual Transaction(s) Detected",
                        body=f'Most notable: "{top["description"]}" – {top["reason"]}',
                        action_url="/transactions",
                    )
                logger.info(f"Anomaly notification sent for family {family.id}: {len(anomalies)} flagged")

            await db.commit()

    asyncio.run(_run())
