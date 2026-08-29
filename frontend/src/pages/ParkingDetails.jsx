import { useNavigate, useParams } from "react-router-dom"
import {
  BadgeCheck,
  Camera,
  Clock,
  Lightbulb,
  MapPin,
  Star,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"
import { parkingSpots } from "@/data/mockParking"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ParkingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const parking = parkingSpots.find(
    (spot) => spot.id === Number(id)
  )

  if (!parking) {
    return <div>Parking space not found.</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
          <section>
            <div className="h-80 rounded-3xl bg-gradient-to-br from-slate-200 to-slate-400 md:h-[430px]" />

            <div className="mt-8">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                {parking.tag}
              </Badge>

              <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
                {parking.title}
              </h1>

              <div className="mt-2 flex items-center gap-2 text-slate-500">
                <MapPin className="h-4 w-4" />
                {parking.address}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Info
                  icon={<Star />}
                  title={`${parking.rating}/5`}
                  text={`${parking.reviews} reviews`}
                />

                <Info
                  icon={<Clock />}
                  title={parking.available}
                  text="Available today"
                />

                <Info
                  icon={<Lightbulb />}
                  title={parking.lighting ? "Well-lit" : "Limited lighting"}
                  text="Lighting"
                />

                <Info
                  icon={<Camera />}
                  title={parking.cctv ? "CCTV available" : "No CCTV"}
                  text="Security"
                />
              </div>

              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-bold">
                  Owner
                </h2>

                <div className="mt-3 flex items-center gap-2">
                  <span className="font-semibold">
                    {parking.owner}
                  </span>

                  {parking.verified && (
                    <BadgeCheck className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
              </div>
            </div>
          </section>

          <Card className="h-fit lg:sticky lg:top-6">
            <CardContent className="space-y-5 p-6">
              <div>
                <span className="text-3xl font-extrabold">
                  ${parking.price}
                </span>

                <span className="text-slate-500">
                  /day
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between py-2">
                  <span>Date</span>
                  <strong>29 Aug 2026</strong>
                </div>

                <div className="flex justify-between py-2">
                  <span>Time</span>
                  <strong>9:00 AM - 4:00 PM</strong>
                </div>

                <div className="flex justify-between border-t py-3">
                  <span>Total</span>
                  <strong>${parking.price}.00</strong>
                </div>
              </div>

              <Button
                className="h-14 w-full rounded-2xl bg-emerald-500 text-base font-bold hover:bg-emerald-600"
                onClick={() => navigate("/dashboard")}
              >
                Book Now
              </Button>

              <p className="text-center text-xs text-slate-400">
                Stripe test payment will be connected here.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function Info({ icon, title, text }) {
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
