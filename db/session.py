"""
SQLAlchemy database setup.
Provides async session factories for database interaction.
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from core.config import settings
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
async def get_db_session() -> AsyncSession: # type: ignore
    """Dependency for providing a database session."""
    async with AsyncSessionLocal() as session:
        yield session
