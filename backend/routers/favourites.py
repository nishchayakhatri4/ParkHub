from fastapi import APIRouter, HTTPException, status
from psycopg.errors import ForeignKeyViolation, UniqueViolation
from psycopg.rows import dict_row

from app.dependencies import CurrentUserDep, UserClientDep
from models.user import MessageResponse


router = APIRouter(
    prefix="/favourites",
    tags=["Favourites"],
)


@router.get("")
def list_favourites(
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> list[dict]:

    with client.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select
                f.id,
                f.created_at,

                g.parking_id,
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

                a.id as owner_id,
                a.first_name as owner_first_name,
                a.last_name as owner_last_name

            from public.favourites f

            join public.garages g
                on g.parking_id = f.parking_id

            join public.accounts a
                on a.id = g.owner_id

            where f.user_id = %s

            order by f.created_at desc
            """,
            (current_user.id,),
        )

        rows = cur.fetchall()

    favourites = []

    for row in rows:
        row["owner"] = {
            "id": row.pop("owner_id"),
            "full_name": (
                f"{row.pop('owner_first_name')} "
                f"{row.pop('owner_last_name')}"
            ),
            "verified_owner": False,
        }

        favourites.append(row)

    return favourites


@router.post(
    "/{parking_id}",
    status_code=status.HTTP_201_CREATED,
)
def add_favourite(
    parking_id: str,
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> dict:

    parking_id = parking_id.upper().strip()

    try:
        with client.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                insert into public.favourites (
                    user_id,
                    parking_id
                )
                values (
                    %s,
                    %s
                )
                returning
                    id,
                    user_id,
                    parking_id,
                    created_at
                """,
                (
                    current_user.id,
                    parking_id,
                ),
            )

            favourite = cur.fetchone()

    except UniqueViolation as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Parking space is already "
                "a favourite"
            ),
        ) from exc

    except ForeignKeyViolation as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking space not found",
        ) from exc

    return favourite


@router.delete(
    "/{parking_id}",
    response_model=MessageResponse,
)
def remove_favourite(
    parking_id: str,
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> MessageResponse:

    parking_id = parking_id.upper().strip()

    with client.cursor() as cur:
        cur.execute(
            """
            delete from public.favourites
            where
                user_id = %s
                and parking_id = %s
            returning id
            """,
            (
                current_user.id,
                parking_id,
            ),
        )

        removed = cur.fetchone()

    if removed is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favourite not found",
        )

    return MessageResponse(
        message="Favourite removed",
    )