"use client";
import * as React from "react";
import type { Family, ScheduleBlock, Student, Teacher } from "@/lib/types/entities";
import type { LocationHoursMap } from "@/lib/schedule/locationHoursUtils";
import { getHoursForDate } from "@/lib/schedule/locationHoursUtils";
import {
  projectBlocksForWindow,
  type ProjectedBlock,
} from "@/lib/schedule/windowedClient";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toMinute(value: string): number {
  const [h = "0", m = "0"] = value.split(":");
  return Number(h) * 60 + Number(m);
}
function minuteToLabel(value: number): string {
  const h24 = Math.floor(value / 60);
  const m = value % 60;
  const hour = h24 % 12 || 12;
  const suffix = h24 >= 12 ? "PM" : "AM";
  return m === 0 ? `${hour}${suffix}` : `${hour}:${m.toString().padStart(2, "0")}${suffix}`;
}
function nowMinute(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}
function teacherInitials(t: Teacher): string {
  const r = t as unknown as Record<string, unknown>;
  const first = (r.first_name as string | undefined)?.trim() ?? "";
  const last = (r.last_name as string | undefined)?.trim() ?? "";
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}
function teacherName(t: Teacher): string {
  const r = t as unknown as Record<string, unknown>;
  const first = (r.first_name as string | undefined)?.trim() ?? "";
  const last = (r.last_name as string | undefined)?.trim() ?? "";
  return `${first} ${last}`.trim() || "Teacher";
}
function studentName(s: Student): string {
  const r = s as unknown as Record<string, unknown>;
  const first = (r.first_name as string | undefined)?.trim() ?? "";
  const last = (r.last_name as string | undefined)?.trim() ?? "";
  return `${first} ${last}`.trim() || "Student";
}
function instrumentEmoji(instr: string | null | undefined): string {
  if (!instr) return "";
  if (/guitar|bass/i.test(instr)) return "🎸";
  if (/piano|keyboard/i.test(instr)) return "🎹";
  if (/drum|perc/i.test(instr)) return "🥁";
  if (/violin|viola|cello|string/i.test(instr)) return "🎻";
  if (/trumpet|horn|brass/i.test(instr)) return "🎺";
  if (/sax|clarinet|flute|wind/i.test(instr)) return "🎷";
  if (/voice|vocal|sing/i.test(instr)) return "🎤";
  return "🎵";
}

