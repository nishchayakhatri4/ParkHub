import { Search as SearchIcon } from "lucide-react"

import AppHeader from "@/components/AppHeader"
import ParkingCard from "@/components/ParkingCard"
import { parkingSpots } from "@/data/mockParking"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Search() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Parking near University of Sydney
          </h1>

          <p className="mt-2 text-slate-500">
            Showing the top 5 spaces based on price, distance,
            availability and ratings.
          </p>
        </div>

        <div className="mb-8 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_160px_160px_auto]">
          <Input
            defaultValue="University of Sydney"
            placeholder="Destination"
          />

          <Input type="date" />

          <Input
            type="number"
            placeholder="Radius (km)"
            defaultValue="2"
          />

          <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600">
            <SearchIcon className="h-4 w-4" />
            Search
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {parkingSpots.map((parking) => (
            <ParkingCard
              key={parking.id}
              parking={parking}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
