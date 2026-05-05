"use client";
import * as React from "react";
import * as ReactDOM from "react-dom";
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
  const first = ((t as unknown as Record<string, unknown>).first_name as string | undefined)?.trim() ?? "";
  const last = ((t as unknown as Record<string, unknown>).last_name as string | undefined)?.trim() ?? "";
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}
function teacherName(t: Teacher): string {
  const first = ((t as unknown as Record<string, unknown>).first_name as string | undefined)?.trim() ?? "";
  const last = ((t as unknown as Record<string, unknown>).last_name as string | undefined)?.trim() ?? "";
  return `${first} ${last}`.trim() || "Teacher";
}
function studentName(s: Student): string {
  const first = ((s as unknown as Record<string, unknown>).first_name as string | undefined)?.trim() ?? "";
  const last = ((s as unknown as Record<string, unknown>).last_name as string | undefined)?.trim() ?? "";
  return `${first} ${last}`.trim() || "Student";
}
function instrumentEmoji(instr: string | null | undefined): string {
  if (!instr) return "";
  if (/guitar|bass/i.test(instr)) return "\u{1F3B8}";
  if (/piano|keyboard/i.test(instr)) return "\u{1F3B9}";
  if (/drum|perc/i.test(instr)) return "\u{1F941}";
  if (/violin|viola|cello|string/i.test(instr)) return "\u{1F3BB}";
  if (/trumpet|horn|brass/i.test(instr)) return "\u{1F3BA}";
  if (/sax|clarinet|flute|wind/i.test(instr)) return "\u{1F3B7}";
  if (/voice|vocal|sing/i.test(instr)) return "\u{1F3A4}";
  return "\u{1F3B5}";
}

