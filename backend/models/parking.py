from datetime import datetime, time
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


class AvailabilityWindow(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def validate_times(self) -> "AvailabilityWindow":
        if self.start_time >= self.end_time:
            raise ValueError("end_time must be after start_time")
        return self


class ParkingBase(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    address: str = Field(min_length=5, max_length=250)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    description: str = Field(default="", max_length=2000)
    price_per_day: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    lighting: bool = False
    cctv: bool = False
    covered: bool = False
    active: bool = True
    availability: list[AvailabilityWindow] = Field(min_length=1)

    @field_validator("availability")
    @classmethod
    def unique_windows(cls, windows: list[AvailabilityWindow]) -> list[AvailabilityWindow]:
        seen: set[tuple[int, time, time]] = set()
        for window in windows:
            key = (window.day_of_week, window.start_time, window.end_time)
            if key in seen:
                raise ValueError("Duplicate availability window")
            seen.add(key)
        return windows


class ParkingCreate(ParkingBase):
    pass


class ParkingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=120)
    address: str | None = Field(default=None, min_length=5, max_length=250)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    description: str | None = Field(default=None, max_length=2000)
    price_per_day: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    lighting: bool | None = None
    cctv: bool | None = None
    covered: bool | None = None
    active: bool | None = None
    availability: list[AvailabilityWindow] | None = Field(default=None, min_length=1)


class OwnerSummary(BaseModel):
    id: UUID
    full_name: str
    verified_owner: bool


class ParkingResponse(BaseModel):
    id: UUID
    owner_id: UUID
    title: str
    address: str
    latitude: float
    longitude: float
    description: str
    price_per_day: Decimal
    lighting: bool
    cctv: bool
    covered: bool
    active: bool
    created_at: datetime
    availability: list[AvailabilityWindow] = Field(default_factory=list)
    owner: OwnerSummary | None = None
    average_rating: float = 0
    review_count: int = 0


class ParkingSearchResult(ParkingResponse):
    distance_km: float
    recommendation_score: float
    label: str
