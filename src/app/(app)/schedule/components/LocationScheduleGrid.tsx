"use client";
import * as React from "react";
import Link from "next/link";
import type { Family, ScheduleBlock, Student, Teacher } from "@/lib/types/entities";
import type { RubyEvent } from "./RubyScheduleBar";
import type { TeacherAvailabilityRow } from "@/lib/schedule/windowedData";
import type { ScheduleRoom } from "@/lib/schedule/types";
import type { LocationHoursMap } from "@/lib/schedule/locationHoursUtils";
import { getHoursForDate } from "@/lib/schedule/locationHoursUtils";
import {
  projectBlocksForWindow,
  type ProjectedBlock,
} from "@/lib/schedule/windowedClient";

// ─── Types ────────────────────────────────────────────────────────────────────
type LocationConfig = {
  name: string;
  color: string;
  accent: string;
  border: string;
  bg: string;
  textColor: string;
};

type Props = {
  locationId: string;
  locationName: string;
  locationConfig?: LocationConfig;
  selectedDate: string;
  blocks: ScheduleBlock[];
  teachers: Teacher[];
  students: Student[];
  families: Family[];
  availability: TeacherAvailabilityRow[];
  rooms: ScheduleRoom[];
  locationHours: LocationHoursMap;
  onBlocksChange: (blocks: ScheduleBlock[]) => void;
  onRubyEvent?: (e: RubyEvent) => void;
};

// ─── Block type display config ─────────────────────────────────────────────────
const BLOCK_DISPLAY: Record<string, { label: string; bg: string; border: string; text: string }> = {
  student_session: { label: "",            bg: "rgba(234,179,8,0.9)",   border: "#ca8a04", text: "#000" },
  first_day:       { label: "First Day",    bg: "rgba(59,130,246,0.85)", border: "#2563eb", text: "#fff" },
  last_day:        { label: "Last Day",     bg: "rgba(239,68,68,0.85)",  border: "#dc2626", text: "#fff" },
  call_out:        { label: "Call Out",     bg: "rgba(249,115,22,0.85)", border: "#ea580c", text: "#fff" },
  makeup_session:  { label: "Makeup",       bg: "rgba(236,72,153,0.85)", border: "#db2777", text: "#fff" },
  meet_greet:      { label: "Meet & Greet", bg: "rgba(20,184,166,0.85)", border: "#0d9488", text: "#fff" },
  sub:             { label: "Sub",          bg: "rgba(34,197,94,0.85)",  border: "#16a34a", text: "#fff" },
  teacher_training:{ label: "Training",     bg: "rgba(139,92,246,0.85)", border: "#7c3aed", text: "#fff" },
  not_bookable:    { label: "Locked",       bg: "rgba(107,114,128,0.7)", border: "#6b7280", text: "#fff" },
  open_time:       { label: "Open",         bg: "rgba(16,185,129,0.2)",  border: "rgba(16,185,129,0.4)", text: "rgba(16,185,129,0.9)" },
  virtual:         { label: "Virtual",      bg: "rgba(14,165,233,0.85)", border: "#0284c7", text: "#fff" },
};

function getBlockDisplay(block: ScheduleBlock) {
  if (block.checked_in) {
    return { label: "Checked In", bg: "rgba(34,197,94,0.3)", border: "rgba(34,197,94,0.6)", text: "#86efac" };
  }
  if (block.is_family_callout || block.block_type === "call_out") return BLOCK_DISPLAY.call_out;
  if (block.is_makeup_session || block.block_type === "makeup_session") return BLOCK_DISPLAY.makeup_session;
  if (block.is_virtual || block.block_type === "virtual") return BLOCK_DISPLAY.virtual;
  if (block.block_type === "first_day") return BLOCK_DISPLAY.first_day;
  if (block.block_type === "last_day") return BLOCK_DISPLAY.last_day;
  if (block.block_type === "meet_greet") return BLOCK_DISPLAY.meet_greet;
  if (block.block_type === "sub") return BLOCK_DISPLAY.sub;
  if (block.block_type === "teacher_training") return BLOCK_DISPLAY.teacher_training;
  if (block.block_type === "not_bookable") return BLOCK_DISPLAY.not_bookable;
  if (block.block_type === "open_time" || !block.student_id) return BLOCK_DISPLAY.open_time;
  return BLOCK_DISPLAY.student_session;
}

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
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function teacherName(teacher: Teacher): string {
  const t = teacher as unknown as Record<string, unknown>;
  const first = typeof t.first_name === "string" ? t.first_name.trim() : "";
  const last = typeof t.last_name === "string" ? t.last_name.trim() : "";
  return `${first} ${last}`.trim() || "Teacher";
}

