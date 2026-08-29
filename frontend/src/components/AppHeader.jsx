import { Link, useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"

import BrandLogo from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"

export default function AppHeader() {
  const navigate = useNavigate()

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"))
    } catch {
      return null
    }
  })()

  const isOwner = currentUser?.role === "owner"

  const homePath = isOwner ? "/owner" : "/home"

  function handleSignOut() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")

    navigate("/")
  }

  return (
    <header className="glass-header sticky top-0 z-40 border-b border-slate-200/80">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-stone-50 px-4 py-3 font-semibold text-slate-900 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-emerald-600"
      >
        Skip to main content
      </a>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to={homePath}
          className="flex items-center"
          aria-label="ParkHub home"
        >
          <BrandLogo className="h-10 w-auto object-contain sm:h-12" />
        </Link>

        <nav
          aria-label="Primary navigation"
          className="order-3 flex w-full items-center justify-between gap-1 border-t border-slate-100 pt-3 md:order-none md:w-auto md:justify-center md:gap-2 md:border-0 md:pt-0"
        >
          {isOwner ? (
            <>
              <Link
                to="/owner"
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                Dashboard
              </Link>

              <Link
                to="/owner#spaces"
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                My Spaces
              </Link>

              <Link
                to="/owner#earnings"
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                Earnings
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/home"
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                Home
              </Link>

              <Link
                to="/search"
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                Find Parking
              </Link>

              <Link
                to="/dashboard"
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
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
