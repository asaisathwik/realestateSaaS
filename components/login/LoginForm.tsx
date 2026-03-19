"use client";

import { useState } from "react";
import { AdminLoginForm } from "./AdminLoginForm";
import { EmployeeLoginForm } from "./EmployeeLoginForm";

type LoginMode = "owner" | "employee";

const tabs: { id: LoginMode; label: string }[] = [
  { id: "owner", label: "Owner Login" },
  { id: "employee", label: "Employee Login" },
];

export function LoginForm() {
  const [mode, setMode] = useState<LoginMode>("owner");

  return (
    <div className="relative w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-xs font-semibold uppercase tracking-[0.18em] text-white">
          PF
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            PlotFlow
          </p>
          <p className="text-sm font-medium text-neutral-900">
            Smart Real Estate Management Platform
          </p>
        </div>
      </div>

      <div className="flex rounded-full border border-neutral-200 bg-neutral-50 p-1 text-sm font-medium text-neutral-600">
        {tabs.map((tab) => {
          const isActive = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`flex-1 rounded-full px-3 py-2 transition ${
                isActive
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {mode === "owner" ? <AdminLoginForm /> : <EmployeeLoginForm />}
      </div>
    </div>
  );
}

