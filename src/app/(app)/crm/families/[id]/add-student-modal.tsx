"use client";

/**
 * Add Student modal — minimal create form for a new student under a family.
 *
 * Posts to existing POST /api/students which handles validation + tenant scoping.
 * Required fields: first_name, last_name. Family is locked to the parent family
 * page being viewed. Other fields are optional but encouraged for billing /
 * scheduling features.
 *
 * On success: caller's onCreated() runs (typically refetches student list).
 */

import * as React from "react";

const ZIRO_GREEN = "#c4f036";

type TeacherOpt = {
  id: string;
  display_name: string;
  instruments: string[];
  teacher_locations: Array<{ location_id: string; is_regular: boolean; can_sub: boolean }>;
};

const INSTRUMENTS = [
  "Guitar",
  "Piano",
  "Voice",
  "Drums",
  "Bass",
  "Ukulele",
  "Violin",
  "Cello",
  "Saxophone",
  "Trumpet",
  "Other",
];

export function AddStudentModal({
  open,
  onClose,
  onCreated,
  familyId,
  defaultLocationId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  familyId: string;
  defaultLocationId?: string | null;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [instrument, setInstrument] = React.useState("");
  const [sessionsPerMonth, setSessionsPerMonth] = React.useState("4");
  const [teacherId, setTeacherId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [teachers, setTeachers] = React.useState<TeacherOpt[]>([]);

  // Reset on close, fetch lookups on open
  React.useEffect(() => {
    if (!open) {
      setFirstName("");
      setLastName("");
      setInstrument("");
      setSessionsPerMonth("4");
      setTeacherId("");
      setStartDate("");
      setSaving(false);
      setError(null);
      return;
    }
    // Fetch teachers — filter by family's location
    // Fetch only ACTIVE teachers + include their locations + instruments
    fetch("/api/crm/teachers?limit=500&isActive=true&include_locations=true")
      .then((r) => r.json())
      .then((j) => {
        const arr = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
        setTeachers(
          arr
            .map(
              (t: {
                id: string;
                display_name?: string | null;
                first_name?: string | null;
                last_name?: string | null;
                instruments?: string[] | null;
                teacher_locations?: Array<{ location_id: string; is_regular: boolean; can_sub: boolean }> | null;
              }) => ({
                id: t.id,
                display_name:
                  t.display_name?.trim() ||
                  [t.first_name, t.last_name].filter(Boolean).join(" ").trim() ||
                  t.id,
                instruments: (t.instruments ?? []).map((s) => s.toLowerCase()),
                teacher_locations: t.teacher_locations ?? [],
              }),
            )
            .sort((a: TeacherOpt, b: TeacherOpt) =>
              a.display_name.localeCompare(b.display_name),
            ),
        );
      })
      .catch(() => {});
  }, [open, defaultLocationId]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    setSaving(true);
    try {
      const sessionsNum = Math.max(1, parseInt(sessionsPerMonth, 10) || 4);
      const payload: Record<string, unknown> = {
        family_id: familyId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        instrument: instrument || null,
        sessions_per_month: sessionsNum,
        // blocks_per_week defaults to roughly sessions/4, min 1
        blocks_per_week: Math.max(1, Math.round(sessionsNum / 4)),
        teacher_id: teacherId || null,
        start_date: startDate || null,
        first_lesson_date: startDate || null,
        status: "active",
      };
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create student.");
        setSaving(false);
        return;
      }
      onCreated();
      onClose();
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
          maxWidth: 560,
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
              Add Student
            </div>
            <div style={{ fontSize: 12, color: "var(--z-muted)", marginTop: 2 }}>
              Student will be enrolled under this family. Edit anything later from the student profile.
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="First Name *">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
                required
                style={inputStyle}
                placeholder="Aiden"
              />
            </Field>
            <Field label="Last Name *">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                style={inputStyle}
                placeholder="Adkins"
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <Field label="Instrument">
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">— Select —</option>
                {INSTRUMENTS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sessions / Month" hint="Default 4">
              <input
                type="number"
                min="1"
                max="20"
                value={sessionsPerMonth}
                onChange={(e) => setSessionsPerMonth(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field
            label="Teacher"
            hint={instrument ? `Filtered by ${instrument.toLowerCase()}` : undefined}
          >
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">— Unassigned —</option>
              {teachers
                .filter((t) => {
                  // Filter by family location: must teach at this location
                  if (defaultLocationId) {
                    const teachesHere = t.teacher_locations.some(
                      (tl) => tl.location_id === defaultLocationId,
                    );
                    if (!teachesHere) return false;
                  }
                  // Filter by instrument: must have it in their instruments[]
                  if (instrument) {
                    if (!t.instruments.includes(instrument.toLowerCase())) return false;
                  }
                  return true;
                })
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.display_name}
                  </option>
                ))}
            </select>
          </Field>

          <Field label="Start Date" hint="First lesson date">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </Field>

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
              {saving ? "Adding…" : "Add Student"}
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
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--z-fg)",
            letterSpacing: 0.2,
          }}
        >
          {label}
        </label>
        {hint && <span style={{ fontSize: 10, color: "var(--z-muted)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
