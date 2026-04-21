"""QLoRA config classes."""
from dataclasses import dataclass
@dataclass
class QLoRAConfig:
    rank: int = 8
