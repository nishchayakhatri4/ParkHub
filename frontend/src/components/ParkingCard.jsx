import { useNavigate } from "react-router-dom"
import {
  BadgeCheck,
  Camera,
  MapPin,
  Star,
} from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ParkingCard({ parking, imageSrc, imageIndex = 0 }) {
  const navigate = useNavigate()
  const parkingImage = parking.image_url || imageSrc

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm transition hover:shadow-md">

      <img
        src={parkingImage}
        alt={`${parking.parking_name} parking space`}
        className="h-40 w-full object-cover"
        loading="lazy"
      />

      <CardContent className="space-y-4 p-5">

        {/* Top information */}
        <div className="flex items-start justify-between gap-3">

          <div>
            {parking.label && (
              <Badge className="mb-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                {parking.label}
              </Badge>
            )}

            <h3 className="font-bold text-slate-900">
              {parking.parking_name}
            </h3>

            <p className="mt-1 text-xs font-medium text-slate-400">
              {parking.parking_id}
            </p>
          </div>

          <span className="whitespace-nowrap text-lg font-extrabold text-slate-900">
            $
            {Number(
              parking.hourly_rate
            ).toFixed(2)}

            <span className="text-xs font-normal text-slate-500">
              /hr
            </span>
          </span>
        </div>

        {/* Parking information */}
        <div className="space-y-2 text-sm text-slate-600">

          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              {parking.address}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-current text-amber-500" />

            <span>
              {parking.score}/5
              {" "}
              ({parking.review_count} reviews)
            </span>
          </div>

          {/* Owner verification */}
          {parking.owner?.verified_owner && (
            <div className="flex items-center gap-2 text-emerald-600">
              <BadgeCheck className="h-4 w-4" />

              Verified owner
            </div>
          )}

          {/* CCTV */}
          {parking.has_cctv && (
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />

              CCTV available
            </div>
          )}

        </div>

        {/* Recommendation score */}
        {parking.recommendation_score !== undefined && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Recommendation score:{" "}
            <strong className="text-slate-700">
              {parking.recommendation_score}
            </strong>
          </div>
        )}

        {/* Details */}
        <Button
          className="w-full bg-emerald-500 hover:bg-emerald-600"
          onClick={() =>
            navigate(
              `/parking/${parking.parking_id}?image=${imageIndex}`,
              { state: { parkingImage } }
            )
          }
        >
          View Space
        </Button>

      </CardContent>
    </Card>
  )
}
