"""
Debias router.
Endpoint for primary debiasing requests.
"""
from fastapi import APIRouter
from ..schemas.debias import DebiasRequest, DebiasResponse
router = APIRouter(tags=["Debias"])
@router.post("/debias", response_model=DebiasResponse)
async def run_debias(request: DebiasRequest) -> DebiasResponse:
    """Processes raw output through the debias engine."""
    raise NotImplementedError
