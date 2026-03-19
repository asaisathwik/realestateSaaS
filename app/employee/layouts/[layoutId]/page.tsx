"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirebase } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";

type LayoutDetails = {
  layoutName: string;
  totalLand: string;
  numberOfPlots: string;
  imageUrl?: string | null;
  plotsAdded?: number;
  plotCustomFields?: { id: string; key: string; label: string }[];
};

type Plot = {
  id: string;
  plotNumber: string;
  facing: string;
  size: string;
  status: string;
  extra?: Record<string, string>;
};

type EmployeeDoc = {
  ownerId?: string;
  companyName?: string;
  name?: string;
};

export default function EmployeeLayoutDetailsPage() {
  const params = useParams<{ layoutId: string }>();
  const router = useRouter();
  const layoutId = params.layoutId;

  const [employee, setEmployee] = useState<EmployeeDoc | null>(null);
  const [layout, setLayout] = useState<LayoutDetails | null>(null);
  const [loadingLayout, setLoadingLayout] = useState(true);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loadingPlots, setLoadingPlots] = useState(true);
  const [customFields, setCustomFields] = useState<
    { id: string; key: string; label: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const plotsUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!layoutId) return;

    const { auth, db } = getFirebase();

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        if (plotsUnsubRef.current) {
          plotsUnsubRef.current();
          plotsUnsubRef.current = null;
        }
        setEmployee(null);
        setLayout(null);
        setPlots([]);
        router.push("/login");
        return;
      }

      if (!user.email) {
        setEmployee(null);
        setError("Missing employee email on account.");
        setLoadingLayout(false);
        setLoadingPlots(false);
        return;
      }

      try {
        setError(null);
        setLoadingLayout(true);
        setLoadingPlots(true);

        // Find employee + owner
        const empRef = collection(db, "employees");
        const empQuery = query(
          empRef,
          where("loginEmail", "==", user.email)
        );
        const empSnap = await getDocs(empQuery);
        if (empSnap.empty) {
          setEmployee(null);
          setError("Employee record not found for this login.");
          setLoadingLayout(false);
          setLoadingPlots(false);
          return;
        }

        const empData = empSnap.docs[0].data() as DocumentData;
        const ownerId = (empData.ownerId as string) || "";

        if (!ownerId) {
          setEmployee(null);
          setError("Employee is not linked to any owner.");
          setLoadingLayout(false);
          setLoadingPlots(false);
          return;
        }

        const empDoc: EmployeeDoc = {
          ownerId,
          companyName: (empData.companyName as string) || "",
          name: (empData.name as string) || "",
        };
        setEmployee(empDoc);

        // Load layout and ensure it belongs to same owner
        const layoutRef = doc(db, "layouts", layoutId);
        const snap = await getDoc(layoutRef);
        if (!snap.exists()) {
          setLayout(null);
          setError("Layout not found.");
          setLoadingLayout(false);
          setLoadingPlots(false);
          return;
        }

        const data = snap.data() as any;
        if (data.ownerId !== ownerId) {
          setLayout(null);
          setError("You are not allowed to view this layout.");
          setLoadingLayout(false);
          setLoadingPlots(false);
          return;
        }

        const nextLayout: LayoutDetails = {
          layoutName: data.layoutName || "Untitled layout",
          totalLand: data.totalLand || "—",
          numberOfPlots: data.numberOfPlots || "—",
          imageUrl: data.imageUrl ?? null,
          plotsAdded: typeof data.plotsAdded === "number" ? data.plotsAdded : 0,
        };

        const rawFields: any[] = Array.isArray(data.plotCustomFields)
          ? data.plotCustomFields
          : [];
        const mappedFields = rawFields
          .map((f: any, index: number) => {
            const label =
              (typeof f?.label === "string" && f.label.trim()) ||
              (typeof f?.name === "string" && f.name.trim()) ||
              "";
            const key =
              (typeof f?.key === "string" && f.key.trim()) ||
              label.replace(/\s+/g, "_").toLowerCase() ||
              `field_${index + 1}`;
            if (!label) return null;
            return {
              id:
                (typeof f?.id === "string" && f.id) ||
                (typeof f?.key === "string" && f.key) ||
                key,
              key,
              label,
            };
          })
          .filter(Boolean) as { id: string; key: string; label: string }[];

        nextLayout.plotCustomFields = mappedFields;
        setLayout(nextLayout);
        setCustomFields(mappedFields);
        setLoadingLayout(false);

        const plotsRef = collection(db, "layouts", layoutId, "plots");
        const plotsQuery = query(plotsRef, orderBy("createdAt", "desc"));

        plotsUnsubRef.current = onSnapshot(
          plotsQuery,
          (snapshot) => {
            const nextPlots: Plot[] = snapshot.docs.map((docSnap) => {
              const plotData = docSnap.data() as any;
              return {
                id: docSnap.id,
                plotNumber: plotData.plotNumber || "—",
                facing: plotData.facing || "—",
                size: plotData.size || "—",
                status: plotData.status || "Available",
                extra:
                  plotData.extra && typeof plotData.extra === "object"
                    ? (plotData.extra as Record<string, string>)
                    : {},
              };
            });
            setPlots(nextPlots);
            setLoadingPlots(false);
          },
          (err) => {
            console.error(err);
            setPlots([]);
            setLoadingPlots(false);
            setError("Unable to load plots. Check permissions.");
          }
        );
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading layout details.");
        setLoadingLayout(false);
        setLoadingPlots(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (plotsUnsubRef.current) {
        plotsUnsubRef.current();
        plotsUnsubRef.current = null;
      }
    };
  }, [layoutId, router]);

  const rowStyleByStatus = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "booked") return "bg-blue-50/70";
    if (normalized === "on hold" || normalized === "hold")
      return "bg-yellow-50/80";
    if (normalized === "available") return "bg-emerald-50/60";
    if (normalized === "sold") return "bg-red-50/70";
    return "bg-white";
  };

  const pillStyleByStatus = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "booked")
      return "border-blue-200 bg-blue-100 text-blue-900";
    if (normalized === "on hold" || normalized === "hold")
      return "border-yellow-200 bg-yellow-100 text-yellow-900";
    if (normalized === "available")
      return "border-emerald-200 bg-emerald-100 text-emerald-900";
    if (normalized === "sold")
      return "border-red-200 bg-red-100 text-red-900";
    return "border-neutral-200 bg-neutral-100 text-neutral-800";
  };

  if (loadingLayout) {
    return (
      <div className="mx-auto max-w-5xl text-sm text-neutral-600">
        Loading layout…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl text-sm text-red-600">{error}</div>
    );
  }

  if (!layout) {
    return (
      <div className="mx-auto max-w-5xl text-sm text-neutral-600">
        Layout not found.
      </div>
    );
  }

  const companyName = employee?.companyName || "Your company";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* About */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Layout overview
            </p>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-black sm:text-3xl">
              {layout.layoutName}
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              Viewing layout from{" "}
              <span className="font-semibold text-neutral-900">
                {companyName}
              </span>{" "}
              (read‑only).
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-700">
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1">
                Total land:{" "}
                <span className="font-semibold">{layout.totalLand}</span>
              </span>
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1">
                Plots planned:{" "}
                <span className="font-semibold">{layout.numberOfPlots}</span>
              </span>
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1">
                Plots added:{" "}
                <span className="font-semibold">{layout.plotsAdded ?? 0}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Image */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Layout image
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Scroll to view. Use zoom if you need.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setImageZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))
              }
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setImageZoom(1)}
              className="hidden rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 sm:inline-flex"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() =>
                setImageZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))
              }
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
            >
              +
            </button>
            {layout.imageUrl ? (
              <a
                href={layout.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
              >
                Open
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50">
          {layout.imageUrl ? (
            <div className="max-h-[70vh] overflow-auto p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={layout.imageUrl}
                alt={layout.layoutName}
                style={{
                  transform: `scale(${imageZoom})`,
                  transformOrigin: "top left",
                }}
                className="block w-full max-w-full rounded-2xl object-contain"
              />
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center p-6 text-center text-sm text-neutral-500">
              No image uploaded yet.
            </div>
          )}
        </div>
      </section>

      {/* Plots table */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-900">Plots</h2>
          <p className="text-xs text-neutral-500">
            {plots.length} plot{plots.length === 1 ? "" : "s"}
          </p>
        </div>

        {loadingPlots ? (
          <p className="text-sm text-neutral-500">Loading plots…</p>
        ) : plots.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No plots added yet. Your owner can add plots for this layout.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    <th className="px-3 py-3 font-semibold">Plot number</th>
                    <th className="px-3 py-3 font-semibold">Facing</th>
                    <th className="px-3 py-3 font-semibold">Size</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    {customFields.map((field) => (
                      <th key={field.id} className="px-3 py-3 font-semibold">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plots.map((plot) => (
                    <tr
                      key={plot.id}
                      className={`border-b border-neutral-100 ${rowStyleByStatus(
                        plot.status
                      )} hover:brightness-[0.98]`}
                    >
                      <td className="px-3 py-3 font-medium text-neutral-950">
                        {plot.plotNumber}
                      </td>
                      <td className="px-3 py-3 text-neutral-800">
                        {plot.facing}
                      </td>
                      <td className="px-3 py-3 text-neutral-800">
                        {plot.size}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${pillStyleByStatus(
                            plot.status
                          )}`}
                        >
                          {plot.status}
                        </span>
                      </td>
                      {customFields.map((field) => (
                        <td
                          key={field.id}
                          className="px-3 py-3 text-neutral-800"
                        >
                          {plot.extra?.[field.key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

