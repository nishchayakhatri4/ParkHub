from decimal import Decimal, ROUND_HALF_UP

import stripe
from fastapi import APIRouter, HTTPException, Request, status

from app.config import get_settings
from app.dependencies import CurrentUserDep, UserClientDep
from models.payment import CheckoutRequest, CheckoutResponse
from models.user import MessageResponse
from services.supabase import get_supabase_admin


router = APIRouter(prefix="/payments", tags=["Payments"])


def _stripe_ready() -> None:
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured. Add test credentials to backend/.env.",
        )
    stripe.api_key = settings.stripe_secret_key


@router.post("/create-checkout", response_model=CheckoutResponse)
def create_checkout(
    payload: CheckoutRequest, current_user: CurrentUserDep, client: UserClientDep
) -> CheckoutResponse:
    _stripe_ready()
    booking = (
        client.table("bookings").select("*,parking_spaces(title,address)")
        .eq("id", str(payload.booking_id)).single().execute().data
    )
    if not booking or str(booking["user_id"]) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking["status"] != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending bookings can be paid")

    amount_cents = int((Decimal(str(booking["total_price"])) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    settings = get_settings()
    admin = get_supabase_admin()
    try:
        existing = admin.table("payments").select("*").eq("booking_id", str(payload.booking_id)).execute().data or []
        if existing and existing[0]["status"] == "paid":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking is already paid")
        if existing and existing[0]["status"] == "pending":
            previous_session = stripe.checkout.Session.retrieve(existing[0]["stripe_session_id"])
            if previous_session.status == "open" and previous_session.url:
                return CheckoutResponse(checkout_url=previous_session.url, session_id=previous_session.id)
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "aud",
                        "unit_amount": amount_cents,
                        "product_data": {
                            "name": f"ParkHub: {booking['parking_spaces']['title']}",
                            "description": f"{booking['booking_date']} · {booking['start_time']}–{booking['end_time']}",
                        },
                    },
                    "quantity": 1,
                }
            ],
            success_url=f"{settings.frontend_url}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.frontend_url}/parking/{booking['parking_space_id']}?payment=cancelled",
            client_reference_id=str(payload.booking_id),
            metadata={"booking_id": str(payload.booking_id), "user_id": str(current_user.id)},
        )
        admin.table("payments").upsert(
            {
                "booking_id": str(payload.booking_id), "user_id": str(current_user.id),
                "stripe_session_id": session.id, "amount": amount_cents, "currency": "aud", "status": "pending",
            }, on_conflict="booking_id"
        ).execute()
    except HTTPException:
        raise
    except stripe.StripeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Checkout already exists for this booking") from exc
    if not session.url:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Stripe did not return a checkout URL")
    return CheckoutResponse(checkout_url=session.url, session_id=session.id)


@router.post("/webhook", response_model=MessageResponse)
async def stripe_webhook(request: Request) -> MessageResponse:
    settings = get_settings()
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe webhook is not configured")
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    if not signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe signature")
    try:
        event = stripe.Webhook.construct_event(payload, signature, settings.stripe_webhook_secret)
    except (ValueError, stripe.SignatureVerificationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe webhook") from exc

    session = event["data"]["object"]
    session_id = session.get("id")
    admin = get_supabase_admin()
    if event["type"] in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
        if event["type"] == "checkout.session.completed" and session.get("payment_status") != "paid":
            return MessageResponse(message="Webhook acknowledged; payment is processing")
        payment_rows = admin.table("payments").select("*").eq("stripe_session_id", session_id).execute().data or []
        if not payment_rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")
        payment = payment_rows[0]
        admin.table("payments").update({"status": "paid"}).eq("id", payment["id"]).execute()
        admin.table("bookings").update({"status": "confirmed"}).eq("id", payment["booking_id"]).eq("status", "pending").execute()
    elif event["type"] in {"checkout.session.expired", "checkout.session.async_payment_failed"}:
        failed = admin.table("payments").update({"status": "failed"}).eq("stripe_session_id", session_id).execute().data or []
        if failed:
            admin.table("bookings").update({"status": "cancelled"}).eq("id", failed[0]["booking_id"]).eq("status", "pending").execute()
    return MessageResponse(message="Webhook processed")
