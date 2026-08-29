from datetime import date, time
from html import escape
from typing import Annotated
from urllib.parse import quote
from uuid import UUID

import folium
from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    status,
)
from fastapi.responses import HTMLResponse
from psycopg import Connection

from app.config import get_settings
from app.dependencies import (
    OwnerDep,
    UserClientDep,
)
from models.parking import (
    ParkingCreate,
    ParkingLocation,
    ParkingResponse,
    ParkingSearchResult,
    ParkingUpdate,
)
from services.search import (
    get_parking_space,
    list_parking_spaces,
    search_parking,
)
from services.supabase import get_connection

router = APIRouter(
    prefix="/parking",
    tags=["Parking"],
)

settings = get_settings()

LOCATION_CENTERS = {
    "Newtown": (-33.8970, 151.1790),
    "Sydney CBD": (-33.8731, 151.2065),
    "Parramatta": (-33.8150, 151.0030),
    "Bondi": (-33.8915, 151.2740),
    "Manly": (-33.7975, 151.2860),
}


def _get_space(
    conn: Connection,
    parking_id: str,
) -> dict:

    space = get_parking_space(
        conn,
        parking_id,
    )

    if space is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking space not found",
        )

    return space


@router.get(
    "/search",
    response_model=list[ParkingSearchResult],
)
def search(
    location: ParkingLocation,
    booking_date: date,
    start_time: time,
    end_time: time,
    limit: Annotated[
        int,
        Query(ge=1, le=20),
    ] = 5,
) -> list[dict]:

    if start_time >= end_time:
        raise HTTPException(
            status_code=
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "end_time must be after "
                "start_time"
            ),
        )

    with get_connection() as conn:
        return search_parking(
            conn=conn,
            location=location,
            booking_date=booking_date,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
        )

@router.get(
    "/map",
    response_class=HTMLResponse,
)
def parking_map(
    location: ParkingLocation,
    booking_date: date,
    start_time: time,
    end_time: time,
    limit: Annotated[
        int,
        Query(ge=1, le=20),
    ] = 5,
) -> HTMLResponse:

    if start_time >= end_time:
        raise HTTPException(
            status_code=
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_time must be after start_time",
        )

    with get_connection() as conn:
        spaces = search_parking(
            conn=conn,
            location=location,
            booking_date=booking_date,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
        )

    # Use actual marker positions to centre the map.
    # If no spaces are found, fall back to the preset
    # centre of the selected area.
    if spaces:
        centre_lat = sum(
            space["latitude"]
            for space in spaces
        ) / len(spaces)

        centre_lon = sum(
            space["longitude"]
            for space in spaces
        ) / len(spaces)

        map_centre = (
            centre_lat,
            centre_lon,
        )
    else:
        map_centre = LOCATION_CENTERS[location]

    parking_map = folium.Map(
        location=map_centre,
        zoom_start=15,
        control_scale=True,
    )

    marker_locations = []

    for space in spaces:
        latitude = space["latitude"]
        longitude = space["longitude"]

        marker_locations.append(
            [latitude, longitude]
        )

        parking_name = escape(
            str(space["parking_name"])
        )

        address = escape(
            str(space["address"])
        )

        parking_id = escape(
            str(space["parking_id"])
        )

        label = escape(
            str(space.get("label", "Available"))
        )

        price = float(
            space["hourly_rate"]
        )

        rating = float(
            space["score"]
        )

        frontend_url = str(
            settings.frontend_url
        ).rstrip("/")

        detail_url = (
            f"{frontend_url}/parking/"
            f"{quote(str(space['parking_id']))}"
        )

        detail_url = escape(
            detail_url,
            quote=True,
        )

        popup_html = f"""
        <div style="
            min-width: 220px;
            font-family: Arial, sans-serif;
        ">
            <div style="
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 4px;
                color: #0f172a;
            ">
                {parking_name}
            </div>

            <div style="
                color: #64748b;
                font-size: 12px;
                margin-bottom: 8px;
            ">
                {parking_id}
            </div>

            <div style="
                font-size: 13px;
                margin-bottom: 6px;
                color: #475569;
            ">
                {address}
            </div>

            <div style="
                margin-top: 8px;
                font-size: 14px;
                color: #0f172a;
            ">
                <strong>${price:.2f}/hr</strong>
            </div>

            <div style="
                margin-top: 4px;
                font-size: 13px;
                color: #475569;
            ">
                ★ {rating:.1f}/5
            </div>

            <div style="
                display: inline-block;
                margin-top: 8px;
                padding: 4px 8px;
                border-radius: 999px;
                background: #d1fae5;
                color: #047857;
                font-size: 11px;
                font-weight: 600;
            ">
                {label}
            </div>

            <div style="
                margin-top: 12px;
            ">
                <a
                    href="{detail_url}"
                    target="_parent"
                    style="
                        display: block;
                        width: 100%;
                        box-sizing: border-box;
                        padding: 9px 12px;
                        border-radius: 8px;
                        background: #10b981;
                        color: white;
                        text-align: center;
                        text-decoration: none;
                        font-size: 13px;
                        font-weight: 700;
                    "
                >
                    View Space
                </a>
            </div>
        </div>
        """

        folium.Marker(
            location=[
                latitude,
                longitude,
            ],
            tooltip=parking_name,
            popup=folium.Popup(
                popup_html,
                max_width=300,
            ),
        ).add_to(parking_map)

    # Automatically frame all returned garages.
    if len(marker_locations) > 1:
        parking_map.fit_bounds(
            marker_locations,
            padding=(30, 30),
        )

    html = parking_map.get_root().render()

    return HTMLResponse(
        content=html,
        status_code=200,
    )


