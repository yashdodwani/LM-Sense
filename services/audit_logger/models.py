"""
services/audit_logger/models.py — Audit Log ORM Models

Defines the database schema for immutable, tamper-evident audit logs.
Includes AuditLog for entries and HashBlock for the hash chain tip.
"""
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, Integer, Index, JSON, ARRAY
from db.base import Base, TimestampMixin, UUIDMixin

class AuditLog(Base, TimestampMixin, UUIDMixin):
    __tablename__ = "audit_logs"

    tenant_id: Mapped[str] = mapped_column(String, index=True)
    request_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    model: Mapped[str] = mapped_column(String)
    prompt_hash: Mapped[str] = mapped_column(String)
    raw_response_hash: Mapped[str] = mapped_column(String)
    debiased_response: Mapped[str] = mapped_column(Text)
    bias_score_before: Mapped[dict] = mapped_column(JSON)
    bias_score_after: Mapped[dict] = mapped_column(JSON)
    bias_types_detected: Mapped[list[str]] = mapped_column(ARRAY(String).with_variant(JSON, "sqlite"))
    severity: Mapped[str] = mapped_column(String)
    layers_applied: Mapped[list[str]] = mapped_column(ARRAY(String).with_variant(JSON, "sqlite"))
    action_taken: Mapped[str] = mapped_column(String)
    block_hash: Mapped[str] = mapped_column(String)


class HashBlock(Base, TimestampMixin, UUIDMixin):
    __tablename__ = "hash_blocks"

    tenant_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    last_hash: Mapped[str] = mapped_column(String)
    entry_count: Mapped[int] = mapped_column(Integer, default=0)