function studentName(student: Student): string {
  const s = student as unknown as Record<string, unknown>;
  const first = typeof s.first_name === "string" ? s.first_name.trim() : "";
  const last = typeof s.last_name === "string" ? s.last_name.trim() : "";
  return `${first} ${last}`.trim() || "Student";
}

// ─── Block type options for the edit panel ────────────────────────────────────
const BLOCK_TYPE_OPTIONS: Array<{ value: ScheduleBlock["block_type"]; label: string }> = [
  { value: "student_session", label: "Booked Session" },
  { value: "first_day",       label: "First Day" },
  { value: "last_day",        label: "Last Day" },
  { value: "call_out",        label: "Call Out" },
  { value: "makeup_session",  label: "Makeup Session" },
  { value: "meet_greet",      label: "Meet & Greet" },
  { value: "sub",             label: "Sub" },
  { value: "teacher_training",label: "Training" },
  { value: "not_bookable",    label: "Locked Time" },
  { value: "open_time",       label: "Open Time" },
  { value: "virtual",         label: "Virtual Session" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function LocationScheduleGrid({
  locationId,
  locationName,
  locationConfig,
  selectedDate,
  blocks,
  teachers,
  students,
  families,
  availability,
  rooms,
  locationHours,
  onBlocksChange,
  onRubyEvent,
}: Props) {
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);
  const [sessionType, setSessionType] = React.useState<ScheduleBlock["block_type"]>("student_session");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync selectedBlockId with Ruby events for state persistence
  React.useEffect(() => {
    if (selectedBlockId) {
      onRubyEvent?.({ type: "idle", message: "Block selected", blockId: selectedBlockId });
    } else {
      onRubyEvent?.({ type: "idle", message: "Selection cleared", blockId: null });
    }
  }, [selectedBlockId, onRubyEvent]);

  // ── Current time indicator ──────────────────────────────────────────────────
  const [nowMinute, setNowMinute] = React.useState<number>(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });
  const [nowDate, setNowDate] = React.useState<string>(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  });
  React.useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNowMinute(n.getHours() * 60 + n.getMinutes());
      setNowDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`);
    };
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Auto check-in loop — runs every 60s, only on today's view ───────────────────────────────────────────────────────
  React.useEffect(() => {
    const runAutoCheckin = () => {
      const _d = new Date();
      const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
      if (selectedDate !== today) return;
      void fetch('/api/schedule-blocks/auto-checkin', { method: 'POST' })
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json() as { updated: number; blocks: Array<{ id: string; teacher_tally: boolean }> };
          if (!data.updated || !data.blocks?.length) return;
          // Patch local state for updated blocks
          onBlocksChange(
            blocks.map((b) => {
              const match = data.blocks.find((u) => u.id === b.id);
              if (!match) return b;
              return { ...b, checked_in: true, checked_in_at: new Date().toISOString(), teacher_tally: match.teacher_tally };
            })
          );
        })
        .catch(() => null);
    };
    runAutoCheckin();
    const id = setInterval(runAutoCheckin, 60_000);
    return () => clearInterval(id);
  }, [selectedDate, blocks, onBlocksChange]);

  // ── Cancel session modal state ───────────────────────────────────────────────────────
  const [cancelTarget, setCancelTarget] = React.useState<ProjectedBlock | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelScope, setCancelScope] = React.useState<"single" | "recurring">("recurring");
  const [cancelSaving, setCancelSaving] = React.useState(false);

  async function confirmCancel() {
    if (!cancelTarget || !cancelReason.trim()) return;
    setCancelSaving(true);
    try {
      const res = await fetch("/api/schedule-blocks/cancel-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          block_id: cancelTarget.source_block_id ?? cancelTarget.id,
          block_date: cancelTarget.block_date ?? selectedDate,
          student_id: cancelTarget.student_id,
          reason: cancelReason.trim(),
          scope: cancelScope,
        }),
      });
      if (!res.ok) throw new Error("Cancel failed");
      // Optimistically revert the block in local state
      if (cancelScope === "recurring") {
        onBlocksChange(
          blocks.map((b) => {
            const isBase = b.id === (cancelTarget.source_block_id ?? cancelTarget.id);
            if (!isBase) return b;
            return { ...b, student_id: null, block_type: "open_time" as const, status: "available" as const };
          })
        );
      }
      const student = cancelTarget.student_id ? studentsById.get(cancelTarget.student_id) : null;
      onRubyEvent?.({ type: "call_out", message: `${student ? studentName(student) : "Session"} cancelled (${cancelScope}) — ${cancelReason.trim()}` });
      setCancelTarget(null);
      setCancelReason("");
      setCancelScope("recurring");
      setSelectedBlockId(null);
    } finally {
      setCancelSaving(false);
    }
  }

  // ── Booking state (for open_time / unbooked blocks) ──
  const [bookingStudentQuery, setBookingStudentQuery] = React.useState("");
  const [bookingStudentId, setBookingStudentId] = React.useState<string | null>(null);
  const [bookingRecurring, setBookingRecurring] = React.useState(true);
  // null = not yet determined; true/false = user answered
  const [bookingFirstDay, setBookingFirstDay] = React.useState<boolean | null>(null);
  // null = not yet checked; true = existing student; false = new student
  const [bookingStudentHasBlocks, setBookingStudentHasBlocks] = React.useState<boolean | null>(null);

  // ── Data maps ───────────────────────────────────────────────────────────────
  const studentsById = React.useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const familiesById = React.useMemo(() => new Map(families.map(f => [f.id, f])), [families]);

  // ── Filter and project blocks ───────────────────────────────────────────────
  const projectedBlocks = React.useMemo(() => {
    return projectBlocksForWindow(blocks, selectedDate, selectedDate);
  }, [blocks, selectedDate]);

  const teacherBlocks = React.useMemo(() => {
    const map = new Map<string, ProjectedBlock[]>();
    for (const b of projectedBlocks) {
      if (!b.teacher_id) continue;
      if (!map.has(b.teacher_id)) map.set(b.teacher_id, []);
      map.get(b.teacher_id)!.push(b);
    }
    return map;
  }, [projectedBlocks]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const dayHours = getHoursForDate(selectedDate, locationHours);
  if (dayHours.isClosed) {
    return (
      <div className="flex h-[400px] items-center justify-center text-sm font-semibold text-[var(--z-muted)]">
        Studio is closed on this date.
      </div>
    );
  }

  const startMin = toMinute(dayHours.openTime);
  const endMin = toMinute(dayHours.closeTime);
  const totalMinutes = endMin - startMin;
  const timeLabels = [];
  for (let m = startMin; m < endMin; m += 30) {
    timeLabels.push(m);
  }

  // Common patch function
  async function patchBlock(block: ScheduleBlock | ProjectedBlock, patch: Partial<ScheduleBlock>, closePanel = false) {
    setSaving(true);
    setError(null);
    try {
      const blockId = (block as ProjectedBlock).source_block_id ?? block.id;
      const res = await fetch(`/api/schedule-blocks/${blockId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json() as { data: ScheduleBlock };
      onBlocksChange(blocks.map(b => b.id === blockId ? { ...b, ...updated.data } : b));
      if (closePanel) setSelectedBlockId(null);
      onRubyEvent?.({ type: "save", message: "Block updated successfully" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function checkIn(block: ScheduleBlock | ProjectedBlock) {
    const patch: Partial<ScheduleBlock> = {
      checked_in: !block.checked_in,
      checked_in_at: !block.checked_in ? new Date().toISOString() : null,
      checked_in_by: !block.checked_in ? "Operator" : null,
    };
    await patchBlock(block, patch);
  }

  async function callOut(block: ScheduleBlock | ProjectedBlock) {
    const patch: Partial<ScheduleBlock> = {
      block_type: "call_out",
      status: "available",
    };
    await patchBlock(block, patch, true);
    onRubyEvent?.({ type: "call_out", message: "Teacher call-out logged" });
  }

  async function bookStudent(block: ProjectedBlock) {
    if (!bookingStudentId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/schedule-blocks/book-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          block_id: block.source_block_id ?? block.id,
          block_date: block.block_date ?? selectedDate,
          student_id: bookingStudentId,
          is_recurring: bookingRecurring,
          is_first_lesson: bookingFirstDay,
        }),
      });
      if (!res.ok) throw new Error("Booking failed");
      const updated = await res.json() as { data: ScheduleBlock };
      // If recurring, we might need to update the base block. If single, we might need to update just local projected?
      // For now, let's assume the API returns the updated base block or new block
      onBlocksChange(blocks.map(b => b.id === updated.data.id ? updated.data : b));
      setSelectedBlockId(null);
      onRubyEvent?.({ type: "book", message: `Booked ${studentName(studentsById.get(bookingStudentId)!)}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] overflow-hidden bg-[var(--z-bg)]">
      {/* ── Time Column ── */}
      <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-[var(--z-border)] bg-[var(--z-bg)]/95 backdrop-blur-sm">
        <div className="h-10 border-b border-[var(--z-border)]" />
        <div className="relative">
          {timeLabels.map((m) => (
            <div key={m} className="flex h-12 items-start justify-center pt-2 text-[10px] font-bold text-[var(--z-muted)]">
              {minuteToLabel(m)}
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid Content ── */}
      <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--z-border)]">
        <div className="inline-flex min-w-full flex-col">
          {/* Teacher Headers */}
          <div className="sticky top-0 z-10 flex border-b border-[var(--z-border)] bg-[var(--z-bg)]/95 backdrop-blur-sm">
            {teachers.map((t) => {
              const teacherId = t.id;
              const dayBlocks = teacherBlocks.get(teacherId) ?? [];
              const booked = dayBlocks.filter(b => b.student_id && b.block_type !== 'open_time').length;
              const open = dayBlocks.filter(b => b.block_type === 'open_time' && !b.student_id).length;
              return (
                <div key={t.id} className="w-48 shrink-0 border-r border-[var(--z-border)] p-2 text-center">
                  <div className="truncate text-[11px] font-black uppercase tracking-wider text-[var(--z-fg)]">
                    {teacherName(t)}
                  </div>
                  <div className="mt-0.5 flex items-center justify-center gap-2 text-[10px] font-bold">
                    <span className="text-[var(--z-accent)]">{booked} booked</span>
                    <span className="text-[var(--z-muted)]">{open} open</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Grid Body */}
          <div className="relative flex flex-1">
            {/* Horizontal lines */}
            <div className="absolute inset-0 pointer-events-none">
              {timeLabels.map((m) => (
                <div key={m} className="h-12 border-b border-[var(--z-border)]/30" />
              ))}
            </div>

            {/* Now indicator line */}
            {selectedDate === nowDate && nowMinute >= startMin && nowMinute <= endMin && (
              <div
                className="absolute left-0 right-0 z-10 border-t-2 border-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.4)]"
                style={{ top: `${((nowMinute - startMin) / 30) * 48}px` }}
              >
                <div className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.6)]" />
              </div>
            )}

            {/* Columns */}
            {teachers.map((t) => {
              const dayBlocks = teacherBlocks.get(t.id) ?? [];
              return (
                <div key={t.id} className="relative w-48 shrink-0 border-r border-[var(--z-border)]/50">
                  {dayBlocks.map((block) => {
                    const blockStart = toMinute(block.start_time);
                    const blockEnd = toMinute(block.end_time);
                    const top = ((blockStart - startMin) / 30) * 48;
                    const height = ((blockEnd - blockStart) / 30) * 48;
                    const display = getBlockDisplay(block);
                    const isSelected = selectedBlockId === block.id;

                    return (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => {
                          setSelectedBlockId(block.id);
                          setSessionType(block.block_type);
                          setBookingStudentId(null);
                          setBookingStudentQuery("");
                          setBookingFirstDay(null);
                          setBookingStudentHasBlocks(null);
                        }}
                        className={`absolute left-1 right-1 flex flex-col overflow-hidden rounded-md border p-1.5 text-left transition-all hover:scale-[1.02] hover:z-20 ${
                          isSelected ? "z-30 ring-2 ring-white ring-offset-2 ring-offset-[var(--z-bg)]" : ""
                        }`}
                        style={{
                          top: `${top + 2}px`,
                          height: `${height - 4}px`,
                          backgroundColor: display.bg,
                          borderColor: display.border,
                        }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="truncate text-[10px] font-black leading-tight" style={{ color: display.text }}>
                            {block.student_id ? studentName(studentsById.get(block.student_id)!) : display.label}
                          </span>
                          {block.is_virtual && (
                            <span className="text-[10px]">🌐</span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[9px] font-bold opacity-80" style={{ color: display.text }}>
                          {block.start_time} – {block.end_time}
                        </div>
                        {block.notes && (
                          <div className="mt-1 truncate text-[8px] italic opacity-60" style={{ color: display.text }}>
                            {block.notes}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Selection Detail ── */}
      {(() => {
        const selectedBlock = projectedBlocks.find(b => b.id === selectedBlockId);
        if (!selectedBlockId || !selectedBlock) return null;

        const student = selectedBlock.student_id ? studentsById.get(selectedBlock.student_id) : null;
        const family = student?.family_id ? familiesById.get(student.family_id) : null;
        const teacher = selectedBlock.teacher_id ? teachers.find(t => t.id === selectedBlock.teacher_id) : null;
        const isUnbooked = !selectedBlock.student_id || selectedBlock.block_type === "open_time";

        return (
          <>
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden" onClick={() => setSelectedBlockId(null)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[80vh] flex-col border-t border-[var(--z-border)] bg-[var(--z-bg)] p-4 shadow-2xl lg:relative lg:z-0 lg:w-80 lg:max-h-full lg:border-l lg:border-t-0">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--z-fg)]">Session Detail</h3>
                <button
                  type="button"
                  onClick={() => setSelectedBlockId(null)}
                  className="rounded-full p-1 text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)]"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 scrollbar-none pb-6">
                {/* Time & Teacher context */}
                <div className="space-y-1">
                  <div className="text-xl font-black text-[var(--z-fg)]">
                    {selectedBlock.start_time} – {selectedBlock.end_time}
                  </div>
                  <div className="text-xs font-bold text-[var(--z-muted)] uppercase tracking-wider">
                    {teacher ? teacherName(teacher) : "Unknown Teacher"} · {locationName}
                  </div>
                </div>

                {isUnbooked ? (
                  /* ── UNBOOKED BLOCK: booking flow ── */
                  <div className="space-y-4 rounded-2xl border border-[var(--z-border)] bg-[var(--z-surface-2)] p-4">
                    <div className="text-xs font-black uppercase tracking-widest text-[var(--z-accent)]">Book a Student</div>
                    
                    {/* Student search */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search student name..."
                        value={bookingStudentQuery}
                        onChange={(e) => {
                          setBookingStudentQuery(e.target.value);
                          setBookingStudentId(null);
                          setBookingFirstDay(null);
                          setBookingStudentHasBlocks(null);
                        }}
                        className="w-full rounded-xl border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] focus:border-[var(--z-accent)]/50 focus:outline-none"
                      />
                      {bookingStudentQuery.length > 1 && !bookingStudentId && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] p-1 shadow-xl">
                          {students
                            .filter(s => studentName(s).toLowerCase().includes(bookingStudentQuery.toLowerCase()))
                            .map(s => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={async () => {
                                  setBookingStudentId(s.id);
                                  setBookingStudentQuery(studentName(s));
                                  // Check if they have other blocks to determine first lesson
                                  const hasBlocks = blocks.some(b => b.student_id === s.id);
                                  setBookingStudentHasBlocks(hasBlocks);
                                  if (hasBlocks) setBookingFirstDay(false);
                                }}
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-[var(--z-fg)] hover:bg-[var(--z-accent)]/10 hover:text-[var(--z-accent)]"
                              >
                                {studentName(s)}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* First lesson check */}
                    {bookingStudentId && bookingStudentHasBlocks === false && (
                      <div className="space-y-2 rounded-xl bg-blue-500/10 p-3 border border-blue-500/20">
                        <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">New Student Detected</div>
                        <div className="text-xs text-blue-100">Is this their very first lesson at the school?</div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setBookingFirstDay(true)}
                            className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition-all ${
                              bookingFirstDay === true ? "bg-blue-500 text-white border-blue-400" : "bg-white/5 text-blue-200 border-blue-500/30"
                            }`}
                          >
                            Yes, First Day
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingFirstDay(false)}
                            className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition-all ${
                              bookingFirstDay === false ? "bg-white/10 text-white border-white/20" : "bg-white/5 text-blue-200 border-blue-500/30"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Recurring toggle */}
                    {bookingStudentId && (
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--z-border)] bg-[var(--z-bg)] p-3">
                        <input
                          type="checkbox"
                          checked={bookingRecurring}
                          onChange={(e) => setBookingRecurring(e.target.checked)}
                          className="h-4 w-4 rounded border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-accent)]"
                        />
                        <span className="text-xs font-bold text-[var(--z-fg)]">
                          {bookingRecurring ? "Recurring every week" : "One-time only"}
                        </span>
                      </label>
                    )}

                    {/* Book button */}
                    {bookingStudentId && (bookingFirstDay !== null || bookingStudentHasBlocks === true) && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => bookStudent(selectedBlock)}
                        className="w-full rounded-xl border border-[#00ff88]/40 bg-[#00ff88]/15 px-3 py-2.5 text-sm font-semibold text-[#00ff88] disabled:opacity-50 hover:bg-[#00ff88]/25 transition-colors"
                      >
                        {saving ? "Booking…" : bookingFirstDay ? "Book as First Lesson" : "Book Session"}
                      </button>
                    )}
                  </div>
                ) : (
                  /* ── BOOKED BLOCK: existing session controls ── */
                  <>
                    {/* Student / family info */}
                    {student && (
                      <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 text-xs space-y-1">
                        <div className="font-semibold text-[var(--z-fg)] text-sm">{studentName(student)}</div>
                        {family && (
                          <div className="text-[var(--z-muted)]">{family.name ?? family.primary_contact_name ?? ""}</div>
                        )}
                        {family?.primary_phone && (
                          <div className="text-[var(--z-muted)]">{family.primary_phone}</div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Link
                            href={`/students/${selectedBlock.student_id}`}
                            className="rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/5"
                            onClick={() => setSelectedBlockId(null)}
                          >
                            Student →
                          </Link>
                          {student.family_id && (
                            <Link
                              href={`/crm?family=${student.family_id}`}
                              className="rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/5"
                              onClick={() => setSelectedBlockId(null)}
                            >
                              Family →
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Session type */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                        Session Type
                      </label>
                      <select
                        value={sessionType}
                        onChange={(e) => setSessionType(e.target.value as ScheduleBlock["block_type"])}
                        className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
                      >
                        {BLOCK_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {selectedBlock.student_id && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => checkIn(selectedBlock)}
                          className="col-span-2 rounded-xl border border-emerald-400/60 bg-emerald-500/20 px-3 py-2.5 text-sm font-semibold text-emerald-100 disabled:opacity-50 hover:bg-emerald-500/30 transition-colors"
                        >
                          {saving ? "Saving..." : "✓ Check In"}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          // Build patch: clear flag overrides so color re-derives from block_type
                          const patch: Partial<ScheduleBlock> = {
                            block_type: sessionType,
                            status: ["open_time", "sub", "call_out"].includes(sessionType) ? "available" : "booked",
                          };
                          // Clear flags that override block_type in getBlockDisplay
                          if (sessionType !== "call_out") patch.is_family_callout = false;
                          if (sessionType !== "makeup_session") patch.is_makeup_session = false;
                          if (sessionType !== "virtual") patch.is_virtual = false;
                          patchBlock(selectedBlock, patch, true);
                        }}
                        className="rounded-xl border border-yellow-400/60 bg-yellow-400/20 px-3 py-2.5 text-sm font-semibold text-yellow-200 disabled:opacity-50 hover:bg-yellow-400/30 transition-colors"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => callOut(selectedBlock)}
                        className="rounded-xl border border-red-400/60 bg-red-500/20 px-3 py-2.5 text-sm font-semibold text-red-200 disabled:opacity-50 hover:bg-red-500/30 transition-colors"
                      >
                        Call Out
                      </button>
                      {selectedBlock.student_id && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => { setCancelTarget(selectedBlock); setCancelReason(""); }}
                          className="col-span-2 rounded-xl border border-orange-400/60 bg-orange-500/15 px-3 py-2.5 text-sm font-semibold text-orange-200 disabled:opacity-50 hover:bg-orange-500/25 transition-colors"
                        >
                          Cancel Session
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Cancel Session Modal ── */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setCancelTarget(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-2xl border border-orange-400/30 bg-[#0f0f12] p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white">Cancel Session</h3>
            <p className="text-xs text-[#909098]">
              {cancelTarget.student_id ? studentName(studentsById.get(cancelTarget.student_id)!) : "Session"} — {cancelTarget.start_time} – {cancelTarget.end_time}
            </p>

            {/* Single vs Recurring choice */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Cancel scope</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCancelScope("single")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    cancelScope === "single"
                      ? "border-orange-400/60 bg-orange-500/20 text-orange-200"
                      : "border-[#2b2b2f] bg-[#1a1a1e] text-[#909098] hover:text-white"
                  }`}
                >
                  This lesson only
                </button>
                <button
                  type="button"
                  onClick={() => setCancelScope("recurring")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    cancelScope === "recurring"
                      ? "border-orange-400/60 bg-orange-500/20 text-orange-200"
                      : "border-[#2b2b2f] bg-[#1a1a1e] text-[#909098] hover:text-white"
                  }`}
                >
                  All recurring
                </button>
              </div>
              <p className="text-[10px] text-[#505055]">
                {cancelScope === "single"
                  ? "Only this one session will be reverted to open time."
                  : "This session and all future recurring sessions will be reverted to open time."}
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Reason <span className="text-orange-400">*</span></label>
              <textarea
                autoFocus
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation…"
                className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-orange-400/50 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setCancelTarget(null); setCancelReason(""); setCancelScope("recurring"); }}
                className="flex-1 rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2.5 text-sm font-semibold text-[#909098] hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!cancelReason.trim() || cancelSaving}
                onClick={confirmCancel}
                className="flex-1 rounded-xl border border-orange-400/60 bg-orange-500/20 px-3 py-2.5 text-sm font-semibold text-orange-200 disabled:opacity-40 hover:bg-orange-500/30 transition-colors"
              >
                {cancelSaving ? "Cancelling…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
