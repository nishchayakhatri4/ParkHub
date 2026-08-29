from decimal import Decimal, ROUND_HALF_UP

import stripe
from fastapi import APIRouter, HTTPException, Request, status
from psycopg.rows import dict_row

from app.config import get_settings
from app.dependencies import CurrentUserDep, UserClientDep
from models.payment import CheckoutRequest, CheckoutResponse, VerifySessionRequest
from models.user import MessageResponse
from services.supabase import get_connection


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


def _stripe_ready() -> None:
    settings = get_settings()

    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Stripe is not configured. "
                "Add test credentials to backend/.env."
            ),
        )

    stripe.api_key = settings.stripe_secret_key


@router.post(
    "/create-checkout",
    response_model=CheckoutResponse,
)
def create_checkout(
    payload: CheckoutRequest,
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> CheckoutResponse:

    _stripe_ready()

    with client.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select
                b.id,
                b.user_id,
                b.parking_id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.total_price,
                b.status,
                g.parking_name,
                g.address
            from public.bookings b
            join public.garages g
                on g.parking_id = b.parking_id
            where b.id = %s
            """,
            (payload.booking_id,),
        )

        booking = cur.fetchone()

    if (
        booking is None
        or booking["user_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if booking["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending bookings can be paid",
        )

    total_price = Decimal(
        str(booking["total_price"])
    )

    amount_cents = int(
        (total_price * 100).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )
    )

    settings = get_settings()

    # Check whether this booking already has a payment.
    with client.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select
                id,
                stripe_session_id,
                status
            from public.payments
            where booking_id = %s
            order by created_at desc
            limit 1
            """,
            (payload.booking_id,),
        )

        existing_payment = cur.fetchone()

    if existing_payment:
        if existing_payment["status"] == "paid":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Booking is already paid",
            )

        if (
            existing_payment["status"] == "pending"
            and existing_payment["stripe_session_id"]
        ):
            try:
                previous_session = (
                    stripe.checkout.Session.retrieve(
                        existing_payment[
                            "stripe_session_id"
                        ]
                    )
                )

                if (
                    previous_session.status == "open"
                    and previous_session.url
                ):
                    return CheckoutResponse(
                        checkout_url=previous_session.url,
                        session_id=previous_session.id,
                    )

            except stripe.StripeError:
                # If the previous Stripe session cannot
                # be reused, create a new one below.
                pass

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "aud",
                        "unit_amount": amount_cents,
                        "product_data": {
                            "name": (
                                "ParkHub: "
                                f"{booking['parking_name']}"
                            ),
                            "description": (
                                f"{booking['booking_date']} "
                                f"· {booking['start_time']}"
                                f"–{booking['end_time']}"
                            ),
                        },
                    },
                    "quantity": 1,
                }
            ],
            success_url=(
                f"{settings.frontend_url}"
                f"/check-in/{booking['id']}"
                "?payment=success"
                "&session_id="
                "{CHECKOUT_SESSION_ID}"
            ),
            cancel_url=(
                f"{settings.frontend_url}"
                f"/parking/{booking['parking_id']}"
                "?payment=cancelled"
            ),
            client_reference_id=str(
                payload.booking_id
            ),
            metadata={
                "booking_id": str(
                    payload.booking_id
                ),
                "user_id": str(
                    current_user.id
                ),
            },
        )

    except stripe.StripeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    if not session.url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Stripe did not return "
                "a checkout URL"
            ),
        )

    # Store amount in AUD, not cents.
    with client.cursor() as cur:
        if existing_payment:
            cur.execute(
                """
                update public.payments
                set
                    stripe_session_id = %s,
                    amount = %s,
                    currency = 'aud',
                    status = 'pending'
                where id = %s
                """,
                (
                    session.id,
                    total_price,
                    existing_payment["id"],
                ),
            )

        else:
            cur.execute(
                """
                insert into public.payments (
                    booking_id,
                    user_id,
                    stripe_session_id,
                    amount,
                    currency,
                    status
                )
                values (
                    %s,
                    %s,
                    %s,
                    %s,
                    'aud',
                    'pending'
                )
                """,
                (
                    payload.booking_id,
                    current_user.id,
                    session.id,
                    total_price,
                ),
            )

    return CheckoutResponse(
        checkout_url=session.url,
        session_id=session.id,
    )


