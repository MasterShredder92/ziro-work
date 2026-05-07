"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

const ZIRO_GREEN = "#c4f036";
const SURFACE = "#111113";
const BORDER = "#1c1c1e";
const TEXT_MUTED = "#7a7a7d";
const TEXT_LIGHT = "#e5e5e7";

/* lesson_day_of_week is integer (0=Sun..6=Sat, JS Date.getDay convention) */
const DAYS: { value: number; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const STATUSES = ["active", "inactive", "trial", "paused"] as const;

type StudentLite = {
  id: string;
  family_id: string | null;
  teacher_id: string | null;
  instrument: string | null;
  lesson_day_of_week: number | null;
  blocks_per_week: number | null;
  experience_level: string | null;
  status: string | null;
};

type FamilyLite = {
  primary_location_id: string | null;
};

type TeacherLite = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  instruments: string[] | null;
  teacher_locations?: { location_id: string }[];
};

function teacherLabel(t: TeacherLite): string {
  if (t.display_name) return t.display_name;
  if (t.first_name && t.last_name) return `${t.first_name} ${t.last_name}`;
  return t.first_name || t.last_name || "Unknown";
}

export type EditEnrollmentResult = Partial<StudentLite> & {
  teacher_changed?: boolean;
  new_teacher_name?: string;
};

