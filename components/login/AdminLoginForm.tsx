"use client";

import { useState, type FormEvent } from "react";
import { Lock, Phone } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { InputField } from "./InputField";
import { getFirebase } from "@/lib/firebase";
import Link from "next/link";

export function AdminLoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetMobile, setResetMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const mobile = (formData.get("admin-mobile") as string | null)?.trim();
    const password = (formData.get("admin-password") as string | null) ?? "";

    if (!mobile || !password) {
      setError("Please enter mobile number and password.");
      return;
    }

    const { auth } = getFirebase();

    // Assumption: owners are registered in Firebase using a derived email from their mobile number.
    const rawDigits = mobile.replace(/\D/g, "");
    const normalizedMobile =
      rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
    const emailFromMobile = `${normalizedMobile}@owner.plotflow.app`;

    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, emailFromMobile, password);
      router.push("/owner/dashboard");
    } catch {
      setError("Unable to log in. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <InputField
          id="admin-mobile"
          name="admin-mobile"
          type="tel"
          autoComplete="tel"
          label="Mobile Number"
          placeholder="Enter your mobile number"
          icon={<Phone className="h-4 w-4" />}
        />

        <div className="space-y-2">
          <InputField
            id="admin-password"
            name="admin-password"
            type="password"
            autoComplete="current-password"
            label="Password"
            placeholder="Enter your password"
            icon={<Lock className="h-4 w-4" />}
          />
          <button
            type="button"
            onClick={() => {
              setShowReset(true);
              setResetMobile("");
              setNewPassword("");
              setConfirmPassword("");
              setResetError(null);
              setResetSuccess(null);
            }}
            className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Signing in..." : "Login as Owner"}
        </button>
      </form>

      {showReset ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/95 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">
                Reset owner password
              </p>
              <p className="text-xs text-slate-500">
                Enter the owner&apos;s registered mobile and new password.
              </p>
            </div>

            <div className="space-y-3">
              <InputField
                id="reset-owner-mobile"
                label="Mobile Number"
                type="tel"
                placeholder="Registered mobile number"
                icon={<Phone className="h-4 w-4" />}
                value={resetMobile}
                onChange={(e) => setResetMobile(e.target.value)}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500/30"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500/30"
              />
            </div>

            {resetError ? (
              <p className="text-xs text-red-600" role="alert">
                {resetError}
              </p>
            ) : null}
            {resetSuccess ? (
              <p className="text-xs text-emerald-600" role="status">
                {resetSuccess}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowReset(false);
                  setResetError(null);
                  setResetSuccess(null);
                }}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!resetMobile || !newPassword || !confirmPassword) {
                    setResetError(
                      "Enter mobile number and confirm your new password."
                    );
                    setResetSuccess(null);
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setResetError("Passwords do not match.");
                    setResetSuccess(null);
                    return;
                  }
                  // Placeholder: here we would call Firebase password reset/update.
                  setResetError(null);
                  setResetSuccess("Password updated locally. This will be wired to Firebase later.");
                  setTimeout(() => {
                    setShowReset(false);
                    setResetSuccess(null);
                  }, 1200);
                }}
                className="rounded-full bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
              >
                Save password
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

