import { OwnerSignupForm } from "@/components/login/OwnerSignupForm";
import Link from "next/link";

export default function OwnerSignupPage() {
  return (
    <div className="flex min-h-screen bg-white text-neutral-950">
      <div className="mx-auto flex w/full max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <section className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              PlotFlow
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">
              Set up your owner account
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-neutral-600">
              Create a PlotFlow owner profile to manage layouts, plots,
              customers, and bookings for your real estate projects from one
              dashboard.
            </p>

            <div className="mt-10 grid max-w-md gap-4">
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-neutral-800">
                  Built for real estate owners
                </p>
                <p className="mt-2 text-sm text-neutral-600">
                  Capture key company details once and reuse them across layouts
                  and sales workflows.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-700">
                  Centralize project information
                </div>
                <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-700">
                  Onboard your team with clarity
                </div>
              </div>
            </div>
          </section>

          <section className="flex justify-center">
            <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl sm:p-8">
              <div className="mb-6 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Owner signup
                </p>
                <h2 className="text-xl font-semibold text-black">
                  Create your PlotFlow owner account
                </h2>
                <p className="text-xs text-neutral-500">
                  Basic details only. You can add more information later from
                  your dashboard.
                </p>
              </div>

              <OwnerSignupForm />

              <p className="mt-4 text-center text-xs text-neutral-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-neutral-800 underline-offset-4 hover:underline"
                >
                  Log in instead
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

