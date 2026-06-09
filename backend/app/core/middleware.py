"""
core/middleware.py – Custom middleware: request logging, timing, security headers.
"""
import time
import uuid

from fastapi import Request, Response
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs every request with timing and a unique request-id."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()

        # Attach request_id so route handlers can reference it
        request.state.request_id = request_id

        logger.info(
            f"[{request_id}] ▶ {request.method} {request.url.path} "
            f"(client={request.client.host if request.client else 'unknown'})"
        )

        try:
            response: Response = await call_next(request)
        except Exception as exc:
            logger.exception(f"[{request_id}] Unhandled exception: {exc}")
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            f"[{request_id}] ◀ {response.status_code} "
            f"({elapsed_ms:.1f}ms)"
        )

        # Attach useful headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{elapsed_ms:.1f}ms"
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds security-related HTTP response headers."""

    HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=()",
    }

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        for key, value in self.HEADERS.items():
            response.headers[key] = value
        return response