export function EditEnrollmentModal({
  open,
  onClose,
  student,
  currentTeacherName,
  canChangeTeacher,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  student: StudentLite;
  currentTeacherName: string | null;
  canChangeTeacher: boolean;
  onSaved: (result: EditEnrollmentResult) => void;
}) {
  const [lessonDay, setLessonDay] = useState<string>(
    student.lesson_day_of_week !== null && student.lesson_day_of_week !== undefined
      ? String(student.lesson_day_of_week)
      : ""
  );
  const [blocks, setBlocks] = useState<string>(
    student.blocks_per_week !== null && student.blocks_per_week !== undefined
      ? String(student.blocks_per_week)
      : ""
  );
  const [experience, setExperience] = useState<string>(student.experience_level ?? "");
  const [status, setStatus] = useState<string>(student.status ?? "");
  const [instrument, setInstrument] = useState<string>(student.instrument ?? "");

  const [changeTeacher, setChangeTeacher] = useState(false);
  const [newTeacherId, setNewTeacherId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const [teachers, setTeachers] = useState<TeacherLite[]>([]);
  const [family, setFamily] = useState<FamilyLite | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLessonDay(
        student.lesson_day_of_week !== null && student.lesson_day_of_week !== undefined
          ? String(student.lesson_day_of_week)
          : ""
      );
      setBlocks(
        student.blocks_per_week !== null && student.blocks_per_week !== undefined
          ? String(student.blocks_per_week)
          : ""
      );
      setExperience(student.experience_level ?? "");
      setStatus(student.status ?? "");
      setInstrument(student.instrument ?? "");
      setChangeTeacher(false);
      setNewTeacherId("");
      setReason("");
      setEffectiveDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [open, student]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        if (student.family_id) {
          const fRes = await fetch(`/api/families/${student.family_id}`, {
            headers: { "x-tenant-id": DEFAULT_TENANT_ID },
          });
          if (fRes.ok) {
            const fJson = await fRes.json();
            setFamily(fJson.data ?? null);
          }
        }
        const tRes = await fetch(
          `/api/crm/teachers?isActive=true&include_locations=true&limit=500`,
          { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }
        );
        if (tRes.ok) {
          const tJson = await tRes.json();
          setTeachers(Array.isArray(tJson.data) ? tJson.data : []);
        }
      } catch {
        /* non-blocking */
      }
    })();
  }, [open, student.family_id]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (t.id === student.teacher_id) return false;
      if (family?.primary_location_id) {
        const teaches_here = t.teacher_locations?.some(
          (tl) => tl.location_id === family.primary_location_id
        );
        if (!teaches_here) return false;
      }
      if (instrument && Array.isArray(t.instruments) && t.instruments.length > 0) {
        const matches = t.instruments.some(
          (i) => i.toLowerCase() === instrument.toLowerCase()
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [teachers, family, instrument, student.teacher_id]);

  if (!open) return null;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      // DB schema:
      //   lesson_day_of_week INT (0..6, nullable)
      //   blocks_per_week    INT NOT NULL
      //   experience_level   TEXT (nullable)
      //   status             TEXT NOT NULL
      //   instrument         TEXT (nullable)
      const payload: Record<string, unknown> = {};

      // Lesson day -> int or null
      const newDay = lessonDay === "" ? null : Number.parseInt(lessonDay, 10);
      if (newDay !== student.lesson_day_of_week) {
        if (newDay !== null && (Number.isNaN(newDay) || newDay < 0 || newDay > 6)) {
          throw new Error("Lesson Day must be 0 (Sun) through 6 (Sat)");
        }
        payload.lesson_day_of_week = newDay;
      }

      // Blocks (NOT NULL): only send if non-empty AND changed
      if (blocks !== "") {
        const newBlocks = Number.parseInt(blocks, 10);
        if (Number.isNaN(newBlocks) || newBlocks < 0 || newBlocks > 10) {
          throw new Error("Blocks / Week must be 0\u201310");
        }
        if (newBlocks !== student.blocks_per_week) {
          payload.blocks_per_week = newBlocks;
        }
      }

      // Experience (nullable)
      const newExp = experience === "" ? null : experience;
      if (newExp !== (student.experience_level ?? null)) {
        payload.experience_level = newExp;
      }

      // Status (NOT NULL): only send if non-empty AND changed
      if (status !== "" && status !== student.status) {
        payload.status = status;
      }

      // Instrument (nullable)
      const newInst = instrument.trim() === "" ? null : instrument.trim();
      if (newInst !== (student.instrument ?? null)) {
        payload.instrument = newInst;
      }

      let result: EditEnrollmentResult = {};

      if (Object.keys(payload).length > 0) {
        const res = await fetch(`/api/students/${student.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-tenant-id": DEFAULT_TENANT_ID },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Save failed (${res.status})`);
        }
        const j = await res.json().catch(() => ({}));
        const updated = (j?.data ?? {}) as Record<string, unknown>;
        const echoed: Partial<StudentLite> = {};
        if ("lesson_day_of_week" in payload) echoed.lesson_day_of_week = (updated.lesson_day_of_week as number | null) ?? null;
        if ("blocks_per_week" in payload) echoed.blocks_per_week = (updated.blocks_per_week as number | null) ?? null;
        if ("experience_level" in payload) echoed.experience_level = (updated.experience_level as string | null) ?? null;
        if ("status" in payload) echoed.status = (updated.status as string | null) ?? null;
        if ("instrument" in payload) echoed.instrument = (updated.instrument as string | null) ?? null;
        result = { ...result, ...echoed };
      }

      if (changeTeacher) {
        if (!newTeacherId) throw new Error("Choose a new teacher");
        if (reason.trim().length < 10) throw new Error("Reason must be at least 10 characters");
        const res = await fetch(`/api/students/${student.id}/teacher`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            new_teacher_id: newTeacherId,
            reason: reason.trim(),
            effective_date: effectiveDate || undefined,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Teacher change failed (${res.status})`);
        }
        const j = await res.json();
        result.teacher_id = newTeacherId;
        result.teacher_changed = true;
        result.new_teacher_name = j?.data?.new_teacher_name;
      }

      onSaved(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border shadow-2xl"
        style={{
          borderColor: BORDER,
          background: SURFACE,
          borderLeft: `3px solid ${ZIRO_GREEN}`,
          maxHeight: "85vh",
          overflow: "auto",
        }}
      >
        <div className="px-6 py-5 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-lg font-semibold" style={{ color: TEXT_LIGHT }}>
            Edit Enrollment Details
          </h2>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Field label="Instrument">
            <input
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "#0a0a0c", borderColor: BORDER, color: TEXT_LIGHT }}
              placeholder="e.g. Guitar, Piano"
            />
          </Field>

          <Field label="Lesson Day">
            <select
              value={lessonDay}
              onChange={(e) => setLessonDay(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "#0a0a0c", borderColor: BORDER, color: TEXT_LIGHT }}
            >
              <option value="">—</option>
              {DAYS.map((d) => (
                <option key={d.value} value={String(d.value)}>{d.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Blocks / Week">
            <input
              type="number"
              min={0}
              max={10}
              value={blocks}
              onChange={(e) => setBlocks(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "#0a0a0c", borderColor: BORDER, color: TEXT_LIGHT }}
            />
          </Field>

          <Field label="Experience Level">
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "#0a0a0c", borderColor: BORDER, color: TEXT_LIGHT }}
            >
              <option value="">—</option>
              {EXPERIENCE_LEVELS.map((l) => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "#0a0a0c", borderColor: BORDER, color: TEXT_LIGHT }}
            >
              <option value="">—</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </Field>

          <div className="pt-3 border-t" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium" style={{ color: TEXT_LIGHT }}>Teacher</div>
                <div className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
                  Current: <span style={{ color: TEXT_LIGHT }}>{currentTeacherName ?? "Unassigned"}</span>
                </div>
              </div>
              {canChangeTeacher && (
                <button
                  type="button"
                  onClick={() => setChangeTeacher((v) => !v)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border transition"
                  style={
                    changeTeacher
                      ? { background: ZIRO_GREEN, color: "#000", borderColor: ZIRO_GREEN }
                      : { background: "transparent", color: ZIRO_GREEN, borderColor: ZIRO_GREEN }
                  }
                >
                  {changeTeacher ? "Cancel Change" : "Change Teacher"}
                </button>
              )}
            </div>

            {!canChangeTeacher && (
              <div className="text-xs mt-2" style={{ color: TEXT_MUTED }}>
                Only owners, admins, company directors, and studio directors can change a teacher.
              </div>
            )}

            {changeTeacher && (
              <div className="space-y-3 mt-3 p-3 rounded-md border" style={{ borderColor: BORDER, background: "#0a0a0c" }}>
                <Field label="New Teacher" required>
                  <select
                    value={newTeacherId}
                    onChange={(e) => setNewTeacherId(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    style={{ background: SURFACE, borderColor: BORDER, color: TEXT_LIGHT }}
                  >
                    <option value="">Choose a teacher…</option>
                    {filteredTeachers.map((t) => (
                      <option key={t.id} value={t.id}>{teacherLabel(t)}</option>
                    ))}
                  </select>
                  <div className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>
                    Filtered by family location{instrument ? ` · ${instrument}` : ""} · active only
                    {filteredTeachers.length === 0 && teachers.length > 0 && (
                      <span style={{ color: "#ff5500" }}> · No matching teacher at this location for this instrument</span>
                    )}
                  </div>
                </Field>

                <Field label="Reason for Change" required>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Teacher moved to a different location, parent requested change due to schedule conflict, etc."
                    className="w-full rounded-md border px-3 py-2 text-sm resize-none"
                    style={{ background: SURFACE, borderColor: BORDER, color: TEXT_LIGHT }}
                  />
                  <div className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>
                    Logged permanently. Visible to family and staff. Min 10 characters.
                  </div>
                </Field>

                <Field label="Effective Date">
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    style={{ background: SURFACE, borderColor: BORDER, color: TEXT_LIGHT }}
                  />
                </Field>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2" style={{ borderColor: BORDER }}>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-md text-sm font-medium border transition"
            style={{ background: "transparent", color: TEXT_MUTED, borderColor: BORDER }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-md text-sm font-semibold transition"
            style={{ background: ZIRO_GREEN, color: "#000" }}
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide mb-1.5" style={{ color: TEXT_MUTED }}>
        {label}
        {required && <span style={{ color: ZIRO_GREEN }}> *</span>}
      </label>
      {children}
    </div>
  );
}
