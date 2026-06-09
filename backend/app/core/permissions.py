"""
core/permissions.py – Role and family membership permission guards.
"""
import uuid
from functools import wraps
from typing import Callable

from fastapi import HTTPException, status

from app.models.family_member import FamilyMember, MemberRole
from app.models.user import User, UserRole


class PermissionDenied(HTTPException):
    def __init__(self, detail: str = "Permission denied."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def require_family_role(*allowed_roles: MemberRole) -> Callable:
    """
    Decorator for route handlers. Checks that the current user's membership
    role in the target family is within *allowed_roles*.

    Usage:
        @require_family_role(MemberRole.ADMIN, MemberRole.MEMBER)
        async def my_route(current_user, membership, ...):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            membership: FamilyMember | None = kwargs.get("membership")
            if membership is None or membership.role not in allowed_roles:
                raise PermissionDenied()
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def is_family_admin(membership: FamilyMember) -> bool:
    return membership.role == MemberRole.ADMIN


def assert_family_admin(membership: FamilyMember) -> None:
    if not is_family_admin(membership):
        raise PermissionDenied("Only family admins can perform this action.")


def assert_can_manage_budgets(membership: FamilyMember) -> None:
    if not membership.can_manage_budgets and membership.role != MemberRole.ADMIN:
        raise PermissionDenied("You do not have permission to manage budgets.")


def assert_can_view_reports(membership: FamilyMember) -> None:
    if not membership.can_view_reports:
        raise PermissionDenied("You do not have permission to view reports.")
