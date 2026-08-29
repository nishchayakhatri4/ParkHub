from fastapi import APIRouter, HTTPException, status
from psycopg.errors import UniqueViolation

from models.auth import (
    AuthResponse,
    AuthUser,
    LoginRequest,
    RegisterRequest,
)
from services.supabase import get_connection


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def _build_auth_response(
    account: tuple,
    session_token,
) -> AuthResponse:
    account_id, email, role, first_name, last_name = account

    return AuthResponse(
        access_token=str(session_token),
        user=AuthUser(
            id=str(account_id),
            email=email,
            full_name=f"{first_name} {last_name}",
            role=role,
            verified_owner=False,
        ),
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest) -> AuthResponse:
    name_parts = payload.full_name.strip().split(maxsplit=1)

    first_name = name_parts[0]
    last_name = name_parts[1]

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into public.accounts (
                        role,
                        first_name,
                        last_name,
                        email,
                        password_hash
                    )
                    values (
                        %s,
                        %s,
                        %s,
                        lower(trim(%s)),
                        encode(
                            extensions.digest(%s, 'sha256'),
                            'hex'
                        )
                    )
                    returning
                        id,
                        email,
                        role,
                        first_name,
                        last_name
                    """,
                    (
                        payload.role,
                        first_name,
                        last_name,
                        str(payload.email),
                        payload.password,
                    ),
                )

                account = cur.fetchone()

                cur.execute(
                    """
                    insert into public.app_sessions (
                        account_id
                    )
                    values (%s)
                    returning token
                    """,
                    (account[0],),
                )

                session_token = cur.fetchone()[0]

    except UniqueViolation as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create account",
        ) from exc

    return _build_auth_response(
        account,
        session_token,
    )


@router.post(
    "/login",
    response_model=AuthResponse,
)
def login(payload: LoginRequest) -> AuthResponse:
    with get_connection() as conn:
        with conn.cursor() as cur:

            # Remove expired sessions.
            cur.execute(
                """
                delete from public.app_sessions
                where expires_at <= now()
                """
            )

            cur.execute(
                """
                select
                    id,
                    email,
                    role,
                    first_name,
                    last_name
                from public.accounts
                where
                    email = lower(trim(%s))
                    and password_hash = encode(
                        extensions.digest(%s, 'sha256'),
                        'hex'
                    )
                """,
                (
                    str(payload.email),
                    payload.password,
                ),
            )

            account = cur.fetchone()

            if account is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password",
                )

            cur.execute(
                """
                insert into public.app_sessions (
                    account_id
                )
                values (%s)
                returning token
                """,
                (account[0],),
            )

            session_token = cur.fetchone()[0]

    return _build_auth_response(
        account,
        session_token,
    )