// ─── Block styling ────────────────────────────────────────────────────────────
type BlockStyle = { bg: string; border: string; text: string; label: string };
function getBlockStyle(block: ScheduleBlock | ProjectedBlock): BlockStyle {
  if (block.checked_in) return { bg: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.55)", text: "#86efac", label: "✓ Checked In" };
  if (block.is_family_callout || block.block_type === "call_out") return { bg: "rgba(249,115,22,0.18)", border: "#ea580c", text: "#fb923c", label: "Call Out" };
  if (block.is_makeup_session || block.block_type === "makeup_session") return { bg: "rgba(236,72,153,0.18)", border: "#db2777", text: "#f472b6", label: "Makeup" };
  if (block.is_virtual || block.block_type === "virtual") return { bg: "rgba(14,165,233,0.18)", border: "#0284c7", text: "#38bdf8", label: "Virtual" };
  if (block.block_type === "first_day") return { bg: "rgba(59,130,246,0.18)", border: "#2563eb", text: "#60a5fa", label: "First Day" };
  if (block.block_type === "last_day") return { bg: "rgba(239,68,68,0.18)", border: "#dc2626", text: "#f87171", label: "Last Day" };
  if (block.block_type === "meet_greet") return { bg: "rgba(20,184,166,0.18)", border: "#0d9488", text: "#2dd4bf", label: "Meet & Greet" };
  if (block.block_type === "sub") return { bg: "rgba(34,197,94,0.18)", border: "#16a34a", text: "#4ade80", label: "Sub" };
  if (block.block_type === "teacher_training") return { bg: "rgba(139,92,246,0.18)", border: "#7c3aed", text: "#a78bfa", label: "Training" };
  if (block.block_type === "not_bookable") return { bg: "rgba(107,114,128,0.18)", border: "#6b7280", text: "#9ca3af", label: "Locked" };
  if (block.block_type === "open_time" || !block.student_id) return { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)", text: "rgba(16,185,129,0.8)", label: "Open" };
  return { bg: "rgba(234,179,8,0.18)", border: "#ca8a04", text: "#fbbf24", label: "" };
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

// ─── Block Edit Sheet ─────────────────────────────────────────────────────────
function BlockEditSheet({
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
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [cancelScope, setCancelScope] = React.useState<"single" | "recurring">("single");
  const [cancelReason, setCancelReason] = React.useState("");
  const bStyle = getBlockStyle(block);
  const isOpen = block.block_type === "open_time" || !block.student_id;

  return (
    <div className="border-t" style={{ borderColor: bStyle.border }}>
      {/* Sheet header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--z-border)" }}>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: bStyle.border }} />
          <span className="text-sm font-bold text-[var(--z-fg)]">
            {minuteToLabel(toMinute(block.start_time))} – {minuteToLabel(toMinute(block.end_time))}
          </span>
          {bStyle.label && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: bStyle.bg, color: bStyle.text, border: `1px solid ${bStyle.border}` }}>
              {bStyle.label}
            </span>
          )}
        </div>
        <button onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--z-muted)]"
          style={{ border: "1px solid var(--z-border)" }}>
          ✕
        </button>
      </div>

      {/* Student info */}
      {student && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b"
          style={{ borderColor: "var(--z-border)", background: "var(--z-surface)" }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88" }}>
            {(studentName(student)[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--z-fg)] truncate">{studentName(student)}</div>
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

      {/* Content */}
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
            {!isOpen && !showCancelConfirm && (
              <button onClick={() => setShowCancelConfirm(true)}
                className="w-full rounded-xl py-3 text-sm font-bold"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}>
                Cancel Session
              </button>
            )}
            {showCancelConfirm && (
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
                  <button onClick={() => setShowCancelConfirm(false)}
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
              <select value={blockType} onChange={e => setBlockType(e.target.value as ScheduleBlock["block_type"])}
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
                {students.map(s => <option key={s.id} value={s.id}>{studentName(s)}</option>)}
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
                {teachers.map(t => <option key={t.id} value={t.id}>{teacherName(t)}</option>)}
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
  const [detailTeacherId, setDetailTeacherId] = React.useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentMinute, setCurrentMinute] = React.useState(nowMinute);

  React.useEffect(() => {
    const id = setInterval(() => setCurrentMinute(nowMinute()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Reset detail view when date changes
  React.useEffect(() => {
    setDetailTeacherId(null);
    setSelectedBlockId(null);
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
    const withBlocks = teachers.filter(t => ids.has(t.id)).sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
    return withBlocks.length > 0 ? withBlocks : teachers.slice(0, 8);
  }, [teachers, dayBlocks]);

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
            ? { ...b, student_id: null, block_type: "open_time" as ScheduleBlock["block_type"], status: "available" as ScheduleBlock["status"], checked_in: false, teacher_tally: false }
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

  if (isClosed) {
    return (
      <div className="mx-4 my-6 rounded-xl border p-8 text-center"
        style={{ borderColor: locationConfig?.border ?? "var(--z-border)" }}>
        <p className="text-sm font-semibold text-[var(--z-muted)]">Closed on this day</p>
      </div>
    );
  }

  // ── Teacher detail view (early return) ───────────────────────────────────
  if (detailTeacherId) {
    const teacher = teachers.find(t => t.id === detailTeacherId);
    if (!teacher) {
      setDetailTeacherId(null);
      return null;
    }

    const tBlocks = dayBlocks
      .filter(b => b.teacher_id === teacher.id)
      .sort((a, b) => toMinute(a.start_time) - toMinute(b.start_time));

    const slots: number[] = [];
    for (let m = openMinute; m < closeMinute; m += 30) slots.push(m);
    const isToday = selectedDate === new Date().toISOString().slice(0, 10);

    return (
      <div style={{ background: "var(--z-bg)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3 sticky top-0 z-10"
          style={{ borderColor: locationConfig?.border ?? "var(--z-border)", background: "var(--z-bg)" }}>
          <button
            onClick={() => { setDetailTeacherId(null); setSelectedBlockId(null); }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-bold text-lg"
            style={{ borderColor: "var(--z-border)", color: "var(--z-muted)" }}>
            ←
          </button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
            style={{
              borderColor: locationConfig?.border ?? "var(--z-border)",
              background: locationConfig?.accent ?? "rgba(0,255,136,0.1)",
              color: locationConfig?.textColor ?? "#00ff88",
            }}>
            {teacherInitials(teacher)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-[var(--z-fg)] truncate">{teacherName(teacher)}</div>
            <div className="text-[10px] text-[var(--z-muted)]">
              {tBlocks.filter(b => b.student_id && b.block_type !== "open_time").length} students
              {" · "}
              {tBlocks.filter(b => !b.student_id || b.block_type === "open_time").length} open
            </div>
          </div>
          {isToday && (
            <div className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)", color: "#c084fc" }}>
              TODAY
            </div>
          )}
        </div>

        {/* Vertical slot list */}
        <div>
          {slots.map(slotMinute => {
            // Find a block that covers this slot
            const block = tBlocks.find(b => {
              const bStart = toMinute(b.start_time);
              const bEnd = toMinute(b.end_time);
              return bStart <= slotMinute && bEnd > slotMinute;
            });

            // Empty slot
            if (!block) {
              return (
                <div key={slotMinute} className="flex items-center gap-3 px-4 py-2 border-b"
                  style={{ borderColor: "var(--z-border)" }}>
                  <div className="w-14 shrink-0 text-right text-[11px] font-medium text-[var(--z-muted)]">
                    {minuteToLabel(slotMinute)}
                  </div>
                  <div className="h-px flex-1 opacity-20" style={{ background: "var(--z-border)" }} />
                </div>
              );
            }

            // Only render the block row at its start time
            const blockStart = toMinute(block.start_time);
            if (blockStart !== slotMinute) return null;

            const bStyle = getBlockStyle(block);
            const student = block.student_id ? studentsById.get(block.student_id) : null;
            const family = student?.family_id ? familiesById.get(student.family_id) : null;
            const instr = student ? (student as unknown as Record<string, unknown>).instrument as string | undefined : undefined;
            const emoji = instr ? instrumentEmoji(instr) : "";
            const blockEnd = toMinute(block.end_time);
            const durationMins = blockEnd - blockStart;
            const isSelected = block.id === selectedBlockId || block.source_block_id === selectedBlockId;
            const isNow = isToday && currentMinute >= blockStart && currentMinute < blockEnd;

            return (
              <React.Fragment key={block.id}>
                <button
                  onClick={() => setSelectedBlockId(isSelected ? null : (block.source_block_id || block.id))}
                  className="w-full text-left border-b"
                  style={{ background: isSelected ? bStyle.bg : "transparent", borderColor: "var(--z-border)" }}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Time */}
                    <div className="w-14 shrink-0 text-right">
                      <div className="text-[11px] font-semibold text-[var(--z-fg)]">{minuteToLabel(blockStart)}</div>
                      <div className="text-[9px] text-[var(--z-muted)]">{durationMins}m</div>
                    </div>
                    {/* Color bar */}
                    <div className="w-1 shrink-0 self-stretch rounded-full" style={{ background: bStyle.border, minHeight: 36 }} />
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {student ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            {emoji && <span className="text-sm">{emoji}</span>}
                            <span className="text-sm font-semibold text-[var(--z-fg)] truncate">{studentName(student)}</span>
                            {isNow && (
                              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                                style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc" }}>
                                NOW
                              </span>
                            )}
                          </div>
                          {family && (
                            <div className="text-[11px] text-[var(--z-muted)] truncate">
                              {String((family as unknown as Record<string, unknown>).name ?? "")}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: bStyle.text }}>
                            {bStyle.label || "Open"}
                          </span>
                          {isNow && (
                            <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                              style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc" }}>
                              NOW
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Status badge */}
                    <div className="shrink-0">
                      {block.checked_in ? (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>
                          ✓ In
                        </span>
                      ) : bStyle.label && bStyle.label !== "Open" ? (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: bStyle.bg, color: bStyle.text, border: `1px solid ${bStyle.border}` }}>
                          {bStyle.label}
                        </span>
                      ) : (
                        <span className="text-[var(--z-muted)] text-lg">›</span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Inline edit sheet */}
                {isSelected && (
                  <BlockEditSheet
                    block={block}
                    student={student ?? null}
                    family={family ?? null}
                    teachers={teachers}
                    students={students}
                    onSave={patch => { void patchBlock(block, patch); }}
                    onCheckIn={() => { void checkIn(block); }}
                    onCallOut={() => { void callOut(block); }}
                    onCancelSession={(scope, reason) => { void cancelSession(block, scope, reason); }}
                    onClose={() => { setSelectedBlockId(null); setError(null); }}
                    saving={saving}
                    error={error}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Main view: teacher cards stacked vertically ───────────────────────────
  return (
    <div>
      {teachersForBoard.map(teacher => {
        const tBlocks = dayBlocks
          .filter(b => b.teacher_id === teacher.id)
          .sort((a, b) => toMinute(a.start_time) - toMinute(b.start_time));
        const bookedCount = tBlocks.filter(b => b.student_id && b.block_type !== "open_time").length;
        const openCount = tBlocks.filter(b => !b.student_id || b.block_type === "open_time").length;

        return (
          <button
            key={teacher.id}
            onClick={() => { setDetailTeacherId(teacher.id); setSelectedBlockId(null); }}
            className="w-full text-left border-b"
            style={{ borderColor: "var(--z-border)", background: "transparent" }}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                style={{
                  borderColor: locationConfig?.border ?? "var(--z-border)",
                  background: locationConfig?.accent ?? "rgba(0,255,136,0.1)",
                  color: locationConfig?.textColor ?? "#00ff88",
                }}>
                {teacherInitials(teacher)}
              </div>

              {/* Name + counts */}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--z-fg)] truncate">{teacherName(teacher)}</div>
                <div className="mt-0.5 flex items-center gap-2">
                  {bookedCount > 0 && (
                    <span className="text-[11px] font-medium text-[var(--z-muted)]">{bookedCount} booked</span>
                  )}
                  {openCount > 0 && (
                    <span className="text-[11px] font-medium" style={{ color: "rgba(16,185,129,0.8)" }}>
                      {openCount} open
                    </span>
                  )}
                  {tBlocks.length === 0 && (
                    <span className="text-[11px] text-[var(--z-muted)]">No blocks today</span>
                  )}
                </div>
              </div>

              {/* Session preview pills */}
              <div className="flex shrink-0 flex-col gap-0.5 items-end">
                {tBlocks.slice(0, 4).map(b => {
                  const s = getBlockStyle(b);
                  const student = b.student_id ? studentsById.get(b.student_id) : null;
                  const instr = student
                    ? (student as unknown as Record<string, unknown>).instrument as string | undefined
                    : undefined;
                  return (
                    <div key={b.id} className="flex items-center gap-1">
                      <span className="text-[10px] text-[var(--z-muted)]">{minuteToLabel(toMinute(b.start_time))}</span>
                      <span className="rounded px-1 py-0.5 text-[9px] font-semibold truncate max-w-[80px]"
                        style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                        {instr ? instrumentEmoji(instr) : ""}
                        {student ? studentName(student).split(" ")[0] : (s.label || "Open")}
                      </span>
                    </div>
                  );
                })}
                {tBlocks.length > 4 && (
                  <span className="text-[9px] text-[var(--z-muted)]">+{tBlocks.length - 4} more</span>
                )}
              </div>

              {/* Chevron */}
              <div className="shrink-0 text-[var(--z-muted)] text-lg ml-1">›</div>
            </div>
          </button>
        );
      })}

      {teachersForBoard.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-[var(--z-muted)]">
          No teachers scheduled today
        </div>
      )}
    </div>
  );
}
