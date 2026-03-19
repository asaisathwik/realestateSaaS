 "use client";

import { ReactNode, useEffect, useRef, useState } from "react";
 import Link from "next/link";
 import { Bell, ChevronDown, ChevronRight, Menu, User } from "lucide-react";
 import { useRouter } from "next/navigation";
 import {
   collection,
   doc,
   getDoc,
   onSnapshot,
   orderBy,
   query,
   where,
 } from "firebase/firestore";
 import {
   onAuthStateChanged,
   signOut,
   type User as FirebaseUser,
 } from "firebase/auth";
 import { getFirebase } from "@/lib/firebase";

 const primaryLinks = [
   { label: "Dashboard", href: "/owner/dashboard" },
   { label: "Profile", href: "/owner/profile" },
   { label: "Employees Onboard", href: "/owner/employees" },
 ];

 type OwnerProfile = {
   ownerName?: string;
   mobile?: string;
   companyName?: string;
   city?: string;
   email?: string;
 };

 type LayoutSummary = {
   id: string;
   name: string;
 };

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [layoutsDropdownOpen, setLayoutsDropdownOpen] = useState(false);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [layouts, setLayouts] = useState<LayoutSummary[]>([]);
  const [layoutsError, setLayoutsError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const layoutsUnsubRef = useRef<(() => void) | null>(null);
  const router = useRouter();

   useEffect(() => {
     const { auth, db } = getFirebase();

     const authUnsub = onAuthStateChanged(auth, async (user) => {
       if (!user) {
         if (layoutsUnsubRef.current) {
           layoutsUnsubRef.current();
           layoutsUnsubRef.current = null;
         }
         setOwner(null);
         setLayouts([]);
         router.push("/login");
         return;
       }

       const snap = await getDoc(doc(db, "owners", user.uid));
       if (snap.exists()) {
         setOwner(snap.data() as OwnerProfile);
       } else {
         setOwner(null);
       }

       if (layoutsUnsubRef.current) {
         layoutsUnsubRef.current();
         layoutsUnsubRef.current = null;
       }

       const layoutsRef = collection(db, "layouts");
       const layoutsQuery = query(
         layoutsRef,
         where("ownerId", "==", user.uid),
         orderBy("createdAt", "desc")
       );

       layoutsUnsubRef.current = onSnapshot(
         layoutsQuery,
         (snapshot) => {
           setLayoutsError(null);
           const nextLayouts: LayoutSummary[] = snapshot.docs.map((docSnap) => {
             const data = docSnap.data() as { layoutName?: string };
             return {
               id: docSnap.id,
               name: data.layoutName || "Untitled layout",
             };
           });
           setLayouts(nextLayouts);
         },
         (error) => {
           console.error(error);
           setLayouts([]);
           setLayoutsError(
             "Unable to load layouts. Check Firestore permissions/rules."
           );
         }
       );
     });

     return () => {
       authUnsub();
       if (layoutsUnsubRef.current) {
         layoutsUnsubRef.current();
         layoutsUnsubRef.current = null;
       }
     };
   }, [router]);

  const handleLogout = async () => {
    const { auth } = getFirebase();
    await signOut(auth);
    router.push("/login");
  };

   const companyName = owner?.companyName || "Owner dashboard";

   return (
     <div className="flex min-h-screen bg-white text-neutral-900">
      {/* Mobile overlay when sidebar is open */}
      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      ) : null}

       {/* Sidebar */}
       <aside
         className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r border-neutral-200 bg-white transition-transform duration-200 ease-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
       >
         <div className="flex h-16 items-center justify-between border-b border-neutral-100 px-4">
           <span className="truncate text-sm font-semibold text-neutral-900">
             {companyName}
           </span>
         </div>

         <nav className="flex flex-1 flex-col gap-4 px-3 py-4 text-sm">
           <div className="space-y-1">
             {primaryLinks.map((item) => (
               <Link
                 key={item.href}
                 href={item.href}
                 className="block rounded-xl px-3 py-2 font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
               >
                 {item.label}
               </Link>
             ))}
           </div>

           <div className="space-y-1">
             <button
               type="button"
               onClick={() => {
                 setLayoutsDropdownOpen((open) => !open);
                 router.push("/owner/layouts");
                 if (window.innerWidth < 768) setIsSidebarOpen(false);
               }}
               className="flex w-full items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
             >
               <span className="flex items-center gap-2">
                 {layoutsDropdownOpen ? (
                   <ChevronDown className="h-4 w-4 text-neutral-500" />
                 ) : (
                   <ChevronRight className="h-4 w-4 text-neutral-500" />
                 )}
                 Layouts &amp; Plots
               </span>
               <span className="text-[11px] text-neutral-500">
                 {layouts.length || 0}
               </span>
             </button>

             {layoutsDropdownOpen ? (
               <div className="space-y-1 border-l border-dashed border-neutral-200 pl-3">
                 <button
                   type="button"
                   onClick={() => {
                     router.push("/owner/layouts");
                     if (window.innerWidth < 768) setIsSidebarOpen(false);
                   }}
                   className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
                 >
                   All layouts
                 </button>
                 {layoutsError ? (
                   <p className="px-2 py-1 text-xs text-red-600">{layoutsError}</p>
                 ) : layouts.length === 0 ? (
                   <p className="px-2 py-1 text-xs text-neutral-500">
                     No layouts yet.
                   </p>
                 ) : (
                   layouts.map((layout) => (
                     <button
                       key={layout.id}
                       type="button"
                       onClick={() => {
                         router.push(`/owner/layouts/${layout.id}`);
                         if (window.innerWidth < 768) setIsSidebarOpen(false);
                       }}
                       className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
                     >
                       {layout.name}
                     </button>
                   ))
                 )}
               </div>
             ) : null}
           </div>
         </nav>

         <div className="mt-auto border-t border-neutral-100 px-4 py-3 text-xs">
           <button
             type="button"
             onClick={() => setShowLogoutConfirm(true)}
             className="mb-2 inline-flex w-full items-center justify-center rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50 hover:text-black"
           >
             Logout
           </button>
           <p className="border-t border-dashed border-neutral-200 pt-2 text-[11px] text-neutral-400">
             Built with{" "}
             <Link
               href="https://plotflow.app"
               target="_blank"
               className="font-medium text-neutral-700 underline-offset-4 hover:text-black hover:underline"
             >
               @ PlotFlow
             </Link>
           </p>
         </div>
       </aside>

       {/* Main content area */}
      <div
        className="flex min-h-screen flex-1 flex-col transition-[margin] duration-200"
        style={{ marginLeft: isSidebarOpen ? "16rem" : 0 }}
      >
         {/* Top navbar */}
         <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur">
           <div className="flex items-center justify-between px-4 py-3">
             <div className="flex items-center gap-3">
               <button
                 type="button"
                 aria-label="Toggle sidebar"
                 onClick={() => setIsSidebarOpen((open) => !open)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-black"
               >
                 <Menu className="h-4 w-4" />
               </button>
               <div className="flex items-center gap-2">
                 <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-black text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                   PF
                 </div>
                 <span className="truncate text-sm font-medium text-neutral-800">
                   {companyName}
                 </span>
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
                 onClick={() => router.push("/owner/profile")}
                 className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-black text-white shadow-sm transition hover:bg-neutral-900"
               >
                 <User className="h-4 w-4" />
               </button>
             </div>
           </div>
         </header>

         {/* Page body */}
         <main className="flex-1 bg-neutral-50 px-4 py-6 sm:px-6 lg:px-8">
           {children}
         </main>

         {showLogoutConfirm ? (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
             <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
               <p className="text-sm font-semibold text-neutral-900">
                 Logout from owner portal?
               </p>
               <p className="mt-1 text-xs text-neutral-500">
                 You will be signed out of this account.
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
     </div>
   );
 }


