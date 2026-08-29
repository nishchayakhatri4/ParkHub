from fastapi import APIRouter, HTTPException, status
from psycopg.errors import UniqueViolation
from psycopg.rows import dict_row

from app.dependencies import CurrentUserDep, UserClientDep
from models.review import ReviewCreate, ReviewResponse
from services.supabase import get_connection


router = APIRouter(
    prefix="/parking",
    tags=["Reviews"],
)


def _get_review(
    conn,
    review_id: int,
) -> dict | None:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select
                r.id,
                r.user_id,
                r.parking_id,
                r.booking_id,
                r.rating,
                r.comment,
                r.created_at,
                a.first_name,
                a.last_name
            from public.reviews r
            join public.accounts a
                on a.id = r.user_id
            where r.id = %s
            """,
            (review_id,),
        )

        row = cur.fetchone()

    if row is None:
        return None

    first_name = row.pop("first_name")
    last_name = row.pop("last_name")

    row["reviewer"] = {
        "id": row["user_id"],
        "full_name": f"{first_name} {last_name}",
    }

    return row


@router.get(
    "/{parking_id}/reviews",
    response_model=list[ReviewResponse],
)
def list_reviews(
    parking_id: str,
) -> list[dict]:

    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                select
                    r.id,
                    r.user_id,
                    r.parking_id,
                    r.booking_id,
                    r.rating,
                    r.comment,
                    r.created_at,
                    a.first_name,
                    a.last_name
                from public.reviews r
                join public.accounts a
                    on a.id = r.user_id
                where r.parking_id = %s
                order by r.created_at desc
                """,
                (
                    parking_id.upper().strip(),
                ),
            )

            rows = cur.fetchall()

    reviews = []

    for row in rows:
        first_name = row.pop("first_name")
        last_name = row.pop("last_name")

        row["reviewer"] = {
            "id": row["user_id"],
            "full_name": (
                f"{first_name} {last_name}"
            ),
        }

        reviews.append(row)

    return reviews


@router.post(
    "/{parking_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    parking_id: str,
    payload: ReviewCreate,
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> dict:

    parking_id = parking_id.upper().strip()

    with client.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select
                id,
                user_id,
                parking_id,
                status
            from public.bookings
            where id = %s
            """,
            (payload.booking_id,),
        )

        booking = cur.fetchone()

    if (
        booking is None
        or booking["user_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This booking does not belong to you",
        )

    if (
        booking["parking_id"] != parking_id
        or booking["status"] != "completed"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "A completed booking for this "
                "parking space is required"
            ),
        )

    try:
        with client.cursor() as cur:
            cur.execute(
                """
                insert into public.reviews (
                    user_id,
                    parking_id,
                    booking_id,
                    rating,
                    comment
                )
                values (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                returning id
                """,
                (
                    current_user.id,
                    parking_id,
                    payload.booking_id,
                    payload.rating,
                    payload.comment,
                ),
            )

            review_id = cur.fetchone()[0]

    except UniqueViolation as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This booking has already "
                "been reviewed"
            ),
        ) from exc

    review = _get_review(
        client,
        review_id,
    )

    if review is None:
        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Review was created but could not be loaded",
        )

    return review