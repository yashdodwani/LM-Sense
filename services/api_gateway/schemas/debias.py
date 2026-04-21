"""
Debias API Models.
"""
from pydantic import BaseModel
from typing import List, Optional
class LayerTrace(BaseModel):
    layer_name: str
    applied: bool
class DebiasRequest(BaseModel):
    model: str
    prompt: str
    raw_response: str
    layers: Optional[List[str]] = None
class DebiasResponse(BaseModel):
    debiased_response: str
    bias_score: float
    layer_trace: List[LayerTrace]
