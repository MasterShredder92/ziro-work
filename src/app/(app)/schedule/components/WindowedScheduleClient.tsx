/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Family, ScheduleBlock, Student, Teacher } from "@/lib/types/entities";
import type { TeacherAvailabilityRow } from "@/lib/schedule/windowedData";
import { shiftWindowByWeeks, type ScheduleWindow } from "@/lib/schedule/window";
import type { ScheduleRoom } from "@/lib/schedule/types";
import {
  computeOpenSlotsForWindow,
  type ProjectedBlock,
  projectBlocksForWindow,
} from "@/lib/schedule/windowedClient";

type WindowPayload = {
  blocks: ScheduleBlock[];
};

type BlockTypeOption = {
  value: ScheduleBlock["block_type"];
  label: string;
};

const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  { value: "student_session", label: "Private Session" },
  { value: "makeup_session", label: "Makeup Session" },
  { value: "meet_greet", label: "Meet & Greet" },
  { value: "teacher_training", label: "Teacher Training" },
  { value: "open_time", label: "Open Time" },
  { value: "sub", label: "Sub Coverage" },
  { value: "call_out", label: "Call Out" },
  { value: "virtual", label: "Virtual Session" },
  { value: "first_day", label: "First Day" },
  { value: "last_day", label: "Last Day" },
  { value: "not_bookable", label: "Not Bookable" },
];

type Props = {
  locationId: string;
  locationLabel: string;
  locations?: Array<{ id: string; name: string }>;
  initialWindow: ScheduleWindow;
  initialBlocks: ScheduleBlock[];
  teachers: Teacher[];
  students: Student[];
  families: Family[];
  availability: TeacherAvailabilityRow[];
  rooms?: ScheduleRoom[];
};

