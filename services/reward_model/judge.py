"""
Reward Model Judge.
Scores text pairs for RLDF.
"""
class RewardModelJudge:
    """AI judge for Layer 2 debates."""
    async def score_pair(
        self,
        prompt: str,
        biased_response: str,
        debiased_response: str,
    ) -> float:
        """
        Sends both responses to the AI judge LLM.
        Returns a reward score between -1.0 (biased wins) and +1.0 (debiased wins).
        Used as the PPO reward signal in RLDF training.
        """
        raise NotImplementedError