@router.get(
    "",
    response_model=list[ParkingResponse],
)
def list_parking(
    owner_id: UUID | None = None,
    active_only: bool = True,
    limit: Annotated[
        int,
        Query(ge=1, le=100),
    ] = 50,
) -> list[dict]:

    with get_connection() as conn:
        return list_parking_spaces(
            conn=conn,
            owner_id=owner_id,
            active_only=active_only,
            limit=limit,
        )


@router.get(
    "/{parking_id}",
    response_model=ParkingResponse,
)
def get_parking(
    parking_id: str,
) -> dict:

    with get_connection() as conn:
        return _get_space(
            conn,
            parking_id,
        )


@router.post(
    "",
    response_model=ParkingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_parking(
    payload: ParkingCreate,
    owner: OwnerDep,
    client: UserClientDep,
) -> dict:

    with client.cursor() as cur:
        try:
            # Prevent two owners generating
            # the same PARK-XXX ID.
            cur.execute(
                """
                select pg_advisory_xact_lock(
                    8712401
                )
                """
            )

            cur.execute(
                """
                select
                    coalesce(
                        max(
                            substring(
                                parking_id
                                from 6
                            )::integer
                        ),
                        0
                    )
                from public.garages
                """
            )

            next_number = (
                cur.fetchone()[0] + 1
            )

            parking_id = (
                f"PARK-{next_number:03d}"
            )

            cur.execute(
                """
                insert into public.garages (
                    parking_id,
                    owner_id,
                    parking_name,
                    location,
                    address,
                    hourly_rate,
                    is_open,
                    latitude,
                    longitude,
                    has_lighting,
                    has_cctv,
                    is_covered,
                    description
                )
                values (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    parking_id,
                    owner.id,
                    payload.parking_name,
                    payload.location,
                    payload.address,
                    payload.hourly_rate,
                    payload.is_open,
                    payload.latitude,
                    payload.longitude,
                    payload.has_lighting,
                    payload.has_cctv,
                    payload.is_covered,
                    payload.description,
                ),
            )

            if payload.availability:
                cur.executemany(
                    """
                    insert into
                        public.garage_availability (
                            parking_id,
                            day_of_week,
                            start_time,
                            end_time
                        )
                    values (
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    """,
                    [
                        (
                            parking_id,
                            window.day_of_week,
                            window.start_time,
                            window.end_time,
                        )
                        for window
                        in payload.availability
                    ],
                )

        except Exception as exc:
            raise HTTPException(
                status_code=
                    status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            ) from exc

    return _get_space(
        client,
        parking_id,
    )


@router.put(
    "/{parking_id}",
    response_model=ParkingResponse,
)
def update_parking(
    parking_id: str,
    payload: ParkingUpdate,
    owner: OwnerDep,
    client: UserClientDep,
) -> dict:

    existing = _get_space(
        client,
        parking_id,
    )

    if existing["owner_id"] != owner.id:
        raise HTTPException(
            status_code=
                status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not own this "
                "parking space"
            ),
        )

    updates = payload.model_dump(
        exclude_none=True,
        exclude={"availability"},
    )

    with client.cursor() as cur:
        try:
            if updates:
                set_clause = ", ".join(
                    f"{column} = %s"
                    for column
                    in updates.keys()
                )

                values = list(
                    updates.values()
                )

                values.extend(
                    [
                        parking_id,
                        owner.id,
                    ]
                )

                cur.execute(
                    f"""
                    update public.garages
                    set {set_clause}
                    where
                        parking_id = %s
                        and owner_id = %s
                    """,
                    values,
                )

            if (
                payload.availability
                is not None
            ):
                cur.execute(
                    """
                    delete from
                        public.garage_availability
                    where parking_id = %s
                    """,
                    (parking_id,),
                )

                if payload.availability:
                    cur.executemany(
                        """
                        insert into
                            public.garage_availability (
                                parking_id,
                                day_of_week,
                                start_time,
                                end_time
                            )
                        values (
                            %s,
                            %s,
                            %s,
                            %s
                        )
                        """,
                        [
                            (
                                parking_id,
                                window.day_of_week,
                                window.start_time,
                                window.end_time,
                            )
                            for window
                            in payload.availability
                        ],
                    )

        except Exception as exc:
            raise HTTPException(
                status_code=
                    status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            ) from exc

    return _get_space(
        client,
        parking_id,
    )


@router.delete(
    "/{parking_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_parking(
    parking_id: str,
    owner: OwnerDep,
    client: UserClientDep,
) -> None:

    with client.cursor() as cur:
        cur.execute(
            """
            update public.garages
            set is_open = false
            where
                parking_id = %s
                and owner_id = %s
            returning parking_id
            """,
            (
                parking_id.upper().strip(),
                owner.id,
            ),
        )

        deleted = cur.fetchone()

    if deleted is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Parking space not found "
                "or you do not own it"
            ),
        )

    return None