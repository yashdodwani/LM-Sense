"""
Structured logging setup.
Configures structlog to output JSON logs for OpenTelemetry compatibility.
"""
import structlog
def setup_logging() -> None:
    """Initializes structlog configuration for the application."""
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
        ]
    )
def get_logger(name: str) -> structlog.BoundLogger:
    """Returns a bound logger instance."""
    return structlog.get_logger(name)
