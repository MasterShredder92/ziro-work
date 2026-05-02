"use client";

/**
 * Add Family modal — minimal create form.
 *
 * Posts to existing POST /api/families which handles validation and tenant scoping.
 * Required field: name. All others optional but encouraged for downstream features
 * (Square push, invoice auto-fill, notifications).
 *
 * On success → router.push(`/crm/families/{newId}`) so the user can finish setup.
 */

import * as React from "react";
import { useRouter } from "next/navigation";

const ZIRO_GREEN = "#00ff88";

type LocationOpt = { id: string; name: string };

export function AddFamilyModal({
  open,
  onClose,
  locations,
}: {
  open: boolean;
  onClose: () => void;
  locations: LocationOpt[];
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [parentName, setParentName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [locationId, setLocationId] = React.useState("");
  const [rateDollars, setRateDollars] = React.useState("45.00");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setName("");
      setParentName("");
      setEmail("");
      setPhone("");
      setLocationId("");
      setRateDollars("45.00");
      setSaving(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Family name is required.");
      return;
    }
    setSaving(true);
    try {
      const rateCents = Math.round((parseFloat(rateDollars) || 0) * 100);
      const payload: Record<string, unknown> = {
        name: name.trim(),
        primary_contact_name: parentName.trim() || null,
        primary_email: email.trim() || null,
        primary_phone: phone.trim() || null,
        primary_location_id: locationId || null,
        rate_tier: rateCents > 0 ? rateCents : 4500,
      };
      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create family.");
        setSaving(false);
        return;
      }
      const newId: string | undefined = json?.data?.id;
      if (!newId) {
        setError("Family created but no id returned. Refresh the families page.");
        setSaving(false);
        return;
      }
      onClose();
      router.push(`/crm/families/${newId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 9000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "8vh 16px 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 540,
          background: "var(--z-surface)",
          border: "1px solid var(--z-border)",
          borderLeft: `3px solid ${ZIRO_GREEN}`,
          borderRadius: 14,
          boxShadow: "0 24px 56px rgba(0,0,0,0.55)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid var(--z-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--z-fg)" }}>
              Add New Family
            </div>
            <div style={{ fontSize: 12, color: "var(--z-muted)", marginTop: 2 }}>
              You can edit any details after creating from the family profile.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--z-border)",
              color: "var(--z-muted)",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={submit} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Family Name *" hint='e.g., "Adkins Family"'>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              style={inputStyle}
              placeholder="Adkins Family"
            />
          </Field>

          <Field label="Parent / Primary Contact Name">
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              style={inputStyle}
              placeholder="Zach Adkins"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Primary Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="parent@email.com"
              />
            </Field>
            <Field label="Primary Phone">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
                placeholder="(402) 555-0100"
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <Field label="Primary Location">
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">— Select location —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Rate / Session ($)" hint="Per lesson">
              <input
                type="number"
                step="0.01"
                min="0"
                value={rateDollars}
                onChange={(e) => setRateDollars(e.target.value)}
                style={inputStyle}
                placeholder="45.00"
              />
            </Field>
          </div>

          {error && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(255, 80, 80, 0.1)",
                color: "#ff8888",
                fontSize: 12,
                border: "1px solid rgba(255, 80, 80, 0.25)",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid var(--z-border)",
                background: "transparent",
                color: "var(--z-muted)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 2,
                padding: "10px 16px",
                borderRadius: 10,
                border: "none",
                background: ZIRO_GREEN,
                color: "#000",
                fontSize: 13,
                fontWeight: 700,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Creating…" : "Create Family"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--z-border)",
  background: "var(--z-bg)",
  color: "var(--z-fg)",
  fontSize: 13,
  outline: "none",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
        }}
      >
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--z-fg)", letterSpacing: 0.2 }}>
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: 10, color: "var(--z-muted)" }}>{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}
