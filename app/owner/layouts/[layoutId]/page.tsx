"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { getFirebase } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";

type LayoutDetails = {
  layoutName: string;
  totalLand: string;
  numberOfPlots: string;
  imageUrl?: string | null;
  plotsAdded?: number;
};

type PlotCustomField = {
  id: string;
  key: string;
  label: string;
};

type Plot = {
  id: string;
  plotNumber: string;
  facing: string;
  size: string;
  status: string;
  extra?: Record<string, string>;
};

export default function LayoutDetailsPage() {
  const params = useParams<{ layoutId: string }>();
  const router = useRouter();
  const layoutId = params.layoutId;

  const [layout, setLayout] = useState<LayoutDetails | null>(null);
  const [loadingLayout, setLoadingLayout] = useState(true);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loadingPlots, setLoadingPlots] = useState(true);

  const [plotNumber, setPlotNumber] = useState("");
  const [facing, setFacing] = useState("");
  const [plotSize, setPlotSize] = useState("");
  const [plotStatus, setPlotStatus] = useState("Available");
  const [plotError, setPlotError] = useState<string | null>(null);
  const [savingPlot, setSavingPlot] = useState(false);
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [customFields, setCustomFields] = useState<PlotCustomField[]>([]);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [fieldsSaving, setFieldsSaving] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [showEditPlot, setShowEditPlot] = useState(false);
  const [openMenuPlotId, setOpenMenuPlotId] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [plotSearch, setPlotSearch] = useState("");
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
        setLayout(null);
        setPlots([]);
        router.push("/login");
        return;
      }

      const layoutRef = doc(db, "layouts", layoutId);
      const snap = await getDoc(layoutRef);
      if (!snap.exists()) {
        setLayout(null);
        setLoadingLayout(false);
        return;
      }

      const data = snap.data() as any;
      setLayout({
        layoutName: data.layoutName || "Untitled layout",
        totalLand: data.totalLand || "—",
        numberOfPlots: data.numberOfPlots || "—",
        imageUrl: data.imageUrl ?? null,
        plotsAdded: typeof data.plotsAdded === "number" ? data.plotsAdded : 0,
      });
      const rawFields: any[] = Array.isArray(data.plotCustomFields)
        ? data.plotCustomFields
        : [];
      const mappedFields: PlotCustomField[] = rawFields
        .map((f, index) => {
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
        .filter(Boolean) as PlotCustomField[];
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
        (error) => {
          console.error(error);
          setPlots([]);
          setLoadingPlots(false);
          setPlotError("Missing or insufficient permissions (Firestore rules).");
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (plotsUnsubRef.current) {
        plotsUnsubRef.current();
        plotsUnsubRef.current = null;
      }
    };
  }, [layoutId, router]);

  const handleAddPlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPlotError(null);

    if (!plotNumber || !facing || !plotSize) {
      setPlotError("Please fill in all plot fields.");
      return;
    }

    const { auth, db } = getFirebase();
    if (!auth.currentUser) {
      setPlotError("You are not logged in.");
      return;
    }

    const extra = buildExtraFromForm();

    try {
      setSavingPlot(true);
      await addDoc(collection(db, "layouts", layoutId, "plots"), {
        plotNumber,
        facing,
        size: plotSize,
        status: plotStatus,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        extra,
      });
      await updateDoc(doc(db, "layouts", layoutId), {
        plotsAdded: increment(1),
      });

      resetPlotForm();
      setShowAddPlot(false);
    } catch (error) {
      console.error(error);
      setPlotError("Unable to add plot. Please try again.");
    } finally {
      setSavingPlot(false);
    }
  };

  const rowStyleByStatus = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "booked") return "bg-blue-50/70";
    if (normalized === "on hold" || normalized === "hold") return "bg-yellow-50/80";
    if (normalized === "available") return "bg-emerald-50/60";
    if (normalized === "sold") return "bg-red-50/70";
    return "bg-white";
  };

  const openEditPlotModal = (plot: Plot) => {
    setEditingPlot(plot);
    setPlotNumber(plot.plotNumber);
    setFacing(plot.facing);
    setPlotSize(plot.size);
    setPlotStatus(plot.status || "Available");
    setPlotError(null);
    setShowEditPlot(true);
  };

  const handleEditPlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPlot) return;
    setPlotError(null);

    if (!plotNumber || !facing || !plotSize) {
      setPlotError("Please fill in all plot fields.");
      return;
    }

    const { auth, db } = getFirebase();
    if (!auth.currentUser) {
      setPlotError("You are not logged in.");
      return;
    }

    const extra = buildExtraFromForm();

    try {
      setSavingPlot(true);
      await updateDoc(
        doc(db, "layouts", layoutId, "plots", editingPlot.id),
        {
          plotNumber,
          facing,
          size: plotSize,
          status: plotStatus,
          extra,
        }
      );
      resetPlotForm();
      setEditingPlot(null);
      setShowEditPlot(false);
    } catch (error) {
      console.error(error);
      setPlotError("Unable to update plot. Please try again.");
    } finally {
      setSavingPlot(false);
    }
  };

  const handleDeletePlot = async (plot: Plot) => {
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm("Delete this plot? This cannot be undone.")
        : true;
    if (!confirmed) return;

    const { auth, db } = getFirebase();
    if (!auth.currentUser) {
      return;
    }

    try {
      await updateDoc(doc(db, "layouts", layoutId), {
        plotsAdded: increment(-1),
      });
      await updateDoc(doc(db, "layouts", layoutId, "plots", plot.id), {
        deletedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const pillStyleByStatus = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "booked")
      return "border-blue-200 bg-blue-100 text-blue-900";
    if (normalized === "on hold" || normalized === "hold")
      return "border-yellow-200 bg-yellow-100 text-yellow-900";
    if (normalized === "available")
      return "border-emerald-200 bg-emerald-100 text-emerald-900";
    if (normalized === "sold") return "border-red-200 bg-red-100 text-red-900";
    return "border-neutral-200 bg-neutral-100 text-neutral-800";
  };

  const plotMatchesSearch = (plot: Plot, term: string) => {
    if (!term.trim()) return false;
    const t = term.trim().toLowerCase();
    return (
      (plot.plotNumber || "").toLowerCase().includes(t) ||
      (plot.facing || "").toLowerCase().includes(t) ||
      (plot.size || "").toLowerCase().includes(t) ||
      (plot.status || "").toLowerCase().includes(t)
    );
  };

  const sortedPlots = useMemo(() => {
    const term = plotSearch.trim();
    if (!term) return plots;
    const matched: Plot[] = [];
    const rest: Plot[] = [];
    plots.forEach((p) => {
      if (plotMatchesSearch(p, term)) matched.push(p);
      else rest.push(p);
    });
    return [...matched, ...rest];
  }, [plots, plotSearch]);

  const handleSaveFields = async (event: FormEvent) => {
    event.preventDefault();
    setFieldsError(null);

    const { auth, db } = getFirebase();
    if (!auth.currentUser) {
      setFieldsError("You are not logged in.");
      return;
    }

    const trimmedLabel = newFieldLabel.trim();
    const nextFields = [...customFields];

    if (trimmedLabel) {
      const key = trimmedLabel.replace(/\s+/g, "_").toLowerCase();
      const id = key;
      if (!nextFields.some((f) => f.id === id || f.key === key)) {
        nextFields.push({ id, key, label: trimmedLabel });
      }
    }

    try {
      setFieldsSaving(true);
      await updateDoc(doc(db, "layouts", layoutId), {
        plotCustomFields: nextFields.map((f) => ({
          id: f.id,
          key: f.key,
          label: f.label,
        })),
      });
      setCustomFields(nextFields);
      setNewFieldLabel("");
      setShowFieldsModal(false);
    } catch (error) {
      console.error(error);
      setFieldsError("Unable to save fields. Please try again.");
    } finally {
      setFieldsSaving(false);
    }
  };

  const resetPlotForm = () => {
    setPlotNumber("");
    setFacing("");
    setPlotSize("");
    setPlotStatus("Available");
    setPlotError(null);
  };

  const buildExtraFromForm = () => {
    const form = document.getElementById(
      "plot-form"
    ) as HTMLFormElement | null;
    if (!form) return {};
    const formData = new FormData(form);
    const extra: Record<string, string> = {};
    customFields.forEach((field) => {
      const value = (formData.get(`extra-${field.key}`) as string) ?? "";
      if (value && value.trim()) {
        extra[field.key] = value.trim();
      }
    });
    return extra;
  };

  if (loadingLayout) {
    return (
      <div className="mx-auto max-w-5xl text-sm text-neutral-600">
        Loading layout…
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="mx-auto max-w-5xl text-sm text-neutral-600">
        Layout not found.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* About */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Layout details
            </p>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-black sm:text-3xl">
              {layout.layoutName}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-700">
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1">
                Total land: <span className="font-semibold">{layout.totalLand}</span>
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddPlot(true)}
              className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-900"
            >
              Add plot
            </button>
            <button
              type="button"
              onClick={() => setShowFieldsModal(true)}
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50"
            >
              Add fields
            </button>
          </div>
        </div>
      </section>

      {/* Image */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Layout image</p>
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
              onClick={() => setImageZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-neutral-900">
                Plots
              </h2>
              <p className="text-xs text-neutral-500">
                {plots.length} plot{plots.length === 1 ? "" : "s"}
              </p>
            </div>
            {plots.length > 0 ? (
              <div className="relative max-w-xs flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  value={plotSearch}
                  onChange={(e) => setPlotSearch(e.target.value)}
                  placeholder="Search by plot no., facing, size, status…"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black focus:bg-white"
                  aria-label="Search plots"
                />
              </div>
            ) : null}
          </div>

          {loadingPlots ? (
            <p className="text-sm text-neutral-500">Loading plots…</p>
          ) : plots.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No plots added yet. Use the form to create plots for this layout.
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
                      <th className="px-3 py-3 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlots.map((plot) => {
                      const isMatch =
                        plotSearch.trim() &&
                        plotMatchesSearch(plot, plotSearch);
                      return (
                        <tr
                          key={plot.id}
                          className={`border-b border-neutral-100 ${rowStyleByStatus(
                            plot.status
                          )} ${
                            isMatch
                              ? "bg-amber-50/90 ring-1 ring-amber-200/60"
                              : ""
                          } hover:brightness-[0.98]`}
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
                          <td className="relative px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuPlotId((current) =>
                                  current === plot.id ? null : plot.id
                                )
                              }
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:bg-neutral-50"
                              aria-label="Open actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {openMenuPlotId === plot.id ? (
                              <div className="absolute right-3 top-9 z-10 w-32 rounded-2xl border border-neutral-200 bg-white py-1 text-xs text-neutral-800 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuPlotId(null);
                                    openEditPlotModal(plot);
                                  }}
                                  className="block w-full px-3 py-1.5 text-left hover:bg-neutral-50"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuPlotId(null);
                                    handleDeletePlot(plot);
                                  }}
                                  className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </section>

      {/* Manage fields modal */}
      {showFieldsModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Add fields
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Plot number, facing and size are always there. Add extra
                  fields that should show in the table and form.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowFieldsModal(false);
                  setFieldsError(null);
                  setNewFieldLabel("");
                }}
                className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleSaveFields}
              className="mt-4 space-y-4 text-sm"
            >
              {customFields.length > 0 ? (
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Current extra fields
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {customFields.map((field) => (
                      <span
                        key={field.id}
                        className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] text-neutral-800"
                      >
                        {field.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-1">
                <label
                  htmlFor="new-field-label"
                  className="text-xs font-medium text-neutral-800"
                >
                  New field label
                </label>
                <input
                  id="new-field-label"
                  type="text"
                  value={newFieldLabel}
                  onChange={(event) => setNewFieldLabel(event.target.value)}
                  placeholder="e.g. Road width, Corner, etc."
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  This will be available for all plots in this layout.
                </p>
              </div>

              {fieldsError ? (
                <p className="text-xs text-red-600" role="alert">
                  {fieldsError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowFieldsModal(false);
                    setFieldsError(null);
                    setNewFieldLabel("");
                  }}
                  className="rounded-full px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fieldsSaving}
                  className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-800/60"
                >
                  {fieldsSaving ? "Saving..." : "Save fields"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Add plot modal */}
      {showAddPlot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Add plot</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Capture basic plot info. Custom fields can be added later.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddPlot(false);
                  setPlotError(null);
                }}
                className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Close
              </button>
            </div>

            <form
              id="plot-form"
              onSubmit={handleAddPlot}
              className="mt-4 space-y-3 text-sm"
            >
              <div className="space-y-1">
                <label
                  htmlFor="plot-number"
                  className="text-xs font-medium text-neutral-800"
                >
                  Plot number
                </label>
                <input
                  id="plot-number"
                  type="text"
                  value={plotNumber}
                  onChange={(event) => setPlotNumber(event.target.value)}
                  placeholder="e.g. 12A"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="facing"
                    className="text-xs font-medium text-neutral-800"
                  >
                    Facing
                  </label>
                  <input
                    id="facing"
                    type="text"
                    value={facing}
                    onChange={(event) => setFacing(event.target.value)}
                    placeholder="e.g. East"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="plot-size"
                    className="text-xs font-medium text-neutral-800"
                  >
                    Plot size
                  </label>
                  <input
                    id="plot-size"
                    type="text"
                    value={plotSize}
                    onChange={(event) => setPlotSize(event.target.value)}
                    placeholder="e.g. 30x40"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="plot-status"
                  className="text-xs font-medium text-neutral-800"
                >
                  Status
                </label>
                <select
                  id="plot-status"
                  value={plotStatus}
                  onChange={(event) => setPlotStatus(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
                >
                  <option>Available</option>
                  <option>Booked</option>
                  <option>Sold</option>
                  <option>On hold</option>
                </select>
              </div>

              {customFields.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {customFields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label
                        htmlFor={`extra-${field.key}`}
                        className="text-xs font-medium text-neutral-800"
                      >
                        {field.label}
                      </label>
                      <input
                        id={`extra-${field.key}`}
                        name={`extra-${field.key}`}
                        type="text"
                        placeholder={field.label}
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {plotError ? (
                <p className="text-xs text-red-600" role="alert">
                  {plotError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPlot(false);
                    resetPlotForm();
                  }}
                  className="rounded-full px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlot}
                  className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-800/60"
                >
                  {savingPlot ? "Saving..." : "Save plot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit plot modal */}
      {showEditPlot && editingPlot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Edit plot
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Update standard details and any custom fields.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditPlot(false);
                  setEditingPlot(null);
                  resetPlotForm();
                }}
                className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Close
              </button>
            </div>

            <form
              id="plot-form"
              onSubmit={handleEditPlot}
              className="mt-4 space-y-3 text-sm"
            >
              <div className="space-y-1">
                <label
                  htmlFor="plot-number"
                  className="text-xs font-medium text-neutral-800"
                >
                  Plot number
                </label>
                <input
                  id="plot-number"
                  type="text"
                  value={plotNumber}
                  onChange={(event) => setPlotNumber(event.target.value)}
                  placeholder="e.g. 12A"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="facing"
                    className="text-xs font-medium text-neutral-800"
                  >
                    Facing
                  </label>
                  <input
                    id="facing"
                    type="text"
                    value={facing}
                    onChange={(event) => setFacing(event.target.value)}
                    placeholder="e.g. East"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="plot-size"
                    className="text-xs font-medium text-neutral-800"
                  >
                    Plot size
                  </label>
                  <input
                    id="plot-size"
                    type="text"
                    value={plotSize}
                    onChange={(event) => setPlotSize(event.target.value)}
                    placeholder="e.g. 30x40"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="plot-status"
                  className="text-xs font-medium text-neutral-800"
                >
                  Status
                </label>
                <select
                  id="plot-status"
                  value={plotStatus}
                  onChange={(event) => setPlotStatus(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
                >
                  <option>Available</option>
                  <option>Booked</option>
                  <option>Sold</option>
                  <option>On hold</option>
                </select>
              </div>

              {customFields.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {customFields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label
                        htmlFor={`extra-${field.key}`}
                        className="text-xs font-medium text-neutral-800"
                      >
                        {field.label}
                      </label>
                      <input
                        id={`extra-${field.key}`}
                        name={`extra-${field.key}`}
                        type="text"
                        defaultValue={editingPlot.extra?.[field.key] ?? ""}
                        placeholder={field.label}
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {plotError ? (
                <p className="text-xs text-red-600" role="alert">
                  {plotError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPlot(false);
                    setEditingPlot(null);
                    resetPlotForm();
                  }}
                  className="rounded-full px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlot}
                  className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-800/60"
                >
                  {savingPlot ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

