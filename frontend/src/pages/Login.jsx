import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  Loader2,
  Lock,
  Mail,
} from "lucide-react"

import BrandLogo from "@/components/BrandLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function Login() {
  return (
    <main className="min-h-screen bg-slate-100 md:flex md:items-center md:justify-center md:p-8">
      <div
        className="
          min-h-screen w-full overflow-hidden bg-stone-50
          md:min-h-0
          md:max-w-5xl
          md:rounded-3xl
          md:border
          md:shadow-xl
          md:grid
          md:grid-cols-2
        "
      >
        <BrandPanel />

        <section
          className="
            flex flex-col
            px-6
            py-10
            md:justify-center
            md:px-12
            lg:px-16
          "
        >
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 hidden md:block">
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue to ParkHub.
              </p>
            </div>

            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  )
}

function BrandPanel() {
  return (
    <section
      className="
        relative isolate flex min-h-[340px]
        flex-col items-start justify-end
        overflow-hidden
        px-6
        py-10
        text-left
        md:min-h-[680px]
        md:p-12
      "
    >
      <img
        src="/banners/login.png"
        alt="Driver finding nearby parking with ParkHub"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        width="761"
        height="1024"
        fetchPriority="high"
      />

      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/25 to-transparent" />

      <BrandLogo className="h-auto w-full max-w-[210px] rounded-xl object-contain shadow-sm" />

      <p className="mt-5 text-sm font-semibold text-white">
        Park smart. Save time. Stress less.
      </p>

      <div className="mt-3 hidden max-w-sm md:block">
        <p className="text-sm leading-6 text-slate-200">
          Find convenient private parking near your destination
          and book it in seconds.
        </p>
      </div>
    </section>
  )
}

function LoginForm() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [loginMode, setLoginMode] = useState(null)
  const [error, setError] = useState("")

  async function handleSubmit(event) {
    event.preventDefault()

    const requestedMode =
      event.nativeEvent.submitter?.value === "owner"
        ? "owner"
        : "user"

    setLoading(true)
    setLoginMode(requestedMode)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      let data = null

      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to sign in"
        )
      }

      if (!data?.access_token) {
        throw new Error(
          "The server did not return an access token"
        )
      }

      if (requestedMode === "owner" && data.user?.role !== "owner") {
        throw new Error(
          "This account is not registered as a parking owner."
        )
      }

      // Save authentication token
      localStorage.setItem(
        "access_token",
        data.access_token
      )

      // Optional: keep basic user details for frontend display
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        )
      }

      navigate(data.user?.role === "owner" ? "/owner" : "/home")
    } catch (err) {
      console.error("Login error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in"
      )
    } finally {
      setLoading(false)
      setLoginMode(null)
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      aria-busy={loading}
    >
      <div className="space-y-4">

        {/* Email */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-semibold text-slate-700"
          >
            Email Address
          </Label>

          <div className="relative">
            <Mail
              className="
                absolute left-4 top-1/2
                h-5 w-5
                -translate-y-1/2
                text-slate-500
              "
            />

            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="
                h-[52px]
                rounded-xl
                border-slate-200
                bg-slate-50
                pl-12
                text-base
                text-slate-900
                shadow-none
                focus-visible:ring-emerald-500
              "
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-semibold text-slate-700"
          >
            Password
          </Label>

          <div className="relative">
            <Lock
              className="
                absolute left-4 top-1/2
                h-5 w-5
                -translate-y-1/2
                text-slate-500
              "
            />

            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="
                h-[52px]
                rounded-xl
                border-slate-200
                bg-slate-50
                pl-12
                text-base
                text-slate-900
                shadow-none
                focus-visible:ring-emerald-500
              "
            />
          </div>
        </div>

        <div className="text-right">
          <Button
            variant="link"
            type="button"
            className="
              h-auto
              p-0
              text-sm
              font-semibold
              text-emerald-700
            "
          >
            Forgot Password?
          </Button>
        </div>
      </div>

      {/* Login error */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          "
        >
          {error}
        </div>
      )}

      {/* Sign in */}
      <Button
        type="submit"
        name="login-mode"
        value="user"
        disabled={loading}
        className="
          h-14
          w-full
          rounded-2xl
          bg-emerald-700
          text-base
          font-bold
          hover:bg-emerald-800
        "
      >
        {loading && loginMode === "user" ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <Button
        type="submit"
        name="login-mode"
        value="owner"
        variant="outline"
        disabled={loading}
        className="h-14 w-full gap-2 rounded-2xl border-slate-300 bg-stone-50 text-base font-bold text-slate-900 hover:bg-stone-100"
      >
        {loading && loginMode === "owner" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Signing in as owner...
          </>
        ) : (
          <>
            <Building2 className="h-5 w-5" />
            Owner Login
          </>
        )}
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />

        <span className="text-sm font-medium text-slate-500">
          or continue with
        </span>

        <Separator className="flex-1" />
      </div>

      {/* Social sign-in */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-[52px] gap-2 rounded-xl font-semibold"
        >
          <GoogleIcon />
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-[52px] gap-2 rounded-xl font-semibold"
        >
          <AppleIcon />
          Apple
        </Button>
      </div>

      {/* Register */}
      <div className="flex justify-center gap-1 text-sm">
        <span className="text-slate-600">
          Don&apos;t have an account?
        </span>

        <Button
          type="button"
          variant="link"
          onClick={() => navigate("/register")}
          className="
            h-auto
            p-0
            text-sm
            font-bold
            text-emerald-700
          "
        >
          Sign up
        </Button>
      </div>
    </form>
  )
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      className="h-5 w-5 shrink-0"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.715v2.258h2.909c1.702-1.567 2.684-3.875 2.684-6.613Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.468-.806 5.956-2.182l-2.909-2.258c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.585-5.037-3.715H.956v2.332A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.963 10.705A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.168.281-1.705V4.963H.956A9 9 0 0 0 0 9c0 1.452.347 2.826.956 4.037l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.507.454 3.441 1.346l2.581-2.582C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.963l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 384 512"
      className="h-5 w-5 shrink-0 fill-black"
    >
      <path d="M279.55 258.94c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C44.7 131.1 4 158.6 4 214.6c0 16.1 2.9 32.2 8.8 48.2 7.9 22.9 36.4 79.2 66.1 78.3 15.5-.4 26.5-11 46.7-11 19.6 0 29.8 11 47.1 11 29.9-.4 55.6-51.2 63.1-74.2-40.1-18.9-56.3-55.3-56.3-108Zm-23.2-164.4c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 72 26.1 2 49.9-11.4 69.5-34.4Z" />
    </svg>
  )
}
