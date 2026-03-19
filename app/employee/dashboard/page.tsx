"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirebase } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";

type Stats = {
  layoutsCount: number;
  totalPlotsPlanned: number;
  totalPlotsAdded: number;
};

type EmployeeDoc = {
  name?: string;
  companyName?: string;
  ownerId?: string;
};

type LayoutSummary = {
  id: string;
  layoutName: string;
  totalLand: string;
  numberOfPlots: string;
  plotsAdded: number;
  imageUrl: string | null;
};

export default function EmployeeDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    layoutsCount: 0,
    totalPlotsPlanned: 0,
    totalPlotsAdded: 0,
  });
  const [employee, setEmployee] = useState<EmployeeDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [layouts, setLayouts] = useState<LayoutSummary[]>([]);

  useEffect(() => {
    const { auth, db } = getFirebase();

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      if (!user.email) return;

      try {
        setLoading(true);

        // Find employee doc for this login
        const empRef = collection(db, "employees");
        const empQuery = query(
          empRef,
          where("loginEmail", "==", user.email)
        );
        const empSnap = await getDocs(empQuery);
        if (empSnap.empty) {
          setEmployee(null);
          setStats({
            layoutsCount: 0,
            totalPlotsPlanned: 0,
            totalPlotsAdded: 0,
          });
          setLayouts([]);
          return;
        }

        const empData = empSnap.docs[0].data() as DocumentData;
        const ownerId = (empData.ownerId as string) || "";
        const companyName = (empData.companyName as string) || "";
        const name = (empData.name as string) || "";

        setEmployee({ name, companyName, ownerId });

        if (!ownerId) {
          setStats({
            layoutsCount: 0,
            totalPlotsPlanned: 0,
            totalPlotsAdded: 0,
          });
          setLayouts([]);
          return;
        }

        // Load layouts for this owner (read-only)
        const layoutsRef = collection(db, "layouts");
        const layoutsQuery = query(
          layoutsRef,
          where("ownerId", "==", ownerId)
        );
        const layoutsSnap = await getDocs(layoutsQuery);

        let layoutsCount = 0;
        let totalPlotsPlanned = 0;
        let totalPlotsAdded = 0;
        const layoutsList: LayoutSummary[] = [];

        layoutsSnap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          layoutsCount += 1;
          const planned = parseInt(String(data.numberOfPlots ?? "0"), 10);
          const added = typeof data.plotsAdded === "number" ? data.plotsAdded : 0;
          if (!Number.isNaN(planned)) totalPlotsPlanned += planned;
          totalPlotsAdded += added;

          layoutsList.push({
            id: docSnap.id,
            layoutName: data.layoutName || "Untitled layout",
            totalLand: data.totalLand || "—",
            numberOfPlots: data.numberOfPlots || "—",
            plotsAdded: added,
            imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
          });
        });

        setStats({ layoutsCount, totalPlotsPlanned, totalPlotsAdded });
        setLayouts(layoutsList);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const companyName = employee?.companyName || "Your company";
  const employeeName = employee?.name || "Employee";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Overview
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
          {employeeName}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          You are viewing layouts for{" "}
          <span className="font-semibold text-neutral-900">{companyName}</span>.
          Data is read‑only.
        </p>
        {loading ? (
          <p className="mt-1 text-xs text-neutral-500">Syncing data…</p>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
            Layouts
          </p>
          <p className="mt-3 text-3xl font-semibold text-black">
            {stats.layoutsCount}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Total ventures you have access to.
          </p>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
            Total plots (planned)
          </p>
          <p className="mt-3 text-3xl font-semibold text-black">
            {stats.totalPlotsPlanned}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Sum of all plots defined by your owner.
          </p>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
            Plots configured
          </p>
          <p className="mt-3 text-3xl font-semibold text-black">
            {stats.totalPlotsAdded}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Plots that already exist inside layouts.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-neutral-900">
            Layouts overview
          </p>
          <p className="text-xs text-neutral-500">
            {layouts.length} layout{layouts.length === 1 ? "" : "s"}
          </p>
        </div>

        {layouts.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No layouts available yet. Your owner can create layouts from their
            dashboard.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {layouts.map((layout) => (
              <Link
                key={layout.id}
                href={`/employee/layouts/${layout.id}`}
                className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-100 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Layout
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-neutral-950">
                    {layout.layoutName}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-neutral-600">
                    <span className="rounded-full border border-neutral-200 bg-white px-3 py-1">
                      Total land:{" "}
                      <span className="font-semibold text-neutral-900">
                        {layout.totalLand}
                      </span>
                    </span>
                    <span className="rounded-full border border-neutral-200 bg-white px-3 py-1">
                      Plots:{" "}
                      <span className="font-semibold text-neutral-900">
                        {layout.plotsAdded} / {layout.numberOfPlots}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  {layout.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={layout.imageUrl}
                      alt={layout.layoutName}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center px-3 text-xs text-neutral-500">
                      No image uploaded
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


