import {
  CalendarDays,
  DollarSign,
  MapPin,
  Plus,
  Star,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function OwnerDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-500">
              OWNER DASHBOARD
            </p>

            <h1 className="mt-1 text-3xl font-extrabold">
              Your parking spaces
            </h1>
          </div>

          <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600">
            <Plus className="h-4 w-4" />
            Add Parking Space
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={<DollarSign />}
            value="$184"
            label="Total earnings"
          />

          <Metric
            icon={<CalendarDays />}
            value="23"
            label="Bookings"
          />

          <Metric
            icon={<Star />}
            value="4.8"
            label="Average rating"
          />

          <Metric
            icon={<MapPin />}
            value="1"
            label="Active space"
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>USYD Driveway</CardTitle>

              <Badge className="bg-emerald-100 text-emerald-700">
                Available
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 md:grid-cols-[180px_1fr_auto] md:items-center">
              <div className="h-32 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300" />

              <div>
                <p className="font-semibold">
                  12 Arundel Street, Glebe
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Available Monday to Friday
                </p>

                <p className="text-sm text-slate-500">
                  9:00 AM - 4:00 PM
                </p>

                <p className="mt-3 font-bold">
                  $8/day
                </p>
              </div>

              <Button variant="outline">
                Edit Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
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
