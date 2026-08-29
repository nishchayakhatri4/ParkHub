import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  DollarSign,
  Loader2,
  MapPin,
  Star,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"
import AppFooter from "@/components/AppFooter"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function OwnerDashboard() {
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadDashboard()
    // Fetch once when the dashboard mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!dashboard || !window.location.hash) {
      return
    }

    const id = window.location.hash.slice(1)
    const element = document.getElementById(id)

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [dashboard])

  async function loadDashboard() {
    const token = localStorage.getItem("access_token")

    if (!token) {
      navigate("/")
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `${API_URL}/users/me/owner-dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Could not load owner dashboard."
        )
      }

      setDashboard(data)
    } catch (err) {
      console.error("Owner dashboard error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Could not load owner dashboard."
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />

        <div id="main-content" role="status" aria-live="polite" className="flex min-h-[65vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="sr-only">Loading owner dashboard</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-700">
            OWNER DASHBOARD
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            Your parking business
          </h1>

          {dashboard && (
            <p className="mt-2 text-sm text-slate-500">
              Weekly figures for{" "}
              {formatDate(dashboard.week_start)} to{" "}
              {formatDate(dashboard.week_end)}
            </p>
          )}
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {dashboard && (
          <>
            <section
              id="earnings"
              className="scroll-mt-24"
            >
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Earnings
              </h2>

              <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  icon={<DollarSign />}
                  value={`$${Number(
                    dashboard.weekly_earnings
                  ).toFixed(2)}`}
                  label="Earnings this week"
                />

                <Metric
                  icon={<CalendarDays />}
                  value={dashboard.weekly_bookings}
                  label="Paid bookings this week"
                />

                <Metric
                  icon={<Star />}
                  value={Number(
                    dashboard.average_rating
                  ).toFixed(1)}
                  label="Average rating"
                />

                <Metric
                  icon={<MapPin />}
                  value={dashboard.active_spaces}
                  label="Active spaces"
                />
              </div>
            </section>

            <section
              id="spaces"
              className="scroll-mt-24"
            >
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                My Spaces
              </h2>

              {dashboard.garages.length === 0 ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <MapPin className="mx-auto h-8 w-8 text-emerald-500" />

                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                      No parking spaces yet
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Your listed garages and driveways will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {dashboard.garages.map((garage) => (
                    <GarageCard
                      key={garage.parking_id}
                      garage={garage}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  )
}

function GarageCard({ garage }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle>
              {garage.parking_name}
            </CardTitle>

            <p className="mt-1 text-sm text-slate-500">
              {garage.parking_id}
            </p>
          </div>

          <Badge
            className={
              garage.is_open
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }
          >
            {garage.is_open ? "Available" : "Closed"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              <MapPin className="h-4 w-4 text-emerald-500" />
              {garage.address}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {garage.location}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <GarageStat
                label="Rate"
                value={`$${Number(
                  garage.hourly_rate
                ).toFixed(2)}/hr`}
              />

              <GarageStat
                label="Bookings this week"
                value={garage.weekly_bookings}
              />

              <GarageStat
                label="Earned this week"
                value={`$${Number(
                  garage.weekly_earnings
                ).toFixed(2)}`}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-6 py-5 text-center">
            <Star className="mx-auto h-5 w-5 text-emerald-500" />

            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {Number(garage.score).toFixed(1)}
            </p>

            <p className="text-xs text-slate-500">
              Rating
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ icon, value, label }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-emerald-500">
          {icon}
        </div>

        <p className="mt-4 text-3xl font-extrabold">
          {value}
        </p>

        <p className="text-sm text-slate-500">
          {label}
        </p>
      </CardContent>
    </Card>
  )
}

function GarageStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-900">
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
    }
  ).format(
    new Date(`${value}T00:00:00`)
  )
}
