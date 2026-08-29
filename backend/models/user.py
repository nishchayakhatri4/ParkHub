from datetime import datetime
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


class MessageResponse(BaseModel):
    message: str