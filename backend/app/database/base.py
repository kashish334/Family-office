"""
database/base.py – SQLAlchemy declarative base shared by all models.
"""
from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    """All ORM models inherit from this class."""

    @declared_attr.directive
    def __tablename__(cls) -> str:  # noqa: N805
        # Auto-generate snake_case table names from class names
        import re
        name = re.sub(r"(?<!^)(?=[A-Z])", "_", cls.__name__).lower()
        return name
