import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  BadgeCheck,
  Camera,
  Clock,
  Lightbulb,
  Loader2,
  MapPin,
  Star,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function ParkingDetails() {
  const { parkingId } = useParams()
  const navigate = useNavigate()

  const [parking, setParking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState("")

  const [date, setDate] = useState("2026-09-01")
  const [startTime, setStartTime] = useState("14:00")
  const [endTime, setEndTime] = useState("16:00")

  // ---------------------------------------------------------
  // Load parking space from FastAPI
  // ---------------------------------------------------------
  useEffect(() => {
    async function loadParking() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(
          `${API_URL}/parking/${parkingId}`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data?.detail || "Parking space not found."
          )
        }

        setParking(data)
      } catch (err) {
        console.error("Parking load error:", err)

        setError(
          err instanceof Error
            ? err.message
            : "Parking space not found."
        )
      } finally {
        setLoading(false)
      }
    }

    loadParking()
  }, [parkingId])

  // ---------------------------------------------------------
  // Calculate estimated price for display
  // Backend still calculates the authoritative total
  // ---------------------------------------------------------
  const estimatedTotal = useMemo(() => {
    if (!parking || !startTime || !endTime) {
      return 0
    }

    const [startHour, startMinute] =
      startTime.split(":").map(Number)

    const [endHour, endMinute] =
      endTime.split(":").map(Number)

    const start =
      startHour * 60 + startMinute

    const end =
      endHour * 60 + endMinute

    const minutes = end - start

    if (minutes <= 0) {
      return 0
    }

    const hours = minutes / 60

    return (
      hours * Number(parking.hourly_rate)
    )
  }, [parking, startTime, endTime])

  // ---------------------------------------------------------
  // Create booking
  // ---------------------------------------------------------
  async function handleBooking() {
    const token =
      localStorage.getItem("access_token")

    if (!token) {
      navigate("/")
      return
    }

    if (!date || !startTime || !endTime) {
      setError(
        "Please select a date, start time and end time."
      )
      return
    }

    if (endTime <= startTime) {
      setError(
        "End time must be after start time."
      )
      return
    }

    try {
      setBooking(true)
      setError("")

      const response = await fetch(
        `${API_URL}/bookings`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            parking_id: parkingId,
            booking_date: date,
            start_time: `${startTime}:00`,
            end_time: `${endTime}:00`,
          }),
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        )

        navigate("/")
        return
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Could not create booking."
        )
      }

      // Booking successfully created.
      // Send user to confirmation/payment page.
      navigate(`/payment/${data.id}`)
    } catch (err) {
      console.error(
        "Booking creation error:",
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : "Could not create booking."
      )
    } finally {
      setBooking(false)
    }
  }

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />

          <p className="text-sm text-slate-500">
            Loading parking space...
          </p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------
  // Error
  // ---------------------------------------------------------
  if (!parking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-red-600">
              {error ||
                "Parking space not found."}
            </p>

            <Button
              variant="outline"
              onClick={() =>
                navigate("/search")
              }
            >
              Back to search
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">

          {/* LEFT SIDE */}
          <section>

            {/* Placeholder image */}
            <div className="flex h-80 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-200 to-slate-400 md:h-[430px]">
              <MapPin className="h-16 w-16 text-slate-500" />
            </div>

            <div className="mt-8">

              {/* Open badge */}
              <Badge
                className={
                  parking.is_open
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                    : "bg-red-100 text-red-700 hover:bg-red-100"
                }
              >
                {parking.is_open
                  ? "Available"
                  : "Unavailable"}
              </Badge>

              {/* Parking name */}
              <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
                {parking.parking_name}
              </h1>

              {/* Address */}
              <div className="mt-2 flex items-center gap-2 text-slate-500">
                <MapPin className="h-4 w-4" />

                <span>
                  {parking.address}
                </span>
              </div>

              <p className="mt-2 text-sm font-medium text-slate-500">
                {parking.location}
              </p>

              {/* Information */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <Info
                  icon={<Star />}
                  title={`${parking.score}/5`}
                  text={`${parking.review_count} reviews`}
                />

                <Info
                  icon={<Clock />}
                  title={
                    parking.is_open
                      ? "Open"
                      : "Closed"
                  }
                  text="Parking availability"
                />

                <Info
                  icon={<Lightbulb />}
                  title={
                    parking.has_lighting
                      ? "Well-lit"
                      : "Limited lighting"
                  }
                  text="Lighting"
                />

                <Info
                  icon={<Camera />}
                  title={
                    parking.has_cctv
                      ? "CCTV available"
                      : "No CCTV"
                  }
                  text="Security"
                />
              </div>

              {/* Description */}
              {parking.description && (
                <div className="mt-8 border-t pt-6">
                  <h2 className="text-lg font-bold text-slate-900">
                    About this space
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {parking.description}
                  </p>
                </div>
              )}

              {/* Owner */}
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-bold">
                  Owner
                </h2>

                <div className="mt-3 flex items-center gap-2">
                  <span className="font-semibold">
                    {parking.owner?.full_name ||
                      "ParkHub Owner"}
                  </span>

                  {parking.owner
                    ?.verified_owner && (
                    <BadgeCheck className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT SIDE */}
          <Card className="h-fit lg:sticky lg:top-6">
            <CardContent className="space-y-5 p-6">

              {/* Price */}
              <div>
                <span className="text-3xl font-extrabold text-slate-900">
                  $
                  {Number(
                    parking.hourly_rate
                  ).toFixed(2)}
                </span>

                <span className="text-slate-500">
                  /hour
                </span>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="booking-date">
                  Date
                </Label>

                <Input
                  id="booking-date"
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(
                      event.target.value
                    )
                  }
                />
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-2">
                  <Label htmlFor="start-time">
                    Start
                  </Label>

                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(event) =>
                      setStartTime(
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">
                    End
                  </Label>

                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(event) =>
                      setEndTime(
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* Price calculation */}
              <div className="rounded-xl bg-slate-50 p-4 text-sm">

                <div className="flex justify-between py-2">
                  <span className="text-slate-500">
                    Hourly rate
                  </span>

                  <strong>
                    $
                    {Number(
                      parking.hourly_rate
                    ).toFixed(2)}
                  </strong>
                </div>

                <div className="flex justify-between border-t py-3">
                  <span className="font-semibold">
                    Estimated total
                  </span>

                  <strong className="text-lg">
                    $
                    {estimatedTotal.toFixed(
                      2
                    )}
                  </strong>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Book */}
              <Button
                disabled={
                  booking ||
                  !parking.is_open
                }
                onClick={handleBooking}
                className="h-14 w-full rounded-2xl bg-emerald-500 text-base font-bold hover:bg-emerald-600"
              >
                {booking ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating booking...
                  </>
                ) : (
                  "Book Now"
                )}
              </Button>

              <p className="text-center text-xs text-slate-400">
                You will review your booking
                before continuing to payment.
              </p>

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function Info({
  icon,
  title,
  text,
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4">

      <div className="text-emerald-500">
        {icon}
      </div>

      <div>
        <p className="font-semibold">
          {title}
        </p>

        <p className="text-xs text-slate-500">
          {text}
        </p>
      </div>
    </div>
  )
}
