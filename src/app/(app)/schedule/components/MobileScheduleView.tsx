"use client";
import * as React from "react";
import { TeacherDetailView } from "./TeacherDetailView";
import type { Family, ScheduleBlock, Student, Teacher } from "@/lib/types/entities";
import type { LocationHoursMap } from "@/lib/schedule/locationHoursUtils";
import { getHoursForDate } from "@/lib/schedule/locationHoursUtils";
import {
  projectBlocksForWindow,
  type ProjectedBlock,
} from "@/lib/schedule/windowedClient";

// ─── Constants ────────────────────────────────────────────────────────────────
const TEACHER_COL_W = 72;   // px — fixed left column
const SLOT_W = 56;           // px per 30-min slot
const ROW_H = 56;            // px per teacher row
const HEADER_H = 32;         // px — time header row

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toMin(t: string): number {
  const [h = "0", m = "0"] = t.split(":");
  return Number(h) * 60 + Number(m);
}
function minToLabel(m: number): string {
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const h = h24 % 12 || 12;
  const suffix = h24 >= 12 ? "PM" : "AM";
  return min === 0 ? `${h}${suffix}` : `${h}:${String(min).padStart(2, "0")}`;
}
function nowMin(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}
function teacherInitials(t: Teacher): string {
  const r = t as unknown as Record<string, unknown>;
  const f = (r.first_name as string | undefined)?.trim() ?? "";
  const l = (r.last_name as string | undefined)?.trim() ?? "";
  return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase() || "?";
}
function teacherDisplayName(t: Teacher): string {
  const r = t as unknown as Record<string, unknown>;
  const f = (r.first_name as string | undefined)?.trim() ?? "";
  const l = (r.last_name as string | undefined)?.trim() ?? "";
  return `${f} ${l}`.trim() || "Teacher";
}
function studentFirstName(s: Student): string {
  const r = s as unknown as Record<string, unknown>;
  return (r.first_name as string | undefined)?.trim() || "Student";
}
function instrumentEmoji(instr: string | null | undefined): string {
  if (!instr) return "";
  if (/guitar|bass/i.test(instr)) return "🎸";
  if (/piano|keyboard/i.test(instr)) return "🎹";
  if (/drum|perc/i.test(instr)) return "🥁";
  if (/violin|viola|cello/i.test(instr)) return "🎻";
  if (/trumpet|horn|brass/i.test(instr)) return "🎺";
  if (/sax|clarinet|flute/i.test(instr)) return "🎷";
  if (/voice|vocal|sing/i.test(instr)) return "🎤";
  return "🎵";
}

// ─── Block styling ────────────────────────────────────────────────────────────
type BStyle = { bg: string; border: string; text: string; label: string };
function blockStyle(b: ScheduleBlock | ProjectedBlock): BStyle {
  if (b.checked_in)
    return { bg: "rgba(34,197,94,0.22)", border: "rgba(34,197,94,0.6)", text: "#86efac", label: "✓ In" };
  if (b.is_family_callout || b.block_type === "call_out")
    return { bg: "rgba(249,115,22,0.2)", border: "#ea580c", text: "#fb923c", label: "Call Out" };
  if (b.is_makeup_session || b.block_type === "makeup_session")
    return { bg: "rgba(236,72,153,0.2)", border: "#db2777", text: "#f472b6", label: "Makeup" };
  if (b.is_virtual || b.block_type === "virtual")
    return { bg: "rgba(14,165,233,0.2)", border: "#0284c7", text: "#38bdf8", label: "Virtual" };
  if (b.block_type === "first_day")
    return { bg: "rgba(59,130,246,0.2)", border: "#2563eb", text: "#60a5fa", label: "1st Day" };
  if (b.block_type === "last_day")
    return { bg: "rgba(239,68,68,0.2)", border: "#dc2626", text: "#f87171", label: "Last Day" };
  if (b.block_type === "meet_greet")
    return { bg: "rgba(20,184,166,0.2)", border: "#0d9488", text: "#2dd4bf", label: "M&G" };
  if (b.block_type === "sub")
    return { bg: "rgba(34,197,94,0.18)", border: "#16a34a", text: "#4ade80", label: "Sub" };
  if (b.block_type === "teacher_training")
    return { bg: "rgba(139,92,246,0.2)", border: "#7c3aed", text: "#a78bfa", label: "Training" };
  if (b.block_type === "not_bookable")
    return { bg: "rgba(107,114,128,0.18)", border: "#6b7280", text: "#9ca3af", label: "Locked" };
  if (b.block_type === "open_time" || !b.student_id)
    return { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.35)", text: "rgba(16,185,129,0.9)", label: "Open" };
  return { bg: "rgba(234,179,8,0.2)", border: "#ca8a04", text: "#fbbf24", label: "" };
}

