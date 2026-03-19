 "use client";

 import { useEffect, useState, type FormEvent } from "react";
 import { getFirebase } from "@/lib/firebase";
 import { doc, getDoc, updateDoc } from "firebase/firestore";
 import { onAuthStateChanged, updatePassword } from "firebase/auth";
 import { useRouter } from "next/navigation";

 type OwnerProfile = {
   ownerName?: string;
   mobile?: string;
   companyName?: string;
   city?: string;
   email?: string;
 };

 export default function OwnerProfilePage() {
   const [owner, setOwner] = useState<OwnerProfile | null>(null);
   const [loadingProfile, setLoadingProfile] = useState(true);
   const [showEditForm, setShowEditForm] = useState(false);
   const [profileSaving, setProfileSaving] = useState(false);
   const [profileError, setProfileError] = useState<string | null>(null);
   const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
   const [ownerName, setOwnerName] = useState("");
   const [companyName, setCompanyName] = useState("");
   const [mobile, setMobile] = useState("");
   const [city, setCity] = useState("");
   const [passwordLoading, setPasswordLoading] = useState(false);
   const [passwordError, setPasswordError] = useState<string | null>(null);
   const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
   const [newPassword, setNewPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const router = useRouter();

   useEffect(() => {
     const { auth, db } = getFirebase();

     const unsubscribe = onAuthStateChanged(auth, async (user) => {
       if (!user) {
         router.push("/login");
         return;
       }

       const snap = await getDoc(doc(db, "owners", user.uid));
       if (snap.exists()) {
         const data = snap.data() as OwnerProfile;
         setOwner(data);
         setOwnerName(data.ownerName ?? "");
         setCompanyName(data.companyName ?? "");
         setMobile(data.mobile ?? "");
         setCity(data.city ?? "");
       } else {
         setOwner(null);
       }
       setLoadingProfile(false);
     });

     return () => {
       unsubscribe();
     };
   }, [router]);

   const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
     event.preventDefault();
     setProfileError(null);
     setProfileSuccess(null);
     const { auth, db } = getFirebase();
     if (!auth.currentUser) return;
     try {
       setProfileSaving(true);
       await updateDoc(doc(db, "owners", auth.currentUser.uid), {
         ownerName: ownerName || null,
         companyName: companyName || null,
         mobile: mobile || null,
         city: city || null,
       });
       setOwner((prev) => prev ? { ...prev, ownerName, companyName, mobile, city } : null);
       setProfileSuccess("Profile updated.");
     } catch (err) {
       console.error(err);
       setProfileError("Failed to update profile. Please try again.");
     } finally {
       setProfileSaving(false);
     }
   };

   const handlePasswordChange = async () => {
     setPasswordError(null);
     setPasswordSuccess(null);

     if (!newPassword || !confirmPassword) {
       setPasswordError("Please enter and confirm your new password.");
       return;
     }

     if (newPassword !== confirmPassword) {
       setPasswordError("Passwords do not match.");
       return;
     }

     try {
       setPasswordLoading(true);
       const { auth } = getFirebase();
       if (!auth.currentUser) {
         setPasswordError("You are not logged in.");
         return;
       }

       await updatePassword(auth.currentUser, newPassword);
       setPasswordSuccess("Password updated successfully.");
       setNewPassword("");
       setConfirmPassword("");
     } catch (error) {
       console.error(error);
       setPasswordError("Unable to update password. Please try again.");
     } finally {
       setPasswordLoading(false);
     }
   };

   return (
     <div className="mx-auto flex max-w-3xl flex-col gap-8">
       <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h1 className="text-2xl font-semibold tracking-tight text-black">
             Owner profile
           </h1>
           <p className="mt-2 text-sm text-neutral-600">
             {showEditForm
               ? "Edit your details and change password below."
               : "View your account details as captured during signup."}
           </p>
         </div>
         <button
           type="button"
           onClick={() => {
             setShowEditForm((open) => !open);
             setProfileError(null);
             setProfileSuccess(null);
             setPasswordError(null);
             setPasswordSuccess(null);
           }}
           className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-800"
         >
           {showEditForm ? "Cancel edit" : "Edit profile & change password"}
         </button>
       </section>

       {showEditForm ? (
         <form
           onSubmit={handleProfileSubmit}
           className="flex flex-col gap-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
         >
           <h2 className="text-sm font-semibold text-neutral-900">
             Profile details
           </h2>
           <div className="grid gap-4 sm:grid-cols-2">
             <div className="space-y-1">
               <label htmlFor="profile-ownerName" className="text-xs font-medium text-neutral-800">
                 Owner name
               </label>
               <input
                 id="profile-ownerName"
                 type="text"
                 value={ownerName}
                 onChange={(e) => setOwnerName(e.target.value)}
                 className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
                 placeholder="Your name"
               />
             </div>
             <div className="space-y-1">
               <label htmlFor="profile-companyName" className="text-xs font-medium text-neutral-800">
                 Company name
               </label>
               <input
                 id="profile-companyName"
                 type="text"
                 value={companyName}
                 onChange={(e) => setCompanyName(e.target.value)}
                 className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
                 placeholder="Company"
               />
             </div>
             <div className="space-y-1">
               <label htmlFor="profile-mobile" className="text-xs font-medium text-neutral-800">
                 Mobile
               </label>
               <input
                 id="profile-mobile"
                 type="tel"
                 value={mobile}
                 onChange={(e) => setMobile(e.target.value)}
                 className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
                 placeholder="Mobile number"
               />
             </div>
             <div className="space-y-1">
               <label htmlFor="profile-city" className="text-xs font-medium text-neutral-800">
                 City / Location
               </label>
               <input
                 id="profile-city"
                 type="text"
                 value={city}
                 onChange={(e) => setCity(e.target.value)}
                 className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
                 placeholder="City"
               />
             </div>
           </div>
           {profileError ? (
             <p className="text-xs text-red-600" role="alert">{profileError}</p>
           ) : null}
           {profileSuccess ? (
             <p className="text-xs text-emerald-600" role="status">{profileSuccess}</p>
           ) : null}
           <button
             type="submit"
             disabled={profileSaving}
             className="w-full max-w-xs rounded-full bg-black px-4 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
           >
             {profileSaving ? "Saving…" : "Save profile"}
           </button>

           <hr className="border-neutral-200" />

           <h2 className="text-sm font-semibold text-neutral-900">
             Change password
           </h2>
           <p className="text-xs text-neutral-500">
             Update the password you use to log in.
           </p>
           <div className="grid gap-4 sm:grid-cols-2">
             <div className="space-y-1">
               <label htmlFor="new-password" className="text-xs font-medium text-neutral-700">
                 New password
               </label>
               <input
                 id="new-password"
                 type="password"
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
                 className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
                 placeholder="Enter a new password"
               />
             </div>
             <div className="space-y-1">
               <label htmlFor="confirm-password" className="text-xs font-medium text-neutral-700">
                 Confirm new password
               </label>
               <input
                 id="confirm-password"
                 type="password"
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
                 placeholder="Re-enter new password"
               />
             </div>
           </div>
           {passwordError ? (
             <p className="text-xs text-red-600" role="alert">{passwordError}</p>
           ) : null}
           {passwordSuccess ? (
             <p className="text-xs text-emerald-600" role="status">{passwordSuccess}</p>
           ) : null}
           <button
             type="button"
             onClick={() => handlePasswordChange()}
             disabled={passwordLoading}
             className="w-full max-w-xs rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
           >
             {passwordLoading ? "Saving…" : "Save new password"}
           </button>
         </form>
       ) : (
         <section className="grid gap-6 md:grid-cols-2">
           <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
             <h2 className="text-sm font-semibold text-neutral-900">
               Account details
             </h2>
             <p className="mt-1 text-xs text-neutral-500">
               These values come from your signup form.
             </p>
             <div className="mt-4 space-y-3 text-sm">
               <div>
                 <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                   Owner name
                 </p>
                 <p className="mt-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900">
                   {loadingProfile ? "Loading..." : owner?.ownerName || "—"}
                 </p>
               </div>
               <div>
                 <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                   Company
                 </p>
                 <p className="mt-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900">
                   {loadingProfile ? "Loading..." : owner?.companyName || "—"}
                 </p>
               </div>
               <div>
                 <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                   Mobile
                 </p>
                 <p className="mt-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900">
                   {loadingProfile ? "Loading..." : owner?.mobile || "—"}
                 </p>
               </div>
               <div>
                 <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                   City / Location
                 </p>
                 <p className="mt-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900">
                   {loadingProfile ? "Loading..." : owner?.city || "—"}
                 </p>
               </div>
               <div>
                 <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                   Login email (derived)
                 </p>
                 <p className="mt-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900">
                   {loadingProfile ? "Loading..." : owner?.email || "—"}
                 </p>
               </div>
             </div>
           </div>
           <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
             <h2 className="text-sm font-semibold text-neutral-900">
               Change password
             </h2>
             <p className="mt-1 text-xs text-neutral-500">
               Use the &quot;Edit profile & change password&quot; button above to update your password.
             </p>
           </div>
         </section>
       )}
     </div>
   );
 }

