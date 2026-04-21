"""
Debias Engine orchestration.
Runs inputs through configured layers.
"""
from services.api_gateway.schemas.pipeline import PipelineConfig
from .result import DebiasResult
class DebiasEngine:
    """Main debiasing pipeline orchestrator."""
    async def run(
        self,
        prompt: str,
        raw_response: str,
        config: PipelineConfig,
        tenant_id: str,
    ) -> DebiasResult:
        """
        Runs the raw_response through enabled layers in sequence.
        Layer 1 → Layer 2 → Layer 3 (each layer receives previous layer's output).
        Returns a DebiasResult with the final debiased text, score, and full layer trace.
        """
        raise NotImplementedError