@router.post(
    "/verify-session",
    response_model=MessageResponse,
)
def verify_checkout_session(
    payload: VerifySessionRequest,
    current_user: CurrentUserDep,
    client: UserClientDep,
) -> MessageResponse:
    """
    Verify a completed Stripe Checkout session directly with Stripe.

    This is useful for the local hackathon demo where Stripe webhooks
    cannot be forwarded from the teammate-owned Stripe sandbox account.
    The endpoint does not trust the frontend redirect alone. It retrieves
    the Checkout Session from Stripe using the server-side secret key and
    only confirms the booking when Stripe reports that payment was paid.
    """

    _stripe_ready()

    try:
        session = stripe.checkout.Session.retrieve(
            payload.session_id
        )
        session_data = session.to_dict()
    except stripe.StripeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not verify Stripe checkout session",
        ) from exc

    if session_data.get("payment_status") != "paid":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Stripe payment has not been completed",
        )

    with client.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select
                id,
                booking_id,
                user_id,
                status
            from public.payments
            where stripe_session_id = %s
            """,
            (payload.session_id,),
        )

        payment = cur.fetchone()

        if (
            payment is None
            or payment["user_id"] != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found",
            )

        client_reference_id = session_data.get(
            "client_reference_id"
        )

        if (
            client_reference_id
            and client_reference_id
            != str(payment["booking_id"])
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Stripe session does not match booking",
            )

        payment_intent = session_data.get(
            "payment_intent"
        )

        cur.execute(
            """
            update public.payments
            set
                status = 'paid',
                stripe_payment_intent_id = %s
            where
                id = %s
                and user_id = %s
            """,
            (
                payment_intent,
                payment["id"],
                current_user.id,
            ),
        )

        cur.execute(
            """
            update public.bookings
            set status = 'confirmed'
            where
                id = %s
                and user_id = %s
                and status = 'pending'
            """,
            (
                payment["booking_id"],
                current_user.id,
            ),
        )

    return MessageResponse(
        message="Payment verified and booking confirmed"
    )


@router.post(
    "/webhook",
    response_model=MessageResponse,
)
async def stripe_webhook(
    request: Request,
) -> MessageResponse:

    settings = get_settings()

    if not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhook is not configured",
        )

    payload = await request.body()

    signature = request.headers.get(
        "stripe-signature"
    )

    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature",
        )

    try:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            settings.stripe_webhook_secret,
        )

    except (
        ValueError,
        stripe.SignatureVerificationError,
    ) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook",
        ) from exc

    session = event["data"]["object"]

    if hasattr(session, "to_dict"):
        session_data = session.to_dict()
    else:
        session_data = session

    session_id = session_data.get("id")

    with get_connection() as conn:
        with conn.cursor(
            row_factory=dict_row
        ) as cur:

            if event["type"] in {
                "checkout.session.completed",
                "checkout.session.async_payment_succeeded",
            }:

                if (
                    event["type"]
                    == "checkout.session.completed"
                    and session_data.get(
                        "payment_status"
                    )
                    != "paid"
                ):
                    return MessageResponse(
                        message=(
                            "Webhook acknowledged; "
                            "payment is processing"
                        )
                    )

                cur.execute(
                    """
                    select
                        id,
                        booking_id
                    from public.payments
                    where stripe_session_id = %s
                    """,
                    (session_id,),
                )

                payment = cur.fetchone()

                if payment is None:
                    raise HTTPException(
                        status_code=
                            status.HTTP_404_NOT_FOUND,
                        detail=(
                            "Payment record "
                            "not found"
                        ),
                    )

                payment_intent = session_data.get(
                    "payment_intent"
                )

                cur.execute(
                    """
                    update public.payments
                    set
                        status = 'paid',
                        stripe_payment_intent_id = %s
                    where id = %s
                    """,
                    (
                        payment_intent,
                        payment["id"],
                    ),
                )

                cur.execute(
                    """
                    update public.bookings
                    set status = 'confirmed'
                    where
                        id = %s
                        and status = 'pending'
                    """,
                    (
                        payment["booking_id"],
                    ),
                )

            elif event["type"] in {
                "checkout.session.expired",
                "checkout.session.async_payment_failed",
            }:

                cur.execute(
                    """
                    update public.payments
                    set status = 'failed'
                    where stripe_session_id = %s
                    returning booking_id
                    """,
                    (session_id,),
                )

                failed_payment = cur.fetchone()

                if failed_payment:
                    cur.execute(
                        """
                        update public.bookings
                        set status = 'cancelled'
                        where
                            id = %s
                            and status = 'pending'
                        """,
                        (
                            failed_payment[
                                "booking_id"
                            ],
                        ),
                    )

    return MessageResponse(
        message="Webhook processed"
    )