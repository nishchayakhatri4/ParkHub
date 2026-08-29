from dataclasses import dataclass
from typing import Annotated, Generator, Literal
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from psycopg import Connection
from pydantic import EmailStr

from services.supabase import get_connection


bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    email: EmailStr
    role: Literal["user", "owner"]
    full_name: str
    verified_owner: bool
    access_token: str


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
) -> CurrentUser:

    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        session_token = UUID(credentials.credentials)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token",
        ) from exc

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select
                    a.id,
                    a.email,
                    a.role,
                    a.first_name,
                    a.last_name
                from public.app_sessions s
                join public.accounts a
                    on a.id = s.account_id
                where
                    s.token = %s
                    and s.expires_at > now()
                """,
                (session_token,),
            )

            account = cur.fetchone()

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
        )

    (
        account_id,
        email,
        role,
        first_name,
        last_name,
    ) = account

    return CurrentUser(
        id=account_id,
        email=email,
        role=role,
        full_name=f"{first_name} {last_name}",
        verified_owner=False,
        access_token=str(session_token),
    )


def require_owner(
    current_user: Annotated[
        CurrentUser,
        Depends(get_current_user),
    ],
) -> CurrentUser:

    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner account required",
        )

    return current_user


def get_user_client(
    current_user: Annotated[
        CurrentUser,
        Depends(get_current_user),
    ],
) -> Generator[Connection, None, None]:
    """
    Transitional dependency.

    Existing routers may still import UserClientDep.
    It now supplies a PostgreSQL connection instead of
    a Supabase Python Client.
    """

    with get_connection() as conn:
        yield conn


CurrentUserDep = Annotated[
    CurrentUser,
    Depends(get_current_user),
]

OwnerDep = Annotated[
    CurrentUser,
    Depends(require_owner),
]

UserClientDep = Annotated[
    Connection,
    Depends(get_user_client),
]