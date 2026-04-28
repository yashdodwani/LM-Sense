"""
tests/test_audit_logger.py — Tests for audit logger.

Tests the AuditLogger, HashChaining and AuditExporter.
"""
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from db.base import Base

from services.audit_logger.logger import AuditLogger
from services.audit_logger.models import AuditLog, HashBlock
from services.api_gateway.schemas.audit import AuditQuery
from services.audit_logger.exporter import AuditExporter
from unittest.mock import MagicMock

# Mock result
class MockSpan:
    bias_type = "gender"
    severity = "high"

class MockResult:
    request_id = "req-1"
    model = "test-model"
    raw_response = "biased"
    debiased_response = "unbiased"
    action_taken = "rewritten"
    bias_score_before = {"overall": 10.0}
    bias_score_after = {"overall": 90.0}
    flagged_spans = [MockSpan()]
    layers_applied = ["postprocess"]

engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def session():
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()

@pytest.mark.asyncio
async def test_audit_log_chains(session):
    logger = AuditLogger(session=session)
    tenant_id = "tenant-1"
    prompt = "say something"
    
    # 1. log() persists an entry and returns a UUID string
    r1 = MockResult()
    r1.request_id = "req-1"
    id1 = await logger.log(r1, tenant_id, prompt)
    assert id1 is not None

    # 2. log() correctly chains block hashes
    r2 = MockResult()
    r2.request_id = "req-2"
    id2 = await logger.log(r2, tenant_id, prompt)
    
    # 3. verify_chain() returns intact=True for an unmodified chain
    verify_result = await logger.verify_chain(tenant_id)
    assert verify_result["intact"] is True
    assert verify_result["entries_checked"] == 2

@pytest.mark.asyncio
async def test_audit_log_tamper(session):
    logger = AuditLogger(session=session)
    tenant_id = "tenant-2"
    prompt = "say something"
    
    r1 = MockResult()
    r1.request_id = "req-1"
    await logger.log(r1, tenant_id, prompt)
    
    r2 = MockResult()
    r2.request_id = "req-2"
    await logger.log(r2, tenant_id, prompt)
    
    # Manual tamper
    from sqlalchemy import select
    res = await session.execute(select(AuditLog).where(AuditLog.request_id == "req-1"))
    log_entry = res.scalar_one()
    log_entry.block_hash = "fake-hash"
    await session.commit()
    
    # 4. verify_chain() returns intact=False when a block_hash is tampered
    verify_result = await logger.verify_chain(tenant_id)
    assert verify_result["intact"] is False
    assert verify_result["first_tampered_id"] == str(log_entry.id)

@pytest.mark.asyncio
async def test_audit_query_severity(session):
    logger = AuditLogger(session=session)
    tenant_id = "tenant-3"
    
    r1 = MockResult()
    r1.request_id = "req-1"
    await logger.log(r1, tenant_id, "prompt 1")
    
    query = AuditQuery(severity="high")
    entries, total = await logger.query(tenant_id, query)
    
    assert total == 1
    assert entries[0].severity == "high"

@pytest.mark.asyncio
async def test_export_csv():
    exporter = AuditExporter()
    
    log = AuditLog(
        id="test-id",
        tenant_id="tenant-1",
        request_id="req-1",
        model="mdl",
        prompt_hash="phash",
        raw_response_hash="rhash",
        debiased_response="resp",
        bias_score_before={"overall": 10},
        bias_score_after={"overall": 90},
        bias_types_detected=["gender"],
        severity="high",
        layers_applied=["Layer3"],
        action_taken="rewritten",
        block_hash="bhash"
    )
    
    import datetime
    log.created_at = datetime.datetime.now()
    
    csv_str = await exporter.export_csv([log])
    assert "request_id" in csv_str
    assert "req-1" in csv_str
    assert "gender" in csv_str
    # 2 rows: header + 1 data row
    assert len(csv_str.strip().split("\n")) == 2
