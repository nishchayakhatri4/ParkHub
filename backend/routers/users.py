from fastapi import APIRouter, HTTPException, status
from psycopg.rows import dict_row

from app.dependencies import CurrentUserDep
from models.user import UserProfile, UserUpdate
from services.supabase import get_connection


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


def _get_profile(
    user_id,
) -> dict:

    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                select
                    a.id,
                    a.email,
                    a.first_name,
                    a.last_name,
                    a.role,
                    a.created_at,
                    up.license_plate,
                    up.car_model
                from public.accounts a
                left join public.user_profiles up
                    on up.account_id = a.id
                where a.id = %s
                """,
                (user_id,),
            )

            account = cur.fetchone()

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    first_name = account.pop("first_name")
    last_name = account.pop("last_name")

    account["full_name"] = (
        f"{first_name} {last_name}"
    )

    # Your current schema has no owner verification
    # column yet.
    account["verified_owner"] = False

    return account


@router.get(
    "/me",
    response_model=UserProfile,
)
def get_me(
    current_user: CurrentUserDep,
) -> dict:

    return _get_profile(
        current_user.id,
    )


@router.patch(
    "/me",
    response_model=UserProfile,
)
def update_me(
    payload: UserUpdate,
    current_user: CurrentUserDep,
) -> dict:

    if payload.full_name is None:
        return _get_profile(
            current_user.id,
        )

    full_name = payload.full_name.strip()

    parts = full_name.split(
        maxsplit=1
    )

    if len(parts) != 2:
        raise HTTPException(
            status_code=
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Please provide both first "
                "and last name"
            ),
        )

    first_name, last_name = parts

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                update public.accounts
                set
                    first_name = %s,
                    last_name = %s
                where id = %s
                returning id
                """,
                (
                    first_name,
                    last_name,
                    current_user.id,
                ),
            )

            updated = cur.fetchone()

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return _get_profile(
        current_user.id,
    )