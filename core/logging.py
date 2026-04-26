"""
core/logging.py — LM-Sense structured logging

Configures structlog with JSON output (production) or pretty console (dev).
Every log event automatically carries: timestamp, level, service, request_id.
Import `get_logger` — never use bare print() or the stdlib logging module directly.
"""

import logging
import sys

import structlog
from structlog.types import EventDict, WrappedLogger

from core.config import settings


def add_app_context(
    logger: WrappedLogger,
    method_name: str,
    event_dict: EventDict,
) -> EventDict:
    """Structlog processor — injects app name and version into every log entry."""
    event_dict["app"] = settings.APP_NAME
    event_dict["version"] = settings.APP_VERSION
    event_dict["env"] = settings.APP_ENV
    return event_dict


def configure_logging() -> None:
    """
    Call once at application startup (in FastAPI lifespan).
    Sets up structlog with shared processors and the right renderer
    based on APP_ENV (JSON in prod/staging, pretty in dev).
    """
    shared_processors: list = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        add_app_context,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.APP_ENV == "development":
        renderer = structlog.dev.ConsoleRenderer(colors=True)
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.DEBUG if settings.DEBUG else logging.INFO
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(sys.stdout),
        cache_logger_on_first_use=True,
    )

    # Also silence noisy stdlib loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.BoundLogger:
    """
    Returns a structlog logger bound to the given name.
    Usage: logger = get_logger(__name__)
    """
    return structlog.get_logger(name)