"""
core/llm_client.py — LM-Sense unified async LLM client

Single interface for calling OpenAI, Anthropic, and Gemini.
All services route LLM calls through here — never import provider SDKs directly elsewhere.
Handles provider selection, error normalisation, and basic retry logic.
"""

from enum import StrEnum
from typing import AsyncGenerator

import httpx

from core.config import settings
from core.exceptions import LLMProviderError, LLMProviderNotConfiguredError, UnsupportedModelError
from core.logging import get_logger

logger = get_logger(__name__)


class LLMProvider(StrEnum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    OPENROUTER = "openrouter"


# Maps model name prefixes to providers
MODEL_PROVIDER_MAP: dict[str, LLMProvider] = {
    "gpt":    LLMProvider.OPENAI,
    "o1":     LLMProvider.OPENAI,
    "claude": LLMProvider.ANTHROPIC,
    "gemini": LLMProvider.GEMINI,
    "nvidia/": LLMProvider.OPENROUTER,
    "openai/": LLMProvider.OPENROUTER,
    "minimax/": LLMProvider.OPENROUTER,
    "meta-llama/": LLMProvider.OPENROUTER,
}


def resolve_provider(model: str) -> LLMProvider:
    """Infers the LLM provider from the model name prefix."""
    for prefix, provider in MODEL_PROVIDER_MAP.items():
        if model.lower().startswith(prefix):
            return provider
    raise UnsupportedModelError(
        f"Cannot resolve provider for model '{model}'. "
        f"Supported prefixes: {list(MODEL_PROVIDER_MAP.keys())}"
    )


class LLMResponse:
    """Normalised response from any LLM provider."""
    def __init__(self, text: str, model: str, provider: LLMProvider, usage: dict) -> None:
        self.text = text
        self.model = model
        self.provider = provider
        self.usage = usage   # {"prompt_tokens": int, "completion_tokens": int}

    def __repr__(self) -> str:
        return f"<LLMResponse provider={self.provider} tokens={self.usage}>"


class LLMClient:
    """
    Async client for calling any supported LLM provider.
    Instantiate once and reuse (holds an httpx.AsyncClient internally).

    Usage:
        client = LLMClient()
        response = await client.complete(model="gpt-4o", prompt="Hello")
    """

    def __init__(self) -> None:
        self._http = httpx.AsyncClient(timeout=60.0)

    async def complete(
        self,
        model: str,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> LLMResponse:
        """
        Sends a prompt to the specified model and returns a normalised response.
        Automatically routes to the correct provider based on model name.
        """
        provider = resolve_provider(model)
        logger.info("llm.request", model=model, provider=provider, prompt_len=len(prompt))

        try:
            if provider == LLMProvider.OPENAI:
                return await self._call_openai(model, prompt, system, temperature, max_tokens)
            elif provider == LLMProvider.ANTHROPIC:
                return await self._call_anthropic(model, prompt, system, temperature, max_tokens)
            elif provider == LLMProvider.GEMINI:
                return await self._call_gemini(model, prompt, system, temperature, max_tokens)
            elif provider == LLMProvider.OPENROUTER:
                return await self._call_openrouter(model, prompt, system, temperature, max_tokens)
        except LLMProviderError:
            raise
        except Exception as exc:
            raise LLMProviderError(
                f"Unexpected error calling {provider}", detail=str(exc)
            ) from exc

    async def _call_openai(
        self, model: str, prompt: str, system: str | None,
        temperature: float, max_tokens: int
    ) -> LLMResponse:
        """Calls the OpenAI chat completions API."""
        if not settings.OPENAI_API_KEY:
            raise LLMProviderNotConfiguredError("OPENAI_API_KEY is not set")

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        resp = await self._http.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={"model": model, "messages": messages,
                  "temperature": temperature, "max_tokens": max_tokens},
        )
        self._raise_for_status(resp, LLMProvider.OPENAI)
        data = resp.json()
        return LLMResponse(
            text=data["choices"][0]["message"]["content"],
            model=model,
            provider=LLMProvider.OPENAI,
            usage=data.get("usage", {}),
        )

    async def _call_anthropic(
        self, model: str, prompt: str, system: str | None,
        temperature: float, max_tokens: int
    ) -> LLMResponse:
        """Calls the Anthropic messages API."""
        if not settings.ANTHROPIC_API_KEY:
            raise LLMProviderNotConfiguredError("ANTHROPIC_API_KEY is not set")

        body: dict = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            body["system"] = system

        resp = await self._http.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            json=body,
        )
        self._raise_for_status(resp, LLMProvider.ANTHROPIC)
        data = resp.json()
        return LLMResponse(
            text=data["content"][0]["text"],
            model=model,
            provider=LLMProvider.ANTHROPIC,
            usage=data.get("usage", {}),
        )

    async def _call_gemini(
        self, model: str, prompt: str, system: str | None,
        temperature: float, max_tokens: int
    ) -> LLMResponse:
        """Calls the Google Gemini generateContent API."""
        if not settings.GEMINI_API_KEY:
            raise LLMProviderNotConfiguredError("GEMINI_API_KEY is not set")

        contents = []
        if system:
            contents.append({"role": "user", "parts": [{"text": system}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        resp = await self._http.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            params={"key": settings.GEMINI_API_KEY},
            json={
                "contents": contents,
                "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
            },
        )
        self._raise_for_status(resp, LLMProvider.GEMINI)
        data = resp.json()
        return LLMResponse(
            text=data["candidates"][0]["content"]["parts"][0]["text"],
            model=model,
            provider=LLMProvider.GEMINI,
            usage={},
        )

    async def _call_openrouter(
        self, model: str, prompt: str, system: str | None,
        temperature: float, max_tokens: int
    ) -> LLMResponse:
        """Calls the OpenRouter chat completions API."""
        if not settings.OPENROUTER_API_KEY:
            raise LLMProviderNotConfiguredError("OPENROUTER_API_KEY is not set")

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        resp = await self._http.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENROUTER_API_KEY}"},
            json={"model": model, "messages": messages,
                  "temperature": temperature, "max_tokens": max_tokens,
                  "reasoning": {"enabled": True}},
        )
        self._raise_for_status(resp, LLMProvider.OPENROUTER)
        data = resp.json()
        return LLMResponse(
            text=data["choices"][0]["message"]["content"],
            model=model,
            provider=LLMProvider.OPENROUTER,
            usage=data.get("usage", {}),
        )

    def _raise_for_status(self, resp: httpx.Response, provider: LLMProvider) -> None:
        """Translates provider HTTP errors into LLMProviderError."""
        if resp.status_code >= 400:
            raise LLMProviderError(
                f"{provider} returned HTTP {resp.status_code}",
                detail=resp.text[:500],
            )

    async def close(self) -> None:
        """Close the underlying HTTP client. Call on app shutdown."""
        await self._http.aclose()


# ── Singleton ─────────────────────────────────────────────────────────────────

_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    """Returns the shared LLMClient singleton. Created on first call."""
    global _client
    if _client is None:
        _client = LLMClient()
    return _client