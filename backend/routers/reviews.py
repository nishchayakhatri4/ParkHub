from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUserDep, UserClientDep
from models.review import ReviewCreate, ReviewResponse
from services.supabase import get_supabase_admin


router = APIRouter(prefix="/parking", tags=["Reviews"])
REVIEW_SELECT = "*,profiles!reviews_user_id_fkey(id,full_name)"


def _hydrate(row: dict) -> dict:
    row["reviewer"] = row.pop("profiles", None)
    return row


@router.get("/{space_id}/reviews", response_model=list[ReviewResponse])
def list_reviews(space_id: UUID) -> list[dict]:
    rows = (
        get_supabase_admin().table("reviews").select(REVIEW_SELECT)
        .eq("parking_space_id", str(space_id)).order("created_at", desc=True).execute().data or []
    )
    return [_hydrate(row) for row in rows]


@router.post("/{space_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    space_id: UUID, payload: ReviewCreate, current_user: CurrentUserDep, client: UserClientDep
) -> dict:
    booking = client.table("bookings").select("*").eq("id", str(payload.booking_id)).single().execute().data
    if not booking or str(booking["user_id"]) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This booking does not belong to you")
    if str(booking["parking_space_id"]) != str(space_id) or booking["status"] != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A completed booking for this space is required")
    try:
        inserted = client.table("reviews").insert(
            {
                "user_id": str(current_user.id), "parking_space_id": str(space_id),
                "booking_id": str(payload.booking_id), "rating": payload.rating, "comment": payload.comment,
            }
        ).execute().data
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This booking has already been reviewed") from exc
    return _hydrate(
        client.table("reviews").select(REVIEW_SELECT).eq("id", inserted[0]["id"]).single().execute().data
    )
