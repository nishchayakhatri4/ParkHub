import { useNavigate } from "react-router-dom"

import BrandLogo from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <BrandLogo className="mx-auto mb-8 h-auto w-full max-w-[220px] object-contain" />

        <p className="text-sm font-bold text-emerald-500">
          404
        </p>

        <h1 className="mt-2 text-4xl font-extrabold text-slate-900">
          Page not found
        </h1>

        <p className="mt-3 text-slate-500">
          The ParkHub page you requested does not exist.
        </p>

        <Button
          onClick={() => navigate("/home")}
          className="mt-6 bg-emerald-500 hover:bg-emerald-600"
        >
          Return Home
        </Button>
      </div>
    </main>
  )
}
