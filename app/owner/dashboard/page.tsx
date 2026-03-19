 "use client";

 import { useEffect, useState } from "react";
 import { getFirebase } from "@/lib/firebase";
 import {
   collection,
   doc,
   getDoc,
   getDocs,
   query,
   where,
 } from "firebase/firestore";

 type Stats = {
   layoutsCount: number;
   totalPlotsPlanned: number;
   totalPlotsAdded: number;
   employeesCount: number;
 };

 type OwnerInfo = {
   ownerName?: string;
   companyName?: string;
 };

 export default function OwnerDashboardPage() {
   const [stats, setStats] = useState<Stats>({
     layoutsCount: 0,
     totalPlotsPlanned: 0,
     totalPlotsAdded: 0,
     employeesCount: 0,
   });
   const [owner, setOwner] = useState<OwnerInfo | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     const { auth, db } = getFirebase();

     const unsub = auth.onAuthStateChanged(async (user) => {
       if (!user) return;

       try {
         setLoading(true);

         // Owner info
         const ownerSnap = await getDoc(doc(db, "owners", user.uid));
         if (ownerSnap.exists()) {
           const data = ownerSnap.data() as OwnerInfo;
           setOwner({
             ownerName: data.ownerName,
             companyName: data.companyName,
           });
         }

         // Layouts stats
         const layoutsRef = collection(db, "layouts");
         const layoutsQuery = query(
           layoutsRef,
           where("ownerId", "==", user.uid)
         );
         const layoutsSnap = await getDocs(layoutsQuery);

         let layoutsCount = 0;
         let totalPlotsPlanned = 0;
         let totalPlotsAdded = 0;

         layoutsSnap.forEach((docSnap) => {
           const data = docSnap.data() as any;
           layoutsCount += 1;
           const planned = parseInt(String(data.numberOfPlots ?? "0"), 10);
           const added = typeof data.plotsAdded === "number" ? data.plotsAdded : 0;
           if (!Number.isNaN(planned)) totalPlotsPlanned += planned;
           totalPlotsAdded += added;
         });

         // Employees (optional; ignore errors if collection does not exist yet)
         let employeesCount = 0;
         try {
           const employeesRef = collection(db, "employees");
           const employeesQuery = query(
             employeesRef,
             where("ownerId", "==", user.uid)
           );
           const employeesSnap = await getDocs(employeesQuery);
           employeesCount = employeesSnap.size;
         } catch {
           employeesCount = 0;
         }

         setStats({
           layoutsCount,
           totalPlotsPlanned,
           totalPlotsAdded,
           employeesCount,
         });
       } finally {
         setLoading(false);
       }
     });

     return () => unsub();
   }, []);

   const displayName =
     owner?.companyName || owner?.ownerName || "Owner dashboard";

   return (
     <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
       <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
         <div>
           <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
             Overview
           </p>
           <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
             {displayName}
           </h1>
           <p className="mt-2 text-sm text-neutral-600">
             Snapshot of your layouts, plots, and team.
           </p>
         </div>
         {loading ? (
           <p className="text-xs text-neutral-500">Syncing data…</p>
         ) : null}
       </header>

       {/* KPI grid */}
       <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
         <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
           <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
             Layouts added
           </p>
           <p className="mt-3 text-3xl font-semibold text-black">
             {stats.layoutsCount}
           </p>
           <p className="mt-2 text-xs text-neutral-500">
             Total ventures configured for this owner.
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
             Sum of all planned plots across layouts.
           </p>
         </div>

         <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
           <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
             Plots added
           </p>
           <p className="mt-3 text-3xl font-semibold text-black">
             {stats.totalPlotsAdded}
           </p>
           <p className="mt-2 text-xs text-neutral-500">
             Plots already created inside your layouts.
           </p>
         </div>

         <div className="rounded-3xl border border-neutral-200 bg_WHITE p-5 shadow-sm">
           <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
             Employees onboarded
           </p>
           <p className="mt-3 text-3xl font-semibold text-black">
             {stats.employeesCount}
           </p>
           <p className="mt-2 text-xs text-neutral-500">
             Team members linked to this owner.
           </p>
         </div>
       </section>

       {/* Summary strip */}
       <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
         <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-700">
           <span>
             Layouts:{" "}
             <span className="font-semibold">{stats.layoutsCount}</span>
           </span>
           <span className="h-1 w-1 rounded-full bg-neutral-400" />
           <span>
             Total plots:{" "}
             <span className="font-semibold">{stats.totalPlotsPlanned}</span>
           </span>
           <span className="h-1 w-1 rounded-full bg-neutral-400" />
           <span>
             Configured plots:{" "}
             <span className="font-semibold">{stats.totalPlotsAdded}</span>
           </span>
           <span className="h-1 w-1 rounded-full bg-neutral-400" />
           <span>
             Employees:{" "}
             <span className="font-semibold">{stats.employeesCount}</span>
           </span>
         </div>
       </section>
     </div>
   );
 }


