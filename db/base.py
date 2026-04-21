"""
SQLAlchemy declarative base and mixins.
"""
from sqlalchemy.orm import declarative_base
Base = declarative_base()
class TimestampMixin:
    """Mixin for created_at and updated_at."""
    pass
class UUIDMixin:
    """Mixin for UUID primary keys."""
    pass
