"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getFirebase } from "@/lib/firebase";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useRouter } from "next/navigation";

type Employee = {
  id: string;
  name: string;
  mobile: string;
  role: string;
  email?: string | null;
  gender?: string | null;
  city?: string | null;
  joiningDate?: string | null;
  status: "Active" | "Inactive";
};

export default function EmployeeProfilePage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { auth, db } = getFirebase();

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      if (!user.email) {
        setEmployee(null);
        setLoading(false);
        return;
      }

      const ref = collection(db, "employees");
      const q = query(ref, where("loginEmail", "==", user.email));
      const snap = await getDocs(q);
      if (snap.empty) {
        setEmployee(null);
        setLoading(false);
        return;
      }
      const docSnap = snap.docs[0];
      const data = docSnap.data() as any;
      setEmployee({
        id: docSnap.id,
        name: data.name || "",
        mobile: data.mobile || "",
        role: data.role || "",
        email: data.email ?? "",
        gender: data.gender ?? "",
        city: data.city ?? "",
        joiningDate: data.joiningDate ?? "",
        status: (data.status as "Active" | "Inactive") || "Active",
      });
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employee) return;

    const { db } = getFirebase();
    setError(null);

    try {
      setSaving(true);
      const employeeRef = doc(db, "employees", employee.id);
      await updateDoc(employeeRef, {
        name: employee.name,
        role: employee.role,
        email: employee.email || null,
        gender: employee.gender || null,
        city: employee.city || null,
        joiningDate: employee.joiningDate || null,
        status: employee.status,
      });
    } catch (err) {
      console.error(err);
      setError("Unable to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl text-sm text-neutral-600">
        Loading profile…
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="mx-auto max-w-4xl text-sm text-neutral-600">
        Employee profile not found.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Profile
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
          Your details
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Basic fields like name, email, city can be updated. Mobile and login
          identity are fixed.
        </p>
      </header>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 text-sm sm:grid-cols-2"
        >
          <div className="space-y-1 sm:col-span-2">
            <label
              htmlFor="emp-name-profile"
              className="text-xs font-medium text-neutral-800"
            >
              Full name
            </label>
            <input
              id="emp-name-profile"
              type="text"
              value={employee.name}
              onChange={(e) =>
                setEmployee((prev) =>
                  prev ? { ...prev, name: e.target.value } : prev
                )
              }
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
              placeholder="Full name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-800">
              Mobile number
            </label>
            <input
              value={employee.mobile}
              disabled
              className="w-full cursor-not-allowed rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="emp-role-profile"
              className="text-xs font-medium text-neutral-800"
            >
              Role
            </label>
            <input
              id="emp-role-profile"
              type="text"
              value={employee.role}
              onChange={(e) =>
                setEmployee((prev) =>
                  prev ? { ...prev, role: e.target.value } : prev
                )
              }
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
              placeholder="e.g. Sales executive"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="emp-email-profile"
              className="text-xs font-medium text-neutral-800"
            >
              Email
            </label>
            <input
              id="emp-email-profile"
              type="email"
              value={employee.email || ""}
              onChange={(e) =>
                setEmployee((prev) =>
                  prev ? { ...prev, email: e.target.value } : prev
                )
              }
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="emp-gender-profile"
              className="text-xs font-medium text-neutral-800"
            >
              Gender
            </label>
            <select
              id="emp-gender-profile"
              value={employee.gender || ""}
              onChange={(e) =>
                setEmployee((prev) =>
                  prev ? { ...prev, gender: e.target.value } : prev
                )
              }
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="emp-city-profile"
              className="text-xs font-medium text-neutral-800"
            >
              City
            </label>
            <input
              id="emp-city-profile"
              type="text"
              value={employee.city || ""}
              onChange={(e) =>
                setEmployee((prev) =>
                  prev ? { ...prev, city: e.target.value } : prev
                )
              }
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
              placeholder="City or location"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="emp-joining-profile"
              className="text-xs font-medium text-neutral-800"
            >
              Joining date
            </label>
            <input
              id="emp-joining-profile"
              type="date"
              value={employee.joiningDate || ""}
              onChange={(e) =>
                setEmployee((prev) =>
                  prev ? { ...prev, joiningDate: e.target.value } : prev
                )
              }
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs font-medium text-neutral-800">Status</p>
            <div className="mt-1 flex gap-3 text-xs">
              <label className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-800">
                <input
                  type="radio"
                  name="emp-status-profile"
                  value="Active"
                  checked={employee.status === "Active"}
                  onChange={() =>
                    setEmployee((prev) =>
                      prev ? { ...prev, status: "Active" } : prev
                    )
                  }
                />
                <span>Active</span>
              </label>
              <label className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-800">
                <input
                  type="radio"
                  name="emp-status-profile"
                  value="Inactive"
                  checked={employee.status === "Inactive"}
                  onChange={() =>
                    setEmployee((prev) =>
                      prev ? { ...prev, status: "Inactive" } : prev
                    )
                  }
                />
                <span>Inactive</span>
              </label>
            </div>
          </div>

          {error ? (
            <p className="sm:col-span-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-800/60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