function keyOf(window: ScheduleWindow): string {
  return `${window.start}_${window.end}`;
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function dayName(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

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

function dayOfWeekToIndex(value: string): number {
  switch (value) {
    case "sunday":
      return 0;
    case "monday":
      return 1;
    case "tuesday":
      return 2;
    case "wednesday":
      return 3;
    case "thursday":
      return 4;
    case "friday":
      return 5;
    case "saturday":
      return 6;
    default: {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : -1;
    }
  }
}

function teacherName(teacher: Teacher): string {
  const t = teacher as unknown as Record<string, unknown>;
  const explicit = typeof t.name === "string" ? t.name.trim() : "";
  if (explicit) return explicit;
  const first = typeof t.first_name === "string" ? t.first_name.trim() : "";
  const last = typeof t.last_name === "string" ? t.last_name.trim() : "";
  return `${first} ${last}`.trim() || "Teacher";
}

function safeTeacherName(teacher: Teacher | undefined): string {
  if (!teacher) return "Unknown teacher";
  return teacherName(teacher);
}

function studentName(student: Student): string {
  const s = student as unknown as Record<string, unknown>;
  const explicit = typeof s.name === "string" ? s.name.trim() : "";
  if (explicit) return explicit;
  const first = typeof s.first_name === "string" ? s.first_name.trim() : "";
  const last = typeof s.last_name === "string" ? s.last_name.trim() : "";
  return `${first} ${last}`.trim() || "Student";
}

function blockEmoji(block: ScheduleBlock): string {
  if (block.checked_in) return "✅";
  if (block.is_virtual || block.block_type === "virtual") return "💻";
  if (block.block_type === "call_out" || block.is_family_callout) return "📵";
  if (block.block_type === "sub") return "🛟";
  if (block.block_type === "makeup_session" || block.is_makeup_session) return "🔁";
  if (block.block_type === "meet_greet") return "🤝";
  if (block.block_type === "teacher_training") return "🎯";
  if (block.block_type === "open_time") return "🟢";
  if (block.status === "booked") return "🎵";
  return "🕒";
}

function blockCardClass(block: ScheduleBlock): string {
  if (block.block_type === "call_out" || block.is_family_callout) {
    return "bg-orange-500/30 border-orange-300/70 text-orange-100";
  }
  if (block.block_type === "sub") {
    return "bg-violet-500/30 border-violet-300/70 text-violet-100";
  }
  if (block.is_makeup_session || block.block_type === "makeup_session") {
    return "bg-cyan-500/30 border-cyan-300/70 text-cyan-100";
  }
  if (block.is_virtual || block.block_type === "virtual") {
    return "bg-sky-500/30 border-sky-300/70 text-sky-100";
  }
  if (!block.student_id || block.block_type === "open_time") {
    return "bg-emerald-500/20 border-emerald-300/60 text-emerald-100";
  }
  if (block.checked_in) {
    return "bg-emerald-400/30 border-emerald-200/80 text-emerald-50";
  }
  return "bg-yellow-300 border-yellow-100 text-black";
}

function familyDisplayName(family: Family | undefined): string {
  if (!family) return "Family";
  const name = family.name?.trim();
  if (name) return name;
  const primary = family.primary_contact_name?.trim();
  if (primary) return primary;
  const parent = family.parent_name?.trim();
  if (parent) return parent;
  return "Family";
}

export function WindowedScheduleClient({
  locationId,
  locationLabel,
  locations = [],
  initialWindow,
  initialBlocks,
  teachers,
  students,
  families,
  availability,
  rooms = [],
}: Props) {
  const router = useRouter();
  const [window, setWindow] = React.useState<ScheduleWindow>(initialWindow);
  const [selectedDate, setSelectedDate] = React.useState(initialWindow.start);
  const [blocksByWindow, setBlocksByWindow] = React.useState<Record<string, ScheduleBlock[]>>({
    [keyOf(initialWindow)]: initialBlocks,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [sessionType, setSessionType] = React.useState<ScheduleBlock["block_type"]>("student_session");
  const [roomIdDraft, setRoomIdDraft] = React.useState<string>("");
  const [isVirtualDraft, setIsVirtualDraft] = React.useState(false);

  const teacherIds = React.useMemo(() => teachers.map((t) => t.id), [teachers]);

  React.useEffect(() => {
    const key = keyOf(window);
    if (blocksByWindow[key]) return;

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void fetch(
      `/api/schedule/blocks?locationId=${encodeURIComponent(locationId)}&start=${window.start}&end=${window.end}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load blocks (${res.status})`);
        return (await res.json()) as WindowPayload;
      })
      .then((payload) => {
        if (cancelled) return;
        setBlocksByWindow((prev) => ({ ...prev, [key]: payload.blocks ?? [] }));
      })
      .catch((err) => {
        if (cancelled || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load window");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [window, blocksByWindow, locationId]);

  const currentBlocks = blocksByWindow[keyOf(window)] ?? [];

  const projected = React.useMemo(
    () => projectBlocksForWindow(currentBlocks, window.start, window.end),
    [currentBlocks, window.start, window.end],
  );

  const openSlots = React.useMemo(
    () =>
      computeOpenSlotsForWindow({
        teacherIds,
        availability,
        projectedBlocks: projected,
        start: window.start,
        end: window.end,
      }),
    [teacherIds, availability, projected, window.start, window.end],
  );

  const moveWeeks = React.useCallback((weeks: number) => {
    setWindow((prev) => shiftWindowByWeeks(prev.start, weeks * 2));
  }, []);

  const assignedBlockCount = React.useMemo(
    () => projected.filter((b) => Boolean(b.student_id)).length,
    [projected],
  );

  const studentNames = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const student of students) {
      map.set(student.id, studentName(student));
    }
    return map;
  }, [students]);

  const studentsById = React.useMemo(() => {
    const map = new Map<string, Student>();
    for (const student of students) map.set(student.id, student);
    return map;
  }, [students]);

  const familiesById = React.useMemo(() => {
    const map = new Map<string, Family>();
    for (const family of families) map.set(family.id, family);
    return map;
  }, [families]);

  const familyByStudentId = React.useMemo(() => {
    const map = new Map<string, Family>();
    for (const student of students) {
      if (!student.family_id) continue;
      const family = familiesById.get(student.family_id);
      if (family) map.set(student.id, family);
    }
    return map;
  }, [students, familiesById]);

  const dayBlocks = React.useMemo(
    () => projected.filter((block) => block.block_date === selectedDate),
    [projected, selectedDate],
  );

  const dayTeacherIds = React.useMemo(
    () => Array.from(new Set(dayBlocks.map((block) => block.teacher_id).filter(Boolean) as string[])),
    [dayBlocks],
  );

  const teachersForBoard = React.useMemo(() => {
    const mapped = teachers
      .filter((teacher) => dayTeacherIds.includes(teacher.id))
      .sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
    return mapped.length > 0 ? mapped : teachers.slice(0, 10);
  }, [teachers, dayTeacherIds]);

  const teacherBlocks = React.useMemo(() => {
    const map = new Map<string, ScheduleBlock[]>();
    for (const teacher of teachersForBoard) {
      map.set(teacher.id, []);
    }
    for (const block of dayBlocks) {
      if (!block.teacher_id) continue;
      const list = map.get(block.teacher_id) ?? [];
      list.push(block);
      map.set(block.teacher_id, list);
    }
    for (const entry of map.values()) {
      entry.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [dayBlocks, teachersForBoard]);

  const teachersById = React.useMemo(() => {
    const map = new Map<string, Teacher>();
    for (const teacher of teachers) map.set(teacher.id, teacher);
    return map;
  }, [teachers]);

  const roomsById = React.useMemo(() => {
    const map = new Map<string, ScheduleRoom>();
    for (const room of rooms) map.set(room.id, room);
    return map;
  }, [rooms]);

  const dayAvail = React.useMemo(() => {
    const day = new Date(`${selectedDate}T00:00:00.000Z`).getUTCDay();
    return availability.filter((row) => dayOfWeekToIndex(String(row.day_of_week)) === day);
  }, [availability, selectedDate]);

  const [startMinute, endMinute] = React.useMemo(() => {
    const defaultStart = 9 * 60;
    const defaultEnd = 21 * 60;
    if (dayAvail.length === 0) return [defaultStart, defaultEnd] as const;
    const mins = dayAvail.flatMap((row) => [toMinute(row.start_time), toMinute(row.end_time)]);
    const lo = Math.min(...mins, defaultStart);
    const hi = Math.max(...mins, defaultEnd);
    const boundedLo = Math.max(6 * 60, Math.floor(lo / 30) * 30);
    const boundedHi = Math.min(23 * 60, Math.ceil(hi / 30) * 30);
    return [boundedLo, Math.max(boundedLo + 60, boundedHi)] as const;
  }, [dayAvail]);

  const slots = React.useMemo(() => {
    const out: number[] = [];
    for (let minute = startMinute; minute <= endMinute; minute += 30) out.push(minute);
    return out;
  }, [startMinute, endMinute]);

  const legend = React.useMemo(
    () => [
      { label: "🎵 Assigned", className: "bg-yellow-300 border-yellow-100 text-black" },
      { label: "🟢 Open Time", className: "bg-emerald-500/20 border-emerald-300/60 text-emerald-100" },
      { label: "📵 Call Out", className: "bg-orange-500/30 border-orange-300/70 text-orange-100" },
      { label: "🛟 Sub Coverage", className: "bg-violet-500/30 border-violet-300/70 text-violet-100" },
      { label: "💻 Virtual", className: "bg-sky-500/30 border-sky-300/70 text-sky-100" },
      { label: "✅ Checked In", className: "bg-emerald-400/30 border-emerald-200/80 text-emerald-50" },
    ],
    [],
  );

  const openByTeacher = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const slot of openSlots) {
      if (slot.date !== selectedDate) continue;
      map.set(slot.teacherId, (map.get(slot.teacherId) ?? 0) + 1);
    }
    return map;
  }, [openSlots, selectedDate]);

  const teacherLoadByDate = React.useMemo(() => {
    const load = new Map<string, number>();
    for (const block of dayBlocks) {
      if (!block.teacher_id) continue;
      const countable = Boolean(block.student_id) || block.block_type === "sub" || block.block_type === "makeup_session";
      if (!countable) continue;
      load.set(block.teacher_id, (load.get(block.teacher_id) ?? 0) + 1);
    }
    return load;
  }, [dayBlocks]);

  const selectedBlock = React.useMemo(
    () => dayBlocks.find((block) => block.id === selectedBlockId) ?? null,
    [dayBlocks, selectedBlockId],
  );

  React.useEffect(() => {
    if (!selectedBlock) return;
    setSessionType(selectedBlock.block_type ?? "student_session");
    setRoomIdDraft(selectedBlock.room_id ?? "");
    setIsVirtualDraft(Boolean(selectedBlock.is_virtual));
  }, [selectedBlock?.id]);

  async function patchBlock(
    block: ProjectedBlock,
    patch: Record<string, unknown>,
    options?: { localOnly?: boolean },
  ): Promise<void> {
    const targetId = block.source_block_id || block.id;
    setSaving(true);
    setError(null);
    try {
      if (!options?.localOnly) {
        const response = await fetch(
          `/api/schedule-blocks/${encodeURIComponent(targetId)}?skip_conflict_check=true`,
          {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
              "x-tenant-id": block.tenant_id,
            },
            body: JSON.stringify(patch),
          },
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || `Update failed (${response.status})`);
        }
      }

      const key = keyOf(window);
      setBlocksByWindow((prev) => {
        const rows = [...(prev[key] ?? [])];
        const idx = rows.findIndex((row) => row.id === targetId);
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...(patch as Partial<ScheduleBlock>) };
        }
        return { ...prev, [key]: rows };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update block");
    } finally {
      setSaving(false);
    }
  }

  async function checkInBlock(block: ProjectedBlock): Promise<void> {
    const canLog =
      typeof block.student_id === "string" &&
      block.student_id.trim().length > 0 &&
      typeof block.teacher_id === "string" &&
      block.teacher_id.trim().length > 0;

    if (canLog) {
      const targetId = block.source_block_id || block.id;
      await fetch("/api/session-log", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
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
  }

  async function createSubCoverage(block: ProjectedBlock): Promise<void> {
    function selectCoverageTeacherId(): string {
      const day = new Date(`${block.block_date}T00:00:00.000Z`).getUTCDay();
      const blockStart = toMinute(block.start_time);
      const blockEnd = toMinute(block.end_time);

      function hasOverlap(teacherId: string): boolean {
        return dayBlocks.some((existing) => {
          if (existing.teacher_id !== teacherId) return false;
          if (existing.id === block.id || existing.id === block.source_block_id) return false;
          if (existing.block_type === "open_time" || existing.block_type === "call_out") return false;
          const start = toMinute(existing.start_time);
          const end = toMinute(existing.end_time);
          return start < blockEnd && end > blockStart;
        });
      }

      const candidateIds = teachers
        .filter((teacher) => teacher.id !== block.teacher_id)
        .filter((teacher) =>
          availability.some(
            (row) =>
              row.teacher_id === teacher.id &&
              dayOfWeekToIndex(String(row.day_of_week)) === day &&
              toMinute(row.start_time) <= blockStart &&
              toMinute(row.end_time) >= blockEnd,
          ),
        )
        .map((teacher) => teacher.id)
        .filter((teacherId) => !hasOverlap(teacherId));

      const sorted = candidateIds.sort((a, b) => {
        const loadA = teacherLoadByDate.get(a) ?? 0;
        const loadB = teacherLoadByDate.get(b) ?? 0;
        if (loadA !== loadB) return loadA - loadB;
        return safeTeacherName(teachersById.get(a)).localeCompare(safeTeacherName(teachersById.get(b)));
      });

      return sorted[0] ?? block.teacher_id;
    }

    const coverageTeacherId = selectCoverageTeacherId();
    const coverageTeacherName = safeTeacherName(teachersById.get(coverageTeacherId));

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/schedule-blocks?skip_conflict_check=true", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": block.tenant_id,
        },
        body: JSON.stringify({
          block_date: block.block_date,
          start_time: block.start_time,
          end_time: block.end_time,
          teacher_id: coverageTeacherId,
          location_id: block.location_id,
          student_id: block.student_id,
          room_id: block.room_id,
          block_type: "sub",
          status: block.student_id ? "booked" : "available",
          is_recurring: false,
          is_virtual: false,
          original_teacher_id: block.teacher_id,
          original_teacher_name: safeTeacherName(teachersById.get(block.teacher_id ?? "")),
          notes: `Auto-created sub coverage block (${coverageTeacherName})`,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Failed to create sub (${response.status})`);
      }
      const payload = await response.json().catch(() => null);
      const created = payload?.data as ScheduleBlock | undefined;
      if (created) {
        const key = keyOf(window);
        setBlocksByWindow((prev) => ({ ...prev, [key]: [created, ...(prev[key] ?? [])] }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sub coverage");
    } finally {
      setSaving(false);
    }
  }

  async function callOutBlock(block: ProjectedBlock): Promise<void> {
    await patchBlock(block, {
      status: "available",
      block_type: "call_out",
      is_family_callout: false,
      callout_reason: "Teacher call out",
      checked_in: false,
      teacher_tally: false,
    });
    await createSubCoverage(block);
  }

  async function virtualizeBlock(block: ProjectedBlock): Promise<void> {
    await patchBlock(block, {
      is_virtual: true,
      block_type: "virtual",
      converted_to_virtual_at: new Date().toISOString(),
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Schedule OS
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
              {locationLabel} · {window.start} to {window.end}
            </h1>
            <p className="text-xs text-[var(--z-muted)]">
              Board view with 30-minute blocks, teachers, open slots, call-outs, and quick actions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveWeeks(-1)}
              className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm"
            >
              Prev 2 weeks
            </button>
            <button
              type="button"
              onClick={() => moveWeeks(1)}
              className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm"
            >
              Next 2 weeks
            </button>
          </div>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
            Locations
          </div>
          <div className="flex flex-wrap gap-2">
            {locations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => router.replace(`/schedule?locationId=${encodeURIComponent(location.id)}`)}
                className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                  location.id === locationId
                    ? "border-violet-400/70 bg-violet-500/25 text-violet-100"
                    : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"
                }`}
              >
                {location.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!selectedBlock || saving}
            onClick={() => (selectedBlock ? createSubCoverage(selectedBlock) : null)}
            className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2.5 py-1 text-xs font-semibold"
          >
            + Sub (Auto)
          </button>
          <button
            type="button"
            disabled={!selectedBlock || saving}
            onClick={() => (selectedBlock ? callOutBlock(selectedBlock) : null)}
            className="rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-200"
          >
            Call Out
          </button>
          <button
            type="button"
            disabled={!selectedBlock || saving}
            onClick={() => (selectedBlock ? virtualizeBlock(selectedBlock) : null)}
            className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-200"
          >
            Go Virtual
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="rounded-lg border border-[var(--z-border)] p-3">
          <div className="text-[var(--z-muted)]">Teachers</div>
          <div className="font-semibold">{teachers.length}</div>
        </div>
        <div className="rounded-lg border border-[var(--z-border)] p-3">
          <div className="text-[var(--z-muted)]">Students</div>
          <div className="font-semibold">{students.length}</div>
        </div>
        <div className="rounded-lg border border-[var(--z-border)] p-3">
          <div className="text-[var(--z-muted)]">Assigned blocks</div>
          <div className="font-semibold">{assignedBlockCount}</div>
        </div>
        <div className="rounded-lg border border-[var(--z-border)] p-3">
          <div className="text-[var(--z-muted)]">Open slots</div>
          <div className="font-semibold">{openSlots.length}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {Array.from(new Set(projected.map((block) => block.block_date).filter(isNonEmptyString)))
          .sort()
          .map((date) => (
            <button
              key={date}
              type="button"
              onClick={() => setSelectedDate(date)}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                date === selectedDate
                  ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100"
                  : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"
              }`}
            >
              {dayName(date)}
            </button>
          ))}
      </div>

      {loading ? <p className="text-sm text-[var(--z-muted)]">Loading window…</p> : null}
      {error ? <p className="text-sm text-[var(--z-danger)]">{error}</p> : null}

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
            Legend
          </span>
          {legend.map((item) => (
            <span
              key={item.label}
              className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${item.className}`}
            >
              {item.label}
            </span>
          ))}
        </div>
        <div className="overflow-auto">
          <div
            className="grid min-w-[980px] gap-0.5"
            style={{ gridTemplateColumns: `88px repeat(${teachersForBoard.length}, minmax(150px,1fr))` }}
          >
            <div className="sticky left-0 z-20 bg-[var(--z-surface)] p-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
              Time
            </div>
            {teachersForBoard.map((teacher) => (
              <div
                key={teacher.id}
                className="p-2 text-xs font-semibold text-[var(--z-fg)] border-b border-[var(--z-border)]"
              >
                <div className="truncate">{teacherName(teacher)}</div>
                <div className="text-[10px] text-[var(--z-muted)]">
                  {openByTeacher.get(teacher.id) ?? 0} open slots
                </div>
              </div>
            ))}

            <div className="sticky left-0 z-10 bg-[var(--z-surface)] border-r border-[var(--z-border)]">
              {slots.slice(0, -1).map((minute) => (
                <div
                  key={minute}
                  className="h-12 border-b border-[var(--z-border)] px-2 pt-1 text-[10px] text-[var(--z-muted)]"
                >
                  {minuteToLabel(minute)}
                </div>
              ))}
            </div>

            {teachersForBoard.map((teacher) => {
              const blocks = teacherBlocks.get(teacher.id) ?? [];
              return (
                <div key={teacher.id} className="relative">
                  {slots.slice(0, -1).map((minute) => (
                    <div key={`${teacher.id}-${minute}`} className="h-12 border-b border-[var(--z-border)]/80" />
                  ))}
                  <div className="pointer-events-none absolute inset-0">
                    {blocks.map((block) => {
                      const start = toMinute(block.start_time);
                      const end = toMinute(block.end_time);
                      const offsetSlots = Math.max(0, (start - startMinute) / 30);
                      const durationSlots = Math.max(1, (end - start) / 30);
                      const top = offsetSlots * 48 + 2;
                      const height = durationSlots * 48 - 4;
                      const student = block.student_id ? studentNames.get(block.student_id) : null;
                      const family = block.student_id ? familyByStudentId.get(block.student_id) : null;
                      const familyLabel = family ? familyDisplayName(family) : null;
                      const emoji = blockEmoji(block);
                      return (
                        <div
                          key={block.id}
                          className={`pointer-events-auto absolute left-1 right-1 rounded border px-2 py-1 text-[11px] shadow ${blockCardClass(block)}`}
                          style={{ top, height, minHeight: 28 }}
                          title={`${student ?? "Open"} · ${block.start_time} - ${block.end_time}`}
                          onClick={() => setSelectedBlockId(block.id)}
                        >
                          <div className="truncate font-semibold">
                            {emoji} {student ?? "Open"}
                          </div>
                          {familyLabel ? (
                            <div className="truncate text-[10px] opacity-80">👨‍👩‍👧 {familyLabel}</div>
                          ) : null}
                          <div className="truncate text-[10px] opacity-80">
                            {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedBlock ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setSelectedBlockId(null)}
            aria-label="Close session details"
          />
          <div className="relative z-10 w-full max-w-xl rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
                  Lesson Details
                </div>
                <div className="text-lg font-semibold text-[var(--z-fg)]">
                  {selectedBlock.student_id ? studentNames.get(selectedBlock.student_id) ?? "Student" : "Open block"}
                </div>
                <div className="text-xs text-[var(--z-muted)]">
                  {safeTeacherName(teachersById.get(selectedBlock.teacher_id ?? ""))} · {selectedBlock.block_date} ·{" "}
                  {selectedBlock.start_time.slice(0, 5)}-{selectedBlock.end_time.slice(0, 5)}
                </div>
                {selectedBlock.student_id && familyByStudentId.get(selectedBlock.student_id) ? (
                  <div className="mt-1 text-xs text-[var(--z-muted)]">
                    Family: {familyDisplayName(familyByStudentId.get(selectedBlock.student_id))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelectedBlockId(null)}
                className="rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs">
                <span className="mb-1 block text-[var(--z-muted)]">Session type</span>
                <select
                  value={sessionType}
                  onChange={(event) => setSessionType(event.target.value as ScheduleBlock["block_type"])}
                  className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm"
                >
                  {BLOCK_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs">
                <span className="mb-1 block text-[var(--z-muted)]">Room</span>
                <select
                  value={roomIdDraft}
                  onChange={(event) => setRoomIdDraft(event.target.value)}
                  className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm"
                >
                  <option value="">No room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                {roomIdDraft && roomsById.get(roomIdDraft) ? (
                  <span className="mt-1 block text-[10px] text-[var(--z-muted)]">
                    {roomsById.get(roomIdDraft)?.name}
                  </span>
                ) : null}
              </label>

              <button
                type="button"
                onClick={() => setIsVirtualDraft((value) => !value)}
                className={`w-full rounded-md border px-3 py-2 text-sm font-semibold ${
                  isVirtualDraft
                    ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
                    : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)]"
                }`}
              >
                {isVirtualDraft ? "Virtual Session Enabled" : "Make Virtual (Google Meet)"}
              </button>

              <div className="grid grid-cols-1 gap-2 text-xs">
                {selectedBlock.student_id ? (
                  <Link
                    href={`/crm/students/${selectedBlock.student_id}`}
                    className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-[var(--z-fg)] hover:bg-white/5"
                  >
                    Open student profile
                  </Link>
                ) : null}
                {selectedBlock.student_id &&
                (() => {
                  const student = studentsById.get(selectedBlock.student_id!);
                  const familyId = (student as unknown as Record<string, unknown> | undefined)?.family_id;
                  const family =
                    typeof familyId === "string" && familyId.trim()
                      ? familiesById.get(familyId)
                      : undefined;
                  return typeof familyId === "string" && familyId.trim() ? (
                    <div className="space-y-1">
                      <Link
                        href={`/crm/families/${familyId}`}
                        className="block rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-[var(--z-fg)] hover:bg-white/5"
                      >
                        Open family account
                      </Link>
                      {family ? (
                        <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-[11px] text-[var(--z-muted)]">
                          <div className="font-semibold text-[var(--z-fg)]">
                            {familyDisplayName(family)}
                          </div>
                          <div>{family.primary_contact_name ?? family.parent_name ?? "No primary contact"}</div>
                          <div>{family.primary_email ?? "No email"}</div>
                          <div>{family.primary_phone ?? "No phone"}</div>
                        </div>
                      ) : null}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => checkInBlock(selectedBlock)}
                className="w-full rounded-md border border-emerald-400/60 bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-100"
              >
                {saving ? "Saving..." : "Check In"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  patchBlock(selectedBlock, {
                    block_type: sessionType,
                    status: sessionType === "open_time" || sessionType === "sub" || sessionType === "call_out" ? "available" : "booked",
                    room_id: roomIdDraft || null,
                    is_virtual: isVirtualDraft,
                  })
                }
                className="w-full rounded-md border border-yellow-300/70 bg-yellow-400 px-3 py-2 text-sm font-semibold text-black"
              >
                Update Appointment
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  callOutBlock(selectedBlock)
                }
                className="w-full rounded-md border border-red-400/60 bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-200"
              >
                Cancel Session
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
