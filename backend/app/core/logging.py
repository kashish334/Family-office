"""
core/logging.py – Loguru-based structured logging setup.
Call configure_logging() once at application startup.
"""
import sys
from loguru import logger
from app.config import get_settings


def configure_logging() -> None:
    settings = get_settings()
    logger.remove()  # Remove default handler

    level = "DEBUG" if settings.debug else "INFO"

    # Console handler with colour
    logger.add(
        sys.stdout,
        level=level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "{message}"
        ),
        colorize=True,
        backtrace=True,
        diagnose=settings.debug,
    )

    # Rotating file handler for production
    if settings.is_production:
        logger.add(
            "logs/app.log",
            level="INFO",
            rotation="10 MB",
            retention="30 days",
            compression="gz",
            serialize=True,   # JSON structured logs
        )

    logger.info(f"Logging configured – level={level}, env={settings.environment}")
