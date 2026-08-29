from functools import lru_cache

from fastapi import HTTPException, status
from supabase import Client, ClientOptions, create_client

from app.config import get_settings


def _missing_configuration() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Supabase is not configured. Add credentials to backend/.env.",
    )


@lru_cache
def get_supabase_admin() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase service-role credentials are not configured in backend/.env.",
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def create_supabase_auth_client() -> Client:
    """Return a fresh auth client so one request cannot retain another user's session."""
    settings = get_settings()
    if not settings.supabase_configured:
        raise _missing_configuration()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def get_supabase_for_token(access_token: str) -> Client:
    settings = get_settings()
    if not settings.supabase_configured:
        raise _missing_configuration()
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
        options=ClientOptions(headers={"Authorization": f"Bearer {access_token}"}),
    )
