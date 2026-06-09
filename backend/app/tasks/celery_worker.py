"""
tasks/celery_worker.py – Celery app instance and shared task configuration.
"""
from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "family_office",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.tasks.reminders",
        "app.tasks.monthly_reports",
        "app.tasks.notifications",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Beat schedule for periodic tasks
    beat_schedule={
        "send-bill-reminders-daily": {
            "task": "app.tasks.reminders.send_bill_reminders",
            "schedule": 86400,  # every 24h
        },
        "generate-monthly-reports": {
            "task": "app.tasks.monthly_reports.generate_all_monthly_reports",
            "schedule": 2592000,  # every 30 days
        },
        "detect-anomalies-weekly": {
            "task": "app.tasks.notifications.run_anomaly_detection",
            "schedule": 604800,  # every 7 days
        },
    },
)
