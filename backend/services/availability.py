from datetime import date, time
from typing import Any, Iterable


ACTIVE_BOOKING_STATUSES = {"pending", "confirmed", "checked_in"}


def parse_time(value: str | time) -> time:
    return value if isinstance(value, time) else time.fromisoformat(value)


def is_within_availability(
    windows: Iterable[dict[str, Any]], booking_date: date, start_time: time, end_time: time
) -> bool:
    return any(
        int(window["day_of_week"]) == booking_date.weekday()
        and parse_time(window["start_time"]) <= start_time
        and parse_time(window["end_time"]) >= end_time
        for window in windows
    )


def times_overlap(start_a: time, end_a: time, start_b: time, end_b: time) -> bool:
    return start_a < end_b and end_a > start_b


def has_booking_conflict(
    bookings: Iterable[dict[str, Any]], start_time: time, end_time: time
) -> bool:
    return any(
        booking.get("status") in ACTIVE_BOOKING_STATUSES
        and times_overlap(start_time, end_time, parse_time(booking["start_time"]), parse_time(booking["end_time"]))
        for booking in bookings
    )
