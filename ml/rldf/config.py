"""RLDF configs."""
from dataclasses import dataclass
@dataclass
class RLDFConfig:
    fairness_lambda: float = 0.7
