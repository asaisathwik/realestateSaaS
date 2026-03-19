"use client";

import { useState } from "react";
import { AdminLoginForm } from "@/components/login/AdminLoginForm";
import { EmployeeLoginForm } from "@/components/login/EmployeeLoginForm";
import { OwnerSignupForm } from "@/components/login/OwnerSignupForm";

type OwnerMode = "login" | "signup";

export default function LoginPage() {
  const [ownerMode, setOwnerMode] = useState<OwnerMode>("login");

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-10 -top-10 -z-10 h-40 rounded-[3rem] bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 blur-3xl" />

        <div className="relative grid w-full overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-2">
          {/* Owner side */}
          <section className="border-b border-slate-200/80 bg-slate-50/95 px-6 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:border-slate-200/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Owner space
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-800">
                  Manage your layouts with clarity
                </h1>
              </div>
              <div className="hidden items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 sm:flex">
                PlotFlow
              </div>
            </div>

            <p className="mt-4 text-xs leading-6 text-slate-500">
              Create or access your owner account to configure layouts, onboard
              employees, and keep bookings organized in one workspace.
            </p>

            <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-slate-100/80 p-1 text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setOwnerMode("login")}
                className={`flex-1 rounded-full px-3 py-1.5 transition ${
                  ownerMode === "login"
                    ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Owner login
              </button>
              <button
                type="button"
                onClick={() => setOwnerMode("signup")}
                className={`flex-1 rounded-full px-3 py-1.5 transition ${
                  ownerMode === "signup"
                    ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Owner sign up
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm sm:p-5">
              {ownerMode === "login" ? (
                <AdminLoginForm />
              ) : (
                <OwnerSignupForm />
              )}
            </div>
          </section>

          {/* Employee side */}
          <section className="bg-white px-6 py-8 text-slate-800 sm:px-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Employee access
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-800">
                Sign in to your workspace
              </h2>
              <p className="text-xs text-slate-500">
                Use your assigned company and mobile number to access layouts,
                plots, and customers shared with you.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm sm:p-5">
              <EmployeeLoginForm />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

