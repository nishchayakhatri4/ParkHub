from datetime import date, datetime, time
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


BookingStatus = Literal[
    "pending",
    "confirmed",
    "checked_in",
    "completed",
    "cancelled",
]

Money = Annotated[
    Decimal,
    Field(max_digits=10, decimal_places=2),
]


class BookingCreate(BaseModel):
    parking_id: str
    booking_date: date
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def validate_times(self) -> "BookingCreate":
        if self.start_time >= self.end_time:
            raise ValueError("end_time must be after start_time")

        return self


class BookingResponse(BaseModel):
    id: UUID
    user_id: UUID
    parking_id: str
    booking_date: date
    start_time: time
    end_time: time
    total_price: Money
    status: BookingStatus
    checked_in_at: datetime | None = None
    checked_out_at: datetime | None = None
    created_at: datetime
    parking_space: dict | None = None