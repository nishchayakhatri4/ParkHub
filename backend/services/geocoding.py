from dataclasses import dataclass

import httpx
from fastapi import HTTPException, status

from app.config import get_settings


@dataclass(frozen=True)
class Coordinates:
    latitude: float
    longitude: float
    display_name: str


async def geocode_address(query: str) -> Coordinates:
    settings = get_settings()
    headers = {"User-Agent": settings.nominatim_user_agent}
    params = {"q": query, "format": "jsonv2", "limit": 1, "countrycodes": "au"}
    try:
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            response = await client.get("https://nominatim.openstreetmap.org/search", params=params)
            response.raise_for_status()
            results = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Destination geocoding is temporarily unavailable",
        ) from exc
    if not results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination was not found")
    return Coordinates(
        latitude=float(results[0]["lat"]),
        longitude=float(results[0]["lon"]),
        display_name=results[0]["display_name"],
    )
