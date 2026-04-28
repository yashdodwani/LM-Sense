"""
services/audit_logger/logger.py — LM-Sense Audit Logger

Handles persisting audit entries into the PostgreSQL database.
Generates an unbreakable hash chain per tenant to ensure tamper evidence.
"""
from dataclasses import dataclass
import hashlib
import json
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.logging import get_logger
from services.audit_logger.models import AuditLog, HashBlock
from services.api_gateway.schemas.audit import AuditQuery
try:
    from services.debias_engine.result import DebiasResult
except ImportError:
    from typing import Any as DebiasResult
from db.session import get_db

logger = get_logger(__name__)

def sha256_hash(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

@dataclass
class AuditEntry:
    pass
class AuditLogger:
    """Tamper-evident logger."""
    def __init__(self, session: Optional[AsyncSession] = None):
        self.provided_session = session

    async def log(self, result: "DebiasResult", tenant_id: str, prompt: str) -> str:
        """
        Persists a DebiasResult to AuditLog.
        Computes: block_hash = SHA-256(entry_data_json + previous_block_hash)
        Updates HashBlock chain tip for this tenant.
        Returns the audit entry ID.
        """
        async def _log(session: AsyncSession) -> str:
            # Handle dict fallback if result is passed as dict
            if isinstance(result, dict):
                req_id = result.get("request_id", "")
                model = result.get("model", "")
                raw_response = result.get("raw_response", "")
                debiased_resp = result.get("debiased_response", "")
                score_before = result.get("bias_score_before", {})
                score_after = result.get("bias_score_after", {})
                spans = result.get("flagged_spans", [])
                layers = result.get("layers_applied", [])
                action = result.get("action_taken", "")
            else:
                req_id = getattr(result, "request_id", "")
                model = getattr(result, "model", "")
                raw_response = getattr(result, "raw_response", getattr(result, "original_text", ""))
                debiased_resp = getattr(result, "debiased_response", getattr(result, "debiased_text", ""))
                
                # Check if it has dict-like score objects or pure pydantic objects
                before_obj = getattr(result, "bias_score_before", None)
                score_before = score_before.model_dump() if hasattr(before_obj, "model_dump") else before_obj or {}
                
                after_obj = getattr(result, "bias_score_after", None)
                score_after = score_after.model_dump() if hasattr(after_obj, "model_dump") else after_obj or {}
                
                spans = getattr(result, "flagged_spans", getattr(result, "trace", []))
                layers = getattr(result, "layers_applied", [])
                action = getattr(result, "action_taken", "")
                if hasattr(action, "value"):
                    action = action.value
                
                if not isinstance(score_before, dict) and hasattr(score_before, "dict"):
                    score_before = score_before.dict()
                if not isinstance(score_after, dict) and hasattr(score_after, "dict"):
                    score_after = score_after.dict()
            
            bias_types_detected = []
            max_severity = "none"
            for span in spans:
                if isinstance(span, dict):
                    bt = span.get("bias_type")
                    sev = span.get("severity")
                else:
                    bt = getattr(span, "bias_type", None)
                    sev = getattr(span, "severity", None)
                    if hasattr(bt, "value"): bt = bt.value
                    if hasattr(sev, "value"): sev = sev.value
                if bt and bt not in bias_types_detected:
                    bias_types_detected.append(bt)
                if sev and max_severity == "none":
                    max_severity = sev
            
            layers_str = [str(la.value) if hasattr(la, 'value') else str(la) for la in layers]
            prompt_hash = sha256_hash(prompt)
            raw_response_hash = sha256_hash(raw_response)

            entry_data_json = json.dumps({
                "tenant_id": tenant_id,
                "request_id": req_id,
                "model": model,
                "prompt_hash": prompt_hash,
                "raw_response_hash": raw_response_hash,
                "debiased_response": debiased_resp,
                "bias_score_before": score_before,
                "bias_score_after": score_after,
                "bias_types_detected": bias_types_detected,
                "severity": max_severity,
                "layers_applied": layers_str,
                "action_taken": action
            }, sort_keys=True)

            hb_query = select(HashBlock).where(HashBlock.tenant_id == tenant_id).with_for_update()
            hb_result = await session.execute(hb_query)
            hash_block = hb_result.scalar_one_or_none()

            if hash_block is None:
                genesis_hash = sha256_hash("GENESIS")
                hash_block = HashBlock(tenant_id=tenant_id, last_hash=genesis_hash, entry_count=0)
                session.add(hash_block)
                await session.flush()
            
            previous_hash = hash_block.last_hash
            block_hash = sha256_hash(entry_data_json + previous_hash)
            
            new_entry = AuditLog(
                tenant_id=tenant_id,
                request_id=req_id,
                model=model,
                prompt_hash=prompt_hash,
                raw_response_hash=raw_response_hash,
                debiased_response=debiased_resp,
                bias_score_before=score_before,
                bias_score_after=score_after,
                bias_types_detected=bias_types_detected,
                severity=max_severity,
                layers_applied=layers_str,
                action_taken=action,
                block_hash=block_hash
            )
            session.add(new_entry)
            
            hash_block.last_hash = block_hash
            hash_block.entry_count += 1
            
            await session.flush()
            return str(new_entry.id)

        if self.provided_session:
            return await _log(self.provided_session)
        else:
            async for session in get_db():
                return await _log(session)

    async def verify_chain(self, tenant_id: str) -> dict:
        """
        Recomputes every block hash from genesis for this tenant.
        Returns {intact: bool, entries_checked: int, first_tampered_id: str | None}
        """
        async def _verify(session: AsyncSession) -> dict:
            query = select(AuditLog).where(AuditLog.tenant_id == tenant_id).order_by(AuditLog.created_at)
            result = await session.execute(query)
            entries = result.scalars().all()

            current_hash = sha256_hash("GENESIS")
            checked = 0

            for entry in entries:
                entry_data_json = json.dumps({
                    "tenant_id": entry.tenant_id,
                    "request_id": entry.request_id,
                    "model": entry.model,
                    "prompt_hash": entry.prompt_hash,
                    "raw_response_hash": entry.raw_response_hash,
                    "debiased_response": entry.debiased_response,
                    "bias_score_before": entry.bias_score_before,
                    "bias_score_after": entry.bias_score_after,
                    "bias_types_detected": entry.bias_types_detected,
                    "severity": entry.severity,
                    "layers_applied": entry.layers_applied,
                    "action_taken": entry.action_taken
                }, sort_keys=True)
                
                expected_hash = sha256_hash(entry_data_json + current_hash)
                
                if entry.block_hash != expected_hash:
                    return {"intact": False, "entries_checked": checked, "first_tampered_id": str(entry.id)}
                
                current_hash = expected_hash
                checked += 1
            
            return {"intact": True, "entries_checked": checked, "first_tampered_id": None}

        if self.provided_session:
            return await _verify(self.provided_session)
        else:
            async for session in get_db():
                return await _verify(session)

    async def query(self, tenant_id: str, filters: AuditQuery) -> tuple[list[AuditLog], int]:
        """
        Returns paginated AuditLog entries matching filters.
        Returns (entries, total_count).
        """
        async def _query(session: AsyncSession) -> tuple[list[AuditLog], int]:
            stmt = select(AuditLog).where(AuditLog.tenant_id == tenant_id)
            
            if filters.bias_type:
                # Basic JSON-in-SQLite replacement for .any()
                stmt = stmt.where(AuditLog.bias_types_detected.contains(filters.bias_type))
            if filters.severity:
                stmt = stmt.where(AuditLog.severity == filters.severity)
            if filters.model:
                stmt = stmt.where(AuditLog.model == filters.model)
            if filters.from_date:
                stmt = stmt.where(AuditLog.created_at >= filters.from_date)
            if filters.to_date:
                stmt = stmt.where(AuditLog.created_at <= filters.to_date)
            
            from sqlalchemy import func
            count_stmt = select(func.count()).select_from(stmt.subquery())
            total = (await session.execute(count_stmt)).scalar() or 0
            
            stmt = stmt.order_by(AuditLog.created_at.desc())
            stmt = stmt.offset((filters.page - 1) * filters.page_size).limit(filters.page_size)
            
            result = await session.execute(stmt)
            entries = list(result.scalars().all())
            return entries, total

        if self.provided_session:
            return await _query(self.provided_session)
        else:
            async for session in get_db():
                return await _query(session)
