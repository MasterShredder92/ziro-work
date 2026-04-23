"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/* ─── Types ──────────────────────────────────────────────── */
type FamilyDetail = {
  id: string;
  name: string;
  status: string | null;
  // Primary contact
  primary_contact_name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  // Account settings
  autopay_enabled: boolean | null;
  billing_day: number | null;
  billing_status: string;
  notes: string | null;
  billing_notes: string | null;
  rate_tier: number;
  rate_tier_override: boolean;
  rate_tier_reason: string | null;
  notify_via_email: boolean;
  notify_via_sms: boolean;
};

type Tab = "overview" | "students" | "billing" | "documents";

/* ─── Helpers ────────────────────────────────────────────── */
function formatAddress(f: FamilyDetail): string | null {
  const parts = [
    f.address_line1,
    f.address_line2,
    [f.city, f.state].filter(Boolean).join(", "),
    f.postal_code,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function formatCurrency(val: number): string {
  return val.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/* ─── Tab nav ────────────────────────────────────────────── */
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "students", label: "Students" },
  { id: "billing", label: "Billing" },
  { id: "documents", label: "Documents" },
];

function TabNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="-mb-px flex gap-0" aria-label="Family tabs">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={[
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-600",
              ].join(" ")}
              aria-selected={isActive}
              role="tab"
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ─── Shared card wrapper ────────────────────────────────── */
function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* ─── Edit button placeholder ────────────────────────────── */
function EditButton() {
  return (
    <button
      disabled
      className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200 dark:text-zinc-400 dark:ring-zinc-700 transition-colors cursor-not-allowed opacity-60"
      title="Edit — coming soon"
    >
      Edit
    </button>
  );
}

/* ─── Field row ──────────────────────────────────────────── */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmpty =
    value === null || value === undefined || value === "" || value === false;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </dt>
      <dd className="text-sm text-zinc-700 dark:text-zinc-300">
        {isEmpty ? (
          <span className="text-zinc-400 dark:text-zinc-600">—</span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

/* ─── Boolean badge ──────────────────────────────────────── */
function BoolBadge({ value, trueLabel = "Yes", falseLabel = "No" }: { value: boolean | null; trueLabel?: string; falseLabel?: string }) {
  if (value === null || value === undefined) {
    return <span className="text-zinc-400 dark:text-zinc-600">—</span>;
  }
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        value
          ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
      ].join(" ")}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}

/* ─── Billing status badge ───────────────────────────────── */
function BillingStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ";
  if (s === "current" || s === "paid") {
    cls += "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400";
  } else if (s === "overdue" || s === "past_due") {
    cls += "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400";
  } else if (s === "paused") {
    cls += "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400";
  } else {
    cls += "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  }
  return <span className={cls}>{status.replace(/_/g, " ")}</span>;
}

/* ─── Primary Contact card ───────────────────────────────── */
function PrimaryContactCard({ family }: { family: FamilyDetail }) {
  const address = formatAddress(family);
  return (
    <Card title="Primary Contact" action={<EditButton />}>
      <dl className="flex flex-col gap-4">
        <Field label="Contact Name" value={family.primary_contact_name} />
        <Field
          label="Email"
          value={
            family.primary_email ? (
              <a
                href={`mailto:${family.primary_email}`}
                className="text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                {family.primary_email}
              </a>
            ) : null
          }
        />
        <Field
          label="Phone"
          value={
            family.primary_phone ? (
              <a
                href={`tel:${family.primary_phone}`}
                className="text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                {family.primary_phone}
              </a>
            ) : null
          }
        />
        <Field label="Address" value={address} />
      </dl>
    </Card>
  );
}

/* ─── Account Settings card ──────────────────────────────── */
function AccountSettingsCard({ family }: { family: FamilyDetail }) {
  return (
    <Card title="Account Settings">
      <dl className="flex flex-col gap-4">
        <Field
          label="Autopay"
          value={<BoolBadge value={family.autopay_enabled} trueLabel="Enabled" falseLabel="Disabled" />}
        />
        <Field
          label="Billing Day"
          value={family.billing_day !== null ? `Day ${family.billing_day} of month` : null}
        />
        <Field
          label="Billing Status"
          value={<BillingStatusBadge status={family.billing_status} />}
        />
        <Field
          label="Rate / Session"
          value={family.rate_tier ? formatCurrency(family.rate_tier) : null}
        />
        {family.rate_tier_override && (
          <Field
            label="Rate Override"
            value={
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {family.rate_tier_reason ?? "Manual override applied"}
              </span>
            }
          />
        )}
        <Field label="Notes" value={family.notes ?? family.billing_notes} />
      </dl>
    </Card>
  );
}

/* ─── Overview tab ───────────────────────────────────────── */
function OverviewTab({ familyId }: { familyId: string }) {
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/crm/families/${familyId}`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) throw new Error(`Failed to load family (${res.status})`);
        const json = await res.json();
        setFamily(json.data ?? json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load family data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [familyId]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
        {[0, 1].map((i) => (
          <div key={i} className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error ?? "Could not load family data."}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <PrimaryContactCard family={family} />
      <AccountSettingsCard family={family} />
    </div>
  );
}

/* ─── Student types ──────────────────────────────────────── */
type FamilyStudent = {
  id: string;
  first_name: string;
  last_name: string;
  instrument: string | null;
  status: string | null;
  teacher_id: string | null;
};

/* ─── Student status badge ───────────────────────────────── */
function StudentStatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  let cls = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ";
  if (s === "active") {
    cls += "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400";
  } else if (s === "paused") {
    cls += "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400";
  } else if (s === "inactive" || s === "withdrawn") {
    cls += "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  } else if (s === "trial") {
    cls += "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400";
  } else {
    cls += "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  }
  return <span className={cls}>{status ?? "Unknown"}</span>;
}

/* ─── Student card ───────────────────────────────────────── */
function StudentCard({ student }: { student: FamilyStudent & { teacherName?: string } }) {
  const initials = [student.first_name[0], student.last_name[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return (
    <a
      href={`/students/${student.id}`}
      className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      {/* Avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-300">
          {student.first_name} {student.last_name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {student.instrument && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{student.instrument}</span>
          )}
          {student.instrument && student.teacherName && (
            <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>·</span>
          )}
          {student.teacherName && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{student.teacherName}</span>
          )}
        </div>
      </div>

      {/* Status + arrow */}
      <div className="flex shrink-0 items-center gap-3">
        <StudentStatusBadge status={student.status} />
        <svg
          className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );
}

/* ─── Students empty state ───────────────────────────────── */
function StudentsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <svg
        className="h-12 w-12 text-zinc-200 dark:text-zinc-700"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <p className="text-sm font-medium text-zinc-400 dark:text-zinc-600">
        No students enrolled in this family yet
      </p>
      <button
        disabled
        className="mt-1 rounded-md px-4 py-2 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200 dark:text-zinc-400 dark:ring-zinc-700 cursor-not-allowed opacity-60"
        title="Add Student — coming soon"
      >
        + Add Student
      </button>
    </div>
  );
}

/* ─── Students tab ───────────────────────────────────────── */
function StudentsTab({ familyId }: { familyId: string }) {
  const [students, setStudents] = useState<(FamilyStudent & { teacherName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch students for this family
        const res = await fetch(
          `/api/crm/students?family_id=${familyId}&page_size=50`,
          { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }
        );
        if (!res.ok) throw new Error(`Failed to load students (${res.status})`);
        const json = await res.json();
        const list: FamilyStudent[] = json.data?.items ?? json.data ?? [];

        // Resolve teacher names (non-blocking, best-effort)
        const teacherIds = [...new Set(list.map((s) => s.teacher_id).filter(Boolean))] as string[];
        const teacherMap: Record<string, string> = {};
        await Promise.all(
          teacherIds.map(async (tid) => {
            try {
              const tr = await fetch(`/api/crm/teachers/${tid}`, {
                headers: { "x-tenant-id": DEFAULT_TENANT_ID },
              });
              if (!tr.ok) return;
              const tj = await tr.json();
              const t = tj.data ?? tj;
              teacherMap[tid] =
                t.display_name ??
                [t.first_name, t.last_name].filter(Boolean).join(" ") ??
                "";
            } catch {
              // ignore — teacher name is optional
            }
          })
        );

        setStudents(
          list.map((s) => ({
            ...s,
            teacherName: s.teacher_id ? teacherMap[s.teacher_id] : undefined,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load students");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [familyId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (students.length === 0) return <StudentsEmptyState />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {students.length} student{students.length !== 1 ? "s" : ""} enrolled
        </p>
      </div>
      {students.map((s) => (
        <StudentCard key={s.id} student={s} />
      ))}
    </div>
  );
}

/* ─── Invoice types ─────────────────────────────────────── */
type Invoice = {
  id: string;
  number: string | null;
  due_date: string | null;
  total_cents: number;
  amount_paid_cents: number;
  balance_cents: number;
  status: string;
  created_at: string;
};

type BillingFamily = {
  balance: number;
  overdue_balance_cents: number;
  lifetime_paid_cents: number;
};

/* ─── Currency helpers ──────────────────────────────────── */
function cents(val: number): string {
  return (val / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function dollars(val: number): string {
  return val.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/* ─── Invoice status badge ────────────────────────────────── */
function InvoiceStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ";
  if (s === "paid") {
    cls += "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400";
  } else if (s === "overdue" || s === "past_due") {
    cls += "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400";
  } else if (s === "open" || s === "sent") {
    cls += "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400";
  } else if (s === "void" || s === "voided") {
    cls += "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  } else if (s === "draft") {
    cls += "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400";
  } else {
    cls += "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  }
  return <span className={cls}>{status.replace(/_/g, " ")}</span>;
}

/* ─── Metric card ─────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className={["text-xl font-bold", valueClass ?? "text-zinc-900 dark:text-zinc-100"].join(" ")}>
        {value}
      </p>
    </div>
  );
}

/* ─── Billing empty state ────────────────────────────────── */
function BillingEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <svg
        className="h-12 w-12 text-zinc-200 dark:text-zinc-700"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm font-medium text-zinc-400 dark:text-zinc-600">
        No invoices found for this family
      </p>
      <button
        disabled
        className="mt-1 rounded-md px-4 py-2 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200 dark:text-zinc-400 dark:ring-zinc-700 cursor-not-allowed opacity-60"
        title="Create Invoice — coming soon"
      >
        + Create Invoice
      </button>
    </div>
  );
}

/* ─── Billing tab ─────────────────────────────────────────── */
function BillingTab({ familyId }: { familyId: string }) {
  const [family, setFamily] = useState<BillingFamily | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [famRes, invRes] = await Promise.all([
          fetch(`/api/crm/families/${familyId}`, {
            headers: { "x-tenant-id": DEFAULT_TENANT_ID },
          }),
          fetch(
            `/api/billing/invoices?family_id=${familyId}&page_size=10&sort=created_at:desc`,
            { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }
          ),
        ]);

        if (!famRes.ok) throw new Error(`Failed to load family (${famRes.status})`);
        const famJson = await famRes.json();
        const f = famJson.data ?? famJson;
        setFamily({
          balance: f.balance ?? 0,
          overdue_balance_cents: f.overdue_balance_cents ?? 0,
          lifetime_paid_cents: f.lifetime_paid_cents ?? 0,
        });

        if (invRes.ok) {
          const invJson = await invRes.json();
          const list = invJson.data?.items ?? invJson.data ?? invJson.items ?? [];
          setInvoices(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load billing data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [familyId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  const balanceClass =
    (family?.balance ?? 0) > 0
      ? "text-red-600 dark:text-red-400"
      : (family?.balance ?? 0) < 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-zinc-900 dark:text-zinc-100";

  return (
    <div className="flex flex-col gap-5">
      {/* ── Financial summary ─────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Current Balance"
          value={dollars(family?.balance ?? 0)}
          valueClass={balanceClass}
        />
        <MetricCard
          label="Overdue"
          value={cents(family?.overdue_balance_cents ?? 0)}
          valueClass={
            (family?.overdue_balance_cents ?? 0) > 0
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-900 dark:text-zinc-100"
          }
        />
        <MetricCard
          label="Lifetime Paid"
          value={cents(family?.lifetime_paid_cents ?? 0)}
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* ── Invoices ────────────────────────────────────────────── */}
      {invoices.length === 0 ? (
        <BillingEmptyState />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Recent Invoices
            </h2>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {invoices.length} shown
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  {["Invoice", "Due Date", "Total", "Paid", "Balance", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {inv.number ?? inv.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300">
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {cents(inv.total_cents)}
                    </td>
                    <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400">
                      {cents(inv.amount_paid_cents)}
                    </td>
                    <td
                      className={[
                        "px-5 py-3 font-medium",
                        inv.balance_cents > 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-zinc-500 dark:text-zinc-400",
                      ].join(" ")}
                    >
                      {cents(inv.balance_cents)}
                    </td>
                    <td className="px-5 py-3">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={`/billing/invoices/${inv.id}`}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200 transition-colors hover:text-zinc-700 hover:ring-zinc-300 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:text-zinc-200"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Documents types ───────────────────────────────────── */
type FamilyFile = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number | null;
  signwell_status: string | null;
  notes: string | null;
  created_at: string | null;
};

type StudentFile = {
  id: string;
  student_id: string;
  student_name: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  folder: string;
  created_at: string;
};

/* ─── SignWell status badge ──────────────────────────────── */
function SignwellBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const s = status.toLowerCase();
  let cls = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ";
  if (s === "completed" || s === "signed") {
    cls += "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400";
  } else if (s === "pending" || s === "sent") {
    cls += "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400";
  } else if (s === "declined" || s === "expired") {
    cls += "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400";
  } else {
    cls += "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  }
  return <span className={cls}>{status.replace(/_/g, " ")}</span>;
}

/* ─── File size formatter ─────────────────────────────────── */
function fmtBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ─── File type icon ───────────────────────────────────────── */
function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "🖼️";
  if (["mp3", "wav", "m4a"].includes(ext)) return "🎧";
  if (["mp4", "mov", "avi"].includes(ext)) return "🎥";
  if (["zip", "rar", "7z"].includes(ext)) return "🗂️";
  return "📁";
}

/* ─── Upload dropzone ─────────────────────────────────────── */
function UploadDropzone({
  onUpload,
  uploading,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={[
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors",
        dragging
          ? "border-zinc-400 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-800/50"
          : "border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30",
      ].join(" ")}
    >
      <svg
        className="h-8 w-8 text-zinc-300 dark:text-zinc-600"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        Drag & drop a file here, or{" "}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-100 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "select a file"}
        </button>
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ─── Documents tab ───────────────────────────────────────── */
function DocumentsTab({ familyId }: { familyId: string }) {
  const [familyFiles, setFamilyFiles] = useState<FamilyFile[]>([]);
  const [studentFiles, setStudentFiles] = useState<StudentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadFiles() {
    setLoading(true);
    setError(null);
    try {
      const [famRes, studRes] = await Promise.all([
        fetch(`/api/crm/families/${familyId}/files`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        }),
        fetch(`/api/crm/families/${familyId}/student-files`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        }),
      ]);
      if (famRes.ok) {
        const j = await famRes.json();
        setFamilyFiles(j.data?.items ?? j.items ?? []);
      }
      if (studRes.ok) {
        const j = await studRes.json();
        setStudentFiles(j.data?.items ?? j.items ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (familyId) loadFiles();
  }, [familyId]);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/crm/families/${familyId}/files`, {
        method: "POST",
        headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      console.log("[DocumentsTab] upload result:", await res.json());
      setUploadMsg({ type: "ok", text: `“${file.name}” uploaded successfully` });
      await loadFiles();
    } catch (err) {
      setUploadMsg({ type: "err", text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-40 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── Section 1: Account Documents & Contracts ───────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Account Documents &amp; Contracts
        </h2>

        <UploadDropzone onUpload={handleUpload} uploading={uploading} />

        {uploadMsg && (
          <p
            className={[
              "mt-2 text-xs",
              uploadMsg.type === "ok"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400",
            ].join(" ")}
          >
            {uploadMsg.text}
          </p>
        )}

        {familyFiles.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 py-10 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              No account documents uploaded yet
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  {["File", "Size", "Date", "Signature", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {familyFiles.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-5 py-3">
                      <span className="mr-2">{fileIcon(f.file_name)}</span>
                      <span className="truncate text-zinc-800 dark:text-zinc-200">{f.file_name}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {fmtBytes(f.file_size_bytes)}
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {fmtDate(f.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <SignwellBadge status={f.signwell_status} />
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={f.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-700 hover:ring-zinc-300 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:text-zinc-200"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Section 2: Student Learning Files ─────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Student Learning Files
        </h2>
        <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
          Files uploaded by teachers on individual student profiles.
        </p>

        {studentFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 py-10 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              No student files have been shared with this family yet
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  {["File", "Student", "Size", "Date", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {studentFiles.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-5 py-3">
                      <span className="mr-2">{fileIcon(f.file_name)}</span>
                      <span className="truncate text-zinc-800 dark:text-zinc-200">{f.file_name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {f.student_name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {fmtBytes(f.file_size)}
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {fmtDate(f.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={f.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-700 hover:ring-zinc-300 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:text-zinc-200"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

/* ─── Placeholder tab ────────────────────────────────────── */
function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-16 dark:border-zinc-800">
      <p className="text-sm text-zinc-400 dark:text-zinc-600">{label} — coming soon</p>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────── */
export function FamilyAccountContent() {
  const params = useParams<{ id: string }>();
  const familyId = params?.id ?? "";

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="flex flex-col gap-0">
      <TabNav active={activeTab} onChange={setActiveTab} />
      <div className="pt-5">
        {activeTab === "overview" && <OverviewTab familyId={familyId} />}
        {activeTab === "students" && <StudentsTab familyId={familyId} />}
        {activeTab === "billing" && <BillingTab familyId={familyId} />}
        {activeTab === "documents" && <DocumentsTab familyId={familyId} />}
      </div>
    </div>
  );
}
