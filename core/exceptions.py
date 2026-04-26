"""
core/exceptions.py — LM-Sense custom exception hierarchy

All domain-specific exceptions live here.
Raised by services, caught and translated to HTTP responses by the API gateway.
Never raise bare Exception — always use one of these.
"""


class LMSenseError(Exception):
    """Base exception for all LM-Sense errors."""
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str, detail: str | None = None) -> None:
        self.message = message
        self.detail = detail
        super().__init__(message)


# ── Auth ─────────────────────────────────────────────────────────────────────

class AuthenticationError(LMSenseError):
    """JWT is missing, expired, or invalid."""
    status_code = 401
    error_code = "AUTHENTICATION_ERROR"


class AuthorizationError(LMSenseError):
    """Authenticated user lacks permission for this action."""
    status_code = 403
    error_code = "AUTHORIZATION_ERROR"


# ── Rate Limiting ─────────────────────────────────────────────────────────────

class RateLimitExceededError(LMSenseError):
    """Tenant has exceeded their request quota."""
    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"


# ── LLM / Provider ───────────────────────────────────────────────────────────

class LLMProviderError(LMSenseError):
    """Upstream LLM provider returned an error."""
    status_code = 502
    error_code = "LLM_PROVIDER_ERROR"


class LLMProviderNotConfiguredError(LMSenseError):
    """No API key found for the requested LLM provider."""
    status_code = 400
    error_code = "LLM_PROVIDER_NOT_CONFIGURED"


class UnsupportedModelError(LMSenseError):
    """Requested model is not supported by LM-Sense."""
    status_code = 400
    error_code = "UNSUPPORTED_MODEL"


# ── Debiasing Pipeline ────────────────────────────────────────────────────────

class DebiasEngineError(LMSenseError):
    """Generic error in the debiasing engine."""
    status_code = 500
    error_code = "DEBIAS_ENGINE_ERROR"


class LayerTimeoutError(LMSenseError):
    """A debiasing layer exceeded its time budget."""
    status_code = 504
    error_code = "LAYER_TIMEOUT"


class BiasDetectionError(LMSenseError):
    """Bias scorer failed to process the input."""
    status_code = 500
    error_code = "BIAS_DETECTION_ERROR"


class RewardModelError(LMSenseError):
    """RLDF reward model (AI judge) returned an error."""
    status_code = 502
    error_code = "REWARD_MODEL_ERROR"


# ── Audit ─────────────────────────────────────────────────────────────────────

class AuditLogError(LMSenseError):
    """Failed to persist or retrieve an audit log entry."""
    status_code = 500
    error_code = "AUDIT_LOG_ERROR"


class AuditChainTamperedError(LMSenseError):
    """Hash chain verification failed — log may have been tampered with."""
    status_code = 500
    error_code = "AUDIT_CHAIN_TAMPERED"


# ── Validation ────────────────────────────────────────────────────────────────

class ValidationError(LMSenseError):
    """Input payload failed domain-level validation."""
    status_code = 422
    error_code = "VALIDATION_ERROR"