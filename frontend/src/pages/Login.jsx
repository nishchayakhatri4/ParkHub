import { MapPin, Mail, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function Login() {
  return (
    <main className="min-h-screen bg-slate-100 md:flex md:items-center md:justify-center md:p-8">
      <div
        className="
          min-h-screen w-full overflow-hidden bg-white
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
        flex flex-col items-center
        bg-slate-900
        px-6
        pb-12
        pt-12
        text-center
        md:justify-center
        md:p-12
      "
    >
      <div
        className="
          flex h-16 w-16
          items-center justify-center
          rounded-[20px]
          bg-emerald-500
        "
      >
        <MapPin className="h-8 w-8 text-white" strokeWidth={2.3} />
      </div>

      <h1 className="mt-4 text-[28px] font-extrabold text-white">
        ParkHub
      </h1>

      <p className="mt-1 text-[13px] font-medium text-slate-400">
        Park smart. Save time. Stress less.
      </p>

      <div className="mt-10 hidden max-w-xs md:block">
        <p className="text-sm leading-6 text-slate-400">
          Find convenient private parking near your destination
          and book it in seconds.
        </p>
      </div>
    </section>
  )
}

function LoginForm() {
  return (
    <form className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-[13px] font-semibold text-slate-600"
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
              defaultValue="alex.mercer@mobility.com"
              className="
                h-[52px]
                rounded-xl
                border-slate-200
                bg-slate-50
                pl-12
                text-[15px]
                text-slate-900
                shadow-none
                focus-visible:ring-emerald-500
              "
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-[13px] font-semibold text-slate-600"
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
              defaultValue="password"
              className="
                h-[52px]
                rounded-xl
                border-slate-200
                bg-slate-50
                pl-12
                text-[15px]
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
            className="h-auto p-0 text-[13px] font-semibold text-emerald-500"
          >
            Forgot Password?
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        className="
          h-14
          w-full
          rounded-2xl
          bg-emerald-500
          text-base
          font-bold
          hover:bg-emerald-600
        "
      >
        Sign In
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />

        <span className="text-xs font-medium text-slate-400">
          or continue with
        </span>

        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-[52px] rounded-xl font-semibold"
        >
          <GoogleIcon />
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-[52px] rounded-xl font-semibold"
        >
          <AppleIcon />
          Apple
        </Button>
      </div>

      <div className="flex justify-center gap-1 text-sm">
        <span className="text-slate-600">
          Don&apos;t have an account?
        </span>

        <Button
          type="button"
          variant="link"
          className="
            h-auto
            p-0
            text-sm
            font-bold
            text-emerald-500
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
    <div
      className="
        mr-1 flex h-5 w-5
        items-center justify-center
        rounded-full
        border-2 border-slate-900
        text-[10px]
        font-bold
      "
    >
      G
    </div>
  )
}

function AppleIcon() {
  return (
    <span className="mr-1 text-xl leading-none">
      ●
    </span>
  )
}

