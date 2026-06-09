"""
utils/helpers.py – General utility functions.
"""
import re
import uuid
from datetime import datetime, date


def generate_id() -> uuid.UUID:
    return uuid.uuid4()


def slugify(text: str) -> str:
    """Convert a string to a URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def truncate(text: str, max_len: int = 50) -> str:
    return text[:max_len] + "..." if len(text) > max_len else text


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    return numerator / denominator if denominator != 0 else default


def month_range(year: int, month: int) -> tuple[datetime, datetime]:
    """Return (start, end) datetimes for a given month."""
    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    return start, end


"""
utils/validators.py – Reusable Pydantic / input validators.
"""
import re


def validate_currency_code(code: str) -> str:
    """Ensure ISO 4217 3-letter currency code."""
    if not re.match(r"^[A-Z]{3}$", code.upper()):
        raise ValueError(f"Invalid currency code: {code}")
    return code.upper()


def validate_hex_color(color: str) -> str:
    if not re.match(r"^#[0-9A-Fa-f]{6}$", color):
        raise ValueError(f"Invalid hex color: {color}")
    return color.lower()


def validate_password_strength(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit.")
    return password


"""
utils/currency.py – Currency formatting helpers.
"""
from decimal import Decimal, ROUND_HALF_UP


def format_currency(amount: Decimal | float, currency: str = "USD") -> str:
    """Format a decimal amount as a currency string."""
    d = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    symbols = {"USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥"}
    symbol = symbols.get(currency, currency + " ")
    return f"{symbol}{d:,}"


def convert_currency(
    amount: Decimal,
    from_currency: str,
    to_currency: str,
    rates: dict[str, float],
) -> Decimal:
    """
    Simple currency conversion using provided rates dict.
    rates should map currency codes to USD equivalent.
    """
    if from_currency == to_currency:
        return amount
    usd_amount = amount / Decimal(str(rates.get(from_currency, 1.0)))
    return usd_amount * Decimal(str(rates.get(to_currency, 1.0)))


"""
utils/date_utils.py – Date helpers.
"""
from datetime import datetime, timedelta, date


def start_of_month(dt: datetime) -> datetime:
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def end_of_month(dt: datetime) -> datetime:
    next_month = (dt.replace(day=28) + timedelta(days=4)).replace(day=1)
    return next_month - timedelta(seconds=1)


def months_between(start: date, end: date) -> int:
    return (end.year - start.year) * 12 + (end.month - start.month)


def fiscal_year_range(year: int, start_month: int = 1) -> tuple[datetime, datetime]:
    """Return start/end of a fiscal year."""
    fy_start = datetime(year, start_month, 1)
    fy_end = datetime(year + 1, start_month, 1) - timedelta(seconds=1)
    return fy_start, fy_end


"""
utils/file_upload.py – File storage abstraction (local + S3).
"""
from pathlib import Path
from app.config import get_settings

settings = get_settings()


async def save_file(content: bytes, filename: str, subfolder: str = "") -> str:
    """Save file content and return the storage path."""
    if settings.storage_backend == "s3":
        return await _save_to_s3(content, filename, subfolder)
    return await _save_local(content, filename, subfolder)


async def _save_local(content: bytes, filename: str, subfolder: str) -> str:
    import aiofiles
    path = Path(settings.upload_dir) / subfolder / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(path, "wb") as f:
        await f.write(content)
    return str(path)


async def _save_to_s3(content: bytes, filename: str, subfolder: str) -> str:
    import boto3
    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )
    key = f"{subfolder}/{filename}" if subfolder else filename
    s3.put_object(Bucket=settings.s3_bucket_name, Key=key, Body=content)
    return f"s3://{settings.s3_bucket_name}/{key}"
