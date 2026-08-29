import { useEffect, useState } from "react"
import {
  Loader2,
  Search as SearchIcon,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"
import AppFooter from "@/components/AppFooter"
import ParkingCard from "@/components/ParkingCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PARKING_IMAGES } from "@/lib/parkingImages"

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

const LOCATIONS = [
  "Newtown",
  "Sydney CBD",
  "Parramatta",
  "Bondi",
  "Manly",
  "Melbourne",
  "Brisbane",
  "Perth",
  "Adelaide",
  "Canberra",
  "Hobart",
  "Darwin",
  "Gold Coast",
  "Newcastle",
  "Wollongong",
  "Geelong",
]

export default function Search() {
  const requestedLocation = new URLSearchParams(
    window.location.search
  ).get("location")

  const [location, setLocation] = useState(
    LOCATIONS.includes(requestedLocation)
      ? requestedLocation
      : "Newtown"
  )
  const [date, setDate] = useState("2026-09-01")
  const [startTime, setStartTime] = useState("14:00")
  const [endTime, setEndTime] = useState("16:00")

  const [parkingSpaces, setParkingSpaces] = useState([])
  const [mapUrl, setMapUrl] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function searchParking() {
    if (!location || !date || !startTime || !endTime) {
      setError("Please complete all search fields.")
      return
    }

    if (endTime <= startTime) {
      setError("End time must be after start time.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams({
        location,
        booking_date: date,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        limit: "5",
      })

      const response = await fetch(
        `${API_URL}/parking/search?${params.toString()}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail || "Could not search for parking."
        )
      }

      setParkingSpaces(data)

      // Use the exact same filters for the Folium map
      setMapUrl(
        `${API_URL}/parking/map?${params.toString()}`
      )
    } catch (err) {
      console.error("Parking search error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Could not search for parking."
      )

      setParkingSpaces([])
      setMapUrl("")
    } finally {
      setLoading(false)
    }
  }

  // Initial search
  useEffect(() => {
    searchParking()
    // Run the default search once; subsequent searches are user initiated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Find parking
          </h1>

          <p className="mt-2 text-slate-500">
            Find available parking based on location,
            price and ratings.
          </p>
        </div>

        {/* Search controls */}
        <div className="mb-8 rounded-2xl border bg-stone-50 p-4">
          <div className="grid gap-4 md:grid-cols-4">

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Location
              </Label>

              <select
                id="location"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                className="
                  flex h-11 w-full
                  rounded-md
                  border border-input
                  bg-background
                  px-3 py-2
                  text-base
                  ring-offset-background
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-ring
                  focus-visible:ring-offset-2
                "
              >
                {LOCATIONS.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">
                Date
              </Label>

              <Input
                id="date"
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
              />
            </div>

            {/* Start time */}
            <div className="space-y-2">
              <Label htmlFor="start-time">
                Start time
              </Label>

              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(event) =>
                  setStartTime(event.target.value)
                }
              />
            </div>

            {/* End time */}
            <div className="space-y-2">
              <Label htmlFor="end-time">
                End time
              </Label>

              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(event) =>
                  setEndTime(event.target.value)
                }
              />
            </div>
          </div>

          <Button
            onClick={searchParking}
            disabled={loading}
            aria-busy={loading}
            className="
              mt-4
              w-full
              gap-2
              bg-emerald-700
              hover:bg-emerald-800
              sm:w-auto
            "
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <SearchIcon className="h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" aria-live="assertive" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results heading */}
        {!loading && !error && (
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Parking in {location}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {parkingSpaces.length} available spaces found
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div role="status" aria-live="polite" className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="sr-only">Searching for available parking</span>
          </div>
        )}

        {/* Results + map */}
        {!loading && !error && (
          <div
            className="
              grid
              gap-6
              lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)]
            "
          >

            {/* Map */}
            <div className="order-1 lg:order-2">
              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  bg-stone-50
                  shadow-sm
                  lg:sticky
                  lg:top-6
                "
              >
                <div className="border-b px-4 py-3">
                  <h2 className="font-bold text-slate-900">
                    Map
                  </h2>

                  <p className="text-xs text-slate-500">
                    Available parking in {location}
                  </p>
                </div>

                {mapUrl ? (
                  <iframe
                    key={mapUrl}
                    src={mapUrl}
                    title={`Parking map for ${location}`}
                    loading="lazy"
                    className="
                      h-[420px]
                      w-full
                      border-0
                      lg:h-[600px]
                    "
                  />
                ) : (
                  <div className="flex h-[420px] items-center justify-center text-sm text-slate-500">
                    Search to view parking on the map.
                  </div>
                )}
              </div>
            </div>

            {/* Parking results */}
            <div className="order-2 lg:order-1">
              {parkingSpaces.length === 0 ? (
                <div className="rounded-2xl border bg-stone-50 p-10 text-center">
                  <p className="font-semibold text-slate-900">
                    No parking spaces found
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Try another location or time.
                  </p>
                </div>
              ) : (
                <div
                  className="
                    grid
                    gap-6
                    sm:grid-cols-2
                    lg:grid-cols-1
                    xl:grid-cols-2
                  "
                >
                  {parkingSpaces.map((parking, index) => (
                    <ParkingCard
                      key={parking.parking_id}
                      parking={parking}
                      imageSrc={PARKING_IMAGES[index % PARKING_IMAGES.length]}
                      imageIndex={index % PARKING_IMAGES.length}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>
      <AppFooter />
    </div>
  )
}
