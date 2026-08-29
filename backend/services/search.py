from collections import defaultdict
from datetime import date, time
from typing import Any
from uuid import UUID

from psycopg import Connection
from psycopg.rows import dict_row


ACTIVE_BOOKING_STATUSES = (
    "pending",
    "confirmed",
    "checked_in",
)


def _hydrate_spaces(
    conn: Connection,
    rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    if not rows:
        return []

    parking_ids = [
        row["parking_id"]
        for row in rows
    ]

    availability_by_space = defaultdict(list)
    review_count_by_space = defaultdict(int)

    with conn.cursor(row_factory=dict_row) as cur:

        cur.execute(
            """
            select
                parking_id,
                day_of_week,
                start_time,
                end_time
            from public.garage_availability
            where parking_id = any(%s)
            order by
                parking_id,
                day_of_week,
                start_time
            """,
            (parking_ids,),
        )

        for availability in cur.fetchall():
            availability_by_space[
                availability["parking_id"]
            ].append(
                {
                    "day_of_week":
                        availability["day_of_week"],
                    "start_time":
                        availability["start_time"],
                    "end_time":
                        availability["end_time"],
                }
            )

        cur.execute(
            """
            select
                parking_id,
                count(*)::integer as review_count
            from public.reviews
            where parking_id = any(%s)
            group by parking_id
            """,
            (parking_ids,),
        )

        for review_row in cur.fetchall():
            review_count_by_space[
                review_row["parking_id"]
            ] = review_row["review_count"]

    hydrated = []

    for row in rows:
        parking_id = row["parking_id"]

        owner_first_name = row.pop(
            "owner_first_name"
        )
        owner_last_name = row.pop(
            "owner_last_name"
        )

        row["owner"] = {
            "id": row["owner_id"],
            "full_name": (
                f"{owner_first_name} "
                f"{owner_last_name}"
            ),
            "verified_owner": False,
        }

        row["availability"] = (
            availability_by_space[parking_id]
        )

        row["review_count"] = (
            review_count_by_space[parking_id]
        )

        hydrated.append(row)

    return hydrated


def list_parking_spaces(
    conn: Connection,
    owner_id: UUID | None = None,
    active_only: bool = True,
    location: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:

    clauses = []
    params: list[Any] = []

    if owner_id is not None:
        clauses.append("g.owner_id = %s")
        params.append(owner_id)

    if active_only:
        clauses.append("g.is_open = true")

    if location is not None:
        clauses.append(
            "lower(g.location) = lower(%s)"
        )
        params.append(location)

    where_clause = ""

    if clauses:
        where_clause = (
            "where " + " and ".join(clauses)
        )

    params.append(limit)

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            f"""
            select
                g.parking_id,
                g.owner_id,
                g.parking_name,
                g.location,
                g.address,
                g.hourly_rate,
                g.score,
                g.is_open,
                g.latitude,
                g.longitude,
                g.has_lighting,
                g.has_cctv,
                g.is_covered,
                g.description,
                g.created_at,
                a.first_name as owner_first_name,
                a.last_name as owner_last_name
            from public.garages g
            join public.accounts a
                on a.id = g.owner_id
            {where_clause}
            order by g.parking_id
            limit %s
            """,
            params,
        )

        rows = cur.fetchall()

    return _hydrate_spaces(
        conn,
        rows,
    )


def get_parking_space(
    conn: Connection,
    parking_id: str,
) -> dict[str, Any] | None:

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select
                g.parking_id,
                g.owner_id,
                g.parking_name,
                g.location,
                g.address,
                g.hourly_rate,
                g.score,
                g.is_open,
                g.latitude,
                g.longitude,
                g.has_lighting,
                g.has_cctv,
                g.is_covered,
                g.description,
                g.created_at,
                a.first_name as owner_first_name,
                a.last_name as owner_last_name
            from public.garages g
            join public.accounts a
                on a.id = g.owner_id
            where g.parking_id = %s
            """,
            (
                parking_id.upper().strip(),
            ),
        )

        row = cur.fetchone()

    if row is None:
        return None

    return _hydrate_spaces(
        conn,
        [row],
    )[0]


def _within_availability(
    space: dict[str, Any],
    booking_date: date,
    start_time: time,
    end_time: time,
) -> bool:

    windows = space["availability"]

    # No availability rows means the garage
    # is available whenever it is open.
    if not windows:
        return True

    weekday = booking_date.weekday()

    return any(
        window["day_of_week"] == weekday
        and window["start_time"] <= start_time
        and window["end_time"] >= end_time
        for window in windows
    )


def _has_conflict(
    bookings: list[dict[str, Any]],
    start_time: time,
    end_time: time,
) -> bool:

    return any(
        start_time < booking["end_time"]
        and end_time > booking["start_time"]
        for booking in bookings
    )


def _rank_spaces(
    spaces: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    if not spaces:
        return []

    prices = [
        float(space["hourly_rate"])
        for space in spaces
    ]

    min_price = min(prices)
    max_price = max(prices)

    cheapest_id = min(
        spaces,
        key=lambda item: float(
            item["hourly_rate"]
        ),
    )["parking_id"]

    highest_rated_id = max(
        spaces,
        key=lambda item: float(
            item["score"]
        ),
    )["parking_id"]

    for space in spaces:
        price = float(space["hourly_rate"])

        if max_price == min_price:
            price_score = 1.0
        else:
            price_score = (
                1
                - (
                    (price - min_price)
                    / (max_price - min_price)
                )
            )

        rating_score = (
            float(space["score"]) / 5
        )

        convenience_score = (
            sum(
                [
                    space["has_lighting"],
                    space["has_cctv"],
                    space["is_covered"],
                ]
            )
            / 3
        )

        # Internal recommendation value only.
        # Public rating remains the 0-5 star score.
        recommendation_score = (
            0.45 * price_score
            + 0.35 * rating_score
            + 0.20 * convenience_score
        )

        space["recommendation_score"] = round(
            recommendation_score,
            3,
        )

    spaces.sort(
        key=lambda item: item[
            "recommendation_score"
        ],
        reverse=True,
    )

    for index, space in enumerate(spaces):
        if index == 0:
            space["label"] = "Best Overall"

        elif (
            space["parking_id"]
            == cheapest_id
        ):
            space["label"] = "Cheapest"

        elif (
            space["parking_id"]
            == highest_rated_id
        ):
            space["label"] = "Highest Rated"

        else:
            space["label"] = "Best Value"

    return spaces


def search_parking(
    conn: Connection,
    location: str,
    booking_date: date,
    start_time: time,
    end_time: time,
    limit: int = 5,
) -> list[dict[str, Any]]:

    spaces = list_parking_spaces(
        conn=conn,
        active_only=True,
        location=location,
        limit=100,
    )

    candidates = [
        space
        for space in spaces
        if _within_availability(
            space,
            booking_date,
            start_time,
            end_time,
        )
    ]

    if not candidates:
        return []

    parking_ids = [
        space["parking_id"]
        for space in candidates
    ]

    bookings_by_space = defaultdict(list)

    with conn.cursor(
        row_factory=dict_row
    ) as cur:
        cur.execute(
            """
            select
                parking_id,
                start_time,
                end_time,
                status
            from public.bookings
            where
                parking_id = any(%s)
                and booking_date = %s
                and status = any(%s)
            """,
            (
                parking_ids,
                booking_date,
                list(ACTIVE_BOOKING_STATUSES),
            ),
        )

        for booking in cur.fetchall():
            bookings_by_space[
                booking["parking_id"]
            ].append(booking)

    available = [
        space
        for space in candidates
        if not _has_conflict(
            bookings_by_space[
                space["parking_id"]
            ],
            start_time,
            end_time,
        )
    ]

    return _rank_spaces(
        available
    )[:limit]