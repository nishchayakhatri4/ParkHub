import { useNavigate } from "react-router-dom"
import {
  BadgeCheck,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ParkingCard({ parking }) {
  const navigate = useNavigate()

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm transition hover:shadow-md">
      <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300" />

      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge className="mb-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              {parking.tag}
            </Badge>

            <h3 className="font-bold text-slate-900">
              {parking.title}
            </h3>
          </div>

          <span className="whitespace-nowrap text-lg font-extrabold text-slate-900">
            ${parking.price}
            <span className="text-xs font-normal text-slate-500">
              /day
            </span>
          </span>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {parking.distance}
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {parking.available}
          </div>

          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-current text-amber-500" />
            {parking.rating}/5 ({parking.reviews} reviews)
          </div>

          {parking.verified && (
            <div className="flex items-center gap-2 text-emerald-600">
              <BadgeCheck className="h-4 w-4" />
              Verified owner
            </div>
          )}

          {parking.cctv && (
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              CCTV available
            </div>
          )}
        </div>

        <Button
          className="w-full bg-emerald-500 hover:bg-emerald-600"
          onClick={() => navigate(`/parking/${parking.id}`)}
        >
          View Space
        </Button>
      </CardContent>
    </Card>
  )
}
