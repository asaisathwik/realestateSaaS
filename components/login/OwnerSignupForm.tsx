"use client";

import { useState, type FormEvent } from "react";
import { Building2, Lock, MapPin, Phone, User } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { InputField } from "./InputField";
import { getFirebase } from "@/lib/firebase";

export function OwnerSignupForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const ownerName = (formData.get("owner-name") as string | null)?.trim();
    const mobile = (formData.get("owner-mobile") as string | null)?.trim();
    const password = (formData.get("owner-password") as string | null) ?? "";
    const companyName = (formData.get("owner-company") as string | null)?.trim();
    const city = (formData.get("owner-city") as string | null)?.trim();

    if (!ownerName || !mobile || !password || !companyName || !city) {
      setError("Please fill in all fields.");
      setSuccess(null);
      return;
    }

    const rawDigits = mobile.replace(/\D/g, "");
    const normalizedMobile =
      rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
    if (!normalizedMobile) {
      setError("Enter a valid mobile number.");
      setSuccess(null);
      return;
    }

    const { auth, db } = getFirebase();
    const emailFromMobile = `${normalizedMobile}@owner.plotflow.app`;

    try {
      setLoading(true);
      setError(null);

      const cred = await createUserWithEmailAndPassword(
        auth,
        emailFromMobile,
        password
      );

      await setDoc(doc(db, "owners", cred.user.uid), {
        ownerName,
        mobile: normalizedMobile,
        companyName,
        city,
        email: emailFromMobile,
        createdAt: serverTimestamp(),
      });

      setSuccess("Owner account created. Redirecting to login…");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError("Unable to create account. Try a different mobile or try again.");
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          id="owner-name"
          name="owner-name"
          label="Owner Name"
          placeholder="Full name"
          icon={<User className="h-4 w-4" />}
        />
        <InputField
          id="owner-mobile"
          name="owner-mobile"
          type="tel"
          autoComplete="tel"
          label="Mobile Number"
          placeholder="For login and contact"
          icon={<Phone className="h-4 w-4" />}
        />
      </div>

      <InputField
        id="owner-password"
        name="owner-password"
        type="password"
        autoComplete="new-password"
        label="Password"
        placeholder="Create a strong password"
        icon={<Lock className="h-4 w-4" />}
      />

      <InputField
        id="owner-company"
        name="owner-company"
        label="Company Name"
        placeholder="Company or project name"
        icon={<Building2 className="h-4 w-4" />}
      />

      <InputField
        id="owner-city"
        name="owner-city"
        label="City / Location"
        placeholder="City or primary project location"
        icon={<MapPin className="h-4 w-4" />}
      />

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-600" role="status">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Creating account…" : "Create owner account"}
      </button>
    </form>
  );
}

