from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUserDep, UserClientDep
from models.booking import BookingCreate, BookingResponse
from models.user import MessageResponse


router = APIRouter(prefix="/bookings", tags=["Bookings"])
BOOKING_SELECT = "*,parking_spaces(id,title,address,owner_id,price_per_day)"


def _get_booking(client, booking_id: UUID | str) -> dict:
    try:
        booking = client.table("bookings").select(BOOKING_SELECT).eq("id", str(booking_id)).single().execute().data
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found") from exc
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    booking["parking_space"] = booking.pop("parking_spaces", None)
    return booking


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, current_user: CurrentUserDep, client: UserClientDep) -> dict:
    if current_user.role != "driver":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Driver account required")
    try:
        data = client.rpc(
            "create_pending_booking",
            {
                "p_parking_space_id": str(payload.parking_space_id),
                "p_booking_date": payload.booking_date.isoformat(),
                "p_start_time": payload.start_time.isoformat(),
                "p_end_time": payload.end_time.isoformat(),
            },
        ).execute().data
    except Exception as exc:
        message = str(exc)
        code = status.HTTP_409_CONFLICT if "already booked" in message else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=message) from exc
    booking = data[0] if isinstance(data, list) else data
    return _get_booking(client, booking["id"])


@router.get("/me", response_model=list[BookingResponse])
def list_my_bookings(current_user: CurrentUserDep, client: UserClientDep) -> list[dict]:
    rows = client.table("bookings").select(BOOKING_SELECT).order("booking_date", desc=True).execute().data or []
    for row in rows:
        row["parking_space"] = row.pop("parking_spaces", None)
    return rows


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: UUID, current_user: CurrentUserDep, client: UserClientDep) -> dict:
    return _get_booking(client, booking_id)


def _transition(client, booking_id: UUID, action: str) -> dict:
    try:
        client.rpc("transition_booking", {"p_booking_id": str(booking_id), "p_action": action}).execute()
    except Exception as exc:
        message = str(exc)
        code = status.HTTP_404_NOT_FOUND if "not found" in message.lower() else status.HTTP_409_CONFLICT
        raise HTTPException(status_code=code, detail=message) from exc
    return _get_booking(client, booking_id)


@router.post("/{booking_id}/check-in", response_model=BookingResponse)
def check_in(booking_id: UUID, current_user: CurrentUserDep, client: UserClientDep) -> dict:
    booking = _get_booking(client, booking_id)
    if str(booking["user_id"]) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the driver can check in")
    return _transition(client, booking_id, "check_in")


@router.post("/{booking_id}/check-out", response_model=BookingResponse)
def check_out(booking_id: UUID, current_user: CurrentUserDep, client: UserClientDep) -> dict:
    booking = _get_booking(client, booking_id)
    if str(booking["user_id"]) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the driver can check out")
    return _transition(client, booking_id, "check_out")


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(booking_id: UUID, current_user: CurrentUserDep, client: UserClientDep) -> dict:
    return _transition(client, booking_id, "cancel")
