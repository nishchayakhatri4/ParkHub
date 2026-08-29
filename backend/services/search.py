from collections import defaultdict
from datetime import date, time
from typing import Any

from supabase import Client

from services.availability import has_booking_conflict, is_within_availability
from services.geocoding import geocode_address
from services.ranking import haversine_km, rank_spaces


SPACE_SELECT = (
    "*,parking_availability(day_of_week,start_time,end_time),"
    "profiles!parking_spaces_owner_id_fkey(id,full_name,verified_owner),reviews(rating)"
)


def hydrate_space(row: dict[str, Any]) -> dict[str, Any]:
    reviews = row.pop("reviews", []) or []
    ratings = [int(review["rating"]) for review in reviews]
    row["average_rating"] = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
    row["review_count"] = len(ratings)
    row["availability"] = row.pop("parking_availability", []) or []
    row["owner"] = row.pop("profiles", None)
    return row


async def search_parking(
    client: Client,
    destination: str,
    booking_date: date,
    start_time: time,
    end_time: time,
    radius_km: float,
    limit: int = 5,
) -> list[dict[str, Any]]:
    coordinates = await geocode_address(destination)
    rows = client.table("parking_spaces").select(SPACE_SELECT).eq("active", True).execute().data or []
    candidates: list[dict[str, Any]] = []
    for raw_row in rows:
        space = hydrate_space(raw_row)
        distance = haversine_km(coordinates.latitude, coordinates.longitude, space["latitude"], space["longitude"])
        if distance <= radius_km and is_within_availability(space["availability"], booking_date, start_time, end_time):
            space["distance_km"] = round(distance, 2)
            candidates.append(space)

    if not candidates:
        return []
    ids = [space["id"] for space in candidates]
    booking_rows = (
        client.table("bookings").select("parking_space_id,start_time,end_time,status")
        .in_("parking_space_id", ids).eq("booking_date", booking_date.isoformat())
        .in_("status", ["pending", "confirmed", "checked_in"]).execute().data or []
    )
    bookings_by_space: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for booking in booking_rows:
        bookings_by_space[booking["parking_space_id"]].append(booking)
    available = [
        space for space in candidates
        if not has_booking_conflict(bookings_by_space[space["id"]], start_time, end_time)
    ]
    return rank_spaces(available)[:limit]
