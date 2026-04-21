"""
Aggregates individual bias scores.
"""
class ScoreAggregator:
    def aggregate(self, scores: dict[str, float]) -> float:
        raise NotImplementedError