// ─── Block color config ───────────────────────────────────────────────────────
function getBlockColor(block: ScheduleBlock | ProjectedBlock): { bg: string; border: string; text: string } {
  if (block.checked_in) return { bg: "rgba(34,197,94,0.25)", border: "rgba(34,197,94,0.55)", text: "#86efac" };
  if (block.is_family_callout || block.block_type === "call_out") return { bg: "rgba(249,115,22,0.85)", border: "#ea580c", text: "#fff" };
  if (block.is_makeup_session || block.block_type === "makeup_session") return { bg: "rgba(236,72,153,0.85)", border: "#db2777", text: "#fff" };
  if (block.is_virtual || block.block_type === "virtual") return { bg: "rgba(14,165,233,0.85)", border: "#0284c7", text: "#fff" };
  if (block.block_type === "first_day") return { bg: "rgba(59,130,246,0.85)", border: "#2563eb", text: "#fff" };
  if (block.block_type === "last_day") return { bg: "rgba(239,68,68,0.85)", border: "#dc2626", text: "#fff" };
  if (block.block_type === "meet_greet") return { bg: "rgba(20,184,166,0.85)", border: "#0d9488", text: "#fff" };
  if (block.block_type === "sub") return { bg: "rgba(34,197,94,0.85)", border: "#16a34a", text: "#fff" };
  if (block.block_type === "teacher_training") return { bg: "rgba(139,92,246,0.85)", border: "#7c3aed", text: "#fff" };
  if (block.block_type === "not_bookable") return { bg: "rgba(107,114,128,0.7)", border: "#6b7280", text: "#fff" };
  if (block.block_type === "open_time" || !block.student_id) return { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "rgba(16,185,129,0.9)" };
  return { bg: "rgba(234,179,8,0.9)", border: "#ca8a04", text: "#000" };
}
function getBlockLabel(block: ScheduleBlock | ProjectedBlock): string {
  if (block.checked_in) return "\u2713 In";
  if (block.is_family_callout || block.block_type === "call_out") return "Out";
  if (block.is_makeup_session || block.block_type === "makeup_session") return "Mkup";
  if (block.is_virtual || block.block_type === "virtual") return "Virt";
  if (block.block_type === "first_day") return "1st";
  if (block.block_type === "last_day") return "Last";
  if (block.block_type === "meet_greet") return "M&G";
  if (block.block_type === "sub") return "Sub";
  if (block.block_type === "teacher_training") return "Train";
  if (block.block_type === "not_bookable") return "Lock";
  if (block.block_type === "open_time" || !block.student_id) return "Open";
  return "";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PX_PER_MINUTE = 2.2;
const ROW_HEIGHT = 44;
const TEACHER_COL_W = 80;
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

// ─── Full Block Edit Sheet ────────────────────────────────────────────────────
// Preserved exactly from original. Handles check-in, call-out, cancel, edit.
function BlockEditSheet({
  block, student, family, teachers, students,
  onSave, onCheckIn, onCallOut, onCancelSession, onClose, saving, error,
}: {
  block: ProjectedBlock;
  student: Student | null;
  family: Family | null;
  teachers: Teacher[];
  students: Student[];
  onSave: (patch: Partial<ScheduleBlock>) => Promise<void>;
  onCheckIn: () => Promise<void>;
  onCallOut: () => Promise<void>;
  onCancelSession: (scope: "single" | "recurring", reason: string) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [tab, setTab] = React.useState<"actions" | "edit" | "cancel">("actions");
  const [blockType, setBlockType] = React.useState(block.block_type ?? "student_session");
  const [assignedTeacherId, setAssignedTeacherId] = React.useState(block.teacher_id ?? "");
  const [assignedStudentId, setAssignedStudentId] = React.useState(block.student_id ?? "");
  const [isVirtual, setIsVirtual] = React.useState(block.is_virtual ?? false);
  const [isRecurring, setIsRecurring] = React.useState(block.is_recurring ?? false);
  const [notes, setNotes] = React.useState(block.notes ?? "");
  const [cancelScope, setCancelScope] = React.useState<"single" | "recurring">("single");
  const [cancelReason, setCancelReason] = React.useState("");
  const color = getBlockColor(block);
  const label = getBlockLabel(block);
  async function handleSave() {
    await onSave({
      block_type: blockType as ScheduleBlock["block_type"],
      teacher_id: assignedTeacherId || null,
      student_id: assignedStudentId || null,
      is_virtual: isVirtual,
      is_recurring: isRecurring,
      notes: notes.trim() || null,
    });
  }
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="mt-auto flex max-h-[85vh] flex-col rounded-t-2xl"
        style={{ background: "var(--z-bg)", borderTop: `2px solid ${color.border}` }}>
        <div className="flex items-start gap-3 border-b border-[var(--z-border)] px-4 py-4 shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
            style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}>
            {label || (student ? studentName(student).split(" ")[0]?.[0]?.toUpperCase() : "?")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-[var(--z-fg)]">
              {student ? studentName(student) : label || "Block"}
            </div>
            <div className="text-xs text-[var(--z-muted)]">
              {minuteToLabel(toMinute(block.start_time))} \u2013 {minuteToLabel(toMinute(block.end_time))}
              {block.is_recurring && <span className="ml-2 text-[10px] font-semibold text-purple-400">\u21bb Recurring</span>}
              {block.is_virtual && <span className="ml-2 text-[10px] font-semibold text-blue-400">Virtual</span>}
            </div>
            {family && (
              <div className="text-xs text-[var(--z-muted)]">
                {family.primary_contact_name ?? family.name ?? ""}
                {family.primary_phone ? ` \u00b7 ${family.primary_phone}` : ""}
              </div>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 text-[var(--z-muted)] hover:text-[var(--z-fg)] text-lg">\u2715</button>
        </div>
        <div className="flex border-b border-[var(--z-border)] px-3 shrink-0">
          {(["actions", "edit"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${tab === t ? "border-b-2 border-[var(--z-accent)] text-[var(--z-accent)]" : "text-[var(--z-muted)] hover:text-[var(--z-fg)]"}`}>
              {t === "actions" ? "Actions" : "Edit Block"}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 p-5 pb-8">
          {error && <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
          {tab === "actions" && (
            <div className="space-y-2">
              {!block.checked_in && block.student_id && (
                <button onClick={onCheckIn} disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/20 py-3 text-sm font-bold text-emerald-100 disabled:opacity-50">
                  {saving ? <span className="animate-pulse">Saving\u2026</span> : <>\u2713 Check In</>}
                </button>
              )}
              {block.checked_in && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-300">
                  \u2713 Already Checked In
                </div>
              )}
              {!block.checked_in && block.student_id && (
                <button onClick={onCallOut} disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/60 bg-red-500/10 py-3 text-sm font-semibold text-red-300 disabled:opacity-50">
                  Mark Call Out
                </button>
              )}
              {block.student_id && (
                <button onClick={() => setTab("cancel")} disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-400/60 bg-orange-500/10 py-3 text-sm font-semibold text-orange-300 disabled:opacity-50">
                  Cancel Session
                </button>
              )}
              <button onClick={() => setTab("edit")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] py-3 text-sm font-semibold text-[var(--z-fg)]">
                Edit Block Details
              </button>
              <button onClick={onClose}
                className="flex w-full items-center justify-center rounded-xl border border-[var(--z-border)] py-3 text-sm text-[var(--z-muted)]">
                Close
              </button>
            </div>
          )}
          {tab === "cancel" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--z-muted)]">Removes the student from this slot and marks it as open time.</p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider">Scope</label>
                <div className="flex gap-2">
                  {(["single", "recurring"] as const).map(s => (
                    <button key={s} onClick={() => setCancelScope(s)}
                      className="flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-colors"
                      style={{ borderColor: cancelScope === s ? "var(--z-accent)" : "var(--z-border)", background: cancelScope === s ? "rgba(99,102,241,0.15)" : "var(--z-surface)", color: cancelScope === s ? "var(--z-accent)" : "var(--z-muted)" }}>
                      {s === "single" ? "This session only" : "All recurring"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider">Reason</label>
                <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={2}
                  placeholder="Optional reason\u2026"
                  className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => onCancelSession(cancelScope, cancelReason)} disabled={saving}
                  className="flex flex-1 items-center justify-center rounded-xl border border-red-400/60 bg-red-500/15 py-3 text-sm font-bold text-red-300 disabled:opacity-50">
                  {saving ? "Cancelling\u2026" : "Confirm Cancel"}
                </button>
                <button onClick={() => setTab("actions")}
                  className="flex items-center justify-center rounded-xl border border-[var(--z-border)] px-4 py-3 text-sm text-[var(--z-muted)]">
                  Back
                </button>
              </div>
            </div>
          )}
          {tab === "edit" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider">Block Type</label>
                <select value={blockType} onChange={e => setBlockType(e.target.value)}
                  className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]">
                  {BLOCK_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider">Student</label>
                <select value={assignedStudentId} onChange={e => setAssignedStudentId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]">
                  <option value="">\u2014 No student \u2014</option>
                  {students.map(s => <option key={s.id} value={s.id}>{studentName(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider">Teacher</label>
                <select value={assignedTeacherId} onChange={e => setAssignedTeacherId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]">
                  <option value="">\u2014 Select teacher \u2014</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{teacherName(t)}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsVirtual(!isVirtual)}
                  className="flex flex-1 items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
                  style={{ borderColor: isVirtual ? "#0284c7" : "var(--z-border)", background: isVirtual ? "rgba(14,165,233,0.12)" : "var(--z-surface)", color: isVirtual ? "#38bdf8" : "var(--z-muted)" }}>
                  Virtual
                  <div className={`h-5 w-9 rounded-full transition-colors ${isVirtual ? "bg-blue-500" : "bg-[var(--z-border)]"}`}>
                    <div className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isVirtual ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
                  </div>
                </button>
                <button type="button" onClick={() => setIsRecurring(!isRecurring)}
                  className="flex flex-1 items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
                  style={{ borderColor: isRecurring ? "#7c3aed" : "var(--z-border)", background: isRecurring ? "rgba(139,92,246,0.12)" : "var(--z-surface)", color: isRecurring ? "#a78bfa" : "var(--z-muted)" }}>
                  Recurring
                  <div className={`h-5 w-9 rounded-full transition-colors ${isRecurring ? "bg-purple-500" : "bg-[var(--z-border)]"}`}>
                    <div className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isRecurring ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
                  </div>
                </button>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add notes\u2026"
                  className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex flex-1 items-center justify-center rounded-xl bg-[var(--z-accent)] py-3 text-sm font-bold text-[var(--z-on-accent)] disabled:opacity-50">
                  {saving ? "Saving\u2026" : "Save Changes"}
                </button>
                <button onClick={onClose}
                  className="flex items-center justify-center rounded-xl border border-[var(--z-border)] px-4 py-3 text-sm text-[var(--z-muted)]">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
// ─── Main component ───────────────────────────────────────────────────────────
export function MobileScheduleView({
  locationId,
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
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentMinute, setCurrentMinute] = React.useState(nowMinute);
  // null = main grid; string = teacher detail view for that teacher ID
  const [detailTeacherId, setDetailTeacherId] = React.useState<string | null>(null);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const id = setInterval(() => setCurrentMinute(nowMinute()), 30_000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (!timelineRef.current) return;
    const { openMinute } = getHoursForDate(locationHours, selectedDate);
    const scrollX = Math.max(0, (currentMinute - openMinute) * PX_PER_MINUTE - 80);
    timelineRef.current.scrollLeft = scrollX;
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const dayTeacherIds = React.useMemo(
    () => Array.from(new Set(dayBlocks.map(b => b.teacher_id).filter(Boolean) as string[])),
    [dayBlocks],
  );
  const teachersForBoard = React.useMemo(() => {
    const withBlocks = teachers
      .filter(t => dayTeacherIds.includes(t.id))
      .sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
    return withBlocks.length > 0 ? withBlocks : teachers.slice(0, 8);
  }, [teachers, dayTeacherIds]);

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
  const selectedBlock = React.useMemo(
    () => dayBlocks.find(b => b.id === selectedBlockId || b.source_block_id === selectedBlockId) ?? null,
    [dayBlocks, selectedBlockId],
  );

  const totalMinutes = closeMinute - openMinute;
  const timelineWidth = totalMinutes * PX_PER_MINUTE;
  const timeMarkers = React.useMemo(() => {
    const out: number[] = [];
    for (let m = openMinute; m <= closeMinute; m += 60) out.push(m);
    return out;
  }, [openMinute, closeMinute]);
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const nowX = isToday ? (currentMinute - openMinute) * PX_PER_MINUTE : null;

  // ── Block mutation helpers — all API calls preserved from original ──
  async function patchBlock(block: ProjectedBlock, patch: Partial<ScheduleBlock>) {
    const targetId = block.source_block_id || block.id;
    setSaving(true); setError(null);
    try {
      const res = await fetch(
        `/api/schedule-blocks/${encodeURIComponent(targetId)}?skip_conflict_check=true`,
        { method: "PATCH", headers: { "content-type": "application/json", "x-tenant-id": block.tenant_id }, body: JSON.stringify(patch) },
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `Update failed (${res.status})`);
      }
      onBlocksChange(blocks.map(b => b.id === targetId ? { ...b, ...(patch as Partial<ScheduleBlock>) } : b));
      setSelectedBlockId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally { setSaving(false); }
  }
  async function checkIn(block: ProjectedBlock) {
    await patchBlock(block, { checked_in: true, checked_in_at: new Date().toISOString(), teacher_tally: true, status: "booked" });
  }
  async function callOut(block: ProjectedBlock) {
    await patchBlock(block, { block_type: "call_out", is_family_callout: true, status: "available" });
  }
  async function cancelSession(block: ProjectedBlock, scope: "single" | "recurring", reason: string) {
    const targetId = block.source_block_id || block.id;
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/schedule-blocks/cancel-session", {
        method: "POST",
        headers: { "content-type": "application/json", "x-tenant-id": block.tenant_id },
        body: JSON.stringify({ block_id: targetId, block_date: block.block_date ?? selectedDate, student_id: block.student_id, scope, reason: reason.trim() || "Cancelled via mobile" }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `Cancel failed (${res.status})`);
      }
      const openPatch = { student_id: null, block_type: "open_time" as ScheduleBlock["block_type"], status: "available" as "available" | "booked", checked_in: false, teacher_tally: false };
      onBlocksChange(blocks.map(b => b.id === targetId ? { ...b, ...openPatch } : b));
      setSelectedBlockId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel session");
    } finally { setSaving(false); }
  }

  if (isClosed) {
    return (
      <div className="mx-4 my-6 rounded-xl border p-8 text-center" style={{ borderColor: locationConfig?.border ?? "var(--z-border)" }}>
        <p className="text-sm font-semibold text-[var(--z-muted)]">Closed on this day</p>
      </div>
    );
  }

  // ── Teacher detail view: early return (no portal — avoids transform stacking context trap) ──
  if (detailTeacherId) {
    const detailTeacher = teachers.find(t => t.id === detailTeacherId);
    if (detailTeacher) {
      const tBlocks = dayBlocks
        .filter(b => b.teacher_id === detailTeacher.id)
        .sort((a, b) => toMinute(a.start_time) - toMinute(b.start_time));
      const slots: number[] = [];
      for (let m = openMinute; m < closeMinute; m += 30) slots.push(m);
      return (
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3"
            style={{ borderColor: locationConfig?.border ?? "var(--z-border)" }}>
            <button
              onClick={() => { setDetailTeacherId(null); setSelectedBlockId(null); }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base font-bold"
              style={{ borderColor: "var(--z-border)", color: "var(--z-muted)" }}>
              ←
            </button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
              style={{ borderColor: locationConfig?.border ?? "var(--z-border)", background: locationConfig?.accent ?? "var(--z-surface-2)", color: locationConfig?.textColor ?? "var(--z-accent)" }}>
              {teacherInitials(detailTeacher)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold" style={{ color: "var(--z-fg)" }}>{teacherName(detailTeacher)}</div>
              <div className="text-xs" style={{ color: "var(--z-muted)" }}>
                {tBlocks.filter(b => b.student_id).length} sessions today
              </div>
            </div>
          </div>
          {/* Vertical slot list */}
          <div className="flex flex-col">
            {slots.map(slotMinute => {
              const block = tBlocks.find(b => {
                const s = toMinute(b.start_time);
                const e = toMinute(b.end_time);
                return s <= slotMinute && e > slotMinute;
              });
              const isSlotStart = block ? toMinute(block.start_time) === slotMinute : false;
              return (
                <div key={slotMinute} className="flex items-stretch border-b"
                  style={{ borderColor: "var(--z-border)", minHeight: 60 }}>
                  <div className="flex w-16 shrink-0 items-start justify-end pr-3 pt-3 text-[11px] font-medium"
                    style={{ color: "var(--z-muted)" }}>
                    {minuteToLabel(slotMinute)}
                  </div>
                  <div className="flex-1 px-3 py-2">
                    {block && isSlotStart ? (
                      <button
                        onClick={() => setSelectedBlockId(block.source_block_id || block.id)}
                        className="w-full rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98]"
                        style={{ backgroundColor: getBlockColor(block).bg, borderColor: getBlockColor(block).border, color: getBlockColor(block).text }}>
                        {block.student_id ? (() => {
                          const s = studentsById.get(block.student_id);
                          const instr = s ? (s as unknown as Record<string, unknown>).instrument as string | undefined : undefined;
                          return (
                            <div>
                              <div className="truncate text-sm font-bold leading-tight">
                                {instr ? instrumentEmoji(instr) + " " : ""}{s ? studentName(s) : "Student"}
                              </div>
                              <div className="mt-0.5 text-[11px] opacity-80">
                                {minuteToLabel(toMinute(block.start_time))} – {minuteToLabel(toMinute(block.end_time))}
                                {block.checked_in && " · Checked In"}
                                {block.is_virtual && " · Virtual"}
                                {block.is_makeup_session && " · Makeup"}
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="text-sm font-semibold">{getBlockLabel(block)}</div>
                        )}
                      </button>
                    ) : block && !isSlotStart ? (
                      <div className="flex h-full items-center">
                        <div className="h-full w-1 rounded-full" style={{ background: getBlockColor(block).border, opacity: 0.35 }} />
                      </div>
                    ) : (
                      <div className="h-full rounded-xl border border-dashed opacity-30"
                        style={{ borderColor: "var(--z-border)" }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {selectedBlock && (
            <BlockEditSheet
              block={selectedBlock}
              student={selectedBlock.student_id ? (studentsById.get(selectedBlock.student_id) ?? null) : null}
              family={(() => { const s = selectedBlock.student_id ? studentsById.get(selectedBlock.student_id) : null; return s?.family_id ? (familiesById.get(s.family_id) ?? null) : null; })()}
              teachers={teachers} students={students}
              onSave={patch => patchBlock(selectedBlock, patch)}
              onCheckIn={() => checkIn(selectedBlock)}
              onCallOut={() => callOut(selectedBlock)}
              onCancelSession={(scope, reason) => cancelSession(selectedBlock, scope, reason)}
              onClose={() => { setSelectedBlockId(null); setError(null); }}
              saving={saving} error={error}
            />
          )}
        </div>
      );
    }
  }

  // ── Main grid: teacher rows + horizontal timeline ──
  return (
    <div className="flex flex-col">
      <div className="flex" style={{ borderBottom: "1px solid var(--z-border)" }}>
        {/* Fixed teacher column */}
        <div className="shrink-0 border-r" style={{ width: TEACHER_COL_W, borderColor: "var(--z-border)" }}>
          <div className="border-b flex items-center justify-center gap-1" style={{ height: 28, borderColor: "var(--z-border)" }}>
            <span className="text-[9px] text-[var(--z-muted)] uppercase tracking-wider">Teacher</span>
          </div>
          {teachersForBoard.map(t => (
            <button key={t.id} onClick={() => setDetailTeacherId(t.id)}
              className="flex w-full flex-col items-center justify-center border-b gap-1 transition-colors active:bg-[var(--z-surface-2)] hover:bg-white/5"
              style={{ height: ROW_HEIGHT, borderColor: "var(--z-border)" }}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold"
                style={{ borderColor: locationConfig?.border ?? "var(--z-border)", background: locationConfig?.accent ?? "var(--z-surface-2)", color: locationConfig?.textColor ?? "var(--z-accent)" }}>
                {teacherInitials(t)}
              </div>
              <span className="text-[9px] font-semibold text-[var(--z-muted)]" style={{ color: locationConfig?.textColor ?? "var(--z-muted)" }}>›</span>
            </button>
          ))}
        </div>

        {/* Scrollable timeline */}
        <div ref={timelineRef} className="flex-1 overflow-x-auto overflow-y-hidden" style={{ WebkitOverflowScrolling: "touch" }}>
          <div style={{ width: timelineWidth, position: "relative", minWidth: "100%" }}>
            {/* Time ruler */}
            <div className="relative border-b" style={{ height: 28, borderColor: "var(--z-border)" }}>
              {timeMarkers.map(m => (
                <div key={m} className="absolute top-1 text-[9px] font-medium text-[var(--z-muted)]"
                  style={{ left: (m - openMinute) * PX_PER_MINUTE + 2 }}>
                  {minuteToLabel(m)}
                </div>
              ))}
            </div>
            {/* Teacher rows */}
            {teachersForBoard.map(teacher => {
              const tBlocks = dayBlocks.filter(b => b.teacher_id === teacher.id);
              return (
                <div key={teacher.id} className="relative border-b" style={{ height: ROW_HEIGHT, borderColor: "var(--z-border)" }}>
                  {timeMarkers.map(m => (
                    <div key={m} className="absolute top-0 bottom-0 border-l"
                      style={{ left: (m - openMinute) * PX_PER_MINUTE, borderColor: "var(--z-border)", opacity: 0.2 }} />
                  ))}
                  {tBlocks.map(block => {
                    const startM = toMinute(block.start_time);
                    const endM = toMinute(block.end_time);
                    const left = (startM - openMinute) * PX_PER_MINUTE;
                    const width = Math.max((endM - startM) * PX_PER_MINUTE - 2, 18);
                    const color = getBlockColor(block as ScheduleBlock);
                    const label = getBlockLabel(block as ScheduleBlock);
                    const student = block.student_id ? studentsById.get(block.student_id) : null;
                    const instr = student ? (student as unknown as Record<string, unknown>).instrument as string | undefined : undefined;
                    const emoji = instr ? instrumentEmoji(instr) : "";
                    const isSelected = block.id === selectedBlockId || block.source_block_id === selectedBlockId;
                    return (
                      <button key={block.id}
                        onClick={() => setSelectedBlockId(isSelected ? null : (block.source_block_id || block.id))}
                        className="absolute top-1 bottom-1 overflow-hidden rounded border px-1 py-0.5 text-left transition-all"
                        style={{ left, width, backgroundColor: color.bg, borderColor: isSelected ? "#fff" : color.border, color: color.text, outline: isSelected ? `2px solid ${color.border}` : "none", zIndex: isSelected ? 10 : 2 }}>
                        {student ? (
                          <div className="truncate text-[10px] font-bold leading-tight">
                            {emoji && <span className="mr-0.5">{emoji}</span>}
                            {studentName(student).split(" ")[0]}
                          </div>
                        ) : label ? (
                          <div className="truncate text-[10px] font-semibold leading-tight">{label}</div>
                        ) : null}
                        {block.checked_in && <div className="text-[8px] font-bold">\u2713</div>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {/* Now line */}
            {nowX !== null && nowX >= 0 && nowX <= timelineWidth && (
              <div className="pointer-events-none absolute top-0 bottom-0 z-20"
                style={{ left: nowX, width: 2, background: "#a855f7" }}>
                <div className="absolute -top-1 -left-[3px] h-2 w-2 rounded-full" style={{ background: "#a855f7" }} />
                <div className="absolute top-0 left-2 rounded px-1 py-0.5 text-[9px] font-bold text-white" style={{ background: "#a855f7" }}>
                  {minuteToLabel(currentMinute)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block edit sheet (main grid) */}
      {selectedBlock && !detailTeacherId && (
        <BlockEditSheet
          block={selectedBlock}
          student={selectedBlock.student_id ? (studentsById.get(selectedBlock.student_id) ?? null) : null}
          family={(() => { const s = selectedBlock.student_id ? studentsById.get(selectedBlock.student_id) : null; return s?.family_id ? (familiesById.get(s.family_id) ?? null) : null; })()}
          teachers={teachers} students={students}
          onSave={patch => patchBlock(selectedBlock, patch)}
          onCheckIn={() => checkIn(selectedBlock)}
          onCallOut={() => callOut(selectedBlock)}
          onCancelSession={(scope, reason) => cancelSession(selectedBlock, scope, reason)}
          onClose={() => { setSelectedBlockId(null); setError(null); }}
          saving={saving} error={error}
        />
      )}
    </div>
  );
}
