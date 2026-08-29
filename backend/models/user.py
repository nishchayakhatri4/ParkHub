from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserProfile(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: Literal["user", "owner"]

    # Kept for frontend compatibility.
    verified_owner: bool = False

    license_plate: str | None = None
    car_model: str | None = None

    created_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=3,
        max_length=100,
    )


class OwnerGarageSummary(BaseModel):
    parking_id: str
    parking_name: str
    location: str
    address: str
    hourly_rate: Decimal
    score: Decimal
    is_open: bool
    weekly_bookings: int
    weekly_earnings: Decimal


class OwnerDashboardResponse(BaseModel):
    week_start: date
    week_end: date
    weekly_earnings: Decimal
    weekly_bookings: int
    average_rating: float
    active_spaces: int
    garages: list[OwnerGarageSummary]


class MessageResponse(BaseModel):
    message: str
