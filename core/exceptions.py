"""
Custom domain exceptions for LM-Sense.
"""
class LMSenseError(Exception):
    """Base exception for LM-Sense."""
    pass
class BiasDetectionError(LMSenseError):
    """Raised when bias cannot be properly scored."""
    pass
class LayerTimeoutError(LMSenseError):
    """Raised when a debias layer times out."""
    pass
