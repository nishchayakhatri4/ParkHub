import { useEffect, useState } from "react"
import {
  Loader2,
  Search as SearchIcon,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"
import ParkingCard from "@/components/ParkingCard"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

const LOCATIONS = [
  "Newtown",
  "Sydney CBD",
  "Parramatta",
  "Bondi",
  "Manly",
]

export default function Search() {
  const [location, setLocation] = useState("Newtown")
  const [date, setDate] = useState("2026-09-01")
  const [startTime, setStartTime] = useState("14:00")
  const [endTime, setEndTime] = useState("16:00")

  const [parkingSpaces, setParkingSpaces] = useState([])
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
    } catch (err) {
      console.error("Parking search error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Could not search for parking."
      )

      setParkingSpaces([])
    } finally {
      setLoading(false)
    }
  }

  // Load initial Newtown results
  useEffect(() => {
    searchParking()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

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
        <div className="mb-8 rounded-2xl border bg-white p-4">

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
                  flex h-10 w-full
                  rounded-md
                  border border-input
                  bg-background
                  px-3 py-2
                  text-sm
                  ring-offset-background
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-ring
                  focus-visible:ring-offset-2
                "
              >
                {LOCATIONS.map((item) => (
                  <option key={item} value={item}>
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

            {/* Start */}
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

            {/* End */}
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
            className="
              mt-4
              w-full
              gap-2
              bg-emerald-500
              hover:bg-emerald-600
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
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Results heading */}
        {!loading && !error && (
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Parking in {location}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {parkingSpaces.length} available spaces found
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        )}

        {/* No results */}
        {!loading &&
          !error &&
          parkingSpaces.length === 0 && (
            <div className="rounded-2xl border bg-white p-10 text-center">
              <p className="font-semibold text-slate-900">
                No parking spaces found
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Try another location or time.
              </p>
            </div>
          )}

        {/* Parking cards */}
        {!loading && parkingSpaces.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {parkingSpaces.map((parking) => (
              <ParkingCard
                key={parking.parking_id}
                parking={parking}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
