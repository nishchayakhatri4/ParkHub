import { Link } from "react-router-dom"

import BrandLogo from "@/components/BrandLogo"

export default function AppFooter() {
  const isOwner = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"))?.role === "owner"
    } catch {
      return false
    }
  })()

  const links = isOwner
    ? [
        { label: "Dashboard", to: "/owner" },
        { label: "My Spaces", to: "/owner#spaces" },
        { label: "Earnings", to: "/owner#earnings" },
      ]
    : [
        { label: "Home", to: "/home" },
        { label: "Find Parking", to: "/search" },
        { label: "My Bookings", to: "/dashboard" },
      ]

  return (
    <footer className="mt-auto border-t border-slate-200 bg-stone-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <BrandLogo className="h-9 w-auto object-contain" />
          <p className="mt-3 text-sm text-slate-600">
            Simple, secure parking when and where you need it.
          </p>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-1 sm:gap-2">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} ParkHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
