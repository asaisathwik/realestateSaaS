"use client";

import { ReactNode, useEffect, useState } from "react";
import { Bell, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { getFirebase } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

type EmployeeDoc = {
  name?: string;
  companyName?: string;
};

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<EmployeeDoc | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
        return;
      }

      const ref = collection(db, "employees");
      const q = query(ref, where("loginEmail", "==", user.email));
      const snap = await getDocs(q);
      if (snap.empty) {
        setEmployee(null);
        return;
      }
      const data = snap.docs[0].data() as DocumentData;
      setEmployee({
        name: (data.name as string) || "",
        companyName: (data.companyName as string) || "",
      });
    });

    return () => unsub();
  }, [router]);

  const handleLogout = async () => {
    const { auth } = getFirebase();
    await signOut(auth);
    router.push("/login");
  };

  const companyName = employee?.companyName || "Employee workspace";

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      {/* Top navbar only */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-black text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              PF
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">
                {companyName}
              </p>
              <p className="truncate text-[11px] text-neutral-500">
                {employee?.name || "Employee"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-black"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Profile"
              onClick={() => router.push("/employee/profile")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-black text-white shadow-sm transition hover:bg-neutral-900"
            >
              <User className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Logout"
              onClick={() => setShowLogoutConfirm(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-black"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-neutral-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      {showLogoutConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <p className="text-sm font-semibold text-neutral-900">
              Logout from employee portal?
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              You will be signed out of this employee login.
            </p>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-full px-4 py-2 font-medium text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await handleLogout();
                }}
                className="rounded-full bg-black px-4 py-2 font-medium text-white shadow-sm hover:bg-neutral-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

