import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Car,
  Home,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react"

import BrandLogo from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function Register() {
  const navigate = useNavigate()

  const [role, setRole] = useState("driver")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event) {
    event.preventDefault()

    const trimmedName = fullName.trim()

    if (trimmedName.split(/\s+/).length < 2) {
      setError("Please enter both your first and last name.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: trimmedName,
            email: email.trim(),
            password,
            role: role === "owner" ? "owner" : "user",
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail || "Could not create account."
        )
      }

      localStorage.setItem(
        "access_token",
        data.access_token
      )

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      )

      if (data.user.role === "owner") {
        navigate("/owner")
      } else {
        navigate("/home")
      }
    } catch (err) {
      console.error("Registration error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Could not create account."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 md:flex md:items-center md:justify-center md:p-8">
      <div className="w-full bg-stone-50 md:grid md:max-w-5xl md:grid-cols-2 md:overflow-hidden md:rounded-3xl md:border md:shadow-xl">
        <section className="flex flex-col items-center justify-center bg-slate-900 px-6 py-12 text-center md:min-h-[720px]">
          <BrandLogo className="h-auto w-full max-w-[260px] rounded-xl object-contain" />

          <h1 className="mt-6 text-3xl font-extrabold text-white">
            Join ParkHub
          </h1>

          <p className="mt-2 max-w-sm text-sm text-slate-300">
            Find affordable parking or earn money from your unused space.
          </p>
        </section>

        <section className="px-6 py-10 md:px-12">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-md space-y-6"
            aria-busy={loading}
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Create your account
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                First, tell us how you plan to use ParkHub.
              </p>
            </div>

            <fieldset>
              <legend className="sr-only">Choose how you will use ParkHub</legend>
              <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("driver")}
                aria-pressed={role === "driver"}
                className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/50"
              >
              <Card
                className={`h-full cursor-pointer ${
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
              </button>

              <button
                type="button"
                onClick={() => setRole("owner")}
                aria-pressed={role === "owner"}
                className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/50"
              >
              <Card
                className={`h-full cursor-pointer ${
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
              </button>
              </div>
            </fieldset>

            <FormField
              id="full-name"
              label="Full Name"
              icon={<User />}
              type="text"
              autoComplete="name"
              placeholder="Alex Mercer"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
            />

            <FormField
              id="register-email"
              label="Email Address"
              icon={<Mail />}
              type="email"
              autoComplete="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />

            <FormField
              id="register-password"
              label="Password"
              icon={<Lock />}
              type="password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />

            {error && (
              <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-2xl bg-emerald-700 font-bold hover:bg-emerald-800"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="min-h-11 rounded-md px-2 font-bold text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
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

function FormField({
  id,
  label,
  icon,
  ...props
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <span className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>

        <Input
          id={id}
          {...props}
          className="h-[52px] rounded-xl bg-slate-50 pl-12"
          required
        />
      </div>
    </div>
  )
}
