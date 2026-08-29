import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
  BadgeCheck,
  Camera,
  ChevronDown,
  Clock,
  Lightbulb,
  Loader2,
  MapPin,
  Star,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"
import AppFooter from "@/components/AppFooter"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PARKING_IMAGES } from "@/lib/parkingImages"

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

const DEMO_REVIEWS = [
  {
    name: "Maya L.",
    initials: "ML",
    rating: 5,
    date: "2 weeks ago",
    comment:
      "Easy to find, exactly as described, and plenty of room to park. I would happily book this space again.",
  },
  {
    name: "Daniel R.",
    initials: "DR",
    rating: 4,
    date: "1 month ago",
    comment:
      "A convenient spot in a great location. Entry instructions were clear and the area felt secure.",
  },
  {
    name: "Priya S.",
    initials: "PS",
    rating: 5,
    date: "2 months ago",
    comment:
      "Smooth booking experience and a very tidy parking space. Perfect for an afternoon visit nearby.",
  },
]

export default function ParkingDetails() {
  const { parkingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

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
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
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
            <p role="alert" className="text-red-700">
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

  const requestedImageIndex = Number(
    new URLSearchParams(location.search).get("image")
  )
  const fallbackImage = Number.isInteger(requestedImageIndex) &&
    requestedImageIndex >= 0 &&
    requestedImageIndex < PARKING_IMAGES.length
    ? PARKING_IMAGES[requestedImageIndex]
    : PARKING_IMAGES[0]
  const parkingImage =
    parking.image_url || location.state?.parkingImage || fallbackImage

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">

          {/* LEFT SIDE */}
          <section>

            <img
              src={parkingImage}
              alt={`${parking.parking_name} parking space`}
              className="h-80 w-full rounded-3xl object-cover md:h-[430px]"
              decoding="async"
            />

            <div className="mt-8">

              {/* Open badge */}
              <div className="flex flex-wrap gap-2">
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

                <Badge className="gap-1 border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
                  <BadgeCheck className="h-4 w-4" />
                  Verified
                </Badge>
              </div>

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

              {/* Additional parking information */}
              <section className="mt-8 border-t pt-6" aria-labelledby="parking-info-heading">
                <h2 id="parking-info-heading" className="text-xl font-bold text-slate-900">
                  Things to know
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Review the space policies and access information before booking.
                </p>

                <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-stone-50">
                  <ExpandableInfo title="Cancellation policy">
                    <p>
                      Cancel up to 2 hours before your booking starts for a full refund.
                      Cancellations made later may be charged for the first booked hour.
                      Bookings that have already started are non-refundable.
                    </p>
                  </ExpandableInfo>

                  <ExpandableInfo title="Host details">
                    <p>
                      Hosted by {parking.owner?.full_name || "a verified ParkHub owner"}.
                      The host typically responds within an hour and provides final entry
                      instructions after your booking is confirmed.
                    </p>
                    <div className="mt-3 flex items-center gap-2 font-semibold text-emerald-800">
                      <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                      Verified ParkHub host
                    </div>
                  </ExpandableInfo>

                  <ExpandableInfo title="Accessibility notes">
                    <p>
                      Vehicle access is step-free and suitable for standard passenger cars.
                      Pedestrian access conditions may vary, so contact the host before booking
                      if you need a wider bay or an accessible path to the street.
                    </p>
                  </ExpandableInfo>

                  <ExpandableInfo title="Additional information">
                    <ul className="list-disc space-y-2 pl-5">
                      <li>Enter your vehicle registration before arrival.</li>
                      <li>Park only within the marked bay shown in the arrival instructions.</li>
                      <li>Do not leave personal items or waste in the parking space.</li>
                      <li>Electric vehicle charging is not included unless the host confirms it.</li>
                    </ul>
                  </ExpandableInfo>
                </div>
              </section>

              {/* Demo reviews */}
              <section className="mt-8 border-t pt-6" aria-labelledby="reviews-heading">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 id="reviews-heading" className="text-xl font-bold text-slate-900">
                      Guest reviews
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Feedback from recent ParkHub bookings.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-600" aria-hidden="true" />
                    <span className="font-bold text-slate-900">
                      {Number(parking.score || 4.8).toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-600">
                      ({parking.review_count || DEMO_REVIEWS.length})
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  {DEMO_REVIEWS.map((review) => (
                    <article
                      key={review.name}
                      className="rounded-2xl border border-slate-200 bg-stone-50 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
                            aria-hidden="true"
                          >
                            {review.initials}
                          </div>

                          <div>
                            <h3 className="font-bold text-slate-900">
                              {review.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {review.date}
                            </p>
                          </div>
                        </div>

                        <ReviewStars rating={review.rating} />
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {review.comment}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
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
                <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                aria-busy={booking}
                className="h-14 w-full rounded-2xl bg-emerald-700 text-base font-bold hover:bg-emerald-800"
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

              <p className="text-center text-sm text-slate-500">
                You will review your booking
                before continuing to payment.
              </p>

            </CardContent>
          </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}

function ExpandableInfo({ title, children }) {
  return (
    <details className="group">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          className="h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>

      <div className="px-5 pb-5 text-sm leading-6 text-slate-600">
        {children}
      </div>
    </details>
  )
}

function ReviewStars({ rating }) {
  return (
    <div
      className="flex shrink-0 gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-amber-400 text-amber-600"
              : "text-slate-300"
          }`}
        />
      ))}
    </div>
  )
}

function Info({
  icon,
  title,
  text,
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-stone-50 p-4">

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
