from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    booking_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class ReviewResponse(BaseModel):
    id: int
    user_id: UUID
    parking_id: str
    booking_id: UUID
    rating: int
    comment: str | None = None
    created_at: datetime
    reviewer: dict | None = None