"""
Sandbox router.
Endpoints for testing prompts and getting A/B comparisons.
"""
from fastapi import APIRouter
router = APIRouter(tags=["Sandbox"])
@router.post("/sandbox")
async def run_sandbox():
    raise NotImplementedError
