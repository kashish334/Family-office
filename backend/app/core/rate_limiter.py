"""
core/rate_limiter.py – SlowAPI-based rate limiting helpers.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings

settings = get_settings()

# Global limiter instance – attach to FastAPI app as `app.state.limiter`
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.rate_limit_per_minute}/minute"])

# Convenient per-route decorators
def rate_limit_default(func):
    return limiter.limit(f"{settings.rate_limit_per_minute}/minute")(func)

def rate_limit_auth(func):
    """Stricter limit for auth endpoints (login, register, password reset)."""
    return limiter.limit(f"{settings.rate_limit_auth_per_minute}/minute")(func)
