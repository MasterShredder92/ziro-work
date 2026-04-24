"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/* ─── Location Brand Colors ──────────────────────────────────
   Bellevue: Royal Purple | Gretna: Emerald | Omaha: Crimson | Elkhorn: Royal Blue
*/
const LOCATION_COLORS: Record<string, string> = {
  bellevue: "#7c3aed",
  gretna:   "#059669",
  omaha:    "#b91c1c",
  elkhorn:  "#1d4ed8",
};
function locationBrandColor(name: string | null): string {
  if (!name) return "#00D16C";
  const n = name.toLowerCase();
  for (const [key, val] of Object.entries(LOCATION_COLORS)) {
    if (n.includes(key)) return val;
  }
  return "#00D16C";
}

/* ─── Adaptive theme tokens ──────────────────────────────────
   All values reference CSS variables set by the app's theme.
   Dark mode: --z-bg is dark, --z-fg is white, etc.
   Light mode: --z-bg is white, --z-fg is dark, etc.
   No hardcoded hex values for backgrounds or text.
*/
const T = {
  bg:        "var(--z-bg, var(--z-surface))",
  surface:   "var(--z-surface)",
  surface2:  "var(--z-surface-2, var(--z-surface))",
  border:    "var(--z-border)",
  fg:        "var(--z-fg)",
  muted:     "var(--z-muted)",
  label:     "var(--z-muted)",
  shadow:    "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
  shadowHover: "0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)",
};

