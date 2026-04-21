"""ORM Models for Audits."""
from db.base import Base
class AuditLog(Base):
    __tablename__ = "audit_logs"
class HashBlock(Base):
    __tablename__ = "hash_blocks"
