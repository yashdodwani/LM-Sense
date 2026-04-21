"""Geographic bias detector."""
class GeographicDetector:
    async def detect(self, text: str) -> float:
        raise NotImplementedError
