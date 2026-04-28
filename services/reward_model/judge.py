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


from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Reward Model Service")

class ScoreRequest(BaseModel):
    text: str

class ScoreResponse(BaseModel):
    score: float

@app.post("/score", response_model=ScoreResponse)
async def score_text(req: ScoreRequest):
    """
    Scores the text for fairness. Returns 0-100 score.
    """
    text_lower = req.text.lower()
    bias_terms = ["he should", "she should", "businessman", "businesswoman", "young man", "waitress"]
    score = 100.0
    for term in bias_terms:
        if term in text_lower:
            score -= 50.0
    return ScoreResponse(score=max(0.0, score))
