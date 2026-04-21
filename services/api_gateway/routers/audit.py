"""
Audit router.
Endpoints for viewing and generating audit logs.
"""
from fastapi import APIRouter
router = APIRouter(tags=["Audit"])
@router.get("/audit")
async def get_audit_logs():
    raise NotImplementedError