const BLOCK_TYPES = [
  { value: "student_session", label: "Student Session" },
  { value: "open_time", label: "Open Time" },
  { value: "sub", label: "Sub" },
  { value: "virtual", label: "Virtual" },
  { value: "makeup_session", label: "Makeup Session" },
  { value: "call_out", label: "Call Out" },
  { value: "first_day", label: "First Day" },
  { value: "last_day", label: "Last Day" },
  { value: "meet_greet", label: "Meet & Greet" },
  { value: "teacher_training", label: "Teacher Training" },
  { value: "not_bookable", label: "Not Bookable" },
];

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = {
  locationId: string;
  locationConfig?: { color: string; border: string; bg: string; textColor: string; accent: string };
  selectedDate: string;
  blocks: ScheduleBlock[];
  teachers: Teacher[];
  students: Student[];
  families: Family[];
  locationHours: LocationHoursMap;
  onBlocksChange: (blocks: ScheduleBlock[]) => void;
};

// ─── Action Sheet ─────────────────────────────────────────────────────────────
function ActionSheet({
  block, student, family, teachers, students,
  onSave, onCheckIn, onCallOut, onCancelSession, onClose, saving, error,
}: {
  block: ProjectedBlock;
  student: Student | null;
  family: Family | null;
  teachers: Teacher[];
  students: Student[];
  onSave: (patch: Partial<ScheduleBlock>) => void;
  onCheckIn: () => void;
  onCallOut: () => void;
  onCancelSession: (scope: "single" | "recurring", reason: string) => void;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [tab, setTab] = React.useState<"actions" | "edit">("actions");
  const [blockType, setBlockType] = React.useState(block.block_type ?? "student_session");
  const [assignedStudentId, setAssignedStudentId] = React.useState(block.student_id ?? "");
  const [assignedTeacherId, setAssignedTeacherId] = React.useState(block.teacher_id ?? "");
  const [isVirtual, setIsVirtual] = React.useState(!!block.is_virtual);
  const [showCancel, setShowCancel] = React.useState(false);
  const [cancelScope, setCancelScope] = React.useState<"single" | "recurring">("single");
  const [cancelReason, setCancelReason] = React.useState("");
  const bs = blockStyle(block);
  const isOpen = block.block_type === "open_time" || !block.student_id;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-2xl"
      style={{ background: "var(--z-bg)", borderTop: `2px solid ${bs.border}`, maxHeight: "70vh", overflowY: "auto" }}>
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="h-1 w-10 rounded-full" style={{ background: "var(--z-border)" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 border-b" style={{ borderColor: "var(--z-border)" }}>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: bs.border }} />
          <span className="text-sm font-bold text-[var(--z-fg)]">
            {minToLabel(toMin(block.start_time))} – {minToLabel(toMin(block.end_time))}
          </span>
          {bs.label && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: bs.bg, color: bs.text, border: `1px solid ${bs.border}` }}>
              {bs.label}
            </span>
          )}
        </div>
        <button onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm text-[var(--z-muted)]"
          style={{ border: "1px solid var(--z-border)" }}>
          ✕
        </button>
      </div>

      {/* Student row */}
      {student && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b"
          style={{ borderColor: "var(--z-border)", background: "var(--z-surface)" }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88" }}>
            {(studentFirstName(student)[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
              {studentFirstName(student)} {String((student as unknown as Record<string, unknown>).last_name ?? "")}
            </div>
            {family && (
              <div className="text-xs text-[var(--z-muted)] truncate">
                {String((family as unknown as Record<string, unknown>).name ?? "")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--z-border)" }}>
        {(["actions", "edit"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-xs font-semibold capitalize"
            style={{
              color: tab === t ? "#00ff88" : "var(--z-muted)",
              borderBottom: tab === t ? "2px solid #00ff88" : "2px solid transparent",
            }}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 space-y-2">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {tab === "actions" && (
          <>
            {!isOpen && !block.checked_in && (
              <button onClick={onCheckIn} disabled={saving}
                className="w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80" }}>
                {saving ? "Saving…" : "✓ Check In"}
              </button>
            )}
            {!isOpen && (
              <button onClick={onCallOut} disabled={saving}
                className="w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50"
                style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.35)", color: "#fb923c" }}>
                Call Out
              </button>
            )}
            {!isOpen && !showCancel && (
              <button onClick={() => setShowCancel(true)}
                className="w-full rounded-xl py-3 text-sm font-bold"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}>
                Cancel Session
              </button>
            )}
            {showCancel && (
              <div className="space-y-2 rounded-xl border p-3"
                style={{ borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.06)" }}>
                <div className="text-xs font-semibold text-red-400">Cancel this session?</div>
                <div className="flex gap-2">
                  {(["single", "recurring"] as const).map(s => (
                    <button key={s} onClick={() => setCancelScope(s)}
                      className="flex-1 rounded-lg py-2 text-xs font-semibold capitalize"
                      style={{
                        background: cancelScope === s ? "rgba(239,68,68,0.2)" : "var(--z-surface)",
                        border: `1px solid ${cancelScope === s ? "rgba(239,68,68,0.5)" : "var(--z-border)"}`,
                        color: cancelScope === s ? "#f87171" : "var(--z-muted)",
                      }}>
                      {s === "single" ? "This week" : "All recurring"}
                    </button>
                  ))}
                </div>
                <input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full rounded-lg border bg-[var(--z-surface)] px-3 py-2 text-xs text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none"
                  style={{ borderColor: "var(--z-border)" }} />
                <div className="flex gap-2">
                  <button onClick={() => onCancelSession(cancelScope, cancelReason)} disabled={saving}
                    className="flex-1 rounded-lg py-2 text-xs font-bold text-red-400 disabled:opacity-50"
                    style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.4)" }}>
                    {saving ? "Cancelling…" : "Confirm Cancel"}
                  </button>
                  <button onClick={() => setShowCancel(false)}
                    className="rounded-lg px-3 py-2 text-xs text-[var(--z-muted)]"
                    style={{ border: "1px solid var(--z-border)" }}>
                    Back
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "edit" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Block Type
              </label>
              <select value={blockType}
                onChange={e => setBlockType(e.target.value as ScheduleBlock["block_type"])}
                className="w-full rounded-lg border bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none"
                style={{ borderColor: "var(--z-border)" }}>
                {BLOCK_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Student
              </label>
              <select value={assignedStudentId} onChange={e => setAssignedStudentId(e.target.value)}
                className="w-full rounded-lg border bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none"
                style={{ borderColor: "var(--z-border)" }}>
                <option value="">— No student —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {studentFirstName(s)} {String((s as unknown as Record<string, unknown>).last_name ?? "")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Teacher
              </label>
              <select value={assignedTeacherId} onChange={e => setAssignedTeacherId(e.target.value)}
                className="w-full rounded-lg border bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none"
                style={{ borderColor: "var(--z-border)" }}>
                <option value="">— Select teacher —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{teacherDisplayName(t)}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => setIsVirtual(!isVirtual)}
              className="flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-semibold"
              style={{
                borderColor: isVirtual ? "#0284c7" : "var(--z-border)",
                background: isVirtual ? "rgba(14,165,233,0.12)" : "var(--z-surface)",
                color: isVirtual ? "#38bdf8" : "var(--z-muted)",
              }}>
              Virtual
              <div className={`h-4 w-8 rounded-full transition-colors ${isVirtual ? "bg-blue-500" : "bg-[var(--z-border)]"}`} />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onSave({
                  block_type: blockType as ScheduleBlock["block_type"],
                  student_id: assignedStudentId || null,
                  teacher_id: assignedTeacherId || undefined,
                  is_virtual: isVirtual,
                })}
                disabled={saving}
                className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-bold disabled:opacity-50"
                style={{ background: "#00ff88", color: "#0a0a0c" }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={onClose}
                className="flex items-center justify-center rounded-xl border px-4 py-3 text-sm text-[var(--z-muted)]"
                style={{ borderColor: "var(--z-border)" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MobileScheduleView({
  locationId: _locationId,
  locationConfig,
  selectedDate,
  blocks,
  teachers,
  students,
  families,
  locationHours,
  onBlocksChange,
}: Props) {
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);
  const [detailTeacherId, setDetailTeacherId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentMinute, setCurrentMinute] = React.useState(nowMin);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const id = setInterval(() => setCurrentMinute(nowMin()), 60_000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    setSelectedBlockId(null);
    setDetailTeacherId(null);
  }, [selectedDate]);

  const { openMinute, closeMinute, isClosed } = React.useMemo(
    () => getHoursForDate(locationHours, selectedDate),
    [locationHours, selectedDate],
  );

  const projected = React.useMemo(
    () => projectBlocksForWindow(blocks, selectedDate, selectedDate),
    [blocks, selectedDate],
  );

  const dayBlocks = React.useMemo(
    () => projected.filter(b => b.block_date === selectedDate),
    [projected, selectedDate],
  );

  const studentsById = React.useMemo(() => {
    const m = new Map<string, Student>();
    for (const s of students) m.set(s.id, s);
    return m;
  }, [students]);

  const familiesById = React.useMemo(() => {
    const m = new Map<string, Family>();
    for (const f of families) m.set(f.id, f);
    return m;
  }, [families]);

  const teachersForBoard = React.useMemo(() => {
    const ids = new Set(dayBlocks.map(b => b.teacher_id).filter(Boolean) as string[]);
    const withBlocks = teachers.filter(t => ids.has(t.id)).sort((a, b) =>
      teacherDisplayName(a).localeCompare(teacherDisplayName(b)),
    );
    return withBlocks.length > 0 ? withBlocks : teachers.slice(0, 8);
  }, [teachers, dayBlocks]);

  // Scroll to current time on mount
  React.useEffect(() => {
    if (!scrollRef.current) return;
    const isToday = selectedDate === new Date().toISOString().slice(0, 10);
    if (!isToday) return;
    const totalMinutes = closeMinute - openMinute;
    const nowOffset = currentMinute - openMinute;
    const totalWidth = Math.ceil(totalMinutes / 30) * SLOT_W;
    const scrollX = Math.max(0, (nowOffset / totalMinutes) * totalWidth - 80);
    scrollRef.current.scrollLeft = scrollX;
  }, [selectedDate, openMinute, closeMinute, currentMinute]);

  async function patchBlock(block: ProjectedBlock, patch: Partial<ScheduleBlock>) {
    const targetId = block.source_block_id || block.id;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/schedule-blocks/${encodeURIComponent(targetId)}?skip_conflict_check=true`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json", "x-tenant-id": block.tenant_id },
          body: JSON.stringify(patch),
        },
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? `Update failed (${res.status})`);
      }
      onBlocksChange(blocks.map(b => b.id === targetId ? { ...b, ...(patch as Partial<ScheduleBlock>) } : b));
      setSelectedBlockId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function checkIn(block: ProjectedBlock) {
    await patchBlock(block, {
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      teacher_tally: true,
      status: "booked",
    });
  }

  async function callOut(block: ProjectedBlock) {
    await patchBlock(block, {
      block_type: "call_out",
      is_family_callout: true,
      status: "available",
    });
  }

  async function cancelSession(block: ProjectedBlock, scope: "single" | "recurring", reason: string) {
    const targetId = block.source_block_id || block.id;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/schedule-blocks/cancel-session", {
        method: "POST",
        headers: { "content-type": "application/json", "x-tenant-id": block.tenant_id },
        body: JSON.stringify({
          block_id: targetId,
          block_date: block.block_date ?? selectedDate,
          student_id: block.student_id,
          scope,
          reason: reason.trim() || "Cancelled via mobile",
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? `Cancel failed (${res.status})`);
      }
      onBlocksChange(
        blocks.map(b =>
          b.id === targetId
            ? {
                ...b,
                student_id: null,
                block_type: "open_time" as ScheduleBlock["block_type"],
                status: "available" as ScheduleBlock["status"],
                checked_in: false,
                teacher_tally: false,
              }
            : b,
        ),
      );
      setSelectedBlockId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel session");
    } finally {
      setSaving(false);
    }
  }

  // ── Teacher detail view (early return) ────────────────────────────────────
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const detailTeacher = detailTeacherId ? (teachers.find(t => t.id === detailTeacherId) ?? null) : null;
  if (detailTeacherId && detailTeacher) {
    return (
      <TeacherDetailView
        teacher={detailTeacher}
        dayBlocks={dayBlocks}
        openMinute={openMinute}
        closeMinute={closeMinute}
        selectedDate={selectedDate}
        isToday={isToday}
        currentMinute={currentMinute}
        studentsById={studentsById}
        familiesById={familiesById}
        teachers={teachers}
        students={students}
        locationConfig={locationConfig}
        onBack={() => { setDetailTeacherId(null); setSelectedBlockId(null); }}
        onPatchBlock={patchBlock}
        onCheckIn={checkIn}
        onCallOut={callOut}
        onCancelSession={cancelSession}
        saving={saving}
        error={error}
        onClearError={() => setError(null)}
      />
    );
  }

  if (isClosed) {
    return (
      <div className="mx-4 my-6 rounded-xl border p-8 text-center"
        style={{ borderColor: locationConfig?.border ?? "var(--z-border)" }}>
        <p className="text-sm font-semibold text-[var(--z-muted)]">Closed on this day</p>
      </div>
    );
  }

  const totalSlots = Math.ceil((closeMinute - openMinute) / 30);
  const timelineWidth = totalSlots * SLOT_W;
  const nowX = isToday && currentMinute >= openMinute && currentMinute <= closeMinute
    ? ((currentMinute - openMinute) / 30) * SLOT_W
    : null;

  const selectedBlock = selectedBlockId
    ? dayBlocks.find(b => b.id === selectedBlockId || b.source_block_id === selectedBlockId) ?? null
    : null;
  const selectedStudent = selectedBlock?.student_id ? studentsById.get(selectedBlock.student_id) ?? null : null;
  const selectedFamily = selectedStudent?.family_id ? familiesById.get(selectedStudent.family_id) ?? null : null;

  return (
    <>
      {/* Grid */}
      <div className="flex" style={{ background: "var(--z-bg)" }}>
        {/* Fixed teacher column */}
        <div className="shrink-0 z-10" style={{ width: TEACHER_COL_W, background: "var(--z-bg)" }}>
          {/* Corner cell */}
          <div style={{ height: HEADER_H, borderBottom: "1px solid var(--z-border)", borderRight: "1px solid var(--z-border)" }} />
          {/* Teacher rows — tap to open detail view */}
          {teachersForBoard.map(teacher => (
            <button key={teacher.id}
              onClick={() => { setDetailTeacherId(teacher.id); setSelectedBlockId(null); }}
              className="flex w-full items-center justify-center"
              style={{
                height: ROW_H,
                borderBottom: "1px solid var(--z-border)",
                borderRight: "1px solid var(--z-border)",
                background: "transparent",
              }}>
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold"
                  style={{
                    borderColor: locationConfig?.border ?? "var(--z-border)",
                    background: locationConfig?.accent ?? "rgba(0,255,136,0.1)",
                    color: locationConfig?.textColor ?? "#00ff88",
                  }}>
                  {teacherInitials(teacher)}
                </div>
                <div className="max-w-[60px] truncate text-center text-[8px] text-[var(--z-muted)] leading-tight">
                  {teacherDisplayName(teacher).split(" ")[0]}
                </div>
               </div>
            </button>
          ))}
        </div>
        {/* Scrollable timeline */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden" style={{ WebkitOverflowScrolling: "touch" }}>
          <div style={{ width: timelineWidth, position: "relative" }}>
            {/* Time header */}
            <div className="relative" style={{ height: HEADER_H, borderBottom: "1px solid var(--z-border)" }}>
              {Array.from({ length: totalSlots }).map((_, i) => {
                const slotMin = openMinute + i * 30;
                const showLabel = slotMin % 60 === 0;
                return (
                  <div key={i} className="absolute top-0 bottom-0 flex items-center"
                    style={{
                      left: i * SLOT_W,
                      width: SLOT_W,
                      borderRight: "1px solid var(--z-border)",
                    }}>
                    {showLabel && (
                      <span className="pl-1 text-[9px] text-[var(--z-muted)]">{minToLabel(slotMin)}</span>
                    )}
                  </div>
                );
              })}
              {/* Now indicator in header */}
              {nowX !== null && (
                <div className="absolute top-0 bottom-0 w-px" style={{ left: nowX, background: "#a855f7", opacity: 0.8 }} />
              )}
            </div>

            {/* Teacher rows */}
            {teachersForBoard.map(teacher => {
              const tBlocks = dayBlocks.filter(b => b.teacher_id === teacher.id);
              return (
                <div key={teacher.id} className="relative"
                  style={{ height: ROW_H, borderBottom: "1px solid var(--z-border)" }}>
                  {/* Slot dividers */}
                  {Array.from({ length: totalSlots }).map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0"
                      style={{
                        left: i * SLOT_W,
                        width: SLOT_W,
                        borderRight: "1px solid var(--z-border)",
                        opacity: 0.3,
                      }} />
                  ))}

                  {/* Now line */}
                  {nowX !== null && (
                    <div className="absolute top-0 bottom-0 w-px z-10"
                      style={{ left: nowX, background: "#a855f7", opacity: 0.5 }} />
                  )}

                  {/* Blocks */}
                  {tBlocks.map(b => {
                    const startSlot = (toMin(b.start_time) - openMinute) / 30;
                    const endSlot = (toMin(b.end_time) - openMinute) / 30;
                    const left = startSlot * SLOT_W;
                    const width = Math.max((endSlot - startSlot) * SLOT_W - 2, 10);
                    const bs = blockStyle(b as ScheduleBlock);
                    const student = b.student_id ? studentsById.get(b.student_id) : null;
                    const instr = student
                      ? (student as unknown as Record<string, unknown>).instrument as string | undefined
                      : undefined;
                    const isSelected = b.id === selectedBlockId || b.source_block_id === selectedBlockId;

                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBlockId(isSelected ? null : (b.source_block_id || b.id))}
                        className="absolute top-1 bottom-1 rounded overflow-hidden text-left transition-all"
                        style={{
                          left,
                          width,
                          background: bs.bg,
                          border: `1px solid ${bs.border}`,
                          color: bs.text,
                          outline: isSelected ? `2px solid ${bs.border}` : "none",
                          outlineOffset: 1,
                          zIndex: isSelected ? 5 : 2,
                        }}>
                        <div className="flex h-full flex-col justify-center px-1">
                          {width > 30 && (
                            <div className="truncate text-[9px] font-semibold leading-tight">
                              {student ? `${instrumentEmoji(instr)}${studentFirstName(student)}` : (bs.label || "Open")}
                            </div>
                          )}
                          {width > 50 && (
                            <div className="truncate text-[8px] opacity-75 leading-tight">
                              {minToLabel(toMin(b.start_time))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action sheet overlay */}
      {selectedBlock && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => { setSelectedBlockId(null); setError(null); }} />
          <ActionSheet
            block={selectedBlock}
            student={selectedStudent}
            family={selectedFamily}
            teachers={teachers}
            students={students}
            onSave={patch => { void patchBlock(selectedBlock, patch); }}
            onCheckIn={() => { void checkIn(selectedBlock); }}
            onCallOut={() => { void callOut(selectedBlock); }}
            onCancelSession={(scope, reason) => { void cancelSession(selectedBlock, scope, reason); }}
            onClose={() => { setSelectedBlockId(null); setError(null); }}
            saving={saving}
            error={error}
          />
        </>
      )}
    </>
  );
}
