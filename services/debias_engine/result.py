"""
Result dataclasses for Debias Engine.
"""
from dataclasses import dataclass
from typing import List, Any
@dataclass
class FlaggedSpan:
    original: str
    replacement: str | None
    bias_type: str
    severity: Any
    start_char: int
    end_char: int

@dataclass
class DebiasResult:
    request_id: str
    model: str
    raw_response: str
    debiased_response: str
    action_taken: str
    bias_score_before: Any
    bias_score_after: Any
    flagged_spans: List[FlaggedSpan]
    layer_trace: List[Any]
    layers_applied: List[str]
    processing_time_ms: float
