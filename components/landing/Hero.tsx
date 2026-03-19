import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const highlights = [
  "Centralize layouts and plots",
  "Manage customers with clarity",
  "Track bookings and payments",
];

export function Hero() {
  return (
    <section id="home" className="border-b border-neutral-200">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm">
            Built for modern real estate teams
          </div>

          <h1 className="mt-8 text-4xl font-semibold tracking-tight text-black sm:text-5xl lg:text-6xl">
            Smart Real Estate Plot Management Software
          </h1>

          <p className="mt-6 text-lg leading-8 text-neutral-600">
            A SaaS platform that helps real estate developers manage layouts,
            plots, customers, and bookings in one place.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Start Free Trial
            </Link>
            <Link
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:text-black"
            >
              Book Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
              >
                <CheckCircle2 className="h-5 w-5 text-black" />
                <span className="text-sm font-medium text-neutral-700">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-neutral-100 to-white blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">
                  Dashboard Overview
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-black">
                  Project Snapshot
                </h2>
              </div>
              <div className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Live
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-neutral-950 p-5 text-white">
                <p className="text-sm text-neutral-300">Active Layouts</p>
                <p className="mt-3 text-3xl font-semibold">24</p>
                <p className="mt-2 text-sm text-neutral-400">
                  Across residential and mixed-use projects
                </p>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-sm text-neutral-500">Plots Available</p>
                <p className="mt-3 text-3xl font-semibold text-black">312</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Filter by size, phase, and status
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">
                    Monthly Bookings
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-black">
                    48 confirmed
                  </p>
                </div>
                <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                  +18%
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {[78, 56, 88, 64].map((width, index) => (
                  <div key={width} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      <span>Phase {index + 1}</span>
                      <span>{width}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-200">
                      <div
                        className="h-2 rounded-full bg-black"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
