"use client";

import { useState, type FormEvent } from "react";
import { Building2, Lock, Phone } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { InputField } from "./InputField";
import { getFirebase } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";

type CompanyOption = {
  companyName: string;
  loginEmail: string;
};

type Step = "mobile" | "companyPassword";

export function EmployeeLoginForm() {
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleVerifyMobile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!mobile.trim()) {
      setError("Please enter your mobile number.");
      return;
    }

    const digits = mobile.replace(/\D/g, "");
    if (!digits) {
      setError("Enter a valid mobile number.");
      return;
    }

    const { db } = getFirebase();

    try {
      setLoading(true);
      const ref = collection(db, "employees");
      const q = query(ref, where("normalizedMobile", "==", digits));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("No employees found for this mobile number.");
        return;
      }

      const options: CompanyOption[] = [];
      const seen = new Set<string>();

      snap.forEach((docSnap) => {
        const data = docSnap.data() as DocumentData;
        const companyName = (data.companyName as string) || "Unknown company";
        const loginEmail = (data.loginEmail as string) || "";
        const key = `${companyName}::${loginEmail}`;
        if (!loginEmail || seen.has(key)) return;
        seen.add(key);
        options.push({ companyName, loginEmail });
      });

      if (!options.length) {
        setError("No valid company logins found for this mobile.");
        return;
      }

      setCompanies(options);
      setSelectedCompany(options[0].companyName);
      setStep("companyPassword");
    } catch (err) {
      console.error(err);
      setError("Unable to lookup company details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!selectedCompany) {
      setError("Please select a company.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const company = companies.find(
      (c) => c.companyName === selectedCompany && c.loginEmail
    );
    if (!company) {
      setError("Invalid company selection.");
      return;
    }

    const { auth } = getFirebase();

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, company.loginEmail, password);
      router.push("/employee/dashboard");
    } catch {
      setError("Unable to log in. Check your password and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {step === "mobile" ? (
        <form className="space-y-5" onSubmit={handleVerifyMobile}>
          <InputField
            id="employee-mobile"
            name="employee-mobile"
            type="tel"
            autoComplete="tel"
            label="Mobile number"
            placeholder="Enter your mobile number"
            icon={<Phone className="h-4 w-4" />}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />

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
            {loading ? "Checking..." : "Next"}
          </button>
        </form>
      ) : (
        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label
              htmlFor="employee-company"
              className="block text-sm font-medium text-slate-700"
            >
              Company
            </label>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500/30">
              <span className="mr-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Building2 className="h-4 w-4" />
              </span>
              <select
                id="employee-company"
                name="employee-company"
                className="h-9 w-full border-0 bg-transparent text-sm text-slate-900 outline-none"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                {companies.map((c) => (
                  <option key={`${c.companyName}-${c.loginEmail}`}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <InputField
              id="employee-password"
              name="employee-password"
              type="password"
              autoComplete="current-password"
              label="Password"
              placeholder="Enter your password"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Default pattern: First word of company + <code>@123</code> (e.g.{" "}
              <code>Sathwik@123</code>).
            </p>
          </div>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setStep("mobile");
                setCompanies([]);
                setSelectedCompany("");
                setPassword("");
                setError(null);
              }}
              className="rounded-full px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Change mobile
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Signing in..." : "Login as Employee"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


