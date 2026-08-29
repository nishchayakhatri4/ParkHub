from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, HttpUrl


class CheckoutRequest(BaseModel):
    booking_id: UUID


class CheckoutResponse(BaseModel):
    checkout_url: HttpUrl
    session_id: str


class VerifySessionRequest(BaseModel):
    session_id: str


class PaymentResponse(BaseModel):
    id: UUID
    booking_id: UUID
    user_id: UUID
    stripe_session_id: str | None = None
    stripe_payment_intent_id: str | None = None
    amount: Decimal
    currency: str
    status: Literal[
        "pending",
        "paid",
        "failed",
        "refunded",
    ]