/* ─── Types ──────────────────────────────────────────────── */
type FamilyDetail = {
  id: string;
  name: string;
  status: string | null;
  primary_contact_name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
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
  is_military: boolean | null;
  primary_location_id: string | null;
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

/* ─── Fading Brand Border Card ───────────────────────────────
   3px left gradient stripe: brandColor → transparent at 50%.
   Uses positioned inner div — border-image kills border-radius.
   Background and border use CSS variables for adaptive theme.
*/
function BrandCard({
  brandColor,
  children,
  style,
  className,
}: {
  brandColor: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        background: T.surface,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        borderLeft: "none",
        boxShadow: T.shadow,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Fading left stripe */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(to bottom, ${brandColor} 0%, ${brandColor}00 50%)`,
          borderRadius: "12px 0 0 12px",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

/* ─── Tab nav ────────────────────────────────────────────── */
const TABS: { id: Tab; label: string }[] = [
  { id: "overview",  label: "Overview"  },
  { id: "students",  label: "Students"  },
  { id: "billing",   label: "Billing"   },
  { id: "documents", label: "Documents" },
];

function TabNav({ active, onChange, brandColor }: { active: Tab; onChange: (t: Tab) => void; brandColor: string }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <nav className="-mb-px flex gap-0" aria-label="Family tabs">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="px-4 py-3 text-sm whitespace-nowrap transition-colors"
              style={{
                borderBottom: isActive ? `2px solid ${brandColor}` : "2px solid transparent",
                color: isActive ? T.fg : T.muted,
                fontWeight: isActive ? 700 : 500,
                background: "transparent",
              }}
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

/* ─── Field row ──────────────────────────────────────────── */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmpty = value === null || value === undefined || value === "" || value === false;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>{label}</dt>
      <dd className="text-sm" style={{ color: T.fg }}>
        {isEmpty ? <span style={{ color: T.label }}>—</span> : value}
      </dd>
    </div>
  );
}

/* ─── Boolean badge ──────────────────────────────────────── */
function BoolBadge({ value, trueLabel = "Yes", falseLabel = "No" }: { value: boolean | null; trueLabel?: string; falseLabel?: string }) {
  if (value === null || value === undefined) return <span style={{ color: T.label }}>—</span>;
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={value
        ? { background: "rgba(16,185,129,0.12)", color: "#059669" }
        : { background: "rgba(107,114,128,0.1)", color: "#6b7280" }}>
      {value ? trueLabel : falseLabel}
    </span>
  );
}

/* ─── Billing status badge ───────────────────────────────── */
function BillingStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let bg = "rgba(107,114,128,0.1)", color = "#6b7280";
  if (s === "current" || s === "paid")          { bg = "rgba(16,185,129,0.12)"; color = "#059669"; }
  else if (s === "overdue" || s === "past_due") { bg = "rgba(185,28,28,0.1)";   color = "#b91c1c"; }
  else if (s === "paused")                      { bg = "rgba(37,99,235,0.12)";  color = "#2563eb"; }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{ background: bg, color }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

/* ─── Inline input with brand focus ring ─────────────────── */
function BrandInput({
  brandColor,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  brandColor: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "6px 10px",
        borderRadius: 8,
        border: `1px solid ${focused ? brandColor : T.border}`,
        boxShadow: focused ? `0 0 0 3px ${brandColor}22` : "none",
        background: T.bg,
        color: T.fg,
        fontSize: 14,
        outline: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    />
  );
}

/* ─── BrandSelect ────────────────────────────────────────── */
function BrandSelect({
  brandColor,
  value,
  onChange,
  children,
}: {
  brandColor: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "6px 10px",
        borderRadius: 8,
        border: `1px solid ${focused ? brandColor : T.border}`,
        boxShadow: focused ? `0 0 0 3px ${brandColor}22` : "none",
        background: T.bg,
        color: T.fg,
        fontSize: 14,
        outline: "none",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {children}
    </select>
  );
}

/* ─── Card action buttons ────────────────────────────────── */
function CardActions({
  editing,
  saving,
  saveState,
  saveError,
  onEdit,
  onCancel,
  onSave,
}: {
  editing: boolean;
  saving: boolean;
  saveState: "idle" | "saved" | "error";
  saveError: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (editing) {
    return (
      <div className="flex items-center gap-2">
        {saving && <span className="text-xs" style={{ color: T.muted }}>Saving…</span>}
        {saveState === "error" && !saving && (
          <span className="text-xs" style={{ color: "#b91c1c" }} title={saveError ?? undefined}>Error</span>
        )}
        <button onClick={onCancel} disabled={saving}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ background: T.surface2, color: T.muted, border: `1px solid ${T.border}` }}>
          Cancel
        </button>
        <button onClick={onSave} disabled={saving}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-80 transition-opacity"
          style={{ background: T.fg, color: T.bg }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {saveState === "saved" && <span className="text-xs" style={{ color: "#059669" }}>✓ Saved</span>}
      <button onClick={onEdit}
        className="rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
        style={{ background: T.surface2, color: T.fg, border: `1px solid ${T.border}` }}>
        Edit
      </button>
    </div>
  );
}

/* ─── Primary Contact Card ───────────────────────────────── */
function PrimaryContactCard({ family, familyId, brandColor, onUpdate }: {
  family: FamilyDetail;
  familyId: string;
  brandColor: string;
  onUpdate: (patch: Partial<FamilyDetail>) => void;
}) {
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name,  setName]  = useState(family.primary_contact_name ?? "");
  const [email, setEmail] = useState(family.primary_email ?? "");
  const [phone, setPhone] = useState(family.primary_phone ?? "");

  useEffect(() => {
    setName(family.primary_contact_name ?? "");
    setEmail(family.primary_email ?? "");
    setPhone(family.primary_phone ?? "");
  }, [family.primary_contact_name, family.primary_email, family.primary_phone]);

  function handleCancel() {
    setName(family.primary_contact_name ?? "");
    setEmail(family.primary_email ?? "");
    setPhone(family.primary_phone ?? "");
    setEditing(false);
    setSaveState("idle");
  }

  async function handleSave() {
    setSaving(true);
    setSaveState("idle");
    setSaveError(null);
    try {
      const res = await fetch(`/api/crm/families/${familyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-id": DEFAULT_TENANT_ID },
        body: JSON.stringify({ primary_contact_name: name || null, primary_email: email || null, primary_phone: phone || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
      onUpdate({ primary_contact_name: name || null, primary_email: email || null, primary_phone: phone || null });
      setSaveState("saved");
      setEditing(false);
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const address = formatAddress(family);

  return (
    <BrandCard brandColor={brandColor}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
        <h2 className="text-sm font-semibold" style={{ color: T.fg }}>Primary Contact</h2>
        <CardActions
          editing={editing} saving={saving} saveState={saveState} saveError={saveError}
          onEdit={() => setEditing(true)} onCancel={handleCancel} onSave={handleSave}
        />
      </div>
      <div className="px-5 py-4">
        <dl className="flex flex-col gap-4">
          {editing ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Contact Name</label>
                <BrandInput brandColor={brandColor} value={name} onChange={setName} placeholder="Full name" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Email</label>
                <BrandInput brandColor={brandColor} type="email" value={email} onChange={setEmail} placeholder="email@example.com" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Phone</label>
                <BrandInput brandColor={brandColor} type="tel" value={phone} onChange={setPhone} placeholder="(555) 000-0000" />
              </div>
            </>
          ) : (
            <>
              <Field label="Contact Name" value={family.primary_contact_name} />
              <Field label="Email" value={
                family.primary_email
                  ? <a href={`mailto:${family.primary_email}`} className="underline underline-offset-2 hover:opacity-70" style={{ color: T.fg }}>{family.primary_email}</a>
                  : null
              } />
              <Field label="Phone" value={
                family.primary_phone
                  ? <a href={`tel:${family.primary_phone}`} className="underline underline-offset-2 hover:opacity-70" style={{ color: T.fg }}>{family.primary_phone}</a>
                  : null
              } />
              <Field label="Address" value={address} />
            </>
          )}
        </dl>
      </div>
    </BrandCard>
  );
}

/* ─── Account Settings Card ──────────────────────────────── */
function AccountSettingsCard({ family, familyId, brandColor, onUpdate }: {
  family: FamilyDetail;
  familyId: string;
  brandColor: string;
  onUpdate: (patch: Partial<FamilyDetail>) => void;
}) {
  const router = useRouter();
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [draftStatus,   setDraftStatus]   = useState(family.status ?? "active");
  const [draftMilitary, setDraftMilitary] = useState(family.is_military ?? false);

  useEffect(() => {
    setDraftStatus(family.status ?? "active");
    setDraftMilitary(family.is_military ?? false);
  }, [family.status, family.is_military]);

  function handleCancel() {
    setDraftStatus(family.status ?? "active");
    setDraftMilitary(family.is_military ?? false);
    setEditing(false);
    setSaveState("idle");
  }

  async function handleSave() {
    setSaving(true);
    setSaveState("idle");
    setSaveError(null);
    try {
      const res = await fetch(`/api/crm/families/${familyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-id": DEFAULT_TENANT_ID },
        body: JSON.stringify({ status: draftStatus, is_military: draftMilitary }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
      onUpdate({ status: draftStatus, is_military: draftMilitary });
      setSaveState("saved");
      setEditing(false);
      router.refresh();
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BrandCard brandColor={brandColor}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
        <h2 className="text-sm font-semibold" style={{ color: T.fg }}>Account Settings</h2>
        <CardActions
          editing={editing} saving={saving} saveState={saveState} saveError={saveError}
          onEdit={() => setEditing(true)} onCancel={handleCancel} onSave={handleSave}
        />
      </div>
      <div className="px-5 py-4">
        <dl className="flex flex-col gap-4">
          {editing ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Family Status</label>
                <BrandSelect brandColor={brandColor} value={draftStatus} onChange={setDraftStatus}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </BrandSelect>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Military Discount</label>
                <button
                  type="button"
                  onClick={() => setDraftMilitary(v => !v)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ background: draftMilitary ? brandColor : "rgba(107,114,128,0.3)" }}>
                  <span className="inline-block h-4 w-4 transform rounded-full shadow transition-transform"
                    style={{
                      background: "var(--z-fg, #fff)",
                      transform: draftMilitary ? "translateX(22px)" : "translateX(2px)",
                    }} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Field label="Family Status" value={
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                  style={
                    (family.status ?? "").toLowerCase() === "active"
                      ? { background: "rgba(16,185,129,0.12)", color: "#059669" }
                      : { background: "rgba(107,114,128,0.1)", color: "#6b7280" }
                  }>
                  {family.status ?? "—"}
                </span>
              } />
              <Field label="Military Discount" value={<BoolBadge value={family.is_military} trueLabel="Yes — ★ MIL" falseLabel="No" />} />
            </>
          )}

          {/* Always-visible read-only fields */}
          <Field label="Autopay"        value={<BoolBadge value={family.autopay_enabled} trueLabel="Enabled" falseLabel="Disabled" />} />
          <Field label="Billing Day"    value={family.billing_day !== null ? `Day ${family.billing_day} of month` : null} />
          <Field label="Billing Status" value={<BillingStatusBadge status={family.billing_status} />} />
          <Field label="Rate / Session" value={family.rate_tier ? formatCurrency(family.rate_tier) : null} />
          {family.rate_tier_override && (
            <Field label="Rate Override" value={
              <span className="text-xs" style={{ color: T.muted }}>{family.rate_tier_reason ?? "Manual override applied"}</span>
            } />
          )}
          <Field label="Notes" value={family.notes ?? family.billing_notes} />
        </dl>
      </div>
    </BrandCard>
  );
}

/* ─── Overview tab ───────────────────────────────────────── */
function OverviewTab({ familyId, brandColor }: { familyId: string; brandColor: string }) {
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
        {[0, 1].map(i => <div key={i} className="h-64 rounded-xl" style={{ background: T.surface }} />)}
      </div>
    );
  }
  if (error || !family) {
    return (
      <div className="rounded-lg px-4 py-3 text-sm"
        style={{ background: "rgba(185,28,28,0.08)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.2)" }}>
        {error ?? "Could not load family data."}
      </div>
    );
  }

  function handleUpdate(patch: Partial<FamilyDetail>) {
    setFamily(f => f ? { ...f, ...patch } : f);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <PrimaryContactCard family={family} familyId={familyId} brandColor={brandColor} onUpdate={handleUpdate} />
      <AccountSettingsCard family={family} familyId={familyId} brandColor={brandColor} onUpdate={handleUpdate} />
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
  let bg = "rgba(107,114,128,0.1)", color = "#6b7280";
  if (s === "active")  { bg = "rgba(16,185,129,0.12)"; color = "#059669"; }
  if (s === "paused")  { bg = "rgba(37,99,235,0.12)";  color = "#2563eb"; }
  if (s === "trial")   { bg = "rgba(245,158,11,0.12)"; color = "#d97706"; }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{ background: bg, color }}>
      {status ?? "Unknown"}
    </span>
  );
}

/* ─── Student card with fading brand border ──────────────── */
function StudentCard({ student, brandColor }: { student: FamilyStudent & { teacherName?: string }; brandColor: string }) {
  const inits = [student.first_name[0], student.last_name[0]].filter(Boolean).join("").toUpperCase();
  return (
    <BrandCard brandColor={brandColor} className="group transition-all hover:shadow-md" style={{ cursor: "pointer" }}>
      <a href={`/students/${student.id}`} className="flex items-center gap-4 px-5 py-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: T.surface2, color: T.muted }}>
          {inits}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: T.fg }}>
            {student.first_name} {student.last_name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {student.instrument && <span className="text-xs" style={{ color: T.muted }}>{student.instrument}</span>}
            {student.instrument && student.teacherName && <span style={{ color: T.muted }}>·</span>}
            {student.teacherName && <span className="text-xs" style={{ color: T.muted }}>{student.teacherName}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <StudentStatusBadge status={student.status} />
          <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" style={{ color: T.muted }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </a>
    </BrandCard>
  );
}

/* ─── Students tab ───────────────────────────────────────── */
function StudentsTab({ familyId, brandColor }: { familyId: string; brandColor: string }) {
  const [students, setStudents] = useState<(FamilyStudent & { teacherName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/crm/students?familyId=${familyId}&page_size=50`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) throw new Error(`Failed to load students (${res.status})`);
        const json = await res.json();
        const list: FamilyStudent[] = json.data?.items ?? json.data ?? [];

        const teacherIds = [...new Set(list.map(s => s.teacher_id).filter(Boolean))] as string[];
        const teacherMap: Record<string, string> = {};
        await Promise.all(teacherIds.map(async (tid) => {
          try {
            const tr = await fetch(`/api/crm/teachers/${tid}`, { headers: { "x-tenant-id": DEFAULT_TENANT_ID } });
            if (!tr.ok) return;
            const tj = await tr.json();
            const t = tj.data ?? tj;
            teacherMap[tid] = t.display_name ?? [t.first_name, t.last_name].filter(Boolean).join(" ") ?? "";
          } catch { /* non-blocking */ }
        }));

        setStudents(list.map(s => ({ ...s, teacherName: s.teacher_id ? teacherMap[s.teacher_id] : undefined })));
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
        {[0, 1, 2].map(i => <div key={i} className="h-20 rounded-xl" style={{ background: T.surface }} />)}
      </div>
    );
  }
  if (error) {
    return <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(185,28,28,0.08)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.2)" }}>{error}</div>;
  }
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-14 text-center rounded-xl" style={{ border: `1px dashed ${T.border}` }}>
        <p className="text-sm font-medium" style={{ color: T.muted }}>No students enrolled in this family yet</p>
        <button disabled className="mt-1 rounded-lg px-4 py-2 text-xs font-medium cursor-not-allowed opacity-60"
          style={{ background: T.surface2, color: T.muted, border: `1px solid ${T.border}` }}>
          + Add Student
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium" style={{ color: T.muted }}>
        {students.length} student{students.length !== 1 ? "s" : ""} enrolled
      </p>
      {students.map(s => <StudentCard key={s.id} student={s} brandColor={brandColor} />)}
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
type BillingFamily = { balance: number; overdue_balance_cents: number; lifetime_paid_cents: number };

function cents(val: number): string {
  return (val / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function dollars(val: number): string {
  return val.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/* ─── Invoice status badge ────────────────────────────────── */
function InvoiceStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let bg = "rgba(107,114,128,0.1)", color = "#6b7280";
  if (s === "paid")                             { bg = "rgba(16,185,129,0.12)"; color = "#059669"; }
  else if (s === "overdue" || s === "past_due") { bg = "rgba(185,28,28,0.1)";  color = "#b91c1c"; }
  else if (s === "open" || s === "sent")        { bg = "rgba(37,99,235,0.12)"; color = "#2563eb"; }
  else if (s === "draft")                       { bg = "rgba(245,158,11,0.12)"; color = "#d97706"; }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{ background: bg, color }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

/* ─── Metric card ─────────────────────────────────────────── */
function MetricCard({ label, value, valueColor, brandColor }: { label: string; value: string; valueColor?: string; brandColor: string }) {
  return (
    <BrandCard brandColor={brandColor}>
      <div className="px-5 py-4 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>{label}</p>
        <p className="text-xl font-bold" style={{ color: valueColor ?? T.fg }}>{value}</p>
      </div>
    </BrandCard>
  );
}

/* ─── Billing tab ─────────────────────────────────────────── */
function BillingTab({ familyId, brandColor }: { familyId: string; brandColor: string }) {
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
          fetch(`/api/crm/families/${familyId}`, { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }),
          fetch(`/api/billing/invoices?family_id=${familyId}&page_size=10&sort=created_at:desc`, { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }),
        ]);
        if (!famRes.ok) throw new Error(`Failed to load family (${famRes.status})`);
        const famJson = await famRes.json();
        const f = famJson.data ?? famJson;
        setFamily({ balance: f.balance ?? 0, overdue_balance_cents: f.overdue_balance_cents ?? 0, lifetime_paid_cents: f.lifetime_paid_cents ?? 0 });
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
          {[0, 1, 2].map(i => <div key={i} className="h-20 rounded-xl" style={{ background: T.surface }} />)}
        </div>
        <div className="h-48 rounded-xl" style={{ background: T.surface }} />
      </div>
    );
  }
  if (error) {
    return <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(185,28,28,0.08)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.2)" }}>{error}</div>;
  }

  const balColor = (family?.balance ?? 0) > 0 ? "#b91c1c" : (family?.balance ?? 0) < 0 ? "#059669" : T.fg;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Current Balance" value={dollars(family?.balance ?? 0)} valueColor={balColor} brandColor={brandColor} />
        <MetricCard label="Overdue" value={cents(family?.overdue_balance_cents ?? 0)} valueColor={(family?.overdue_balance_cents ?? 0) > 0 ? "#b91c1c" : T.fg} brandColor={brandColor} />
        <MetricCard label="Lifetime Paid" value={cents(family?.lifetime_paid_cents ?? 0)} valueColor="#059669" brandColor={brandColor} />
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center rounded-xl" style={{ border: `1px dashed ${T.border}` }}>
          <p className="text-sm font-medium" style={{ color: T.muted }}>No invoices found for this family</p>
        </div>
      ) : (
        <BrandCard brandColor={brandColor}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
            <h2 className="text-sm font-semibold" style={{ color: T.fg }}>Recent Invoices</h2>
            <span className="text-xs" style={{ color: T.muted }}>{invoices.length} shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Invoice", "Due Date", "Total", "Paid", "Balance", "Status", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: T.label }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}
                    style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.surface2)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: T.muted }}>{inv.number ?? inv.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-5 py-3" style={{ color: T.fg }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: T.fg }}>{cents(inv.total_cents)}</td>
                    <td className="px-5 py-3" style={{ color: "#059669" }}>{cents(inv.amount_paid_cents)}</td>
                    <td className="px-5 py-3 font-medium" style={{ color: inv.balance_cents > 0 ? "#b91c1c" : T.muted }}>{cents(inv.balance_cents)}</td>
                    <td className="px-5 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3">
                      <a href={`/billing/invoices/${inv.id}`}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium hover:opacity-80 transition-opacity"
                        style={{ background: T.surface2, color: T.fg, border: `1px solid ${T.border}` }}>
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BrandCard>
      )}
    </div>
  );
}

