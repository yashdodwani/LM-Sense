"""
FastAPI Dependencies.
Contains functions for auth checks, rate-limits, and db sessions.
"""
from fastapi import Request
async def verify_auth(request: Request) -> str:
    """Validates JWT and returns tenant ID."""
    raise NotImplementedError
