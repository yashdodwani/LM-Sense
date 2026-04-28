"""
db/base.py — LM-Sense database declarative base

Contains the declarative base and mixins for SQLAlchemy ORM models.
Includes TimestampMixin and UUIDMixin.
"""
from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    """Declarative base class for all SQLAlchemy ORM models."""
    pass

class TimestampMixin:
    """Mixin for created_at and updated_at."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

class UUIDMixin:
    """Mixin for UUID primary keys."""
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
