"use client";
import * as React from "react";
import Link from "next/link";
import type { Family, ScheduleBlock, Student, Teacher } from "@/lib/types/entities";

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
function toMinute(value: string | null | undefined): number {
  if (!value) return 0;
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

function formatBlockTime(value: string | null | undefined): string {
  if (!value) return "";
  // Strip seconds: "16:00:00" → "4:00 PM", "16:30" → "4:30 PM"
  const [h = "0", m = "0"] = value.split(":");
  const hour24 = Number(h);
  const min = Number(m);
  const hour12 = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}:${min.toString().padStart(2, "0")} ${suffix}`;
}

const INSTRUMENT_EMOJI: Record<string, string> = {
  piano: "🎹", keyboard: "🎹",
  guitar: "🎸", bass: "🎸", ukulele: "🎸",
  drums: "🥁", percussion: "🥁",
  vocals: "🎤", voice: "🎤", singing: "🎤",
  violin: "🎻", viola: "🎻", cello: "🎻",
  trumpet: "🎺", saxophone: "🎷", flute: "🪈",
  clarinet: "🎵", harp: "🎵",
};

function instrumentEmoji(instrument: string | null | undefined): string {
  if (!instrument) return "🎵";
  return INSTRUMENT_EMOJI[instrument.toLowerCase().trim()] ?? "🎵";
}

function teacherName(teacher: Teacher | undefined | null): string {
  if (!teacher) return "Staff";
  const t = teacher as unknown as Record<string, unknown>;
  const first = typeof t.first_name === "string" ? t.first_name.trim() : "";
  const last = typeof t.last_name === "string" ? t.last_name.trim() : "";
  return `${first} ${last}`.trim() || "Staff";
}

function studentName(student: Student | undefined | null): string {
  if (!student) return "Student";
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

// ─── Recurring Lesson type (API response shape) ───────────────────────────────
type RecurringLesson = {
  id: string;
  student_id: string;
  teacher_id: string;
  location_id: string;
  room_id?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  instrument: string | null;
  student_first_name: string | null;
  student_last_name: string | null;
};

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
  // ── Room assignments state ──────────────────────────────────────────────────
  // Map: room_id → teacher_id (recurring assignment for the selected day)
  const [roomAssignments, setRoomAssignments] = React.useState<Map<string, string[]>>(new Map());
  const [assigningRoomId, setAssigningRoomId] = React.useState<string | null>(null);
  const [assigningSaving, setAssigningSaving] = React.useState(false);
  // Sub assignments: room_ids that are one-time subs for the currently viewed date
  const [subAssignments, setSubAssignments] = React.useState<Set<string>>(new Set());
  // Conflict modal: triggered when assigning a teacher who has no availability for the day
  const [conflictTarget, setConflictTarget] = React.useState<{ teacherId: string; roomId: string } | null>(null);
  const [conflictSaving, setConflictSaving] = React.useState(false);
  // Recurring lessons fetched client-side for projection overlay
  const [clientRecurringLessons, setClientRecurringLessons] = React.useState<RecurringLesson[]>([]);
  // Room assignments fetch effect is placed after selectedDayName declaration below

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
  const lastAutoCheckinRef = React.useRef<number>(0);
  React.useEffect(() => {
    const runAutoCheckin = () => {
      // Throttle to once per 55s to be safe
      if (Date.now() - lastAutoCheckinRef.current < 55000) return;
      lastAutoCheckinRef.current = Date.now();

      const _d = new Date();
      const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
      if (selectedDate !== today) return;

      void fetch('/api/schedule-blocks/auto-checkin', { method: 'POST' })
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json() as { updated: number; blocks: Array<{ id: string; teacher_tally: boolean }> };
          if (!data.updated || !data.blocks?.length) return;
          
          // Use functional update to avoid 'blocks' dependency
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
    // Remove 'blocks' from dependencies to stop the re-triggering loop
  }, [selectedDate, onBlocksChange]);

  // ── Cancel session modal state ───────────────────────────────────────────────────────
  const [cancelTarget, setCancelTarget] = React.useState<ProjectedBlock | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelScope, setCancelScope] = React.useState<"single" | "recurring">("single");
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
      setCancelTarget(null);
      setCancelReason("");
      setCancelScope("recurring");
      // Close the management modal too
      setSelectedBlockId(null);
      setSyntheticBlock(null);
      setOpenSlotContext(null);
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
  // Context for open-slot clicks (no existing DB block row)
  const [openSlotContext, setOpenSlotContext] = React.useState<{
    teacherId: string;
    roomId: string | null;
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  // Synthetic block: created when clicking a recurring overlay (no real DB row for that date)
  const [syntheticBlock, setSyntheticBlock] = React.useState<ProjectedBlock | null>(null);

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

  // ── Smart-Filter: derive day name from selectedDate ─────────────────────────
  // DB day_of_week is a string enum: monday|tuesday|wednesday|thursday|friday|saturday|sunday
  const selectedDayName = React.useMemo((): string => {
    if (!selectedDate) return "";
    const d = new Date(selectedDate + "T00:00:00.000Z");
    return ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][d.getUTCDay()] ?? "";
  }, [selectedDate]);
  // ── Client-side availability fetch ────────────────────────────────────────
  // The SSR payload is too large (4MB+) and availability is dropped from the serialized props.
  // We fetch it directly client-side so the grid always has fresh data.
  const [clientAvailability, setClientAvailability] = React.useState<typeof availability>(availability);
  React.useEffect(() => {
    if (!locationId) return;
    void fetch(`/api/schedule/availability?location_id=${locationId}`)
      .then(r => r.ok ? r.json() : null)
      .then((res: { data?: typeof availability } | null) => {
        if (res?.data && res.data.length > 0) {
          setClientAvailability(res.data);
        }
      })
      .catch(() => {});
  }, [locationId]);
  // Fetch recurring lessons for projection overlay (client-side, no SSR)
  React.useEffect(() => {
    if (!locationId || !selectedDate) return;
    const d = new Date(selectedDate + "T00:00:00.000Z");
    const dow = d.getUTCDay(); // 0=Sun, 6=Sat
    void fetch(`/api/schedule/recurring-lessons?location_id=${locationId}&day_of_week=${dow}`)
      .then(r => r.ok ? r.json() : null)
      .then((res: { data?: RecurringLesson[] } | null) => {
        if (res?.data) setClientRecurringLessons(res.data);
      })
      .catch(() => {});
  }, [locationId, selectedDate]);

  // Fetch recurring room assignments when location or day changes
  React.useEffect(() => {
    if (!locationId || !selectedDayName) return;
    void fetch(`/api/schedule/room-assignments?location_id=${locationId}&day_of_week=${selectedDayName}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { data?: Array<{ room_id: string; teacher_id: string }> } | null) => {
        if (!data?.data) return;
        const map = new Map<string, string[]>();
        for (const a of data.data) {
          if (!map.has(a.room_id)) map.set(a.room_id, []);
          map.get(a.room_id)!.push(a.teacher_id);
        }
        setRoomAssignments(map);
      })
      .catch(() => {});
  }, [locationId, selectedDayName]);

  // Build a map: teacher_id → array of availability rows for the selected day at this location
  // Uses clientAvailability (fetched client-side) to bypass SSR payload size limits
  const teacherAvailabilityForDay = React.useMemo(() => {
    const map = new Map<string, typeof availability>();
    for (const row of clientAvailability) {
      if (String(row.day_of_week) !== selectedDayName) continue;
      if (!map.has(row.teacher_id)) map.set(row.teacher_id, []);
      map.get(row.teacher_id)!.push(row);
    }
    return map;
  // NOTE: roomAssignments is included so the memo re-computes the moment a teacher
  // is assigned to a room — triggering an instant re-render of the hatch zones.
  }, [clientAvailability, selectedDayName, roomAssignments]);

  // Smart-Filter: only show teachers who have availability data for this day
  // Teachers with existing blocks but no availability row are still shown (legacy data — visible with conflict overlay)
  const filteredTeachers = React.useMemo(() => {
    return teachers.filter((t) => {
      const hasAvailability = teacherAvailabilityForDay.has(t.id);
      const hasBlocksToday = (teacherBlocks.get(t.id) ?? []).length > 0;
      // Show if they have availability for this day OR have existing blocks (legacy data must remain visible)
      return hasAvailability || hasBlocksToday;
    });
  }, [teachers, teacherAvailabilityForDay, teacherBlocks]);

  // ── Room-centric memos ─────────────────────────────────────────────────────
  // Sort active rooms numerically — handles "LOCATION_N" and plain "N" formats
  const sortedRooms = React.useMemo(() => {
    const roomNum = (name: string) => {
      // Extract trailing integer: "BELLEVUE_10" → 10, "OMAHA_2" → 2, "3" → 3
      const m = name.match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : 999;
    };
    return [...rooms]
      .filter(r => r.isActive)
      .sort((a, b) => roomNum(a.name) - roomNum(b.name));
  }, [rooms]);

  // Map: room_id → blocks assigned to that room on the selected day
  const roomBlocks = React.useMemo(() => {
    const map = new Map<string, ProjectedBlock[]>();
    for (const b of projectedBlocks) {
      if (b.room_id) {
        // Block has explicit room_id — place it directly
        if (!map.has(b.room_id)) map.set(b.room_id, []);
        map.get(b.room_id)!.push(b);
      } else if (b.teacher_id) {
        // Block has no room_id — find which room this teacher is assigned to
        // and place it there so it isn't silently dropped
        let placed = false;
        for (const [roomId, teacherIds] of roomAssignments.entries()) {
          if (teacherIds.includes(b.teacher_id)) {
            if (!map.has(roomId)) map.set(roomId, []);
            map.get(roomId)!.push(b);
            placed = true;
            break;
          }
        }
        if (!placed) {
          // Teacher has no room assignment — place in a virtual "unassigned" bucket
          // keyed by teacher_id so the teacher column can still find it
          const key = `teacher:${b.teacher_id}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(b);
        }
      }
    }
    return map;
  }, [projectedBlocks, roomAssignments]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const dayHours = getHoursForDate(locationHours, selectedDate);
  if (dayHours.isClosed) {
    return (
      <div className="flex h-[400px] items-center justify-center text-sm font-semibold text-[var(--z-muted)]">
        Studio is closed on this date.
      </div>
    );
  }

  const startMin = dayHours.openMinute;
  const endMin = dayHours.closeMinute;
  const totalMinutes = endMin - startMin;
  const timeLabels: number[] = [];
  for (let m = startMin; m < endMin; m += 30) {
    timeLabels.push(m);
  }
  const numSlots = timeLabels.length;
  // SLOT_H: fill available viewport height.
  // Consumed above the grid: TopBar ~65px + schedule header ~88px + util bar ~40px = ~193px
  // No upper cap — let slots grow to fill the screen naturally.
  // Minimum 44px so text stays readable.
  const SLOT_H = typeof window !== "undefined"
    ? Math.max(44, Math.floor((window.innerHeight - 193) / Math.max(numSlots, 1) * 0.855))
    : 48;

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
      // checked_in_by must be a UUID or null — never send a plain string
      checked_in_by: null,
    };
    await patchBlock(block, patch, true);
    setSyntheticBlock(null);
  }

  async function callOut(block: ScheduleBlock | ProjectedBlock) {
    const patch: Partial<ScheduleBlock> = {
      block_type: "call_out",
      status: "available",
    };
    await patchBlock(block, patch, true);
  }

  async function bookStudent(block: ProjectedBlock | null) {
    if (!bookingStudentId) return;
    setSaving(true);
    setError(null);
    try {
      // Determine if this is an existing block or a pure open-slot click
      const isOpenSlot = !block || (!block.student_id && block.block_type === "open_time" && !block.source_block_id);
      const ctx = openSlotContext;

      const payload: Record<string, unknown> = {
        student_id: bookingStudentId,
        is_recurring: bookingRecurring,
        is_first_lesson: bookingFirstDay,
      };

      if (block && (block.source_block_id ?? block.id)) {
        // Existing DB block — update it
        payload.block_id = block.source_block_id ?? block.id;
        payload.block_date = block.block_date ?? selectedDate;
        payload.teacher_id = block.teacher_id;
        payload.location_id = locationId;
        payload.room_id = block.room_id ?? null;
        payload.start_time = block.start_time;
        payload.end_time = block.end_time;
      } else if (ctx) {
        // Pure open-slot (no DB row) — create a new block
        payload.teacher_id = ctx.teacherId;
        payload.location_id = locationId;
        payload.room_id = ctx.roomId;
        payload.block_date = ctx.date;
        payload.start_time = ctx.startTime;
        payload.end_time = ctx.endTime;
      } else {
        throw new Error("No block context available");
      }

      const res = await fetch("/api/schedule-blocks/book-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error ?? "Booking failed");
      }
      const result = await res.json() as { data: ScheduleBlock };
      const newBlock = result.data;

      // Update local blocks state: replace if existing, append if new
      const exists = blocks.some(b => b.id === newBlock.id);
      if (exists) {
        onBlocksChange(blocks.map(b => b.id === newBlock.id ? newBlock : b));
      } else {
        onBlocksChange([...blocks, newBlock]);
      }

      // If recurring, refresh the recurring lessons overlay
      if (bookingRecurring) {
        const d = new Date((payload.block_date as string) + "T00:00:00.000Z");
        const dow = d.getUTCDay();
        void fetch(`/api/schedule/recurring-lessons?location_id=${locationId}&day_of_week=${dow}`)
          .then(r => r.ok ? r.json() : null)
          .then((res2: { data?: RecurringLesson[] } | null) => {
            if (res2?.data) setClientRecurringLessons(res2.data);
          })
          .catch(() => {});
      }

      setSelectedBlockId(null);
      setOpenSlotContext(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSaving(false);
    }
  }

  if (selectedDayName === "friday") {
    return (
      <div className="flex h-[calc(100vh-7rem)] min-h-0 flex-1 items-center justify-center bg-[var(--z-bg)]">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--z-border)] bg-[#111113] px-12 py-10">
          <span className="text-4xl">🔒</span>
          <p className="text-xl font-bold text-white">Studio Closed</p>
          <p className="text-sm text-[var(--z-muted)]">Fridays are not scheduled. No rooms available.</p>
        </div>
      </div>
    );
  }

  // ── Utilization & Revenue Math ──────────────────────────────────────────
  // Denominator: Total potential slots across ALL rooms (even if no teacher assigned)
  const totalSlots = sortedRooms.length * timeLabels.length;
  
  // Numerator: Booked blocks + projected recurring lessons
  const bookedSlots = projectedBlocks.filter(b =>
    b.student_id && b.block_type !== "open_time"
  ).length + clientRecurringLessons.filter(rl => {
    const dow = new Date(selectedDate + "T00:00:00.000Z").getUTCDay();
    return rl.day_of_week === dow;
  }).length;

  const openSlots = totalSlots - bookedSlots;
  const utilPct = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
  const utilColor = utilPct >= 80 ? "#c4f036" : utilPct >= 50 ? "#eab308" : "#ef4444";
  
  // Revenue Gap: Every open slot is $160/month potential
  const revenueGap = openSlots * 160;
  const totalPotential = totalSlots * 160;

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 flex-1 flex-col overflow-hidden bg-[var(--z-bg)]">
      {/* ── Utilization & Revenue Bar ── */}
      <div className="flex shrink-0 items-center gap-6 border-b border-[var(--z-border)] bg-[var(--z-bg)]/95 px-5 py-3">
        {/* Left: Progress & Pct */}
        <div className="flex flex-1 items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--z-muted)]">Efficiency</span>
            <span className="text-lg font-black" style={{ color: utilColor }}>{utilPct}%</span>
          </div>
          <div className="relative flex-1 h-2 rounded-full bg-[var(--z-border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${utilPct}%`, backgroundColor: utilColor }}
            />
          </div>
        </div>

        {/* Right: Revenue Potential & Gap */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--z-muted)]">Monthly Leak</span>
            <span className="text-sm font-black text-[#ef4444]">
              -${revenueGap.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="h-8 w-px bg-[var(--z-border)] opacity-50" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--z-muted)]">Total Potential</span>
            <span className="text-sm font-black text-[#c4f036]">
              {totalPotential.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="h-8 w-px bg-[var(--z-border)] opacity-50" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--z-muted)]">Capacity</span>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span style={{ color: "#c4f036" }}>{bookedSlots} Booked</span>
              <span className="text-[var(--z-muted)]">/</span>
              <span className="text-[var(--z-muted)]">{totalSlots} Total</span>
            </div>
          </div>
        </div>
      </div>
      {/* ── Main grid row ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* ── Time Column ── */}
      <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-[var(--z-border)] bg-[var(--z-bg)]/95 backdrop-blur-sm">
        <div className="h-16 border-b border-[var(--z-border)]" />
        <div className="relative">
          {timeLabels.map((m) => (
            <div key={m} className="flex items-start justify-center pt-2 text-[10px] font-bold text-[var(--z-muted)]" style={{ height: `${SLOT_H}px` }}>
              {minuteToLabel(m)}
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid Content ── */}
      <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--z-border)]">
        <div className="flex min-w-full flex-col">
          {/* Room Headers */}
          <div className="sticky top-0 z-30 flex h-20 border-b border-[var(--z-border)] bg-[var(--z-bg)]/95 backdrop-blur-sm">
            {sortedRooms.length === 0 ? (
              /* Fallback: teacher headers when no rooms are configured */
              filteredTeachers.map((t) => {
                const dayBlocks = teacherBlocks.get(t.id) ?? [];
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
              })
            ) : (
              sortedRooms.map((room) => {
                const dayBlocks = roomBlocks.get(room.id) ?? [];
                const booked = dayBlocks.filter(b => b.student_id && b.block_type !== 'open_time').length;
                const open = dayBlocks.filter(b => b.block_type === 'open_time' && !b.student_id).length;
                // Teacher from recurring assignment map first, then fall back to block data
                const assignedTeacherIds = roomAssignments.get(room.id) ?? (dayBlocks.find(b => b.teacher_id)?.teacher_id ? [dayBlocks.find(b => b.teacher_id)!.teacher_id!] : []);
                const assignedTeacherId = assignedTeacherIds[0] ?? null;
                const assignedTeachers = assignedTeacherIds.map(id => teachers.find(t => t.id === id)).filter(Boolean) as typeof teachers;
                const assignedTeacher = assignedTeachers[0] ?? null;
                const primaryInstrument = (room.primaryInstruments as string[] | undefined)?.[0];
                const emoji = primaryInstrument ? instrumentEmoji(primaryInstrument) : "🎵";
                const hasBlocks = dayBlocks.length > 0;
                const isAssigning = assigningRoomId === room.id;
                // Stretch: use flex-1 so columns expand to fill the full screen width
                // All teachers — show everyone, flag those without availability with ⚠️
                // GUARDRAIL: exclude teachers already assigned to a DIFFERENT room on this day
                const availableTeachers = teachers.filter(t => {
                  const existingRoom = [...roomAssignments.entries()].find(([rid, tids]) => tids.includes(t.id) && rid !== room.id);
                  return !existingRoom; // block if already in another room on this day
                });
                return (
                  <div
                    key={room.id}
                    className="relative flex-1 min-w-[160px] border-r border-[var(--z-border)] p-2 text-center overflow-visible"
                    style={hasBlocks || assignedTeacher ? { borderTop: `2px solid rgba(0,255,136,0.3)` } : {}}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm">{emoji}</span>
                      <span className="truncate text-[11px] font-black uppercase tracking-wider text-[var(--z-fg)]">
                        Room {room.name}
                      </span>
                    </div>
                    {assignedTeachers.length > 0 ? (
                      <button
                        className="mt-0.5 w-full truncate text-[10px] font-semibold text-[var(--z-accent)] hover:opacity-70 transition-opacity"
                        onClick={() => setAssigningRoomId(isAssigning ? null : room.id)}
                        title="Click to reassign teacher"
                      >
                        {assignedTeachers.map(t => teacherName(t)).join(" / ")}
                        {subAssignments.has(room.id) ? (
                          <span className="ml-1 inline-flex items-center rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-yellow-400 border border-yellow-500/30">
                            🟡 Sub
                          </span>
                        ) : " ✎"}
                      </button>
                    ) : (
                      <button
                        className="mt-0.5 w-full text-[10px] font-semibold text-[var(--z-muted)] hover:text-[var(--z-accent)] transition-colors"
                        onClick={() => setAssigningRoomId(isAssigning ? null : room.id)}
                        title="Assign a teacher to this room"
                      >
                        + Assign Teacher
                      </button>
                    )}
                    {hasBlocks && (
                      <div className="mt-0.5 flex items-center justify-center gap-2 text-[10px] font-bold">
                        <span className="text-[var(--z-accent)]">{booked} booked</span>
                        <span className="text-[var(--z-muted)]">{open} open</span>
                      </div>
                    )}
                    {/* Teacher assignment dropdown */}
                    {isAssigning && (
                      <div
                        className="absolute left-0 top-full z-[9999] mt-1 w-full min-w-[180px] rounded-xl border border-[rgba(0,255,136,0.2)] bg-[#0f1a14] shadow-2xl"
                        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,136,0.1)" }}
                      >
                        <div className="border-b border-[rgba(0,255,136,0.1)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--z-accent)]">
                          Assign to {room.name}
                        </div>
                        <div className="max-h-48 overflow-y-auto py-1">
                          {availableTeachers.length === 0 ? (
                            <div className="px-3 py-2 text-[11px] text-[var(--z-muted)]">No teachers available today</div>
                          ) : (
                            availableTeachers.map(t => (
                              <button
                                key={t.id}
                                disabled={assigningSaving}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] font-medium text-[var(--z-fg)] hover:bg-[rgba(0,255,136,0.08)] transition-colors disabled:opacity-50"
                                onClick={async () => {
                                  // Conflict check: teacher not scheduled for this day
                                  if (!teacherAvailabilityForDay.has(t.id)) {
                                    setConflictTarget({ teacherId: t.id, roomId: room.id });
                                    setAssigningRoomId(null);
                                    return;
                                  }
                                  setAssigningSaving(true);
                                  try {
                                    const res = await fetch("/api/schedule/room-assignments", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        teacher_id: t.id,
                                        room_id: room.id,
                                        location_id: locationId,
                                        day_of_week: selectedDayName,
                                        is_recurring: true,
                                      }),
                                    });
                                    if (res.ok) {
                                      setRoomAssignments(prev => {
                                        const next = new Map(prev);
                                        // Remove teacher from any other room
                                        for (const [rid, tids] of next.entries()) {
                                          if (rid !== room.id && tids.includes(t.id)) {
                                            next.set(rid, tids.filter(id => id !== t.id));
                                          }
                                        }
                                        // Add teacher to this room (shift-split: append)
                                        const existing = next.get(room.id) ?? [];
                                        if (!existing.includes(t.id)) next.set(room.id, [...existing, t.id]);
                                        return next;
                                      });
                                      // Clear sub badge if assigning as recurring
                                      setSubAssignments(prev => { const next = new Set(prev); next.delete(room.id); return next; });
                                    }
                                  } finally {
                                    setAssigningSaving(false);
                                    setAssigningRoomId(null);
                                  }
                                }}
                              >
                                <span className="text-xs">{instrumentEmoji((t.instruments as string[] | undefined)?.[0] ?? "")}</span>
                                <span className={t.id === assignedTeacherId ? "text-[var(--z-accent)] font-bold" : ""}>
                                  {teacherName(t)}
                                  {t.id === assignedTeacherId ? " ✓" : ""}
                                  {!teacherAvailabilityForDay.has(t.id) && (
                                    <span className="ml-1 text-yellow-400 text-[9px]">⚠️</span>
                                  )}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                        {assignedTeacherId && (
                          <div className="border-t border-[rgba(0,255,136,0.1)] p-1">
                            <button
                              disabled={assigningSaving}
                              className="w-full rounded-lg px-3 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              onClick={async () => {
                                setAssigningSaving(true);
                                try {
                                  await fetch(`/api/schedule/room-assignments?room_id=${room.id}&location_id=${locationId}&day_of_week=${selectedDayName}`, { method: "DELETE" });
                                  setRoomAssignments(prev => { const next = new Map(prev); next.delete(room.id); return next; });
                                  setSubAssignments(prev => { const next = new Set(prev); next.delete(room.id); return next; });
                                } finally {
                                  setAssigningSaving(false);
                                  setAssigningRoomId(null);
                                }
                              }}
                            >
                              Remove Assignment
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Main Grid Body */}
          <div className="relative flex flex-1">
            {/* Horizontal lines */}
            <div className="absolute inset-0 pointer-events-none">
              {timeLabels.map((m) => (
                <div key={m} className="border-b border-[var(--z-border)]/30" style={{ height: `${SLOT_H}px` }} />
              ))}
            </div>

            {/* Now indicator line */}
            {selectedDate === nowDate && nowMinute >= startMin && nowMinute <= endMin && (
              <div
                className="absolute left-0 right-0 z-10 border-t-2 border-[#c4f036] shadow-[0_0_8px_rgba(0,255,136,0.4)]"
                style={{ top: `${((nowMinute - startMin) / 30) * SLOT_H}px` }}
              >
                <div className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-[#c4f036] shadow-[0_0_8px_rgba(0,255,136,0.6)]" />
              </div>
            )}

            {/* Columns */}
            {(sortedRooms.length === 0 ? filteredTeachers.map(t => ({ id: t.id, isRoom: false as const, teacher: t })) : sortedRooms.map(r => ({ id: r.id, isRoom: true as const, room: r }))).map((col) => {
              // For room columns: first try roomBlocks (has explicit room_id or was matched via roomAssignments).
              // Fallback: if no blocks found via room, check teacher-keyed bucket (null room_id, no room assignment)
              // This prevents Sunday/weekday blocks with null room_id from being silently dropped.
              let dayBlocks: ProjectedBlock[];
              if (col.isRoom) {
                const roomKeyed = roomBlocks.get(col.id) ?? [];
                if (roomKeyed.length > 0) {
                  dayBlocks = roomKeyed;
                } else {
                  // Check if any teacher assigned to this room has unassigned blocks
                  const assignedTids = roomAssignments.get(col.id) ?? [];
                  const teacherKeyed = assignedTids.flatMap(tid => roomBlocks.get(`teacher:${tid}`) ?? []);
                  if (teacherKeyed.length > 0) {
                    dayBlocks = teacherKeyed;
                  } else {
                    // Last resort: no room assignments exist at all for this day (e.g. Sunday).
                    // Distribute teacher-keyed blocks across columns by teacher bucket index.
                    const allTeacherKeys = [...roomBlocks.keys()].filter(k => k.startsWith("teacher:"));
                    const colIdx = sortedRooms.findIndex(r => r.id === col.id);
                    dayBlocks = (colIdx >= 0 && colIdx < allTeacherKeys.length)
                      ? (roomBlocks.get(allTeacherKeys[colIdx]) ?? [])
                      : [];
                  }
                }
              } else {
                dayBlocks = teacherBlocks.get(col.id) ?? [];
              }
              // Hard-Lock: compute unavailable zones for the teacher(s) in this column
              // For room columns: support shift-splits (multiple teachers per room per day)
              const assignedTeacherIds = col.isRoom
                ? (roomAssignments.get(col.id) ?? (dayBlocks.find(b => b.teacher_id)?.teacher_id ? [dayBlocks.find(b => b.teacher_id)!.teacher_id!] : []))
                : [col.id];
              const assignedTeacherId = assignedTeacherIds[0] ?? null;
              // Merge availability windows from ALL assigned teachers (shift-split: union of windows)
              const availRows = assignedTeacherIds.flatMap(tid => teacherAvailabilityForDay.get(tid) ?? []);
              const availWindows = availRows.map(r => ({
                start: toMinute(r.start_time),
                end: toMinute(r.end_time),
              }));
              const hasAvailability = availWindows.length > 0;
              const availStart = hasAvailability ? Math.min(...availWindows.map(w => w.start)) : endMin;
              const availEnd = hasAvailability ? Math.max(...availWindows.map(w => w.end)) : startMin;
              const gridHeight = ((endMin - startMin) / 30) * SLOT_H;
              const preHeight = hasAvailability ? Math.max(0, ((availStart - startMin) / 30) * SLOT_H) : 0;
              const postTop = hasAvailability ? ((availEnd - startMin) / 30) * SLOT_H : 0;
              const postHeight = hasAvailability ? Math.max(0, ((endMin - availEnd) / 30) * SLOT_H) : 0;
              // Empty room state: room has no blocks today AND no teacher assigned
              // If a teacher is assigned (via roomAssignments), suppress the placeholder so their availability renders
              const isEmptyRoom = col.isRoom && dayBlocks.length === 0 && assignedTeacherIds.length === 0;
              return (
                <div key={`${col.id}__${assignedTeacherId ?? "empty"}`} className="relative flex-1 min-w-[160px] border-r border-[var(--z-border)]/50">
                  {/* Empty Room State */}
                  {isEmptyRoom && (
                    <div
                      className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-1"
                      style={{ pointerEvents: "none" }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,255,136,0.2)", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center", lineHeight: 1.4 }}>
                        Room Available
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.1)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        No Teacher
                      </span>
                    </div>
                  )}
                  {/* ── Capacity Generator ──
                   * Loop every 30-min slot from studio open to close.
                   * For each slot:
                   *   - Outside teacher availability → hatched Unavailable row
                   *   - Inside availability + has a booked block → render lesson card
                   *   - Inside availability + no block → render clickable OPEN TIME slot
                   * For empty rooms (no teacher assigned): generate bookable "+ Room Available" slots
                   *   for the full studio hours so they count toward utilization denominator.
                   */}
                  {isEmptyRoom && timeLabels.map((slotMin) => {
                    const slotTop = ((slotMin - startMin) / 30) * SLOT_H;
                    return (
                      <button
                        key={`empty-${slotMin}`}
                        type="button"
                        className="absolute left-1 right-1 flex items-center justify-center overflow-hidden rounded-md border transition-all hover:border-[rgba(0,255,136,0.4)] hover:bg-[rgba(0,255,136,0.06)]"
                        style={{
                          top: `${slotTop + 2}px`,
                          height: `${SLOT_H - 4}px`,
                          borderColor: "rgba(0,255,136,0.1)",
                          background: "rgba(0,255,136,0.02)",
                          zIndex: 2,
                        }}
                        onClick={() => {
                          setSelectedBlockId(null);
                          setSyntheticBlock(null);
                          setBookingStudentId(null);
                          setBookingStudentQuery("");
                          setBookingFirstDay(null);
                          setBookingStudentHasBlocks(null);
                          setOpenSlotContext({
                            teacherId: "00000000-0000-0000-0000-000000000000", // Explicitly flag as missing teacher
                            roomId: col.isRoom ? col.id : null,
                            date: selectedDate,
                            startTime: `${String(Math.floor(slotMin / 60)).padStart(2, "0")}:${String(slotMin % 60).padStart(2, "0")}`,
                            endTime: `${String(Math.floor((slotMin + 30) / 60)).padStart(2, "0")}:${String((slotMin + 30) % 60).padStart(2, "0")}`,
                          });
                        }}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(239,68,68,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", userSelect: "none" }}>
                            Missing Teacher
                          </span>
                          <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(0,255,136,0.25)", letterSpacing: "0.06em", textTransform: "uppercase", userSelect: "none" }}>
                            $160 Potential
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {!isEmptyRoom && timeLabels.map((slotMin) => {
                    const slotTop = ((slotMin - startMin) / 30) * SLOT_H;
                    const slotEnd = slotMin + 30;
                    const inWindow = hasAvailability
                      ? availWindows.some(w => slotMin >= w.start && slotEnd <= w.end)
                      : false;

                    // Check if a booked block starts at this slot
                    const block = dayBlocks.find(b => toMinute(b.start_time) === slotMin);

                    if (!inWindow) {
                      // ── Hatched Unavailable row ──
                      return (
                        <div
                          key={slotMin}
                          className="absolute left-0 right-0 flex items-center justify-center overflow-hidden"
                          style={{
                            top: `${slotTop}px`,
                            height: `${SLOT_H}px`,
                            background: "repeating-linear-gradient(135deg, rgba(0,255,136,0.03) 0px, rgba(0,255,136,0.03) 2px, transparent 2px, transparent 10px)",
                            borderBottom: "1px solid rgba(0,255,136,0.06)",
                            pointerEvents: "none",
                            zIndex: 2,
                          }}
                        >
                          <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(0,255,136,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", userSelect: "none" }}>
                            Unavailable
                          </span>
                        </div>
                      );
                    }

                    if (block) {
                      // ── Booked lesson card ──
                      const blockStart = toMinute(block.start_time);
                      const blockEnd = toMinute(block.end_time);
                      const blockHeight = ((blockEnd - blockStart) / 30) * SLOT_H;
                      const display = getBlockDisplay(block);
                      const isSelected = selectedBlockId === block.id;
                      const isConflict = hasAvailability &&
                        block.block_type === "student_session" &&
                        (blockStart < availStart || blockEnd > availEnd);
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
                          className={`absolute left-1 right-1 flex flex-col overflow-hidden rounded-md border p-1.5 text-center transition-all hover:scale-[1.02] hover:z-20 ${
                            isSelected ? "z-30 ring-2 ring-white ring-offset-2 ring-offset-[var(--z-bg)]" : "z-10"
                          }`}
                          style={{
                            top: `${slotTop + 2}px`,
                            height: `${blockHeight - 4}px`,
                            backgroundColor: display.bg,
                            borderColor: isConflict ? "#ef4444" : display.border,
                            boxShadow: isConflict ? "0 0 0 1px #ef4444, 0 0 8px rgba(239,68,68,0.3)" : undefined,
                            opacity: block.checked_in ? 0.45 : 1,
                          }}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="w-full truncate text-[15px] font-black leading-tight" style={{ color: display.text }}>
                              {block.student_id ? (() => {
                                const s = studentsById.get(block.student_id);
                                if (s) return studentName(s);
                                const rl = clientRecurringLessons.find(r => r.student_id === block.student_id);
                                return rl ? [rl.student_first_name, rl.student_last_name].filter(Boolean).join(" ") : display.label;
                              })() : display.label}
                            </span>
                            
                            <div className="flex items-center justify-center gap-1.5">
                              {block.student_id && (() => {
                                const s = studentsById.get(block.student_id);
                                const instr = s?.instrument || clientRecurringLessons.find(r => r.student_id === block.student_id)?.instrument;
                                return instr ? (
                                  <>
                                    <span className="text-base">{instrumentEmoji(instr as string)}</span>
                                    <span className="text-[11px] font-black uppercase tracking-wider opacity-80" style={{ color: display.text }}>{instr as string}</span>
                                  </>
                                ) : null;
                              })()}
                              {block.checked_in && (
                                <span
                                  title="Checked In"
                                  style={{ fontSize: 9, fontWeight: 900, color: "#000", background: "#22c55e", borderRadius: 3, padding: "0 4px", lineHeight: "14px", userSelect: "none" }}
                                >✓</span>
                              )}
                              {isConflict && (
                                <span
                                  title="Schedule Conflict"
                                  style={{ fontSize: 9, fontWeight: 900, color: "#fff", background: "#ef4444", borderRadius: 3, padding: "0 4px", lineHeight: "14px", userSelect: "none" }}
                                >!</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-1 text-[14px] font-bold opacity-90" style={{ color: display.text }}>
                            {formatBlockTime(block.start_time)} – {formatBlockTime(block.end_time)}
                          </div>
                          {block.notes && (
                            <div className="mt-1 truncate text-[13px] italic opacity-60" style={{ color: display.text }}>{block.notes}</div>
                          )}
                        </button>
                      );
                    }

                    // ── Recurring lesson overlay (future dates: no actual block row exists) ──
                    // Match on teacher_id + start_time.
                    // Priority order:
                    //   1. assignedTeacherIds from roomAssignments (populated async)
                    //   2. Infer teacher from dayBlocks (current week)
                    //   3. Check roomAssignments map directly for this column
                    //   4. For non-room (teacher) columns: match directly on col.id
                    //   5. Last resort: if no room assignment exists anywhere for this teacher,
                    //      render in the first column that claims this teacher (prevents invisible students)
                    const roomAssignedTeacherIds = col.isRoom ? (roomAssignments.get(col.id) ?? []) : [];
                    const inferredTeacherIds: string[] = assignedTeacherIds.length > 0
                      ? assignedTeacherIds
                      : dayBlocks.length > 0
                        ? [...new Set(dayBlocks.map(b => b.teacher_id).filter(Boolean) as string[])]
                        : roomAssignedTeacherIds.length > 0
                          ? roomAssignedTeacherIds
                          : col.isRoom ? [] : [col.id]; // teacher column: match by col.id directly

                    // For room columns with no assignment at all, check if this recurring lesson's
                    // teacher has NO room assignment anywhere — if so, render in first room column
                    const colIndex = (sortedRooms.length > 0 ? sortedRooms : filteredTeachers).findIndex(c => c.id === col.id);
                    const isFirstColumn = colIndex === 0;
                    const recurringLesson = clientRecurringLessons.find(rl => {
                      const rlMin = toMinute(rl.start_time);
                      if (rlMin !== slotMin) return false;
                      // Direct teacher match (works for teacher columns and assigned room columns)
                      if (inferredTeacherIds.includes(rl.teacher_id)) return true;
                      // Fallback: if this teacher has no room assignment anywhere on this day,
                      // render them in the first column so they're never invisible
                      if (col.isRoom && isFirstColumn) {
                        const teacherHasAnyRoomAssignment = [...roomAssignments.values()].some(tids => tids.includes(rl.teacher_id));
                        if (!teacherHasAnyRoomAssignment) return true;
                      }
                      return false;
                    });

                    if (recurringLesson) {
                      const rlStart = toMinute(recurringLesson.start_time);
                      const rlEnd = toMinute(recurringLesson.end_time);
                      const rlHeight = ((rlEnd - rlStart) / 30) * SLOT_H;
                      const rlStudentName = [recurringLesson.student_first_name, recurringLesson.student_last_name]
                        .filter(Boolean).join(" ") || "Student";
                      const rlSlotEndMin = rlEnd;
                      const rlStartStr = `${String(Math.floor(rlStart / 60)).padStart(2, "0")}:${String(rlStart % 60).padStart(2, "0")}`;
                      const rlEndStr = `${String(Math.floor(rlSlotEndMin / 60)).padStart(2, "0")}:${String(rlSlotEndMin % 60).padStart(2, "0")}`;
                      return (
                        <button
                          key={`rl-${recurringLesson.id}`}
                          type="button"
                          className="absolute left-1 right-1 flex flex-col overflow-hidden rounded-md border p-1.5 text-left hover:scale-[1.02] hover:z-20 transition-all"
                          style={{
                            top: `${slotTop + 2}px`,
                            height: `${rlHeight - 4}px`,
                            backgroundColor: "rgba(234,179,8,1.0)",
                            borderColor: "#ca8a04",
                            zIndex: 8,
                            opacity: 1,
                          }}
                          title={`${rlStudentName} (recurring)`}
                          onClick={() => {
                            if (recurringLesson.student_id) {
                              // Route to Management Modal: build a synthetic ProjectedBlock
                              const synId = `rl-synthetic-${recurringLesson.id}`;
                              const synBlock = {
                                id: synId,
                                source_block_id: synId,
                                tenant_id: "00000000-0000-0000-0000-000000000001",
                                location_id: locationId,
                                teacher_id: recurringLesson.teacher_id,
                                student_id: recurringLesson.student_id,
                                room_id: recurringLesson.room_id ?? null,
                                block_date: selectedDate,
                                start_time: recurringLesson.start_time,
                                end_time: recurringLesson.end_time,
                                block_type: "student_session",
                                status: "booked",
                                checked_in: false,
                                checked_in_at: null,
                                callout_reason: null,
                                teacher_tally: false,
                                notes: null,
                                is_recurring: true,
                                created_at: "",
                                updated_at: "",
                              };
                              setSyntheticBlock(synBlock as ProjectedBlock);
                              setSelectedBlockId(synId);
                              setOpenSlotContext(null);
                            } else {
                              // No student — open Booking Modal
                              setSelectedBlockId(null);
                              setBookingStudentId(null);
                              setBookingStudentQuery("");
                              setBookingFirstDay(null);
                              setBookingStudentHasBlocks(null);
                              setOpenSlotContext({
                                teacherId: recurringLesson.teacher_id,
                                roomId: col.isRoom ? col.id : null,
                                date: selectedDate,
                                startTime: rlStartStr,
                                endTime: rlEndStr,
                              });
                            }
                          }}
                        >
                          <div className="truncate text-[14px] font-black leading-tight" style={{ color: "#000" }}>
                            {recurringLesson.instrument
                              ? `${instrumentEmoji(recurringLesson.instrument)} ${rlStudentName}`
                              : `- ${rlStudentName}`}
                          </div>
                          <div className="mt-0.5 text-[13px] font-bold opacity-80" style={{ color: "#000" }}>
                            {formatBlockTime(recurringLesson.start_time)} – {formatBlockTime(recurringLesson.end_time)}
                          </div>
                        </button>
                      );
                    }

                    // ── OPEN TIME slot ──
                    // Compute the end time for this 30-min slot
                    const slotEndMin = slotMin + 30;
                    const slotStartStr = `${String(Math.floor(slotMin / 60)).padStart(2, "0")}:${String(slotMin % 60).padStart(2, "0")}`;
                    const slotEndStr = `${String(Math.floor(slotEndMin / 60)).padStart(2, "0")}:${String(slotEndMin % 60).padStart(2, "0")}`;
                    const colTeacherId = col.isRoom ? (assignedTeacherId ?? "") : col.id;
                    const colRoomId = col.isRoom ? col.id : null;
                    return (
                      <button
                        key={slotMin}
                        type="button"
                        onClick={() => {
                          setSessionType("student_session");
                          setSelectedBlockId(null);
                          setBookingStudentId(null);
                          setBookingStudentQuery("");
                          setBookingFirstDay(null);
                          setBookingStudentHasBlocks(null);
                          setOpenSlotContext({
                            teacherId: colTeacherId,
                            roomId: colRoomId,
                            date: selectedDate,
                            startTime: slotStartStr,
                            endTime: slotEndStr,
                          });
                        }}
                        className="absolute left-1 right-1 flex items-center justify-center gap-1 rounded border border-dashed transition-all hover:border-[#c4f036] hover:bg-[rgba(0,255,136,0.06)] group"
                        style={{
                          top: `${slotTop + 1}px`,
                          height: `${SLOT_H - 2}px`,
                          borderColor: "rgba(0,255,136,0.15)",
                          zIndex: 1,
                        }}
                      >
                        <span
                          style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,255,136,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", userSelect: "none" }}
                          className="group-hover:text-[#c4f036] transition-colors"
                        >
                          + Open
                        </span>
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
        const selectedBlock = projectedBlocks.find(b => b.id === selectedBlockId)
          ?? (syntheticBlock && syntheticBlock.id === selectedBlockId ? syntheticBlock : null);
        // Show modal if: (a) a block is selected, OR (b) an open slot was clicked
        const isOpenSlotModal = !selectedBlock && !!openSlotContext;
        if (!selectedBlock && !isOpenSlotModal) return null;

        const student = selectedBlock?.student_id ? studentsById.get(selectedBlock.student_id) : null;
        const family = student?.family_id ? familiesById.get(student.family_id) : null;
        const teacher = selectedBlock?.teacher_id
          ? teachers.find(t => t.id === selectedBlock.teacher_id)
          : (openSlotContext?.teacherId ? teachers.find(t => t.id === openSlotContext.teacherId) : null);
        const isUnbooked = isOpenSlotModal || !selectedBlock?.student_id || selectedBlock.block_type === "open_time";

        // Derived display time for open-slot modal
        const displayStartTime = selectedBlock?.start_time ?? openSlotContext?.startTime ?? "";
        const displayEndTime = selectedBlock?.end_time ?? openSlotContext?.endTime ?? "";

        function closeModal() {
          setSelectedBlockId(null);
          setOpenSlotContext(null);
          setSyntheticBlock(null);
          setBookingStudentId(null);
          setBookingStudentQuery("");
          setBookingFirstDay(null);
          setBookingStudentHasBlocks(null);
        }

        return (
          <>
            {/* ── Centered Modal Backdrop ── */}
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={closeModal}
            >
              {/* Blur backdrop */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

              {/* Modal card — stop propagation so inner clicks don't close */}
              <div
                className="relative z-10 w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0f1a14 0%, #0a0a0c 60%, #0a0a0c 100%)",
                  border: "1px solid rgba(0,255,136,0.18)",
                  boxShadow: "0 0 0 1px rgba(0,255,136,0.08), 0 25px 60px rgba(0,0,0,0.7), 0 0 80px rgba(0,255,136,0.04)",
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Green half-fade top accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                  style={{ background: "linear-gradient(90deg, #c4f036 0%, rgba(0,255,136,0.3) 50%, transparent 100%)" }}
                />

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#c4f036] shadow-[0_0_6px_#c4f036]" />
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-[var(--z-fg)]">Session Detail</h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full p-1.5 text-[var(--z-muted)] hover:bg-white/8 hover:text-[var(--z-fg)] transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

              <div className="flex-1 overflow-y-auto space-y-4 scrollbar-none px-5 pb-5">
                {/* Time & Teacher context */}
                <div className="space-y-1">
                  <div className="text-xl font-black text-[var(--z-fg)]">
                    {formatBlockTime(displayStartTime)} – {formatBlockTime(displayEndTime)}
                  </div>
                  {isOpenSlotModal && (
                    <div className="inline-flex items-center gap-1 rounded-full border border-[#c4f036]/20 bg-[#c4f036]/8 px-2 py-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#c4f036]">Open Slot</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {teacher ? (
                      <Link
                        href={`/teachers/${teacher.id}`}
                        className="text-xs font-bold text-[var(--z-muted)] uppercase tracking-wider hover:text-[var(--z-accent)] hover:underline transition-colors"
                        onClick={closeModal}
                      >
                        {teacherName(teacher)}
                      </Link>
                    ) : (
                      <span className="text-xs font-bold text-[var(--z-muted)] uppercase tracking-wider">Unknown Teacher</span>
                    )}
                    <span className="text-xs text-[var(--z-muted)] opacity-50">·</span>
                    <span className="text-xs font-bold text-[var(--z-muted)] uppercase tracking-wider">{locationName}</span>
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
                                  // Default to recurring and student_session
                                  setBookingRecurring(true);
                                  setBookingFirstDay(false); // Default to regular student session
                                  
                                  // Check if they have other blocks to determine if they are truly new
                                  const hasBlocks = blocks.some(b => b.student_id === s.id);
                                  setBookingStudentHasBlocks(hasBlocks);
                                  
                                  // If they have NO blocks, we might want to prompt them about first day,
                                  // but we still default to student_session (yellow) as requested.
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

                    {/* Session Type Selection (Matching UI Colors) */}
                    {bookingStudentId && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-[var(--z-muted)] uppercase tracking-wider">Session Type</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setBookingFirstDay(false)}
                            className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                              !bookingFirstDay 
                                ? "bg-[rgba(234,179,8,0.9)] text-black border-[#ca8a04]" 
                                : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]"
                            }`}
                          >
                            Student Session
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingFirstDay(true)}
                            className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                              bookingFirstDay 
                                ? "bg-[rgba(59,130,246,0.85)] text-white border-[#2563eb]" 
                                : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]"
                            }`}
                          >
                            First Day
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Book button */}
                    {bookingStudentId && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => bookStudent(isOpenSlotModal ? null : (selectedBlock ?? null))}
                        className="w-full rounded-xl border border-[#c4f036]/40 bg-[#c4f036]/15 px-3 py-2.5 text-sm font-semibold text-[#c4f036] disabled:opacity-50 hover:bg-[#c4f036]/25 transition-colors"
                      >
                        {saving ? "Booking…" : bookingRecurring ? `🔄 Book Recurring ${bookingFirstDay ? "First Day" : "Session"}` : `Book ${bookingFirstDay ? "First Day" : "Session"}`}
                      </button>
                    )}
                  </div>
                ) : (
                  /* ── BOOKED BLOCK: existing session controls ── */
                  <>
                    {/* Student / family info */}
                    {student && (
                      <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 text-xs space-y-1">
                        <Link
                          href={`/students/${selectedBlock!.student_id}`}
                          className="block font-semibold text-[var(--z-fg)] text-sm hover:text-[var(--z-accent)] hover:underline transition-colors"
                          onClick={closeModal}
                        >
                          {studentName(student)}
                        </Link>
                        {family && (
                          <div className="text-[var(--z-muted)]">{family.name ?? family.primary_contact_name ?? ""}</div>
                        )}
                        {family?.primary_phone && (
                          <div className="text-[var(--z-muted)]">{family.primary_phone}</div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Link
                            href={`/students/${selectedBlock!.student_id}`}
                            className="rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/5"
                            onClick={closeModal}
                          >
                            Student →
                          </Link>
                          {student.family_id && (
                            <Link
                              href={`/crm?family=${student.family_id}`}
                              className="rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/5"
                              onClick={closeModal}
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
                      {selectedBlock!.student_id && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => checkIn(selectedBlock!)}
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
                          patchBlock(selectedBlock!, patch, true);
                        }}
                        className="rounded-xl border border-yellow-400/60 bg-yellow-400/20 px-3 py-2.5 text-sm font-semibold text-yellow-200 disabled:opacity-50 hover:bg-yellow-400/30 transition-colors"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => callOut(selectedBlock!)}
                        className="rounded-xl border border-red-400/60 bg-red-500/20 px-3 py-2.5 text-sm font-semibold text-red-200 disabled:opacity-50 hover:bg-red-500/30 transition-colors"
                      >
                        Call Out
                      </button>
                      {selectedBlock!.student_id && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => { setCancelTarget(selectedBlock!); setCancelReason(""); }}
                          className="col-span-2 rounded-xl border border-orange-400/60 bg-orange-500/15 px-3 py-2.5 text-sm font-semibold text-orange-200 disabled:opacity-50 hover:bg-orange-500/25 transition-colors"
                        >
                          Cancel Session
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
              </div>{/* end modal card */}
            </div>{/* end backdrop */}
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
              {cancelTarget.student_id ? studentName(studentsById.get(cancelTarget.student_id)) : "Session"} — {formatBlockTime(cancelTarget.start_time)} – {formatBlockTime(cancelTarget.end_time)}
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
                onClick={() => { setCancelTarget(null); setCancelReason(""); setCancelScope("single"); }}
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

      {/* ── Schedule Conflict Modal ─────────────────────────────────────────── */}
      {conflictTarget && (() => {
        const conflictTeacher = teachers.find(t => t.id === conflictTarget.teacherId);
        const conflictRoom = rooms.find(r => r.id === conflictTarget.roomId);
        return (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setConflictTarget(null)}
          >
            <div
              className="relative w-full max-w-sm rounded-2xl border border-yellow-500/40 bg-[#111115] p-6 shadow-2xl"
              style={{ boxShadow: "0 0 0 1px rgba(234,179,8,0.2), 0 24px 64px rgba(0,0,0,0.8)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-xl">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Schedule Conflict</h3>
                  <p className="mt-0.5 text-[11px] text-[#909098]">
                    <span className="font-semibold text-yellow-400">{conflictTeacher ? teacherName(conflictTeacher) : "This teacher"}</span>
                    {" "}is not scheduled for{" "}
                    <span className="font-semibold text-white capitalize">{selectedDayName}s</span>
                    {conflictRoom ? <> in <span className="font-semibold text-white">Room {conflictRoom.name}</span></> : ""}.
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {/* Add as Sub */}
                <button
                  disabled={conflictSaving}
                  className="flex w-full items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-left transition-all hover:bg-yellow-500/20 disabled:opacity-50"
                  onClick={async () => {
                    setConflictSaving(true);
                    try {
                      const res = await fetch("/api/schedule/room-assignments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          teacher_id: conflictTarget.teacherId,
                          room_id: conflictTarget.roomId,
                          location_id: locationId,
                          day_of_week: selectedDayName,
                          is_recurring: false,
                          assignment_date: selectedDate,
                        }),
                      });
                      if (res.ok) {
                        setRoomAssignments(prev => {
                          const next = new Map(prev);
                          for (const [rid, tids] of next.entries()) {
                            if (tids.includes(conflictTarget.teacherId)) {
                              const filtered = tids.filter(t => t !== conflictTarget.teacherId);
                              if (filtered.length === 0) next.delete(rid);
                              else next.set(rid, filtered);
                            }
                          }
                          const existing = next.get(conflictTarget.roomId) ?? [];
                          next.set(conflictTarget.roomId, [...existing, conflictTarget.teacherId]);
                          return next;
                        });
                        setSubAssignments(prev => new Set([...prev, conflictTarget.roomId]));
                      }
                    } finally {
                      setConflictSaving(false);
                      setConflictTarget(null);
                    }
                  }}
                >
                  <span className="text-lg">🟡</span>
                  <div>
                    <div className="text-[11px] font-black text-yellow-400">Add as Sub</div>
                    <div className="text-[10px] text-[#909098]">One-time override for {selectedDate} only. Does not change their master schedule.</div>
                  </div>
                </button>

                {/* Update Master Availability */}
                <button
                  className="flex w-full items-center gap-3 rounded-xl border border-[rgba(0,255,136,0.2)] bg-[rgba(0,255,136,0.05)] px-4 py-3 text-left transition-all hover:bg-[rgba(0,255,136,0.1)]"
                  onClick={() => {
                    window.open(`/teachers/${conflictTarget.teacherId}?tab=availability`, "_blank");
                    setConflictTarget(null);
                  }}
                >
                  <span className="text-lg">📅</span>
                  <div>
                    <div className="text-[11px] font-black text-[var(--z-accent)]">Update Master Availability</div>
                    <div className="text-[10px] text-[#909098]">Opens teacher profile in a new tab to add this day permanently.</div>
                  </div>
                </button>

                {/* Cancel */}
                <button
                  className="w-full rounded-xl px-4 py-2 text-[11px] font-semibold text-[var(--z-muted)] hover:text-white transition-colors"
                  onClick={() => setConflictTarget(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      </div>{/* end main grid row */}
    </div>
  );
}

