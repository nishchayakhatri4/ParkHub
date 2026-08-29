from datetime import date, time
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies import OwnerDep, UserClientDep
from models.parking import ParkingCreate, ParkingResponse, ParkingSearchResult, ParkingUpdate
from services.search import SPACE_SELECT, hydrate_space, search_parking
from services.supabase import get_supabase_admin


router = APIRouter(prefix="/parking", tags=["Parking"])


def _serialize(data: dict) -> dict:
    return {
        key: (str(value) if key == "price_per_day" else value)
        for key, value in data.items()
    }


def _availability_rows(space_id: str, windows: list) -> list[dict]:
    return [
        {
            "parking_space_id": space_id,
            "day_of_week": window.day_of_week,
            "start_time": window.start_time.isoformat(),
            "end_time": window.end_time.isoformat(),
        }
        for window in windows
    ]


def _get_space(client, space_id: UUID | str) -> dict:
    try:
        row = client.table("parking_spaces").select(SPACE_SELECT).eq("id", str(space_id)).single().execute().data
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking space not found") from exc
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking space not found")
    return hydrate_space(row)


@router.get("/search", response_model=list[ParkingSearchResult])
async def search(
    destination: Annotated[str, Query(min_length=3, max_length=200)],
    booking_date: date,
    start_time: time,
    end_time: time,
    radius_km: Annotated[float, Query(gt=0, le=50)] = 2,
    limit: Annotated[int, Query(ge=1, le=20)] = 5,
) -> list[dict]:
    if start_time >= end_time:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="end_time must be after start_time")
    return await search_parking(
        get_supabase_admin(), destination, booking_date, start_time, end_time, radius_km, limit
    )


@router.get("", response_model=list[ParkingResponse])
def list_parking(
    owner_id: UUID | None = None,
    active_only: bool = True,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[dict]:
    query = get_supabase_admin().table("parking_spaces").select(SPACE_SELECT)
    if owner_id:
        query = query.eq("owner_id", str(owner_id))
    if active_only:
        query = query.eq("active", True)
    return [hydrate_space(row) for row in (query.limit(limit).execute().data or [])]


@router.get("/{space_id}", response_model=ParkingResponse)
def get_parking(space_id: UUID) -> dict:
    return _get_space(get_supabase_admin(), space_id)


@router.post("", response_model=ParkingResponse, status_code=status.HTTP_201_CREATED)
def create_parking(payload: ParkingCreate, owner: OwnerDep, client: UserClientDep) -> dict:
    parking_data = _serialize(payload.model_dump(exclude={"availability"}))
    parking_data["owner_id"] = str(owner.id)
    try:
        inserted = client.table("parking_spaces").insert(parking_data).execute().data
        if not inserted:
            raise ValueError("No parking space returned")
        space_id = inserted[0]["id"]
        client.table("parking_availability").insert(_availability_rows(space_id, payload.availability)).execute()
    except Exception as exc:
        if "space_id" in locals():
            client.table("parking_spaces").delete().eq("id", space_id).execute()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _get_space(client, space_id)


@router.put("/{space_id}", response_model=ParkingResponse)
def update_parking(space_id: UUID, payload: ParkingUpdate, owner: OwnerDep, client: UserClientDep) -> dict:
    existing = _get_space(client, space_id)
    if str(existing["owner_id"]) != str(owner.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this parking space")
    updates = _serialize(payload.model_dump(exclude_none=True, exclude={"availability"}))
    try:
        if updates:
            client.table("parking_spaces").update(updates).eq("id", str(space_id)).execute()
        if payload.availability is not None:
            client.table("parking_availability").delete().eq("parking_space_id", str(space_id)).execute()
            client.table("parking_availability").insert(_availability_rows(str(space_id), payload.availability)).execute()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _get_space(client, space_id)


@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parking(space_id: UUID, owner: OwnerDep, client: UserClientDep) -> None:
    existing = _get_space(client, space_id)
    if str(existing["owner_id"]) != str(owner.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this parking space")
    try:
        result = client.table("parking_spaces").delete().eq("id", str(space_id)).execute().data
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Parking spaces with bookings cannot be deleted; deactivate the listing instead",
        ) from exc
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking space not found")
