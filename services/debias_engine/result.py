"""
Result dataclasses for Debias Engine.
"""
from dataclasses import dataclass
from typing import List, Any
@dataclass
class DebiasResult:
    original_text: str
    debiased_text: str
    score: float
    trace: List[Any]
