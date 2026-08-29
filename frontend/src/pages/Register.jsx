import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Car,
  Home,
  Lock,
  Mail,
  MapPin,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function Register() {
  const navigate = useNavigate()
  const [role, setRole] = useState("driver")

  function handleSubmit(event) {
    event.preventDefault()

    if (role === "owner") {
      navigate("/owner/dashboard")
    } else {
      navigate("/home")
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 md:flex md:items-center md:justify-center md:p-8">
      <div className="w-full bg-white md:grid md:max-w-5xl md:grid-cols-2 md:overflow-hidden md:rounded-3xl md:border md:shadow-xl">
        <section className="flex flex-col items-center justify-center bg-slate-900 px-6 py-12 text-center md:min-h-[720px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-emerald-500">
            <MapPin className="h-8 w-8 text-white" />
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-white">
            Join ParkHub
          </h1>

          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Find affordable parking or earn money from your unused space.
          </p>
        </section>

        <section className="px-6 py-10 md:px-12">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-md space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Create your account
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                First, tell us how you plan to use ParkHub.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card
                onClick={() => setRole("driver")}
                className={`cursor-pointer ${
                  role === "driver"
                    ? "border-emerald-500 bg-emerald-50"
                    : ""
                }`}
              >
                <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                  <Car className="h-7 w-7 text-emerald-500" />
                  <strong>Driver</strong>
                  <span className="text-xs text-slate-500">
                    I need parking
                  </span>
                </CardContent>
              </Card>

              <Card
                onClick={() => setRole("owner")}
                className={`cursor-pointer ${
                  role === "owner"
                    ? "border-emerald-500 bg-emerald-50"
                    : ""
                }`}
              >
                <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                  <Home className="h-7 w-7 text-emerald-500" />
                  <strong>Owner</strong>
                  <span className="text-xs text-slate-500">
                    I have a space
                  </span>
                </CardContent>
              </Card>
            </div>

            <FormField
              label="Full Name"
              icon={<User />}
              type="text"
              placeholder="Alex Mercer"
            />

            <FormField
              label="Email Address"
              icon={<Mail />}
              type="email"
              placeholder="alex@example.com"
            />

            <FormField
              label="Password"
              icon={<Lock />}
              type="password"
              placeholder="Create a password"
            />

            <Button
              type="submit"
              className="h-14 w-full rounded-2xl bg-emerald-500 font-bold hover:bg-emerald-600"
            >
              Create Account
            </Button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="font-bold text-emerald-500"
              >
                Sign in
              </button>
            </p>
          </form>
        </section>
      </div>
    </main>
  )
}

function FormField({ label, icon, ...props }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="relative">
        <span className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>

        <Input
          {...props}
          className="h-[52px] rounded-xl bg-slate-50 pl-12"
          required
        />
      </div>
    </div>
  )
}
