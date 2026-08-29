from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUserDep, UserClientDep
from models.user import MessageResponse


router = APIRouter(prefix="/favourites", tags=["Favourites"])


@router.get("")
def list_favourites(current_user: CurrentUserDep, client: UserClientDep) -> list[dict]:
    return (
        client.table("favourites")
        .select("id,created_at,parking_spaces(*,profiles!parking_spaces_owner_id_fkey(id,full_name,verified_owner))")
        .eq("user_id", str(current_user.id)).order("created_at", desc=True).execute().data or []
    )


@router.post("/{space_id}", status_code=status.HTTP_201_CREATED)
def add_favourite(space_id: UUID, current_user: CurrentUserDep, client: UserClientDep) -> dict:
    try:
        data = client.table("favourites").insert(
            {"user_id": str(current_user.id), "parking_space_id": str(space_id)}
        ).execute().data
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Parking space is already a favourite") from exc
    return data[0]


@router.delete("/{space_id}", response_model=MessageResponse)
def remove_favourite(space_id: UUID, current_user: CurrentUserDep, client: UserClientDep) -> MessageResponse:
    data = (
        client.table("favourites").delete().eq("user_id", str(current_user.id))
        .eq("parking_space_id", str(space_id)).execute().data
    )
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favourite not found")
    return MessageResponse(message="Favourite removed")
