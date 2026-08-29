import { Link, useNavigate } from "react-router-dom"
import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Quote,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"
import AppFooter from "@/components/AppFooter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

const AUSTRALIAN_CITIES = [
  "Sydney CBD",
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

const TESTIMONIALS = [
  {
    name: "Amelia T.",
    location: "Sydney",
    rating: 5,
    quote:
      "I found a secure space near the city in minutes. The directions were clear and check-in was completely stress-free.",
  },
  {
    name: "Marcus K.",
    location: "Melbourne",
    rating: 5,
    quote:
      "ParkHub has made commuting so much easier. I can compare spaces, prices and reviews before I leave home.",
  },
  {
    name: "Sophie N.",
    location: "Brisbane",
    rating: 5,
    quote:
      "The space looked exactly like the photos and the owner was helpful. I will definitely use ParkHub again.",
  },
  {
    name: "Liam W.",
    location: "Perth",
    rating: 5,
    quote:
      "Booking private parking before an event saved us so much time. Simple, reliable and great value.",
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main id="main-content">
        <section className="border-b border-slate-200 bg-stone-50">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:py-16">
            <div className="text-left">
              <h1 className="max-w-xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Find parking without the stress.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 md:text-lg">
                Book affordable private parking close to where you actually
                need to be.
              </p>

              <form
                className="mt-8 max-w-xl rounded-2xl border border-slate-200 bg-stone-50 p-3 shadow-sm sm:p-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  navigate("/search")
                }}
              >
                <div className="grid gap-3 xl:grid-cols-[1fr_160px_auto]">
                  <div className="relative">
                    <Label htmlFor="hero-location" className="sr-only">
                      Parking destination
                    </Label>
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" />

                    <Input
                      id="hero-location"
                      className="h-12 border-slate-200 bg-slate-50 pl-12 shadow-none"
                      placeholder="Where are you going?"
                      defaultValue="University of Sydney"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hero-date" className="sr-only">
                      Parking date
                    </Label>
                    <Input
                      id="hero-date"
                      className="h-12 border-slate-200 bg-slate-50 shadow-none"
                      type="date"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="h-12 gap-2 bg-emerald-700 px-5 font-semibold hover:bg-emerald-800"
                  >
                    <Search className="h-4 w-4" />
                    Find Parking
                  </Button>
                </div>
              </form>

              <p className="mt-4 text-sm font-medium text-slate-500">
                No subscription required &middot; Secure booking &middot; Instant confirmation
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
              <img
                src="/banners/hero.png"
                alt="Driver reserving a shared parking space with ParkHub"
                className="aspect-[4/3] h-full w-full object-cover"
                width="1450"
                height="1086"
                fetchPriority="high"
              />
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-stone-50" aria-labelledby="cities-heading">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                Explore Australia
              </p>

              <h2 id="cities-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Find parking in major Australian cities
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Discover convenient private parking near city centres,
                neighbourhoods and popular destinations across Australia.
              </p>
            </div>

            <nav aria-label="Parking locations" className="mt-8 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {AUSTRALIAN_CITIES.map((city) => (
                <Link
                  key={city}
                  to={`/search?location=${encodeURIComponent(city)}`}
                  className="group flex min-h-14 items-center justify-between gap-3 border-b border-stone-200 py-3 text-base font-semibold text-slate-800 transition-colors hover:border-emerald-300 hover:text-emerald-800 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 motion-reduce:transition-none"
                >
                  {city}
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </nav>
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

        <section className="border-t border-slate-200 bg-stone-100" aria-labelledby="testimonials-heading">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                  Park with confidence
                </p>

                <h2 id="testimonials-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  See why drivers love ParkHub
                </h2>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  Realistic demo stories inspired by everyday parking needs across Australia.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Star className="h-5 w-5 fill-amber-400 text-amber-600" aria-hidden="true" />
                5.0  rating reviews
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {TESTIMONIALS.map((testimonial) => (
                <Card key={testimonial.name} className="h-full border-slate-200 shadow-sm">
                  <CardContent className="flex h-full flex-col p-6">
                    <Quote className="h-8 w-8 text-emerald-700" aria-hidden="true" />

                    <div
                      className="mt-5 flex gap-1"
                      role="img"
                      aria-label={`${testimonial.rating} out of 5 stars`}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          aria-hidden="true"
                          className={`h-5 w-5 ${
                            star <= testimonial.rating
                              ? "fill-amber-400 text-amber-600"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>

                    <blockquote className="mt-5 flex-1 text-base leading-7 text-slate-700">
                      “{testimonial.quote}”
                    </blockquote>

                    <div className="mt-6 border-t border-stone-200 pt-4">
                      <p className="font-bold text-slate-900">
                        {testimonial.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Verified booking · {testimonial.location}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
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
