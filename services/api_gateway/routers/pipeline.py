"""
Pipeline Config router.
Endpoints to configure layer settings per tenant.
"""
from fastapi import APIRouter
router = APIRouter(tags=["Pipeline"])
@router.get("/pipeline")
async def get_pipeline_config():
    raise NotImplementedError
