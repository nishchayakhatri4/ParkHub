import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function UserDashboard() {
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [paymentMessage, setPaymentMessage] = useState("")

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const token = localStorage.getItem("access_token")

    if (!token) {
      navigate("/")
      return
    }

    try {
      setLoading(true)
      setError("")

      const searchParams = new URLSearchParams(
        window.location.search
      )

      const paymentStatus = searchParams.get("payment")
      const sessionId = searchParams.get("session_id")

      // Stripe redirects here after Checkout succeeds.
      // Do not trust the redirect itself. Ask the backend to
      // retrieve the session from Stripe and verify it was paid.
      if (
        paymentStatus === "success"
        && sessionId
      ) {
        const verifyResponse = await fetch(
          `${API_URL}/payments/verify-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              session_id: sessionId,
            }),
          }
        )

        const verifyData = await verifyResponse.json()

        if (!verifyResponse.ok) {
          throw new Error(
            verifyData?.detail
              || "Could not verify Stripe payment."
          )
        }

        setPaymentMessage(
          "Payment confirmed. Your parking space is ready."
        )

        // Remove Stripe query parameters so refreshing the
        // dashboard does not keep re-running the verification.
        window.history.replaceState(
          {},
          "",
          "/dashboard"
        )
      }

      const bookingsResponse = await fetch(
        `${API_URL}/bookings/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const bookingsData = await bookingsResponse.json()

      if (!bookingsResponse.ok) {
        throw new Error(
          bookingsData?.detail
            || "Could not load your bookings."
        )
      }

      setBookings(bookingsData)
    } catch (err) {
      console.error("Dashboard error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Could not load dashboard."
      )
    } finally {
      setLoading(false)
    }
  }

  const upcomingBooking = useMemo(() => {
    const usable = bookings
      .filter((booking) =>
        ["confirmed", "checked_in", "pending"].includes(
          booking.status
        )
      )
      .sort((a, b) => {
        const aTime = new Date(
          `${a.booking_date}T${a.start_time}`
        ).getTime()

        const bTime = new Date(
          `${b.booking_date}T${b.start_time}`
        ).getTime()

        return aTime - bTime
      })

    return usable[0] || null
  }, [bookings])

  const previousBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        ["completed", "cancelled"].includes(
          booking.status
        )
      ).length,
    [bookings]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />

        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-500">
            DRIVER DASHBOARD
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            Your bookings
          </h1>
        </div>

        {paymentMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {paymentMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Upcoming Booking</CardTitle>

                {upcomingBooking && (
                  <StatusBadge
                    status={upcomingBooking.status}
                  />
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {upcomingBooking ? (
                <>
                  <div>
                    <h2 className="text-xl font-bold">
                      {
                        upcomingBooking.parking_space
                          ?.parking_name
                      }
                    </h2>

                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" />

                      {
                        upcomingBooking.parking_space
                          ?.address
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Detail
                      icon={<CalendarDays />}
                      label="Date"
                      value={formatDate(
                        upcomingBooking.booking_date
                      )}
                    />

                    <Detail
                      icon={<Clock />}
                      label="Time"
                      value={`${formatTime(
                        upcomingBooking.start_time
                      )} - ${formatTime(
                        upcomingBooking.end_time
                      )}`}
                    />
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Total paid
                    </p>

                    <p className="mt-1 text-xl font-extrabold">
                      ${Number(
                        upcomingBooking.total_price
                      ).toFixed(2)}
                    </p>
                  </div>

                  <Button
                    disabled={
                      upcomingBooking.status
                      !== "confirmed"
                    }
                    className="h-14 w-full rounded-2xl bg-emerald-500 font-bold hover:bg-emerald-600"
                  >
                    {upcomingBooking.status === "confirmed"
                      ? "CHECK IN"
                      : upcomingBooking.status === "checked_in"
                        ? "CHECKED IN"
                        : "AWAITING PAYMENT"}
                  </Button>

                  {upcomingBooking.status === "pending" && (
                    <p className="text-center text-xs text-amber-600">
                      This booking has not been confirmed by
                      payment yet.
                    </p>
                  )}
                </>
              ) : (
                <div className="py-10 text-center">
                  <p className="font-semibold text-slate-900">
                    No upcoming bookings
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Search for a parking space to make a booking.
                  </p>

                  <Button
                    onClick={() => navigate("/search")}
                    className="mt-5 bg-emerald-500 hover:bg-emerald-600"
                  >
                    Find parking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <CalendarDays className="h-6 w-6 text-emerald-500" />

                <p className="mt-4 text-3xl font-extrabold">
                  {bookings.length}
                </p>

                <p className="text-sm text-slate-500">
                  Total bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Clock className="h-6 w-6 text-emerald-500" />

                <p className="mt-4 text-3xl font-extrabold">
                  {previousBookings}
                </p>

                <p className="text-sm text-slate-500">
                  Previous bookings
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    confirmed:
      "bg-emerald-100 text-emerald-700",
    checked_in:
      "bg-blue-100 text-blue-700",
    pending:
      "bg-amber-100 text-amber-700",
    completed:
      "bg-slate-100 text-slate-700",
    cancelled:
      "bg-red-100 text-red-700",
  }

  const labels = {
    confirmed: "Confirmed",
    checked_in: "Checked In",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
  }

  return (
    <Badge className={styles[status] || ""}>
      {labels[status] || status}
    </Badge>
  )
}

function Detail({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="mb-2 text-emerald-500">
        {icon}
      </div>

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="font-semibold">
        {value}
      </p>
    </div>
  )
}

function formatDate(value) {
  return new Intl.DateTimeFormat(
    "en-AU",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(`${value}T00:00:00`)
  )
}

function formatTime(value) {
  const [hours, minutes] = value.split(":")
  const date = new Date()

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  )

  return new Intl.DateTimeFormat(
    "en-AU",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date)
}
