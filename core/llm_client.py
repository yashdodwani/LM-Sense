"""
Unified LLM Client wrapper.
Abstracts interactions with OpenAI, Anthropic, and Gemini.
"""
from typing import Optional
class LLMClient:
    """Client for routing requests to different LLM providers asynchronously."""
    async def generate(self, prompt: str, model: str = "gpt-4o", temperature: float = 0.7) -> str:
        """Generates text from the underlying provider."""
        raise NotImplementedError("Generation not implemented")
