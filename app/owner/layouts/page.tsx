"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getFirebase } from "@/lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

type Layout = {
  id: string;
  layoutName: string;
  totalLand: string;
  numberOfPlots: string;
  plotsAdded: number;
  imageUrl: string | null;
};

export default function OwnerLayoutsPage() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);
  const [layoutName, setLayoutName] = useState("");
  const [totalLand, setTotalLand] = useState("");
  const [numberOfPlots, setNumberOfPlots] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { auth, db } = getFirebase();

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const layoutsRef = collection(db, "layouts");
      const q = query(
        layoutsRef,
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeLayouts = onSnapshot(
        q,
        (snapshot) => {
          const nextLayouts: Layout[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as any;
            return {
              id: docSnap.id,
              layoutName: data.layoutName || "Untitled layout",
              totalLand: data.totalLand || "—",
              numberOfPlots: data.numberOfPlots || "—",
              plotsAdded: typeof data.plotsAdded === "number" ? data.plotsAdded : 0,
              imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
            };
          });
          setLayouts(nextLayouts);
          setLoading(false);
        },
        (error) => {
          console.error(error);
          setLayouts([]);
          setLoading(false);
          setError("Missing or insufficient permissions (Firestore rules).");
        }
      );

      return unsubscribeLayouts;
    });

    return () => {
      unsubscribeAuth();
    };
  }, [router]);

  const handleCreateLayout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!layoutName || !totalLand || !numberOfPlots) {
      setError("Please fill in all layout fields.");
      return;
    }

    const { auth, db } = getFirebase();
    if (!auth.currentUser) {
      setError("You are not logged in.");
      return;
    }

    try {
      setSavingLayout(true);
      let imageUrl: string | null = null;

      if (imageFile) {
        try {
          const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
          const uploadPreset =
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

          if (!cloudName || !uploadPreset) {
            throw new Error("Missing Cloudinary environment variables.");
          }

          const formData = new FormData();
          formData.append("file", imageFile);
          formData.append("upload_preset", uploadPreset);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Cloudinary upload error", response.status, errorText);
            throw new Error(
              `Cloudinary upload failed (${response.status}). Check preset and cloud name.`
            );
          }

          const json = (await response.json()) as { secure_url?: string };
          imageUrl = json.secure_url ?? null;
        } catch (uploadError) {
          console.error(uploadError);
          setError(
            "Image upload failed. The layout will be saved without an image. Check Cloudinary preset name and that it is unsigned."
          );
        }
      }

      await addDoc(collection(db, "layouts"), {
        ownerId: auth.currentUser.uid,
        layoutName,
        totalLand,
        numberOfPlots,
        imageUrl,
        plotsAdded: 0,
        createdAt: serverTimestamp(),
      });

      setLayoutName("");
      setTotalLand("");
      setNumberOfPlots("");
      setImageFile(null);
      setSavingLayout(false);
    } catch (err) {
      console.error(err);
      setError("Unable to create layout. Please try again.");
      setSavingLayout(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Layouts &amp; plots
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
            Manage layouts
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Create and organize your real estate layouts. Each layout can have
            its own set of plots.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm((value) => !value);
            setError(null);
          }}
          className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-900"
        >
          {showCreateForm ? "Close form" : "Add layout"}
        </button>
      </header>

      {showCreateForm ? (
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <form className="space-y-4" onSubmit={handleCreateLayout}>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label
                    htmlFor="layout-name"
                    className="text-xs font-medium text-neutral-800"
                  >
                    Layout name
                  </label>
                  <input
                    id="layout-name"
                    type="text"
                    value={layoutName}
                    onChange={(event) => setLayoutName(event.target.value)}
                    placeholder="e.g. Green Valley"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="total-land"
                      className="text-xs font-medium text-neutral-800"
                    >
                      Total land
                    </label>
                    <input
                      id="total-land"
                      type="text"
                      value={totalLand}
                      onChange={(event) => setTotalLand(event.target.value)}
                      placeholder="e.g. 3.5 acres"
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="number-of-plots"
                      className="text-xs font-medium text-neutral-800"
                    >
                      Number of plots
                    </label>
                    <input
                      id="number-of-plots"
                      type="number"
                      min={1}
                      value={numberOfPlots}
                      onChange={(event) =>
                        setNumberOfPlots(event.target.value.trim())
                      }
                      placeholder="e.g. 120"
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-medium text-neutral-800">
                  Layout image (Cloudinary ready)
                </p>
                <p className="text-[11px] text-neutral-500">
                  Upload a layout map or site plan. The file will be uploaded to
                  Cloudinary in a later step – for now, we only capture the
                  selected file.
                </p>
                <label className="mt-2 flex cursor-pointer items-center justify-center rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:text-black">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setImageFile(file || null);
                    }}
                  />
                  {imageFile ? "Change image" : "Choose image"}
                </label>
                {imageFile ? (
                  <p className="truncate text-[11px] text-neutral-500">
                    Selected: {imageFile.name}
                  </p>
                ) : null}
              </div>
            </div>

            {error ? (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setError(null);
                }}
                className="rounded-full px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingLayout}
                className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-800/60"
              >
                {savingLayout ? "Saving..." : "Save layout"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-900">
            Layouts list
          </h2>
          <p className="text-xs text-neutral-500">
            {layouts.length} layout{layouts.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Loading layouts…</p>
        ) : layouts.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No layouts yet. Click &quot;Add layout&quot; to create your first
            one.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                type="button"
                onClick={() => router.push(`/owner/layouts/${layout.id}`)}
                className="group grid gap-4 rounded-3xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-neutral-300 hover:shadow-md sm:p-5 md:grid-cols-[minmax(0,1fr)_260px]"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Layout
                  </p>
                  <p className="mt-2 line-clamp-1 text-base font-semibold tracking-tight text-neutral-950">
                    {layout.layoutName}
                  </p>

                  <div className="mt-4 grid gap-2 text-xs text-neutral-600 sm:grid-cols-2">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                        Total land
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">
                        {layout.totalLand}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                        Plots
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">
                        {layout.plotsAdded} / {layout.numberOfPlots}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-neutral-700">
                    <span className="inline-flex h-2 w-2 rounded-full bg-neutral-900/70" />
                    Open details
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50">
                  {layout.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={layout.imageUrl}
                      alt={layout.layoutName}
                      className="h-44 w-full object-cover transition duration-200 group-hover:scale-[1.02] md:h-40"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center p-4 text-center text-xs text-neutral-500 md:h-40">
                      No image yet
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

