 "use client";

 import { useEffect, useRef, useState, type FormEvent } from "react";
import { getFirebase, getTempAuth } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
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
  type?: "employee" | "telecaller";
  reportsToEmployeeId?: string | null;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [employeeType, setEmployeeType] = useState<"employee" | "telecaller">(
    "employee"
  );
  const [reportsToEmployeeId, setReportsToEmployeeId] = useState("");

  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const actionMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isInsideAny = Object.values(actionMenuRefs.current).some(
        (el) => el && el.contains(target)
      );
      if (!isInsideAny) setActionMenuOpen(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const employeesUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const { auth, db } = getFirebase();

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        if (employeesUnsubRef.current) {
          employeesUnsubRef.current();
          employeesUnsubRef.current = null;
        }
        setEmployees([]);
        router.push("/login");
        return;
      }

      const ref = collection(db, "employees");
      const q = query(
        ref,
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      employeesUnsubRef.current = onSnapshot(
        q,
        (snapshot) => {
          const list: Employee[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as any;
            return {
              id: docSnap.id,
              name: data.name || "Unnamed",
              mobile: data.mobile || "",
              role: data.role || "",
              email: data.email ?? "",
              gender: data.gender ?? "",
              city: data.city ?? "",
              joiningDate: data.joiningDate ?? "",
              status: (data.status as "Active" | "Inactive") || "Active",
              type: (data.type as "employee" | "telecaller") || "employee",
              reportsToEmployeeId: data.reportsToEmployeeId || null,
            };
          });
          setEmployees(list);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error(err);
          setEmployees([]);
          setLoading(false);
          setError("Unable to load employees. Check Firestore rules.");
        }
      );

      return;
    });

    return () => {
      unsubAuth();
      if (employeesUnsubRef.current) {
        employeesUnsubRef.current();
        employeesUnsubRef.current = null;
      }
    };
  }, [router]);

  const handleDeleteEmployee = async (empId: string) => {
    const { auth, db } = getFirebase();
    if (!auth.currentUser) return;
    setError(null);
    try {
      const empSnap = await getDoc(doc(db, "employees", empId));
      const authUid = empSnap.exists() ? (empSnap.data() as { authUid?: string }).authUid : null;

      await deleteDoc(doc(db, "employees", empId));

      if (authUid) {
        try {
          await deleteDoc(doc(db, "employeesByAuthUid", authUid));
        } catch {
          // Best-effort: employee doc is already removed
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete employee. Check console or try again.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name || !mobile || !role) {
      setError("Please fill in employee name, mobile, and role.");
      return;
    }

    if (employeeType === "telecaller" && !reportsToEmployeeId) {
      setError("Please select which employee this telecaller reports to.");
      return;
    }

    const { auth, db } = getFirebase();
    if (!auth.currentUser) {
      setError("You are not logged in.");
      return;
    }

    try {
      setSaving(true);

      // Get owner company name for password pattern
      const ownerSnap = await getDoc(doc(db, "owners", auth.currentUser.uid));
      const ownerData = (ownerSnap.exists() ? ownerSnap.data() : null) as
        | { companyName?: string }
        | null;
      const companyName = ownerData?.companyName || "Employee";

      const firstWord = companyName.trim().split(/\s+/)[0] || "Employee";
      const password = `${firstWord}@123`;

      const digits = mobile.replace(/\D/g, "");
      const companySlug = companyName.toLowerCase().replace(/\s+/g, "-");
      const loginEmail = `${digits}@${companySlug}.employee.plotflow.app`;

      const ownerUid = auth.currentUser.uid;

      const duplicateQuery = query(
        collection(db, "employees"),
        where("ownerId", "==", ownerUid),
        where("normalizedMobile", "==", digits)
      );
      const duplicateSnap = await getDocs(duplicateQuery);
      if (!duplicateSnap.empty) {
        setError("An employee with this mobile number already exists.");
        setSaving(false);
        return;
      }

      // Create auth user with temp auth so owner stays signed in; then map employee uid → ownerId for Firestore rules
      let authUid: string | null = null;
      try {
        const tempAuth = getTempAuth();
        const userCred = await createUserWithEmailAndPassword(
          tempAuth,
          loginEmail,
          password
        );
        authUid = userCred.user.uid;
      } catch (authError: any) {
        if (authError?.code !== "auth/email-already-in-use") {
          console.error(authError);
        }
      }

      await addDoc(collection(db, "employees"), {
        ownerId: ownerUid,
        name,
        mobile,
        normalizedMobile: digits,
        role,
        email: email || null,
        gender: gender || null,
        city: city || null,
        joiningDate: joiningDate || null,
        status,
        type: employeeType,
        reportsToEmployeeId:
          employeeType === "telecaller" ? reportsToEmployeeId : null,
        loginEmail,
        companyName,
        ...(authUid ? { authUid } : {}),
        createdAt: serverTimestamp(),
      });

      if (authUid) {
        await setDoc(doc(db, "employeesByAuthUid", authUid), {
          ownerId: ownerUid,
        });
      }

      setName("");
      setMobile("");
      setRole("");
      setEmail("");
      setGender("");
      setCity("");
      setJoiningDate("");
      setStatus("Active");
      setEmployeeType("employee");
      setReportsToEmployeeId("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError("Unable to add employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Team
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
            Employees onboarding
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Add employees and keep a simple list of everyone working on your
            layouts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setError(null);
          }}
          className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-900"
        >
          Add employee
        </button>
      </header>

      {/* Employees & telecallers table */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Employees list
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Core employees and telecallers are shown in separate sections.
            </p>
          </div>
          <p className="text-xs text-neutral-500">
            {employees.length} person{employees.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Loading employees…</p>
        ) : error ? (
          <p className="text_sm text-red-600">{error}</p>
        ) : employees.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No employees onboarded yet. Use &quot;Add employee&quot; to create
            one.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Core employees */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Employees
                </p>
                <p className="text-xs text-neutral-500">
                  {
                    employees.filter(
                      (emp) => (emp.type || "employee") === "employee"
                    ).length
                  }{" "}
                  employee
                  {employees.filter(
                    (emp) => (emp.type || "employee") === "employee"
                  ).length === 1
                    ? ""
                    : "s"}
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-neutral-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                        <th className="px-3 py-3 font-semibold">Name</th>
                        <th className="px-3 py-3 font-semibold">Mobile</th>
                        <th className="px-3 py-3 font-semibold">Role</th>
                        <th className="px-3 py-3 font-semibold">City</th>
                        <th className="px-3 py-3 font-semibold">Joining date</th>
                        <th className="px-3 py-3 font-semibold">Status</th>
                        <th className="w-12 px-3 py-3 font-semibold text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees
                        .filter(
                          (emp) => (emp.type || "employee") === "employee"
                        )
                        .map((emp) => (
                          <tr
                            key={emp.id}
                            className="border-b border-neutral-100 hover:bg-neutral-50"
                          >
                            <td className="px-3 py-3 font-medium text-neutral-950">
                              {emp.name}
                            </td>
                            <td className="px-3 py-3 text-neutral-800">
                              {emp.mobile}
                            </td>
                            <td className="px-3 py-3 text-neutral-800">
                              {emp.role}
                            </td>
                            <td className="px-3 py-3 text-neutral-700">
                              {emp.city || "—"}
                            </td>
                            <td className="px-3 py-3 text-neutral-700">
                              {emp.joiningDate || "—"}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  emp.status === "Active"
                                    ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                                    : "border-neutral-200 bg-neutral-100 text-neutral-800"
                                }`}
                              >
                                {emp.status}
                              </span>
                            </td>
                            <td className="relative px-3 py-3 text-right">
                              <div
                                ref={(el) => {
                                  actionMenuRefs.current[emp.id] = el;
                                }}
                                className="relative inline-block"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActionMenuOpen(
                                      actionMenuOpen === emp.id ? null : emp.id
                                    );
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900"
                                  aria-label="Actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                {actionMenuOpen === emp.id ? (
                                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionMenuOpen(null);
                                        router.push(`/owner/employees/${emp.id}`);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionMenuOpen(null);
                                        setDeleteTarget({
                                          id: emp.id,
                                          name: emp.name,
                                        });
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Delete
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Telecallers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Telecallers
                </p>
                <p className="text-xs text-neutral-500">
                  {
                    employees.filter(
                      (emp) => (emp.type || "employee") === "telecaller"
                    ).length
                  }{" "}
                  telecaller
                  {employees.filter(
                    (emp) => (emp.type || "employee") === "telecaller"
                  ).length === 1
                    ? ""
                    : "s"}
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-neutral-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                        <th className="px-3 py-3 font-semibold">Name</th>
                        <th className="px-3 py-3 font-semibold">Mobile</th>
                        <th className="px-3 py-3 font-semibold">Assigned to</th>
                        <th className="px-3 py-3 font-semibold">Status</th>
                        <th className="w-12 px-3 py-3 font-semibold text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees
                        .filter(
                          (emp) => (emp.type || "employee") === "telecaller"
                        )
                        .map((emp) => {
                          const assignedTo =
                            employees.find(
                              (e) => e.id === emp.reportsToEmployeeId
                            ) || null;
                          return (
                            <tr
                              key={emp.id}
                              className="border-b border-neutral-100 hover:bg-neutral-50"
                            >
                              <td className="px-3 py-3 font-medium text-neutral-950">
                                {emp.name}
                              </td>
                              <td className="px-3 py-3 text-neutral-800">
                                {emp.mobile}
                              </td>
                              <td className="px-3 py-3 text-neutral-800">
                                {assignedTo?.name || "—"}
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                    emp.status === "Active"
                                      ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                                      : "border-neutral-200 bg-neutral-100 text-neutral-800"
                                  }`}
                                >
                                  {emp.status}
                                </span>
                              </td>
                              <td className="relative px-3 py-3 text-right">
                                <div
                                  ref={(el) => {
                                    actionMenuRefs.current[emp.id] = el;
                                  }}
                                  className="relative inline-block"
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActionMenuOpen(
                                        actionMenuOpen === emp.id ? null : emp.id
                                      );
                                    }}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900"
                                    aria-label="Actions"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                  {actionMenuOpen === emp.id ? (
                                    <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActionMenuOpen(null);
                                          router.push(
                                            `/owner/employees/${emp.id}`
                                          );
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActionMenuOpen(null);
                                          setDeleteTarget({
                                            id: emp.id,
                                            name: emp.name || "",
                                          });
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Add employee modal */}
      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Add employee
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Basic details are enough. You can refine this later.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-4 grid gap-3 text-sm sm:grid-cols-2"
            >
              <div className="space-y-1 sm:col-span-2">
                <label
                  htmlFor="emp-name"
                  className="text-xs font-medium text-neutral-800"
                >
                  Employee name
                </label>
                <input
                  id="emp-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="emp-mobile"
                  className="text-xs font-medium text-neutral-800"
                >
                  Mobile number
                </label>
                <input
                  id="emp-mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Contact number"
                  className="w-full rounded-2xl border border-neutral-200 bg_WHITE px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="emp-role"
                  className="text-xs font-medium text-neutral-800"
                >
                  Role
                </label>
                <input
                  id="emp-role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Sales executive"
                  className="w-full rounded-2xl border border-neutral-200 bg_WHITE px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="emp-email"
                  className="text-xs font-medium text-neutral-800"
                >
                  Email (optional)
                </label>
                <input
                  id="emp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="emp-gender"
                  className="text-xs font-medium text-neutral-800"
                >
                  Gender
                </label>
                <select
                  id="emp-gender"
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
                <label
                  htmlFor="emp-city"
                  className="text-xs font-medium text-neutral-800"
                >
                  City
                </label>
                <input
                  id="emp-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City or location"
                  className="w-full rounded-2xl border border-neutral-200 bg_WHITE px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="emp-joining"
                  className="text-xs font-medium text-neutral-800"
                >
                  Joining date
                </label>
                <input
                  id="emp-joining"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 bg_WHITE px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black"
                />
              </div>

              {/* Employee type */}
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs font-medium text-neutral-800">
                  Type
                </p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs">
                  <label className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-800">
                    <input
                      type="radio"
                      name="emp-type"
                      value="employee"
                      checked={employeeType === "employee"}
                      onChange={() => setEmployeeType("employee")}
                    />
                    <span>Employee</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-800">
                    <input
                      type="radio"
                      name="emp-type"
                      value="telecaller"
                      checked={employeeType === "telecaller"}
                      onChange={() => setEmployeeType("telecaller")}
                    />
                    <span>Telecaller</span>
                  </label>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Telecallers get the employee login but are tracked separately so you can see their call work.
                </p>
              </div>

              {/* Telecaller assignment */}
              {employeeType === "telecaller" ? (
                <div className="space-y-1 sm:col-span-2">
                  <label
                    htmlFor="emp-reports-to"
                    className="text-xs font-medium text-neutral-800"
                  >
                    Assigned under which employee
                  </label>
                  <select
                    id="emp-reports-to"
                    value={reportsToEmployeeId}
                    onChange={(e) => setReportsToEmployeeId(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black"
                  >
                    <option value="">Select employee</option>
                    {employees
                      .filter(
                        (emp) => (emp.type || "employee") === "employee"
                      )
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} – {emp.role || "Employee"}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    This telecaller&apos;s work will be linked to the selected employee.
                  </p>
                </div>
              ) : null}

              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs font-medium text-neutral-800">Status</p>
                <div className="mt-1 flex gap-3 text-xs">
                  <label className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-800">
                    <input
                      type="radio"
                      name="emp-status"
                      value="Active"
                      checked={status === "Active"}
                      onChange={() => setStatus("Active")}
                    />
                    <span>Active</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg_WHITE px-3 py-1.5 text-neutral-800">
                    <input
                      type="radio"
                      name="emp-status"
                      value="Inactive"
                      checked={status === "Inactive"}
                      onChange={() => setStatus("Inactive")}
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
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-medium text_WHITE shadow-sm transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-800/60"
                >
                  {saving ? "Saving..." : "Save employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <p className="text-sm font-semibold text-neutral-900">
              Delete employee?
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {deleteTarget.name
                ? `You are about to remove “${deleteTarget.name}”. They will no longer be able to access the employee portal.`
                : "This employee will no longer be able to access the employee portal."}
            </p>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full px-4 py-2 font-medium text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  if (target) {
                    await handleDeleteEmployee(target.id);
                  }
                }}
                className="rounded-full bg-red-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

