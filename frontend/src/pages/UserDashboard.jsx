import {
  CalendarDays,
  Clock,
  Heart,
  MapPin,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UserDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-500">
            DRIVER DASHBOARD
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            Welcome back, Alex
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Booking</CardTitle>

                <Badge className="bg-emerald-100 text-emerald-700">
                  Confirmed
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">
                  Secure Driveway near USYD
                </h2>

                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  12 Arundel Street, Glebe
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Detail
                  icon={<CalendarDays />}
                  label="Date"
                  value="29 Aug 2026"
                />

                <Detail
                  icon={<Clock />}
                  label="Time"
                  value="9 AM - 4 PM"
                />
              </div>

              <Button className="h-14 w-full rounded-2xl bg-emerald-500 font-bold hover:bg-emerald-600">
                CHECK IN
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <Heart className="h-6 w-6 text-emerald-500" />

                <p className="mt-4 text-3xl font-extrabold">
                  4
                </p>

                <p className="text-sm text-slate-500">
                  Favourite spaces
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <CalendarDays className="h-6 w-6 text-emerald-500" />

                <p className="mt-4 text-3xl font-extrabold">
                  12
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
