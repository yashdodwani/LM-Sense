"""
Bias Scorer.
Runs multiple bias detectors in parallel and aggregates the score.
"""
from typing import Dict, Any
class BiasScoreResult:
    pass
class BiasScorer:
    """Main entry point for bias detection."""
    async def score(self, text: str) -> BiasScoreResult:
        """
        Runs all enabled detectors in parallel (asyncio.gather).
        Aggregates dimension scores into a single 0–100 fairness score.
        Higher score = more fair.
        Returns detected bias types and their per-dimension scores.
        """
        raise NotImplementedError