/* ─── Documents types ───────────────────────────────────── */
type FamilyFile = { id: string; file_name: string; file_url: string; file_type: string; file_size_bytes: number | null; signwell_status: string | null; notes: string | null; created_at: string | null };
type StudentFile = { id: string; student_id: string; student_name: string; file_name: string; file_url: string; file_size: number | null; folder: string; created_at: string };

function SignwellBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const s = status.toLowerCase();
  let bg = "rgba(107,114,128,0.1)", color = "#6b7280";
  if (s === "completed" || s === "signed")       { bg = "rgba(16,185,129,0.12)";  color = "#059669"; }
  else if (s === "pending" || s === "sent")      { bg = "rgba(245,158,11,0.12)";  color = "#d97706"; }
  else if (s === "declined" || s === "expired")  { bg = "rgba(185,28,28,0.1)";    color = "#b91c1c"; }
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide" style={{ background: bg, color }}>{status.replace(/_/g, " ")}</span>;
}

function fmtBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
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
function UploadDropzone({ onUpload, uploading, brandColor }: { onUpload: (file: File) => void; uploading: boolean; brandColor: string }) {
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
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors"
      style={{ borderColor: dragging ? brandColor : T.border, background: dragging ? T.surface2 : "transparent" }}>
      <svg className="h-8 w-8" style={{ color: T.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <p className="text-sm" style={{ color: T.muted }}>
        Drag & drop a file here, or{" "}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="font-medium underline underline-offset-2 hover:opacity-70 disabled:opacity-50" style={{ color: T.fg }}>
          {uploading ? "Uploading…" : "select a file"}
        </button>
      </p>
      <input ref={inputRef} type="file" className="hidden"
        onChange={e => { const file = e.target.files?.[0]; if (file) onUpload(file); e.target.value = ""; }} />
    </div>
  );
}

/* ─── Documents tab ───────────────────────────────────────── */
function DocumentsTab({ familyId, brandColor }: { familyId: string; brandColor: string }) {
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
        fetch(`/api/crm/families/${familyId}/files`, { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }),
        fetch(`/api/crm/families/${familyId}/student-files`, { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }),
      ]);
      if (famRes.ok) { const j = await famRes.json(); setFamilyFiles(j.data?.items ?? j.items ?? []); }
      if (studRes.ok) { const j = await studRes.json(); setStudentFiles(j.data?.items ?? j.items ?? []); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (familyId) loadFiles(); }, [familyId]);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/crm/families/${familyId}/files`, {
        method: "POST", headers: { "x-tenant-id": DEFAULT_TENANT_ID }, body: form,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      setUploadMsg({ type: "ok", text: `"${file.name}" uploaded successfully` });
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
        <div className="h-28 rounded-xl" style={{ background: T.surface }} />
        <div className="h-40 rounded-xl" style={{ background: T.surface }} />
      </div>
    );
  }
  if (error) {
    return <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(185,28,28,0.08)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.2)" }}>{error}</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold" style={{ color: T.fg }}>Account Documents &amp; Contracts</h2>
        <UploadDropzone onUpload={handleUpload} uploading={uploading} brandColor={brandColor} />
        {uploadMsg && (
          <p className="mt-2 text-xs" style={{ color: uploadMsg.type === "ok" ? "#059669" : "#b91c1c" }}>{uploadMsg.text}</p>
        )}
        {familyFiles.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center" style={{ borderColor: T.border }}>
            <p className="text-sm" style={{ color: T.muted }}>No account documents uploaded yet</p>
          </div>
        ) : (
          <BrandCard brandColor={brandColor} style={{ marginTop: 16 }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["File", "Size", "Date", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: T.label }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {familyFiles.map(f => (
                  <tr key={f.id} style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.surface2)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td className="px-5 py-3" style={{ maxWidth: 220 }}>
                      <span className="mr-2">{fileIcon(f.file_name)}</span>
                      <span className="truncate" style={{ color: T.fg, maxWidth: 180, display: "inline-block", verticalAlign: "middle", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.file_name}>{f.file_name}</span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: T.muted }}>{fmtBytes(f.file_size_bytes)}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: T.muted }}>{fmtDate(f.created_at)}</td>
                    <td className="px-5 py-3">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {f.file_url ? (
                          <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                            className="rounded-lg px-2.5 py-1 text-xs font-medium hover:opacity-80 transition-opacity"
                            style={{ background: T.surface2, color: T.fg, border: `1px solid ${T.border}` }}>View</a>
                        ) : (
                          <span className="rounded-lg px-2.5 py-1 text-xs font-medium"
                            style={{ background: T.surface2, color: T.muted, border: `1px solid ${T.border}`, opacity: 0.5, cursor: "default" }}>Unavailable</span>
                        )}
                        <button
                          onClick={async () => {
                            if (!window.confirm("Are you sure you want to delete this document? This cannot be undone.")) return;
                            const res = await fetch(`/api/crm/families/${familyId}/files?fileId=${f.id}`, {
                              method: "DELETE", headers: { "x-tenant-id": DEFAULT_TENANT_ID },
                            });
                            if (res.ok) setFamilyFiles(prev => prev.filter(x => x.id !== f.id));
                            else alert("Delete failed. Please try again.");
                          }}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium hover:opacity-80 transition-opacity"
                          style={{ background: "rgba(185,28,28,0.08)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.2)", cursor: "pointer" }}
                          title="Delete document">
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BrandCard>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold" style={{ color: T.fg }}>Student Learning Files</h2>
        <p className="mb-4 text-xs" style={{ color: T.muted }}>Files uploaded by teachers on individual student profiles.</p>
        {studentFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center" style={{ borderColor: T.border }}>
            <p className="text-sm" style={{ color: T.muted }}>No student files have been shared with this family yet</p>
          </div>
        ) : (
          <BrandCard brandColor={brandColor}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["File", "Student", "Size", "Date", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: T.label }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentFiles.map(f => (
                  <tr key={f.id} style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.surface2)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td className="px-5 py-3" style={{ maxWidth: 220 }}>
                      <span className="mr-2">{fileIcon(f.file_name)}</span>
                      <span className="truncate" style={{ color: T.fg, maxWidth: 180, display: "inline-block", verticalAlign: "middle", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.file_name}>{f.file_name}</span>
                    </td>
                    <td className="px-5 py-3"><span className="text-xs font-medium" style={{ color: T.fg }}>{f.student_name}</span></td>
                    <td className="px-5 py-3 text-xs" style={{ color: T.muted }}>{fmtBytes(f.file_size)}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: T.muted }}>{fmtDate(f.created_at)}</td>
                    <td className="px-5 py-3">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {f.file_url ? (
                          <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                            className="rounded-lg px-2.5 py-1 text-xs font-medium hover:opacity-80 transition-opacity"
                            style={{ background: T.surface2, color: T.fg, border: `1px solid ${T.border}` }}>Download</a>
                        ) : (
                          <span className="rounded-lg px-2.5 py-1 text-xs font-medium"
                            style={{ background: T.surface2, color: T.muted, border: `1px solid ${T.border}`, opacity: 0.5, cursor: "default" }}>Unavailable</span>
                        )}
                        <button
                          onClick={async () => {
                            if (!window.confirm("Are you sure you want to delete this document? This cannot be undone.")) return;
                            const res = await fetch(`/api/crm/families/${familyId}/files?fileId=${f.id}`, {
                              method: "DELETE", headers: { "x-tenant-id": DEFAULT_TENANT_ID },
                            });
                            if (res.ok) setStudentFiles(prev => prev.filter(x => x.id !== f.id));
                            else alert("Delete failed. Please try again.");
                          }}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium hover:opacity-80 transition-opacity"
                          style={{ background: "rgba(185,28,28,0.08)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.2)", cursor: "pointer" }}
                          title="Delete document">
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BrandCard>
        )}
      </section>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────── */
export function FamilyAccountContent() {
  const params = useParams<{ id: string }>();
  const familyId = params?.id ?? "";
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [brandColor, setBrandColor] = useState<string>("#00D16C");

  useEffect(() => {
    if (!familyId) return;
    async function resolveColor() {
      try {
        const res = await fetch(`/api/crm/families/${familyId}`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) return;
        const json = await res.json();
        const f = json.data ?? json;
        if (f.primary_location_id) {
          const lr = await fetch(`/api/crm/locations/${f.primary_location_id}`, {
            headers: { "x-tenant-id": DEFAULT_TENANT_ID },
          });
          if (lr.ok) {
            const lj = await lr.json();
            const loc = lj.data ?? lj;
            setBrandColor(locationBrandColor(loc.name ?? null));
          }
        }
      } catch { /* non-blocking */ }
    }
    resolveColor();
  }, [familyId]);

  return (
    <div className="flex flex-col gap-0">
      <TabNav active={activeTab} onChange={setActiveTab} brandColor={brandColor} />
      <div className="pt-5">
        {activeTab === "overview"  && <OverviewTab  familyId={familyId} brandColor={brandColor} />}
        {activeTab === "students"  && <StudentsTab  familyId={familyId} brandColor={brandColor} />}
        {activeTab === "billing"   && <BillingTab   familyId={familyId} brandColor={brandColor} />}
        {activeTab === "documents" && <DocumentsTab familyId={familyId} brandColor={brandColor} />}
      </div>
    </div>
  );
}
