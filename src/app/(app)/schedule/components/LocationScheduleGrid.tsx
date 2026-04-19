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
}: Props) {
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);
  const [sessionType, setSessionType] = React.useState<ScheduleBlock["block_type"]>("student_session");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── Booking state (for open_time / unbooked blocks) ──
  const [bookingStudentQuery, setBookingStudentQuery] = React.useState("");
  const [bookingStudentId, setBookingStudentId] = React.useState<string | null>(null);
  const [bookingRecurring, setBookingRecurring] = React.useState(true);
  // null = not yet determined; true/false = user answered
  const [bookingFirstDay, setBookingFirstDay] = React.useState<boolean | null>(null);
  // null = not yet checked; true = existing student; false = new student
  const [bookingStudentHasBlocks, setBookingStudentHasBlocks] = React.useState<boolean | null>(null);

  // ── Compute time bounds from location_hours ──
  const { openMinute, closeMinute, isClosed } = React.useMemo(
    () => getHoursForDate(locationHours, selectedDate),
    [locationHours, selectedDate],
  );

  const slots = React.useMemo(() => {
    if (isClosed) return [];
    const out: number[] = [];
    for (let m = openMinute; m <= closeMinute; m += 30) out.push(m);
    return out;
  }, [openMinute, closeMinute, isClosed]);

  // ── Project blocks for selected date ──
  const projected = React.useMemo(
    () => projectBlocksForWindow(blocks, selectedDate, selectedDate),
    [blocks, selectedDate],
  );

  const dayBlocks = React.useMemo(
    () => projected.filter((b) => b.block_date === selectedDate),
    [projected, selectedDate],
  );

  const dayTeacherIds = React.useMemo(
    () => Array.from(new Set(dayBlocks.map((b) => b.teacher_id).filter(Boolean) as string[])),
    [dayBlocks],
  );

  const teachersForBoard = React.useMemo(() => {
    const withBlocks = teachers
      .filter((t) => dayTeacherIds.includes(t.id))
      .sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
    return withBlocks.length > 0 ? withBlocks : teachers.slice(0, 12);
  }, [teachers, dayTeacherIds]);

  const teacherBlocks = React.useMemo(() => {
    const map = new Map<string, ProjectedBlock[]>();
    for (const t of teachersForBoard) map.set(t.id, []);
    for (const b of dayBlocks) {
      if (!b.teacher_id) continue;
      const list = map.get(b.teacher_id) ?? [];
      list.push(b);
      map.set(b.teacher_id, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [dayBlocks, teachersForBoard]);

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

  const roomsById = React.useMemo(() => {
    const m = new Map<string, ScheduleRoom>();
    for (const r of rooms) m.set(r.id, r);
    return m;
  }, [rooms]);

  const selectedBlock = React.useMemo(
    () => dayBlocks.find((b) => b.id === selectedBlockId || b.source_block_id === selectedBlockId) ?? null,
    [dayBlocks, selectedBlockId],
  );

  React.useEffect(() => {
    if (selectedBlock) {
      setSessionType(selectedBlock.block_type ?? "student_session");
      // Reset booking state whenever a new block is selected
      setBookingStudentQuery("");
      setBookingStudentId(null);
      setBookingRecurring(true);
      setBookingFirstDay(null);
      setBookingStudentHasBlocks(null);
      setError(null);
    }
  }, [selectedBlock?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Patch block ──
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
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `Update failed (${res.status})`);
      }
      const updated = blocks.map((b) =>
        b.id === targetId ? { ...b, ...(patch as Partial<ScheduleBlock>) } : b,
      );
      onBlocksChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function checkIn(block: ProjectedBlock) {
    const targetId = block.source_block_id || block.id;
    if (block.student_id && block.teacher_id) {
      await fetch("/api/session-log", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schedule_block_id: targetId,
          student_id: block.student_id,
          teacher_id: block.teacher_id,
          location_id: block.location_id,
          block_date: block.block_date,
          student_rate: 0,
          teacher_rate: 0,
          status: "checked_in",
        }),
      }).catch(() => null);
    }
    await patchBlock(block, {
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      teacher_tally: true,
      status: "booked",
    });
    const ciStudent = block.student_id ? studentsById.get(block.student_id) : null;
    onRubyEvent?.({ type: "check_in", message: `✓ ${ciStudent ? studentName(ciStudent) : "Student"} checked in — logged.` });
  }

  async function callOut(block: ProjectedBlock) {
    await patchBlock(block, {
      block_type: "call_out",
      is_family_callout: true,
      status: "available",
    });
    const coStudent = block.student_id ? studentsById.get(block.student_id) : null;
    onRubyEvent?.({ type: "call_out", message: `${coStudent ? studentName(coStudent) : "Session"} marked as call-out — still charged.` });
  }

  // ── Check if a student has any existing blocks (to determine new vs existing) ──
  async function checkStudentHasBlocks(studentId: string): Promise<boolean> {
    try {
      const res = await fetch(
        `/api/schedule-blocks?student_id=${encodeURIComponent(studentId)}&limit=1`,
        { headers: { "content-type": "application/json" } },
      );
      if (!res.ok) return false;
      const j = await res.json().catch(() => null);
      const data = j?.data ?? j;
      return Array.isArray(data) ? data.length > 0 : false;
    } catch {
      return false;
    }
  }

  // ── Book a student into an open slot ──
  async function bookStudent(block: ProjectedBlock) {
    if (!bookingStudentId) return;
    setSaving(true);
    setError(null);
    try {
      const tenantId = block.tenant_id ?? "";
      const isFirstDay = bookingFirstDay === true;
      const blockType: ScheduleBlock["block_type"] = isFirstDay ? "first_day" : "student_session";

      await fetch(
        `/api/schedule-blocks/${encodeURIComponent(block.source_block_id || block.id)}?skip_conflict_check=true`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json", "x-tenant-id": tenantId },
          body: JSON.stringify({
            student_id: bookingStudentId,
            block_type: blockType,
            status: "booked",
            is_recurring: bookingRecurring,
          }),
        },
      );

      // If first_day: stub trigger for invoice creation + studio agreement
      if (isFirstDay) {
        await fetch("/api/events", {
          method: "POST",
          headers: { "content-type": "application/json", "x-tenant-id": tenantId },
          body: JSON.stringify({
            event_type: "first_day_trigger",
            student_id: bookingStudentId,
            block_id: block.source_block_id || block.id,
            block_date: block.block_date,
            location_id: locationId,
            note: "First lesson booked — invoice + studio agreement dispatch pending integration setup",
          }),
        }).catch(() => null); // stub — endpoint may not exist yet, fail silently
      }

      const updated = blocks.map((b) =>
        b.id === (block.source_block_id || block.id)
          ? { ...b, student_id: bookingStudentId, block_type: blockType, status: "booked" as const, is_recurring: bookingRecurring }
          : b,
      );
      onBlocksChange(updated);
      setSelectedBlockId(null);
      const bookedStudent = students.find((s) => s.id === bookingStudentId);
      const bookedName = bookedStudent ? studentName(bookedStudent) : "Student";
      onRubyEvent?.({
        type: "book_student",
        message: isFirstDay
          ? `${bookedName} booked as First Day — invoice + agreement queued.`
          : `${bookedName} booked as a recurring session.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to book student";
      setError(msg);
      onRubyEvent?.({ type: "error", message: `Booking failed: ${msg}` });
    } finally {
      setSaving(false);
    }
  }

  // ── Block position in grid ──
  function blockTop(startTime: string): number {
    const m = toMinute(startTime);
    return ((m - openMinute) / 30) * 48;
  }

  function blockHeight(startTime: string, endTime: string): number {
    const duration = toMinute(endTime) - toMinute(startTime);
    return Math.max((duration / 30) * 48, 44);
  }

  const gridHeight = slots.length * 48;

  if (isClosed) {
    return (
      <div
        className="mx-4 my-6 rounded-xl border p-8 text-center"
        style={{ borderColor: locationConfig?.border ?? "var(--z-border)", backgroundColor: locationConfig?.bg ?? "transparent" }}
      >
        <p className="text-sm font-semibold" style={{ color: locationConfig?.textColor ?? "var(--z-muted)" }}>
          {locationName} is closed on this day
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0">
      {/* ── Time grid ── */}
      <div className="flex h-full min-h-0 overflow-auto">
        {/* Time labels column */}
        <div className="sticky left-0 z-10 w-14 shrink-0 bg-[var(--z-bg)]">
          {/* Spacer to align with sticky teacher header */}
          <div className="h-[var(--teacher-header-h,52px)]" />
          <div style={{ height: gridHeight }} className="relative">
            {slots.map((minute, i) => (
              <div
                key={minute}
                className="absolute right-2 text-[10px] text-[var(--z-muted)] leading-none"
                style={{ top: i * 48 + 2 }}
              >
                {minuteToLabel(minute)}
              </div>
            ))}
          </div>
        </div>

        {/* Teacher columns */}
        <div className="flex flex-1 gap-0 overflow-x-auto">
          {teachersForBoard.map((teacher) => {
            const tBlocks = teacherBlocks.get(teacher.id) ?? [];
            const openCount = tBlocks.filter((b) => b.block_type === "open_time" || !b.student_id).length;
            const bookedCount = tBlocks.filter((b) => b.student_id && b.block_type !== "open_time").length;

            return (
              <div key={teacher.id} className="relative min-w-[140px] flex-1 border-l border-[var(--z-border)]">
                {/* Teacher header */}
                <div
                  className="sticky top-0 z-10 border-b px-2 py-2 text-center"
                  style={{
                    borderColor: locationConfig?.border ?? "var(--z-border)",
                    backgroundColor: locationConfig?.bg ?? "var(--z-bg)",
                  }}
                >
                  <div
                    className="truncate text-xs font-semibold"
                    style={{ color: locationConfig?.textColor ?? "var(--z-fg)" }}
                  >
                    {teacherName(teacher)}
                  </div>
                  <div className="mt-0.5 flex items-center justify-center gap-2 text-[10px] text-[var(--z-muted)]">
                    <span>{bookedCount} booked</span>
                    {openCount > 0 && (
                      <span className="text-emerald-400">{openCount} open</span>
                    )}
                  </div>
                </div>

                {/* Grid background rows */}
                <div className="relative" style={{ height: gridHeight }}>
                  {slots.map((minute, i) => (
                    <div
                      key={minute}
                      className="absolute inset-x-0 border-b border-[var(--z-border)]/30"
                      style={{ top: i * 48, height: 48 }}
                    />
                  ))}

                  {/* Blocks */}
                  {tBlocks.map((block) => {
                    const display = getBlockDisplay(block as ScheduleBlock);
                    const top = blockTop(block.start_time);
                    const height = blockHeight(block.start_time, block.end_time);
                    const isSelected = block.id === selectedBlockId || block.source_block_id === selectedBlockId;
                    const student = block.student_id ? studentsById.get(block.student_id) : null;

                    return (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => setSelectedBlockId(isSelected ? null : (block.source_block_id || block.id))}
                        className="absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-1 text-left text-[10px] transition-all hover:z-20 hover:shadow-lg"
                        style={{
                          top,
                          height,
                          backgroundColor: display.bg,
                          borderColor: isSelected ? "#fff" : display.border,
                          color: display.text,
                          outline: isSelected ? `2px solid ${display.border}` : "none",
                          outlineOffset: "1px",
                          zIndex: isSelected ? 15 : 5,
                        }}
                      >
                        {/* Student name — bold and larger, shown first for booked sessions */}
                        {student ? (
                          <div className="font-bold leading-tight truncate text-[11px]">
                            {(() => {
                              const instr = (student as unknown as Record<string, unknown>).instrument;
                              const emoji = typeof instr === "string" && instr ? (
                                /guitar|bass/i.test(instr) ? "🎸" :
                                /piano|keyboard/i.test(instr) ? "🎹" :
                                /drum|perc/i.test(instr) ? "🥁" :
                                /violin|viola|cello|string/i.test(instr) ? "🎻" :
                                /trumpet|horn|brass/i.test(instr) ? "🎺" :
                                /sax|clarinet|flute|wind/i.test(instr) ? "🎷" :
                                /voice|vocal|sing/i.test(instr) ? "🎤" : "🎵"
                              ) : null;
                              return <>{emoji && <span className="mr-0.5">{emoji}</span>}{studentName(student)}</>;
                            })()}
                          </div>
                        ) : display.label ? (
                          <div className="font-semibold leading-tight truncate">{display.label}</div>
                        ) : null}
                        <div className="opacity-75 leading-tight">
                          {minuteToLabel(toMinute(block.start_time))}–{minuteToLabel(toMinute(block.end_time))}
                        </div>
                        {block.checked_in && (
                          <div className="text-[9px] font-bold">✓ IN</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Block detail modal ── */}
      {selectedBlock && (() => {
        const student = selectedBlock.student_id ? studentsById.get(selectedBlock.student_id) : null;
        const family = student?.family_id ? familiesById.get(student.family_id) : null;
        const display = getBlockDisplay(selectedBlock as ScheduleBlock);
        return (
          <>
            {/* Blurred backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedBlockId(null)}
              aria-hidden
            />
            {/* Centered panel */}
            <div
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-2xl"
              style={{
                borderColor: locationConfig?.border ?? "var(--z-border)",
                backgroundColor: "#0f0f12",
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Block details"
            >
              {/* Modal header */}
              <div
                className="flex items-start justify-between rounded-t-2xl border-b px-5 py-4"
                style={{ borderColor: locationConfig?.border ?? "var(--z-border)" }}
              >
                <div>
                  <div
                    className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                    style={{ color: locationConfig?.textColor ?? "var(--z-muted)" }}
                  >
                    {locationName}
                  </div>
                  <h3 className="text-base font-bold text-[var(--z-fg)]">
                    {student ? studentName(student) : (display.label || "Block")}
                  </h3>
                  <div className="text-xs text-[var(--z-muted)] mt-0.5">
                    {minuteToLabel(toMinute(selectedBlock.start_time))} – {minuteToLabel(toMinute(selectedBlock.end_time))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBlockId(null)}
                  className="rounded-lg p-1.5 text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)] transition-colors"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                {error && (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {error}
                  </div>
                )}

                {/* ── OPEN SLOT: student booking flow ── */}
                {(!selectedBlock.student_id && (selectedBlock.block_type === "open_time" || !selectedBlock.block_type)) ? (
                  <div className="space-y-4">
                    {/* Student search */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                        Book a Student
                      </label>
                      <input
                        type="text"
                        value={bookingStudentQuery}
                        onChange={(e) => {
                          setBookingStudentQuery(e.target.value);
                          setBookingStudentId(null);
                          setBookingStudentHasBlocks(null);
                          setBookingFirstDay(null);
                        }}
                        placeholder="Type student name…"
                        className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)]"
                        autoFocus
                      />
                      {/* Autocomplete dropdown */}
                      {bookingStudentQuery.length >= 1 && !bookingStudentId && (() => {
                        const q = bookingStudentQuery.toLowerCase();
                        const matches = students.filter((s) => studentName(s).toLowerCase().includes(q)).slice(0, 8);
                        if (matches.length === 0) return <div className="text-xs text-[var(--z-muted)] px-1">No students found</div>;
                        return (
                          <div className="rounded-lg border border-[var(--z-border)] bg-[#0f0f12] shadow-xl overflow-hidden">
                            {matches.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
                                onClick={async () => {
                                  setBookingStudentId(s.id);
                                  setBookingStudentQuery(studentName(s));
                                  const hasBlocks = await checkStudentHasBlocks(s.id);
                                  setBookingStudentHasBlocks(hasBlocks);
                                  // Existing student moving times: skip first-day question
                                  if (hasBlocks) setBookingFirstDay(false);
                                  else setBookingFirstDay(null); // new student: ask
                                }}
                              >
                                <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--z-surface-2)] flex items-center justify-center text-xs font-bold text-[var(--z-fg)]">
                                  {studentName(s).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-[var(--z-fg)]">{studentName(s)}</div>
                                  <div className="text-[10px] text-[var(--z-muted)]">
                                    {String((s as unknown as Record<string,unknown>).instrument ?? "") || "No instrument"}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* First-day question — only for new students */}
                    {bookingStudentId && bookingStudentHasBlocks === false && bookingFirstDay === null && (
                      <div className="rounded-xl border border-blue-400/40 bg-blue-500/10 p-4 space-y-3">
                        <p className="text-sm font-semibold text-blue-200">Is this their first lesson?</p>
                        <p className="text-xs text-[var(--z-muted)]">
                          This student has no existing sessions. If it&apos;s their first lesson, we&apos;ll book it as a First Day and queue their invoice + studio agreement once integrations are set up.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setBookingFirstDay(true)}
                            className="flex-1 rounded-xl border border-blue-400/50 bg-blue-500/20 px-3 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/30 transition-colors"
                          >
                            Yes — First Lesson
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingFirstDay(false)}
                            className="flex-1 rounded-xl border border-[var(--z-border)] px-3 py-2 text-sm font-semibold text-[var(--z-muted)] hover:bg-white/5 transition-colors"
                          >
                            No — Regular Session
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Existing student notice */}
                    {bookingStudentId && bookingStudentHasBlocks === true && (
                      <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-xs text-[var(--z-muted)]">
                        Existing student — booking as a recurring session (no first-day trigger).
                      </div>
                    )}

                    {/* Recurring toggle — shown once student + first-day are resolved */}
                    {bookingStudentId && bookingFirstDay !== null && (
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div
                          className={`relative h-5 w-9 rounded-full transition-colors ${
                            bookingRecurring ? "bg-[#00ff88]/70" : "bg-[var(--z-surface-2)] border border-[var(--z-border)]"
                          }`}
                          onClick={() => setBookingRecurring((v) => !v)}
                        >
                          <div
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                              bookingRecurring ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </div>
                        <span className="text-sm text-[var(--z-fg)]">
                          {bookingRecurring ? "Recurring every week" : "One-time only"}
                        </span>
                      </label>
                    )}

                    {/* Book button */}
                    {bookingStudentId && bookingFirstDay !== null && (
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
                            href={`/crm/students/${selectedBlock.student_id}`}
                            className="rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/5"
                            onClick={() => setSelectedBlockId(null)}
                          >
                            Student →
                          </Link>
                          {student.family_id && (
                            <Link
                              href={`/crm/families/${student.family_id}`}
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
                        onClick={() =>
                          patchBlock(selectedBlock, {
                            block_type: sessionType,
                            status: ["open_time", "sub", "call_out"].includes(sessionType) ? "available" : "booked",
                          })
                        }
                        className="rounded-xl border border-yellow-400/60 bg-yellow-400/20 px-3 py-2.5 text-sm font-semibold text-yellow-200 disabled:opacity-50 hover:bg-yellow-400/30 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => callOut(selectedBlock)}
                        className="rounded-xl border border-red-400/60 bg-red-500/20 px-3 py-2.5 text-sm font-semibold text-red-200 disabled:opacity-50 hover:bg-red-500/30 transition-colors"
                      >
                        Call Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
