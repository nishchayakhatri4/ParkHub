from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, status
from psycopg.rows import dict_row

from app.dependencies import CurrentUserDep
from models.user import (
    OwnerDashboardResponse,
    UserProfile,
    UserUpdate,
)
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


@router.get(
    "/me/owner-dashboard",
    response_model=OwnerDashboardResponse,
)
def get_owner_dashboard(
    current_user: CurrentUserDep,
) -> dict:
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner account required",
        )

    today = date.today()
    week_start = (
        today - timedelta(days=today.weekday())
    )
    week_end_exclusive = (
        week_start + timedelta(days=7)
    )

    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                select
                    g.parking_id,
                    g.parking_name,
                    g.location,
                    g.address,
                    g.hourly_rate,
                    g.score,
                    g.is_open,

                    count(distinct b.id)
                        filter (
                            where paid.amount is not null
                        ) as weekly_bookings,

                    coalesce(
                        sum(paid.amount),
                        0
                    ) as weekly_earnings

                from public.garages g

                left join public.bookings b
                    on b.parking_id = g.parking_id
                    and b.booking_date >= %s
                    and b.booking_date < %s

                left join lateral (
                    select
                        max(p.amount) as amount
                    from public.payments p
                    where
                        p.booking_id = b.id
                        and p.status = 'paid'
                ) paid on true

                where g.owner_id = %s

                group by
                    g.parking_id,
                    g.parking_name,
                    g.location,
                    g.address,
                    g.hourly_rate,
                    g.score,
                    g.is_open

                order by
                    g.is_open desc,
                    g.parking_name asc
                """,
                (
                    week_start,
                    week_end_exclusive,
                    current_user.id,
                ),
            )

            garages = cur.fetchall()

    weekly_earnings = sum(
        (
            garage["weekly_earnings"]
            for garage in garages
        ),
        start=0,
    )

    weekly_bookings = sum(
        garage["weekly_bookings"]
        for garage in garages
    )

    active_spaces = sum(
        1
        for garage in garages
        if garage["is_open"]
    )

    average_rating = (
        sum(
            float(garage["score"])
            for garage in garages
        ) / len(garages)
        if garages
        else 0.0
    )

    return {
        "week_start": week_start,
        "week_end": (
            week_end_exclusive
            - timedelta(days=1)
        ),
        "weekly_earnings": weekly_earnings,
        "weekly_bookings": weekly_bookings,
        "average_rating": round(
            average_rating,
            1,
        ),
        "active_spaces": active_spaces,
        "garages": garages,
    }


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
