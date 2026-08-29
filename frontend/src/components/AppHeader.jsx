import { Link, useNavigate } from "react-router-dom"
import { LogOut, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function AppHeader() {
  const navigate = useNavigate()

  let currentUser = null

  try {
    currentUser = JSON.parse(
      localStorage.getItem("user")
    )
  } catch {
    currentUser = null
  }

  const isOwner = currentUser?.role === "owner"

  const homePath = isOwner ? "/owner" : "/home"

  function handleSignOut() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")

    navigate("/")
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to={homePath}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
            <MapPin className="h-5 w-5 text-white" />
          </div>

          <span className="text-xl font-extrabold text-slate-900">
            ParkHub
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {isOwner ? (
            <>
              <Link
                to="/owner"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Dashboard
              </Link>

              <Link
                to="/owner#spaces"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                My Spaces
              </Link>

              <Link
                to="/owner#earnings"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Earnings
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/home"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Home
              </Link>

              <Link
                to="/search"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Find Parking
              </Link>

              <Link
                to="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                My Bookings
              </Link>
            </>
          )}
        </nav>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  )
}