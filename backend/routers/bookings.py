from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from psycopg.rows import dict_row

from app.dependencies import CurrentUserDep, UserClientDep
from models.booking import BookingCreate, BookingResponse


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"],
)


ACTIVE_BOOKING_STATUSES = [
    "pending",
    "confirmed",
    "checked_in",
]


def _get_booking(
    client,
    booking_id: UUID,
) -> dict:

    with client.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select
                b.id,
                b.user_id,
                b.parking_id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.total_price,
                b.status,
                b.checked_in_at,
                b.checked_out_at,
                b.created_at,

                g.owner_id,
                g.parking_name,
                g.location,
                g.address,
                g.hourly_rate,
                g.latitude,
                g.longitude

            from public.bookings b

            join public.garages g
                on g.parking_id = b.parking_id

            where b.id = %s
            """,
            (booking_id,),
        )

        row = cur.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    row["parking_space"] = {
        "parking_id": row["parking_id"],
        "owner_id": row.pop("owner_id"),
        "parking_name": row.pop("parking_name"),
        "location": row.pop("location"),
        "address": row.pop("address"),
        "hourly_rate": row.pop("hourly_rate"),
        "latitude": row.pop("latitude"),
        "longitude": row.pop("longitude"),
    }

    return row


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    payload: BookingCreate,
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> dict:

    if current_user.role != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account required",
        )

    parking_id = payload.parking_id.upper().strip()

    with client.cursor(row_factory=dict_row) as cur:

        # Serialize booking attempts for this parking space.
        cur.execute(
            """
            select pg_advisory_xact_lock(
                hashtext(%s)
            )
            """,
            (parking_id,),
        )

        # Load parking space.
        cur.execute(
            """
            select
                parking_id,
                owner_id,
                hourly_rate,
                is_open
            from public.garages
            where parking_id = %s
            """,
            (parking_id,),
        )

        garage = cur.fetchone()

        if garage is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parking space not found",
            )

        if not garage["is_open"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Parking space is currently unavailable",
            )

        # Check whether availability rules exist.
        cur.execute(
            """
            select exists(
                select 1
                from public.garage_availability
                where parking_id = %s
            )
            """,
            (parking_id,),
        )

        has_availability_rules = cur.fetchone()["exists"]

        # If availability rules exist, requested booking
        # must fit completely inside one window.
        if has_availability_rules:
            cur.execute(
                """
                select exists(
                    select 1
                    from public.garage_availability
                    where
                        parking_id = %s
                        and day_of_week = %s
                        and start_time <= %s
                        and end_time >= %s
                )
                """,
                (
                    parking_id,
                    payload.booking_date.weekday(),
                    payload.start_time,
                    payload.end_time,
                ),
            )

            within_window = cur.fetchone()["exists"]

            if not within_window:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Parking space is not available "
                        "during the requested time"
                    ),
                )

        # Check booking overlap.
        cur.execute(
            """
            select exists(
                select 1
                from public.bookings
                where
                    parking_id = %s
                    and booking_date = %s
                    and status = any(%s)
                    and %s < end_time
                    and %s > start_time
            )
            """,
            (
                parking_id,
                payload.booking_date,
                ACTIVE_BOOKING_STATUSES,
                payload.start_time,
                payload.end_time,
            ),
        )

        conflict = cur.fetchone()["exists"]

        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Parking space is already booked "
                    "during the requested time"
                ),
            )

        # Calculate number of booked hours.
        start_dt = datetime.combine(
            date.min,
            payload.start_time,
        )

        end_dt = datetime.combine(
            date.min,
            payload.end_time,
        )

        duration_seconds = Decimal(
            str((end_dt - start_dt).total_seconds())
        )

        duration_hours = (
            duration_seconds / Decimal("3600")
        )

        total_price = (
            Decimal(str(garage["hourly_rate"]))
            * duration_hours
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        cur.execute(
            """
            insert into public.bookings (
                user_id,
                parking_id,
                booking_date,
                start_time,
                end_time,
                total_price,
                status
            )
            values (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                'pending'
            )
            returning id
            """,
            (
                current_user.id,
                parking_id,
                payload.booking_date,
                payload.start_time,
                payload.end_time,
                total_price,
            ),
        )

        booking_id = cur.fetchone()["id"]

    return _get_booking(
        client,
        booking_id,
    )


@router.get(
    "/me",
    response_model=list[BookingResponse],
)
def list_my_bookings(
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> list[dict]:

    with client.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select id
            from public.bookings
            where user_id = %s
            order by
                booking_date desc,
                start_time desc
            """,
            (current_user.id,),
        )

        booking_ids = [
            row["id"]
            for row in cur.fetchall()
        ]

    return [
        _get_booking(client, booking_id)
        for booking_id in booking_ids
    ]


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
)
def get_booking(
    booking_id: UUID,
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> dict:

    booking = _get_booking(
        client,
        booking_id,
    )

    is_driver = (
        booking["user_id"]
        == current_user.id
    )

    is_owner = (
        booking["parking_space"]["owner_id"]
        == current_user.id
    )

    if not is_driver and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access this booking",
        )

    return booking


def _transition(
    client,
    booking_id: UUID,
    action: str,
) -> dict:

    transition_map = {
        "check_in": {
            "required": "confirmed",
            "new": "checked_in",
            "timestamp": "checked_in_at",
        },
        "check_out": {
            "required": "checked_in",
            "new": "completed",
            "timestamp": "checked_out_at",
        },
        "cancel": {
            "required": None,
            "new": "cancelled",
            "timestamp": None,
        },
    }

    transition = transition_map[action]

    with client.cursor() as cur:

        if action == "cancel":
            cur.execute(
                """
                update public.bookings
                set status = 'cancelled'
                where
                    id = %s
                    and status in (
                        'pending',
                        'confirmed'
                    )
                returning id
                """,
                (booking_id,),
            )

        else:
            timestamp_column = transition[
                "timestamp"
            ]

            cur.execute(
                f"""
                update public.bookings
                set
                    status = %s,
                    {timestamp_column} = now()
                where
                    id = %s
                    and status = %s
                returning id
                """,
                (
                    transition["new"],
                    booking_id,
                    transition["required"],
                ),
            )

        updated = cur.fetchone()

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Booking cannot perform action "
                f"'{action}' in its current state"
            ),
        )

    return _get_booking(
        client,
        booking_id,
    )


@router.post(
    "/{booking_id}/check-in",
    response_model=BookingResponse,
)
def check_in(
    booking_id: UUID,
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> dict:

    booking = _get_booking(
        client,
        booking_id,
    )

    if booking["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the user can check in",
        )

    return _transition(
        client,
        booking_id,
        "check_in",
    )


@router.post(
    "/{booking_id}/check-out",
    response_model=BookingResponse,
)
def check_out(
    booking_id: UUID,
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> dict:

    booking = _get_booking(
        client,
        booking_id,
    )

    if booking["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the user can check out",
        )

    return _transition(
        client,
        booking_id,
        "check_out",
    )


@router.post(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
)
def cancel_booking(
    booking_id: UUID,
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> dict:

    booking = _get_booking(
        client,
        booking_id,
    )

    if booking["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the user can cancel this booking",
        )

    return _transition(
        client,
        booking_id,
        "cancel",
    )