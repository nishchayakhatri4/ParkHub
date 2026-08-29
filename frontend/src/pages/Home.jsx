import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main>
        <section className="bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:py-24">
            <p className="font-semibold text-emerald-400">
              Parking made simple
            </p>

            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-6xl">
              Find parking without the stress.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-slate-400">
              Book affordable private parking close to where you actually
              need to be.
            </p>

            <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-white p-4 shadow-xl">
              <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <Input
                    className="h-12 pl-12"
                    placeholder="Where are you going?"
                    defaultValue="University of Sydney"
                  />
                </div>

                <Input
                  className="h-12"
                  type="date"
                />

                <Button
                  onClick={() => navigate("/search")}
                  className="h-12 gap-2 bg-emerald-500 hover:bg-emerald-600"
                >
                  <Search className="h-4 w-4" />
                  Find Parking
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-3">
          <Feature
            icon={<MapPin />}
            title="Nearby spaces"
            text="Find unused private parking close to your destination."
          />

          <Feature
            icon={<ShieldCheck />}
            title="Trusted listings"
            text="Compare verified owners, ratings and safety features."
          />

          <Feature
            icon={<CalendarDays />}
            title="Book by time"
            text="Reserve spaces only for the hours you actually need."
          />
        </section>
      </main>
    </div>
  )
}

function Feature({ icon, title, text }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          {icon}
        </div>

        <h3 className="font-bold text-slate-900">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {text}
        </p>
      </CardContent>
    </Card>
  )
}
