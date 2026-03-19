"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirebase } from "@/lib/firebase";
import {
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

type Employee = {
  name?: string;
  mobile?: string;
  normalizedMobile?: string;
  role?: string;
  email?: string | null;
  gender?: string | null;
  city?: string | null;
  joiningDate?: string | null;
  status?: "Active" | "Inactive";
  authUid?: string | null;
  type?: "employee" | "telecaller";
  reportsToEmployeeId?: string | null;
};

export default function EmployeeDetailsPage() {
  const params = useParams<{ employeeId: string }>();
  const router = useRouter();
  const employeeId = params.employeeId;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  useEffect(() => {
    if (!employeeId) return;

    const { auth, db } = getFirebase();

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const ref = doc(db, "employees", employeeId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setEmployee(null);
        setLoading(false);
        return;
      }
      const data = snap.data() as Employee;
      setEmployee(data);
      setName(data.name ?? "");
      setMobile(data.mobile ?? "");
      setRole(data.role ?? "");
      setEmail(data.email ?? "");
      setGender(data.gender ?? "");
      setCity(data.city ?? "");
      setJoiningDate(data.joiningDate ?? "");
      setStatus((data.status as "Active" | "Inactive") ?? "Active");
      setLoading(false);
    });

    return () => unsub();
  }, [employeeId, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employeeId) return;
    setError(null);
    const { auth, db } = getFirebase();
    if (!auth.currentUser) return;
    try {
      setSaving(true);
      const digits = mobile.replace(/\D/g, "");
      await updateDoc(doc(db, "employees", employeeId), {
        name: name || null,
        mobile: mobile || null,
        normalizedMobile: digits || null,
        role: role || null,
        email: email || null,
        gender: gender || null,
        city: city || null,
        joiningDate: joiningDate || null,
        status,
      });
      setEmployee((prev) => prev ? { ...prev, name, mobile, role, email, gender, city, joiningDate, status } : null);
    } catch (err) {
      console.error(err);
      setError("Failed to update employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!employeeId) return;
    const { auth, db } = getFirebase();
    if (!auth.currentUser) return;
    try {
      setDeleting(true);
      setError(null);
      await deleteDoc(doc(db, "employees", employeeId));
      if (employee?.authUid) {
        try {
          await deleteDoc(doc(db, "employeesByAuthUid", employee.authUid));
        } catch {
          // Best-effort; employee doc already removed
        }
      }
      router.push("/owner/employees");
    } catch (err) {
      console.error(err);
      setError("Failed to delete employee. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl text-sm text-neutral-600">
        Loading employee…
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="mx-auto max-w-4xl text-sm text-neutral-600">
        Employee not found.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Edit employee
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
            {employee.name || "Unnamed"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/owner/employees")}
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            Back to employees
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete employee"}
          </button>
        </div>
      </header>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-neutral-900">
            Employee details
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Update any field and save. Changing mobile may affect login; ensure it is unique per employee.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="edit-name" className="text-xs font-medium text-neutral-800">
              Employee name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-mobile" className="text-xs font-medium text-neutral-800">
              Mobile number
            </label>
            <input
              id="edit-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Contact number"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-role" className="text-xs font-medium text-neutral-800">
              Role
            </label>
            <input
              id="edit-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Sales executive"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-email" className="text-xs font-medium text-neutral-800">
              Email (optional)
            </label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-gender" className="text-xs font-medium text-neutral-800">
              Gender
            </label>
            <select
              id="edit-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-city" className="text-xs font-medium text-neutral-800">
              City
            </label>
            <input
              id="edit-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City or location"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-joining" className="text-xs font-medium text-neutral-800">
              Joining date
            </label>
            <input
              id="edit-joining"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-800">Status</p>
            <div className="mt-1 flex gap-3 text-xs">
              <label className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-800">
                <input
                  type="radio"
                  name="edit-status"
                  value="Active"
                  checked={status === "Active"}
                  onChange={() => setStatus("Active")}
                />
                <span>Active</span>
              </label>
              <label className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-800">
                <input
                  type="radio"
                  name="edit-status"
                  value="Inactive"
                  checked={status === "Inactive"}
                  onChange={() => setStatus("Inactive")}
                />
                <span>Inactive</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <p className="text-sm font-semibold text-neutral-900">
              Delete this employee?
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              This will permanently remove{" "}
              <span className="font-semibold">
                {employee.name || "this employee"}
              </span>{" "}
              from your team and revoke their portal access. This action cannot
              be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-full px-4 py-2 font-medium text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  await handleDelete();
                }}
                disabled={deleting}
                className="rounded-full bg-red-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete employee"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
