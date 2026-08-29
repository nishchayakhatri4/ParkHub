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
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:py-16">
            <div className="text-left">
              <p className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                Parking made simple
              </p>

              <h1 className="mt-5 max-w-xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Find parking without the stress.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 md:text-lg">
                Book affordable private parking close to where you actually
                need to be.
              </p>

              <div className="mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                <div className="grid gap-3 xl:grid-cols-[1fr_160px_auto]">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <Input
                      className="h-12 border-slate-200 bg-slate-50 pl-12 shadow-none"
                      placeholder="Where are you going?"
                      defaultValue="University of Sydney"
                    />
                  </div>

                  <Input
                    className="h-12 border-slate-200 bg-slate-50 shadow-none"
                    type="date"
                  />

                  <Button
                    onClick={() => navigate("/search")}
                    className="h-12 gap-2 bg-emerald-600 px-5 font-semibold hover:bg-emerald-700"
                  >
                    <Search className="h-4 w-4" />
                    Find Parking
                  </Button>
                </div>
              </div>

              <p className="mt-4 text-xs font-medium text-slate-400">
                No subscription required &middot; Secure booking &middot; Instant confirmation
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
              <img
                src="/banners/hero.png"
                alt="Driver reserving a shared parking space with ParkHub"
                className="aspect-[4/3] h-full w-full object-cover"
              />
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
