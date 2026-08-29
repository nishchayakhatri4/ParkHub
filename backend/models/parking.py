from datetime import datetime, time
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


ParkingLocation = Literal[
    "Newtown",
    "Sydney CBD",
    "Parramatta",
    "Bondi",
    "Manly",
]


class AvailabilityWindow(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def validate_times(self) -> "AvailabilityWindow":
        if self.start_time >= self.end_time:
            raise ValueError("end_time must be after start_time")

        return self


class ParkingCreate(BaseModel):
    parking_name: str = Field(min_length=2, max_length=120)
    location: ParkingLocation
    address: str = Field(min_length=5, max_length=250)

    hourly_rate: Decimal = Field(
        gt=0,
        max_digits=10,
        decimal_places=2,
    )

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    has_lighting: bool = False
    has_cctv: bool = False
    is_covered: bool = False
    is_open: bool = True

    availability: list[AvailabilityWindow] = Field(
        default_factory=list
    )


class ParkingUpdate(BaseModel):
    parking_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )

    location: ParkingLocation | None = None

    address: str | None = Field(
        default=None,
        min_length=5,
        max_length=250,
    )

    hourly_rate: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=10,
        decimal_places=2,
    )

    latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    has_lighting: bool | None = None
    has_cctv: bool | None = None
    is_covered: bool | None = None
    is_open: bool | None = None

    availability: list[AvailabilityWindow] | None = None


class OwnerSummary(BaseModel):
    id: UUID
    full_name: str
    verified_owner: bool = False


class ParkingResponse(BaseModel):
    parking_id: str
    owner_id: UUID

    parking_name: str
    location: ParkingLocation
    address: str

    hourly_rate: Decimal
    score: Decimal

    is_open: bool

    latitude: float
    longitude: float

    has_lighting: bool
    has_cctv: bool
    is_covered: bool

    description: str | None = None

    created_at: datetime

    availability: list[AvailabilityWindow] = Field(
        default_factory=list
    )

    owner: OwnerSummary | None = None

    review_count: int = 0


class ParkingSearchResult(ParkingResponse):
    recommendation_score: float
    label: str