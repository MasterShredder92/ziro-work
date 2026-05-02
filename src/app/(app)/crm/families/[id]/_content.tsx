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

type Tab = "overview" | "billing" | "docs_notes";

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
  id,
}: {
  brandColor: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
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
  { id: "overview",   label: "Overview"    },
  { id: "billing",    label: "Billing"     },
  { id: "docs_notes", label: "Docs & Notes" },
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

  const [name,    setName]    = useState(family.primary_contact_name ?? "");
  const [email,   setEmail]   = useState(family.primary_email ?? "");
  const [phone,   setPhone]   = useState(family.primary_phone ?? "");
  const [addr1,   setAddr1]   = useState(family.address_line1 ?? "");
  const [addr2,   setAddr2]   = useState(family.address_line2 ?? "");
  const [city,    setCity]    = useState(family.city ?? "");
  const [state,   setState]   = useState(family.state ?? "");
  const [postal,  setPostal]  = useState(family.postal_code ?? "");

  useEffect(() => {
    setName(family.primary_contact_name ?? "");
    setEmail(family.primary_email ?? "");
    setPhone(family.primary_phone ?? "");
    setAddr1(family.address_line1 ?? "");
    setAddr2(family.address_line2 ?? "");
    setCity(family.city ?? "");
    setState(family.state ?? "");
    setPostal(family.postal_code ?? "");
  }, [family.primary_contact_name, family.primary_email, family.primary_phone, family.address_line1, family.address_line2, family.city, family.state, family.postal_code]);

  function handleCancel() {
    setName(family.primary_contact_name ?? "");
    setEmail(family.primary_email ?? "");
    setPhone(family.primary_phone ?? "");
    setAddr1(family.address_line1 ?? "");
    setAddr2(family.address_line2 ?? "");
    setCity(family.city ?? "");
    setState(family.state ?? "");
    setPostal(family.postal_code ?? "");
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
        body: JSON.stringify({
          primary_contact_name: name || null,
          primary_email: email || null,
          primary_phone: phone || null,
          address_line1: addr1 || null,
          address_line2: addr2 || null,
          city: city || null,
          state: state || null,
          postal_code: postal || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
      onUpdate({
        primary_contact_name: name || null,
        primary_email: email || null,
        primary_phone: phone || null,
        address_line1: addr1 || null,
        address_line2: addr2 || null,
        city: city || null,
        state: state || null,
        postal_code: postal || null,
      });
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
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Address Line 1</label>
                <BrandInput brandColor={brandColor} value={addr1} onChange={setAddr1} placeholder="123 Main St" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Address Line 2</label>
                <BrandInput brandColor={brandColor} value={addr2} onChange={setAddr2} placeholder="Apt, Suite, etc." />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>City</label>
                  <BrandInput brandColor={brandColor} value={city} onChange={setCity} placeholder="Omaha" />
                </div>
                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>State</label>
                  <BrandInput brandColor={brandColor} value={state} onChange={setState} placeholder="NE" />
                </div>
                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Zip</label>
                  <BrandInput brandColor={brandColor} value={postal} onChange={setPostal} placeholder="68102" />
                </div>
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

  const [draftStatus,        setDraftStatus]        = useState(family.status ?? "active");
  const [draftMilitary,      setDraftMilitary]      = useState(family.is_military ?? false);
  const [draftAutopay,       setDraftAutopay]       = useState(family.autopay_enabled ?? false);
  const [draftBillingDay,    setDraftBillingDay]    = useState(String(family.billing_day ?? ""));
  const [draftBillingStatus, setDraftBillingStatus] = useState(family.billing_status ?? "current");
  // rate_tier stored in cents — display/edit in dollars
  const [draftRate,          setDraftRate]          = useState(
    family.rate_tier ? String((family.rate_tier / 100).toFixed(2)) : ""
  );

  useEffect(() => {
    setDraftStatus(family.status ?? "active");
    setDraftMilitary(family.is_military ?? false);
    setDraftAutopay(family.autopay_enabled ?? false);
    setDraftBillingDay(String(family.billing_day ?? ""));
    setDraftBillingStatus(family.billing_status ?? "current");
    setDraftRate(family.rate_tier ? String((family.rate_tier / 100).toFixed(2)) : "");
  }, [family.status, family.is_military, family.autopay_enabled, family.billing_day, family.billing_status, family.rate_tier]);

  function handleCancel() {
    setDraftStatus(family.status ?? "active");
    setDraftMilitary(family.is_military ?? false);
    setDraftAutopay(family.autopay_enabled ?? false);
    setDraftBillingDay(String(family.billing_day ?? ""));
    setDraftBillingStatus(family.billing_status ?? "current");
    setDraftRate(family.rate_tier ? String((family.rate_tier / 100).toFixed(2)) : "");
    setEditing(false);
    setSaveState("idle");
  }

  async function handleSave() {
    setSaving(true);
    setSaveState("idle");
    setSaveError(null);
    // Convert dollars back to cents for storage
    const rateInCents = draftRate ? Math.round(parseFloat(draftRate) * 100) : null;
    try {
      const res = await fetch(`/api/crm/families/${familyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-tenant-id": DEFAULT_TENANT_ID },
        body: JSON.stringify({
          status: draftStatus,
          is_military: draftMilitary,
          autopay_enabled: draftAutopay,
          billing_day: draftBillingDay ? parseInt(draftBillingDay, 10) : null,
          billing_status: draftBillingStatus,
          rate_tier: rateInCents,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
      onUpdate({
        status: draftStatus,
        is_military: draftMilitary,
        autopay_enabled: draftAutopay,
        billing_day: draftBillingDay ? parseInt(draftBillingDay, 10) : null,
        billing_status: draftBillingStatus,
        rate_tier: rateInCents ?? 0,
      });
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
                <button type="button" onClick={() => setDraftMilitary(v => !v)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ background: draftMilitary ? brandColor : "rgba(107,114,128,0.3)" }}>
                  <span className="inline-block h-4 w-4 transform rounded-full shadow transition-transform"
                    style={{ background: "var(--z-fg, #fff)", transform: draftMilitary ? "translateX(22px)" : "translateX(2px)" }} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Auto-pay</label>
                <button type="button" onClick={() => setDraftAutopay(v => !v)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ background: draftAutopay ? brandColor : "rgba(107,114,128,0.3)" }}>
                  <span className="inline-block h-4 w-4 transform rounded-full shadow transition-transform"
                    style={{ background: "var(--z-fg, #fff)", transform: draftAutopay ? "translateX(22px)" : "translateX(2px)" }} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Billing Day (1–31)</label>
                <BrandInput brandColor={brandColor} type="number" value={draftBillingDay} onChange={setDraftBillingDay} placeholder="1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Billing Status</label>
                <BrandSelect brandColor={brandColor} value={draftBillingStatus} onChange={setDraftBillingStatus}>
                  <option value="current">Current</option>
                  <option value="overdue">Overdue</option>
                  <option value="paused">Paused</option>
                  <option value="past_due">Past Due</option>
                </BrandSelect>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.label }}>Rate / Session ($)</label>
                <BrandInput brandColor={brandColor} type="number" value={draftRate} onChange={setDraftRate} placeholder="45.00" />
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
              <Field label="Autopay"        value={<BoolBadge value={family.autopay_enabled} trueLabel="Enabled" falseLabel="Disabled" />} />
              <Field label="Billing Day"    value={family.billing_day !== null ? `Day ${family.billing_day} of month` : null} />
              <Field label="Billing Status" value={<BillingStatusBadge status={family.billing_status} />} />
              <Field label="Rate / Session" value={family.rate_tier ? formatCurrency(family.rate_tier / 100) : null} />
              {family.rate_tier_override && (
                <Field label="Rate Override" value={
                  <span className="text-xs" style={{ color: T.muted }}>{family.rate_tier_reason ?? "Manual override applied"}</span>
                } />
              )}
            </>
          )}
        </dl>
      </div>
    </BrandCard>
  );
}

/* ─── Family Notes Card ─────────────────────────────────── */
function FamilyNotesCard({ family, familyId, brandColor, onUpdate }: {
  family: FamilyDetail;
  familyId: string;
  brandColor: string;
  onUpdate: (patch: Partial<FamilyDetail>) => void;
}) {
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState(family.notes ?? "");

  useEffect(() => { setDraftNotes(family.notes ?? ""); }, [family.notes]);

  function handleCancel() {
    setDraftNotes(family.notes ?? "");
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
        body: JSON.stringify({ notes: draftNotes || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
      onUpdate({ notes: draftNotes || null });
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

  return (
    <BrandCard brandColor={brandColor} style={{ gridColumn: "1 / -1" }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
        <h2 className="text-sm font-semibold" style={{ color: T.fg }}>Family Notes</h2>
        <CardActions
          editing={editing} saving={saving} saveState={saveState} saveError={saveError}
          onEdit={() => setEditing(true)} onCancel={handleCancel} onSave={handleSave}
        />
      </div>
      <div className="px-5 py-4">
        {editing ? (
          <textarea
            value={draftNotes}
            onChange={e => setDraftNotes(e.target.value)}
            placeholder="Add notes about this family…"
            rows={5}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: T.bg,
              color: T.fg,
              fontSize: 14,
              resize: "vertical",
              outline: "none",
              lineHeight: 1.6,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = brandColor; e.currentTarget.style.boxShadow = `0 0 0 3px ${brandColor}22`; }}
            onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap" style={{ color: family.notes ? T.fg : T.muted, lineHeight: 1.7 }}>
            {family.notes || "No notes yet. Click Edit to add notes about this family."}
          </p>
        )}
      </div>
    </BrandCard>
  );
}

/* ─── Overview tab ───────────────────────────────────────── */

/* ─── Teacher profile type ───────────────────────────────── */
type TeacherProfile = {
  id: string;
  full_name: string;
  bio: string | null;
  photo_url: string | null;
  teacher_role: string;
  instruments: string[];
  lesson_style: string | null;
  teaches_students: string[];
};
/* ─── Teacher avatar ─────────────────────────────────────── */
function TeacherAvatar({ teacher, size = 56 }: { teacher: TeacherProfile; size?: number }) {
  const initials = teacher.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (teacher.photo_url) {
    return (
      <img
        src={teacher.photo_url}
        alt={teacher.full_name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{ width: size, height: size, background: "rgba(0,255,0,0.08)", color: "#00ff00", border: "1px solid rgba(0,255,0,0.18)" }}
    >
      {initials}
    </div>
  );
}
/* ─── Meet Your Teacher(s) card ──────────────────────────── */
function MeetTeachersCard({ familyId, brandColor }: { familyId: string; brandColor: string }) {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!familyId) return;
    async function load() {
      try {
        const res = await fetch(`/api/crm/families/${familyId}/teachers`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) return;
        const json = await res.json();
        setTeachers(json.data ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [familyId]);

  if (!loading && teachers.length === 0) return null;

  return (
    <BrandCard brandColor={brandColor} id="meet-teachers">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: T.label }}>
          Meet Your Teacher{teachers.length !== 1 ? "s" : ""}
        </h3>
        {!loading && (
          <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: T.surface2, color: T.muted }}>
            {teachers.length}
          </span>
        )}
      </div>
      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse px-5 pb-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full" style={{ background: T.surface2 }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded" style={{ background: T.surface2 }} />
                <div className="h-3 w-48 rounded" style={{ background: T.surface2 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col divide-y" style={{ borderColor: T.border }}>
          {teachers.map((teacher) => (
            <li key={teacher.id} className="flex items-start gap-4 px-5 py-4">
              <TeacherAvatar teacher={teacher} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: T.fg }}>{teacher.full_name}</p>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: T.surface2, color: T.muted }}>
                    {teacher.teacher_role}
                  </span>
                </div>
                {teacher.teaches_students.length > 0 && (
                  <p className="mt-0.5 text-xs" style={{ color: T.muted }}>
                    Teacher for {teacher.teaches_students.join(" & ")}
                  </p>
                )}
                {teacher.bio && (
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: T.label }}>
                    {teacher.bio}
                  </p>
                )}
                {teacher.instruments && teacher.instruments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {teacher.instruments.map((inst: string) => (
                      <span key={inst} className="rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(0,255,0,0.06)", color: "#00cc00" }}>
                        {inst}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </BrandCard>
  );
}
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
    <div className="flex flex-col gap-4">
      <StudentsTabInline familyId={familyId} brandColor={brandColor} />
      <div className="grid gap-4 sm:grid-cols-2">
        <PrimaryContactCard family={family} familyId={familyId} brandColor={brandColor} onUpdate={handleUpdate} />
        <AccountSettingsCard family={family} familyId={familyId} brandColor={brandColor} onUpdate={handleUpdate} />
      </div>
      <MeetTeachersCard familyId={familyId} brandColor={brandColor} />
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

/* ─── Students tab (inline on Overview + standalone) ────── */
function StudentsTabInline({ familyId, brandColor }: { familyId: string; brandColor: string }) {
  return <StudentsTab familyId={familyId} brandColor={brandColor} />;
}
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
  // ── types ──────────────────────────────────────────────────────────────
  type FamilySummary = {
    balance: number;
    overdue_balance_cents: number;
    lifetime_paid_cents: number;
    square_customer_id: string | null;
  };
  type SquareInvoiceRow = {
    id: string;
    invoice_number: string | null;
    title: string | null;
    status: string;
    amount_cents: number | null;
    requested_amount: number | null;
    amount_paid: number | null;
    due_date: string | null;
    paid_at: string | null;
    square_created_at: string | null;
    customer_name: string | null;
    source?: "square" | "manual";
    live_url_token?: string | null;
    pdf_url?: string | null;
  };

  // ── state ──────────────────────────────────────────────────────────────
  const [family,   setFamily]   = useState<FamilySummary | null>(null);
  const [invoices, setInvoices] = useState<SquareInvoiceRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // modal state
  const [showModal,   setShowModal]   = useState(false);
  const [modalType,   setModalType]   = useState<"single" | "recurring" | null>(null);
  const [mAmount,     setMAmount]     = useState("");
  const [mDate,       setMDate]       = useState("");
  const [mDesc,       setMDesc]       = useState("");
  const [mSubmitting, setMSubmitting] = useState(false);
  const [mError,      setMError]      = useState<string | null>(null);
  const [mSuccess,    setMSuccess]    = useState(false);

  // ── load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!familyId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [famRes, invRes] = await Promise.all([
          fetch(`/api/crm/families/${familyId}`, { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }),
          fetch(`/api/crm/families/${familyId}/square-invoices`, { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }),
        ]);
        if (!famRes.ok) throw new Error(`Failed to load family (${famRes.status})`);
        const famJson = await famRes.json();
        const f = famJson.data ?? famJson;
        setFamily({
          balance: f.balance ?? 0,
          overdue_balance_cents: f.overdue_balance_cents ?? 0,
          lifetime_paid_cents: f.lifetime_paid_cents ?? 0,
          square_customer_id: f.square_customer_id ?? null,
        });
        if (invRes.ok) {
          const invJson = await invRes.json();
          const list = invJson.data ?? [];
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

  // ── helpers ────────────────────────────────────────────────────────────
  function fmtShortDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
  }
  function squareCents(val: number | null): string {
    if (val == null) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val / 100);
  }
  function SquareStatusBadge({ status }: { status: string }) {
    const s = (status ?? "").toUpperCase();
    let bg = "rgba(107,114,128,0.1)", color = "#6b7280";
    if (s === "PAID")                                    { bg = "rgba(5,150,105,0.12)";  color = "#059669"; }
    else if (s === "UNPAID" || s === "PAYMENT_PENDING")  { bg = "rgba(245,158,11,0.12)"; color = "#d97706"; }
    else if (s === "OVERDUE")                            { bg = "rgba(185,28,28,0.1)";   color = "#b91c1c"; }
    else if (s === "CANCELLED" || s === "CANCELED")      { bg = "rgba(107,114,128,0.1)"; color = "#6b7280"; }
    else if (s === "DRAFT")                              { bg = "rgba(99,102,241,0.1)";  color = "#6366f1"; }
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
        style={{ background: bg, color }}>
        {s === "PAYMENT_PENDING" ? "PENDING" : s}
      </span>
    );
  }

  // ── create invoice ─────────────────────────────────────────────────────
  async function handleCreateInvoice() {
    if (!mAmount || !mDate || !mDesc) { setMError("All fields are required."); return; }
    const amountCents = Math.round(parseFloat(mAmount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) { setMError("Enter a valid dollar amount."); return; }
    setMSubmitting(true);
    setMError(null);
    try {
      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": DEFAULT_TENANT_ID },
        body: JSON.stringify({
          family_id: familyId,
          status: "draft",
          due_at: new Date(mDate).toISOString(),
          issued_at: new Date().toISOString(),
          description: mDesc,
          lineItems: [{ description: mDesc, amount_cents: amountCents }],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string })?.error ?? `Failed to create invoice (${res.status})`);
      }
      setMSuccess(true);
      setTimeout(() => {
        setShowModal(false); setModalType(null);
        setMAmount(""); setMDate(""); setMDesc(""); setMSuccess(false);
      }, 1500);
    } catch (err) {
      setMError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setMSubmitting(false);
    }
  }

  function closeModal() {
    setShowModal(false); setModalType(null);
    setMAmount(""); setMDate(""); setMDesc(""); setMError(null); setMSuccess(false);
  }

  // ── render ─────────────────────────────────────────────────────────────
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

  // No Square profile
  if (!family?.square_customer_id) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center rounded-xl" style={{ border: `1px dashed ${T.border}` }}>
        <svg className="h-10 w-10" style={{ color: T.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
        <p className="text-sm font-semibold" style={{ color: T.fg }}>No Square Profile Linked</p>
        <p className="text-xs max-w-xs" style={{ color: T.muted }}>This family does not have a Square customer ID. Sync Square to link their billing history.</p>
      </div>
    );
  }

  const balColor = (family?.balance ?? 0) > 0 ? "#b91c1c" : (family?.balance ?? 0) < 0 ? "#059669" : T.fg;

  return (
    <div className="flex flex-col gap-5">
      {/* Metric cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Current Balance" value={squareCents(family?.balance ?? 0)} valueColor={balColor} brandColor={brandColor} />
        <MetricCard label="Overdue" value={squareCents(family?.overdue_balance_cents ?? 0)} valueColor={(family?.overdue_balance_cents ?? 0) > 0 ? "#b91c1c" : T.fg} brandColor={brandColor} />
        <MetricCard label="Lifetime Paid" value={squareCents(family?.lifetime_paid_cents ?? 0)} valueColor="#059669" brandColor={brandColor} />
      </div>

      {/* Square invoice ledger */}
      <BrandCard brandColor={brandColor}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: T.fg }}>Square Invoice Ledger</h2>
            <p className="text-xs mt-0.5" style={{ color: T.muted }}>Last 12 months · {invoices.length} records</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ border: "1.5px solid #00D16C", color: "#00D16C", background: "rgba(0,209,108,0.06)" }}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create Invoice
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm" style={{ color: T.muted }}>No Square invoices found in the last 12 months</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Date", "Invoice #", "Description", "Amount", "Status", ""].map(h => (
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
                    <td className="px-5 py-2.5 text-xs" style={{ color: T.muted }}>{fmtShortDate(inv.square_created_at)}</td>
                    <td className="px-5 py-2.5 font-mono text-xs" style={{ color: T.muted }}>{inv.invoice_number ?? "—"}</td>
                    <td className="px-5 py-2.5 text-xs max-w-[200px] truncate" style={{ color: T.fg }}>{inv.title || "Lesson Invoice"}</td>
                    <td className="px-5 py-2.5 text-xs font-semibold" style={{ color: T.fg }}>{squareCents(inv.amount_cents)}</td>
                    <td className="px-5 py-2.5"><SquareStatusBadge status={inv.status} /></td>
                    <td className="px-5 py-2.5 text-right">
                      {inv.source === "manual" && (inv.pdf_url || inv.live_url_token) ? (
                        <a
                          href={inv.pdf_url ?? `/invoice/${inv.live_url_token}`}
                          target="_blank"
                          rel="noopener"
                          className="text-xs font-semibold hover:underline"
                          style={{ color: "var(--z-accent)" }}
                        >
                          {inv.pdf_url ? "PDF →" : "View →"}
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BrandCard>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${T.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: T.fg }}>Create Invoice</h3>
              <button onClick={closeModal} className="rounded-lg p-1 hover:opacity-60 transition-opacity" style={{ color: T.muted }}>✕</button>
            </div>

            {/* Invoice type selector */}
            {!modalType ? (
              <div className="flex flex-col gap-3 px-6 py-6">
                <p className="text-sm" style={{ color: T.muted }}>Choose invoice type:</p>
                <button
                  onClick={() => setModalType("single")}
                  className="flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-all hover:opacity-80"
                  style={{ border: `1.5px solid ${T.border}`, background: T.bg }}>
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: T.fg }}>Single Invoice</p>
                    <p className="text-xs" style={{ color: T.muted }}>One-time charge for a specific service or date</p>
                  </div>
                </button>
                <button
                  onClick={() => setModalType("recurring")}
                  className="flex items-center gap-3 rounded-xl px-4 py-4 text-left transition-all hover:opacity-80"
                  style={{ border: `1.5px solid ${T.border}`, background: T.bg }}>
                  <span className="text-xl">🔄</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: T.fg }}>Recurring Invoice</p>
                    <p className="text-xs" style={{ color: T.muted }}>Auto-generate monthly invoices on a schedule</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: T.muted }}>
                  {modalType === "single" ? "Single Invoice" : "Recurring Invoice"}
                </p>

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: T.label }}>Amount ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: T.muted }}>$</span>
                    <input
                      type="number" min="0" step="0.01" placeholder="45.00"
                      value={mAmount} onChange={e => setMAmount(e.target.value)}
                      className="w-full rounded-lg pl-7 pr-3 py-2 text-sm"
                      style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.fg, outline: "none" }}
                      onFocus={e => { e.currentTarget.style.borderColor = brandColor; e.currentTarget.style.boxShadow = `0 0 0 3px ${brandColor}22`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                {/* Service date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: T.label }}>Service Date</label>
                  <input
                    type="date" value={mDate} onChange={e => setMDate(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.fg, outline: "none" }}
                    onFocus={e => { e.currentTarget.style.borderColor = brandColor; e.currentTarget.style.boxShadow = `0 0 0 3px ${brandColor}22`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: T.label }}>Description</label>
                  <input
                    type="text" placeholder="e.g. Guitar lessons — April"
                    value={mDesc} onChange={e => setMDesc(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.fg, outline: "none" }}
                    onFocus={e => { e.currentTarget.style.borderColor = brandColor; e.currentTarget.style.boxShadow = `0 0 0 3px ${brandColor}22`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                {mError && <p className="text-xs" style={{ color: "#b91c1c" }}>{mError}</p>}
                {mSuccess && <p className="text-xs font-semibold" style={{ color: "#059669" }}>✓ Invoice created as Draft</p>}

                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => setModalType(null)}
                    className="flex-1 rounded-lg py-2 text-sm font-medium hover:opacity-70 transition-opacity"
                    style={{ border: `1px solid ${T.border}`, color: T.muted, background: T.bg }}
                    disabled={mSubmitting}>Back</button>
                  <button onClick={handleCreateInvoice}
                    className="flex-1 rounded-lg py-2 text-sm font-semibold hover:opacity-80 transition-opacity"
                    style={{ background: brandColor, color: "#fff" }}
                    disabled={mSubmitting || mSuccess}>
                    {mSubmitting ? "Sending…" : "Send Invoice"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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

/* ─── Docs & Notes tab (Documents + Family Notes merged) ── */
function DocsNotesTab({ familyId, brandColor }: { familyId: string; brandColor: string }) {
  const [family, setFamily] = useState<FamilyDetail | null>(null);

  useEffect(() => {
    if (!familyId) return;
    async function load() {
      try {
        const res = await fetch(`/api/crm/families/${familyId}`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) return;
        const json = await res.json();
        setFamily(json.data ?? json);
      } catch { /* non-blocking */ }
    }
    load();
  }, [familyId]);

  return (
    <div className="flex flex-col gap-6">
      <DocumentsTab familyId={familyId} brandColor={brandColor} />
      {family && (
        <FamilyNotesCard
          family={family}
          familyId={familyId}
          brandColor={brandColor}
          onUpdate={(patch) => setFamily(f => f ? { ...f, ...patch } : f)}
        />
      )}
    </div>
  );
}
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
        {activeTab === "overview"   && <OverviewTab   familyId={familyId} brandColor={brandColor} />}
        {activeTab === "billing"    && <BillingTab    familyId={familyId} brandColor={brandColor} />}
        {activeTab === "docs_notes" && <DocsNotesTab  familyId={familyId} brandColor={brandColor} />}
      </div>
    </div>
  );
}
