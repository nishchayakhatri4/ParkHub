from functools import lru_cache

from fastapi import HTTPException, status
from psycopg_pool import ConnectionPool

from app.config import get_settings


def _missing_configuration() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Database is not configured. Add DATABASE_URL to backend/.env.",
    )


@lru_cache
def get_db_pool() -> ConnectionPool:
    settings = get_settings()

    if not settings.database_configured:
        raise _missing_configuration()

    return ConnectionPool(
        conninfo=settings.database_url,
        min_size=1,
        max_size=5,
        open=True,
    )


def get_connection():
    return get_db_pool().connection()
