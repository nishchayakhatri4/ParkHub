from dataclasses import dataclass
from typing import Annotated, Literal
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import EmailStr
from supabase import Client

from services.supabase import create_supabase_auth_client, get_supabase_for_token


bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    email: EmailStr
    role: Literal["driver", "owner"]
    full_name: str
    verified_owner: bool
    access_token: str


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    token = credentials.credentials
    try:
        auth_response = create_supabase_auth_client().auth.get_user(token)
        auth_user = auth_response.user
        if auth_user is None:
            raise ValueError("No user returned")
        profile = (
            get_supabase_for_token(token).table("profiles")
            .select("id,full_name,role,verified_owner")
            .eq("id", str(auth_user.id)).single().execute().data
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token") from exc
    if not profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User profile is missing")
    return CurrentUser(
        id=UUID(profile["id"]), email=auth_user.email, role=profile["role"],
        full_name=profile["full_name"], verified_owner=profile["verified_owner"], access_token=token,
    )


def require_owner(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    if current_user.role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner account required")
    return current_user


def get_user_client(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> Client:
    return get_supabase_for_token(current_user.access_token)


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
OwnerDep = Annotated[CurrentUser, Depends(require_owner)]
UserClientDep = Annotated[Client, Depends(get_user_client)]
