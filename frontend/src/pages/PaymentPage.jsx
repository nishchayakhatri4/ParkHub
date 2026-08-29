import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooking() {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/bookings/${bookingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Could not load booking");
        }

        const data = await response.json();
        setBooking(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [bookingId, navigate]);

  async function handlePayment() {
    try {
      setPaying(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/payments/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            booking_id: bookingId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not start payment"
        );
      }

      if (!data.checkout_url) {
        throw new Error(
          "Stripe checkout URL was not returned"
        );
      }

      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div id="main-content" role="status" aria-live="polite" className="flex min-h-[65vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          <span className="sr-only">Loading booking details</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div id="main-content" className="flex min-h-[65vh] items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p role="alert" className="text-center text-sm text-red-700">
                {error || "Booking could not be found."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const parking = booking.parking_space;

  const startTime = booking.start_time?.slice(0, 5);
  const endTime = booking.end_time?.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main id="main-content" className="mx-auto w-full max-w-lg px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Confirm your booking
            </h1>
            <p className="text-sm text-slate-500">
              Review your parking details before paying
            </p>
          </div>
        </div>

        {/* Parking card */}
        <Card className="mb-4 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-slate-900">
                  {parking.parking_name}
                </CardTitle>

                <div className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{parking.address}</span>
                </div>
              </div>

              <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                ${parking.hourly_rate}/hr
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Separator className="mb-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-2">
                <CalendarDays className="h-5 w-5 text-emerald-500" />

                <div>
                  <p className="text-xs text-slate-500">
                    Date
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {booking.booking_date}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Clock3 className="h-5 w-5 text-emerald-500" />

                <div>
                  <p className="text-xs text-slate-500">
                    Time
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {startTime} - {endTime}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">
              Price details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Parking
              </span>

              <span className="font-medium text-slate-900">
                ${Number(booking.total_price).toFixed(2)}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">
                Total
              </span>

              <span className="text-xl font-bold text-slate-900">
                ${Number(booking.total_price).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stripe information */}
        <div className="mb-5 flex gap-3 rounded-xl border bg-stone-50 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Secure payment
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              You will be redirected to Stripe to complete
              your payment securely. ParkHub does not store
              your card details.
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Payment button */}
        <Button
          onClick={handlePayment}
          disabled={paying}
          aria-busy={paying}
          className="h-12 w-full bg-emerald-700 text-base font-semibold text-white hover:bg-emerald-800"
        >
          {paying ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Continue to payment
            </>
          )}
        </Button>

        <p className="mt-4 text-center text-sm text-slate-500">
          Booking ID: {booking.id}
        </p>
      </main>
      <AppFooter />
    </div>
  );
}
