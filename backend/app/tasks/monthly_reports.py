"""
tasks/monthly_reports.py – Auto-generate monthly summaries via AI.
"""
from loguru import logger
from app.tasks.celery_worker import celery_app


@celery_app.task(name="app.tasks.monthly_reports.generate_all_monthly_reports")
def generate_all_monthly_reports():
    """Generate AI monthly summaries for all active families."""
    import asyncio
    from datetime import datetime

    async def _run():
        from app.database.session import AsyncSessionLocal
        from sqlalchemy import select
        from app.models.family import Family
        from app.services.AI_service import AIService
        from app.models.ai_insight import AIInsight

        now = datetime.utcnow()
        prev_month = now.month - 1 if now.month > 1 else 12
        prev_year = now.year if now.month > 1 else now.year - 1

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Family).where(Family.deleted_at.is_(None))
            )
            families = result.scalars().all()

            ai_service = AIService(db)
            for family in families:
                try:
                    summary_text = await ai_service.generate_monthly_summary(
                        family.id, prev_year, prev_month
                    )
                    insight = AIInsight(
                        family_id=family.id,
                        insight_type="monthly_summary",
                        title=f"Monthly Summary – {datetime(prev_year, prev_month, 1).strftime('%B %Y')}",
                        body=summary_text,
                        severity="info",
                    )
                    db.add(insight)
                    logger.info(f"Monthly summary generated for family {family.id}")
                except Exception as e:
                    logger.error(f"Failed to generate summary for family {family.id}: {e}")

            await db.commit()

    asyncio.run(_run())


