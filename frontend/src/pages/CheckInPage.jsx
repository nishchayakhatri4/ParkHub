import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  LogOut,
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

export default function CheckInPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadBooking()
  }, [bookingId])

  async function loadBooking() {
    const token = localStorage.getItem("access_token")

    if (!token) {
      navigate("/")
      return
    }

    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams(window.location.search)
      const paymentStatus = params.get("payment")
      const sessionId = params.get("session_id")

      if (paymentStatus === "success" && sessionId) {
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
            verifyData?.detail ||
              "Could not verify Stripe payment."
          )
        }

        setMessage(
          "Payment confirmed. Your parking space is ready."
        )

        window.history.replaceState(
          {},
          "",
          `/check-in/${bookingId}`
        )
      }

      await fetchBooking(token)
    } catch (err) {
      console.error("Check-in page error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Could not load booking."
      )
    } finally {
      setLoading(false)
    }
  }

  async function fetchBooking(token) {
    const bookingResponse = await fetch(
      `${API_URL}/bookings/${bookingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const bookingData = await bookingResponse.json()

    if (!bookingResponse.ok) {
      throw new Error(
        bookingData?.detail ||
          "Could not load booking."
      )
    }

    setBooking(bookingData)
  }

  async function changeBookingState(action) {
    const token = localStorage.getItem("access_token")

    if (!token) {
      navigate("/")
      return
    }

    const endpoint =
      action === "check-in"
        ? "check-in"
        : "check-out"

    try {
      setActionLoading(true)
      setError("")
      setMessage("")

      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Could not ${action}.`
        )
      }

      setBooking(data)

      if (action === "check-in") {
        setMessage(
          "You are checked in. Your parking session is active."
        )
      } else {
        setMessage(
          "Check-out complete. Your booking is finished."
        )
      }
    } catch (err) {
      console.error(`${action} error:`, err)

      setError(
        err instanceof Error
          ? err.message
          : `Could not ${action}.`
      )
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />

        <div className="flex min-h-[65vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />

        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="font-semibold text-red-600">
                {error}
              </p>

              <Button
                onClick={() => navigate("/dashboard")}
                className="mt-5"
                variant="outline"
              >
                Back to bookings
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  const parking = booking.parking_space

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-500">
            PARKING SESSION
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            {headingForStatus(booking.status)}
          </h1>

          <p className="mt-2 text-slate-500">
            {descriptionForStatus(booking.status)}
          </p>
        </div>

        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>
                {parking?.parking_name || booking.parking_id}
              </CardTitle>

              <StatusBadge status={booking.status} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-start gap-2 text-sm text-slate-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

              <span>
                {parking?.address || "Address unavailable"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Detail
                icon={<CalendarDays />}
                label="Date"
                value={formatDate(booking.booking_date)}
              />

              <Detail
                icon={<Clock />}
                label="Time"
                value={`${formatTime(
                  booking.start_time
                )} - ${formatTime(
                  booking.end_time
                )}`}
              />
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Amount paid
              </p>

              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                ${Number(booking.total_price).toFixed(2)}
              </p>
            </div>

            {booking.status === "confirmed" && (
              <Button
                onClick={() =>
                  changeBookingState("check-in")
                }
                disabled={actionLoading}
                className="h-14 w-full gap-2 rounded-2xl bg-emerald-500 text-base font-bold hover:bg-emerald-600"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    CHECKING IN...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    CHECK IN
                  </>
                )}
              </Button>
            )}

            {booking.status === "checked_in" && (
              <Button
                onClick={() =>
                  changeBookingState("check-out")
                }
                disabled={actionLoading}
                className="h-14 w-full gap-2 rounded-2xl bg-slate-900 text-base font-bold hover:bg-slate-800"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    CHECKING OUT...
                  </>
                ) : (
                  <>
                    <LogOut className="h-5 w-5" />
                    CHECK OUT
                  </>
                )}
              </Button>
            )}

            {booking.status === "completed" && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

                <p className="mt-3 font-bold text-emerald-800">
                  Parking session completed
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  You have successfully checked out.
                </p>
              </div>
            )}

            {booking.status === "pending" && (
              <p className="text-center text-sm text-amber-600">
                Payment must be confirmed before you can check in.
              </p>
            )}

            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="w-full"
            >
              View all bookings
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending:
      "bg-amber-100 text-amber-700",
    confirmed:
      "bg-emerald-100 text-emerald-700",
    checked_in:
      "bg-blue-100 text-blue-700",
    completed:
      "bg-slate-100 text-slate-700",
    cancelled:
      "bg-red-100 text-red-700",
  }

  return (
    <Badge className={styles[status] || ""}>
      {formatStatus(status)}
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

      <p className="font-semibold text-slate-900">
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

function formatStatus(status) {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    checked_in: "Checked In",
    completed: "Completed",
    cancelled: "Cancelled",
  }

  return labels[status] || status
}

function headingForStatus(status) {
  const headings = {
    pending: "Awaiting payment",
    confirmed: "Check in",
    checked_in: "Parking in progress",
    completed: "Parking complete",
    cancelled: "Booking cancelled",
  }

  return headings[status] || "Booking"
}

function descriptionForStatus(status) {
  const descriptions = {
    pending:
      "Your booking is waiting for payment confirmation.",
    confirmed:
      "Your payment is complete. Check in when you arrive.",
    checked_in:
      "You are checked in. Check out when you leave the space.",
    completed:
      "Your parking session has been completed.",
    cancelled:
      "This booking has been cancelled.",
  }

  return descriptions[status] || ""
}
