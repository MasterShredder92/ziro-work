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
  if (/guitar|bass/i.test(instr)) return "🎸";
  if (/piano|keyboard/i.test(instr)) return "🎹";
  if (/drum|perc/i.test(instr)) return "🥁";
  if (/violin|viola|cello|string/i.test(instr)) return "🎻";
  if (/trumpet|horn|brass/i.test(instr)) return "🎺";
  if (/sax|clarinet|flute|wind/i.test(instr)) return "🎷";
  if (/voice|vocal|sing/i.test(instr)) return "🎤";
  return "🎵";
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
  if (block.checked_in) return "✓ Checked In";
  if (block.is_family_callout || block.block_type === "call_out") return "Call Out";
  if (block.is_makeup_session || block.block_type === "makeup_session") return "Makeup";
  if (block.is_virtual || block.block_type === "virtual") return "Virtual";
  if (block.block_type === "first_day") return "First Day";
  if (block.block_type === "last_day") return "Last Day";
  if (block.block_type === "meet_greet") return "Meet & Greet";
  if (block.block_type === "sub") return "Sub";
  if (block.block_type === "teacher_training") return "Training";
  if (block.block_type === "not_bookable") return "Locked";
  if (block.block_type === "open_time" || !block.student_id) return "Open";
  return ""; // student_session: show student name instead
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PX_PER_MINUTE = 2.5; // horizontal pixels per minute
const ROW_HEIGHT = 64;      // px per teacher row
const LABEL_COL_W = 56;     // px for time labels column
const TEACHER_COL_W = 80;   // px for teacher name column

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

// ─── Check-in sheet ───────────────────────────────────────────────────────────
function CheckInSheet({
  block,
  student,
  family,
  onCheckIn,
  onCallOut,
  onClose,
  saving,
  error,
}: {
  block: ProjectedBlock;
  student: Student | null;
  family: Family | null;
  onCheckIn: () => void;
  onCallOut: () => void;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}) {
  const color = getBlockColor(block);
  const label = getBlockLabel(block);
  const instr = student ? (student as unknown as Record<string, unknown>).instrument as string | undefined : undefined;
  const emoji = instr ? instrumentEmoji(instr) : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl border-t p-5 pb-8 animate-in slide-in-from-bottom-4 duration-300"
        style={{ background: "var(--z-surface)", borderColor: "var(--z-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--z-border)]" />

        {/* Block info */}
        <div className="mb-4 flex items-start gap-3">
          <div
            className="h-10 w-1.5 shrink-0 rounded-full"
            style={{ background: color.border }}
          />
          <div className="min-w-0 flex-1">
            {student ? (
              <div className="text-base font-bold text-[var(--z-fg)]">
                {emoji && <span className="mr-1">{emoji}</span>}
                {studentName(student)}
              </div>
            ) : (
              <div className="text-base font-bold text-[var(--z-fg)]">{label || "Block"}</div>
            )}
            <div className="text-xs text-[var(--z-muted)]">
              {minuteToLabel(toMinute(block.start_time))} – {minuteToLabel(toMinute(block.end_time))}
            </div>
            {family && (
              <div className="text-xs text-[var(--z-muted)]">
                {family.primary_contact_name ?? family.name ?? ""}
                {family.primary_phone ? ` · ${family.primary_phone}` : ""}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!block.checked_in && block.student_id && (
            <button
              onClick={onCheckIn}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/20 py-3 text-sm font-bold text-emerald-100 disabled:opacity-50"
            >
              {saving ? (
                <span className="animate-pulse">Saving…</span>
              ) : (
                <>✓ Check In</>
              )}
            </button>
          )}
          {block.checked_in && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-300">
              ✓ Already Checked In
            </div>
          )}
          {!block.checked_in && block.student_id && (
            <button
              onClick={onCallOut}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/60 bg-red-500/10 py-3 text-sm font-semibold text-red-300 disabled:opacity-50"
            >
              Mark Call Out
            </button>
          )}
          <button
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-xl border border-[var(--z-border)] py-3 text-sm text-[var(--z-muted)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [selectedTeacherId, setSelectedTeacherId] = React.useState<string | null>(null);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  // ── Update current time every 30s ──
  React.useEffect(() => {
    const id = setInterval(() => setCurrentMinute(nowMinute()), 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Scroll to current time on mount ──
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
    return withBlocks.length > 0 ? withBlocks : teachers.slice(0, 8);
  }, [teachers, dayTeacherIds]);

  // Filter by selected teacher
  const visibleTeachers = React.useMemo(
    () => selectedTeacherId
      ? teachersForBoard.filter((t) => t.id === selectedTeacherId)
      : teachersForBoard,
    [teachersForBoard, selectedTeacherId],
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

  const selectedBlock = React.useMemo(
    () => dayBlocks.find((b) => b.id === selectedBlockId || b.source_block_id === selectedBlockId) ?? null,
    [dayBlocks, selectedBlockId],
  );

  const totalMinutes = closeMinute - openMinute;
  const timelineWidth = totalMinutes * PX_PER_MINUTE;

  // Time markers every 60 min
  const timeMarkers = React.useMemo(() => {
    const out: number[] = [];
    for (let m = openMinute; m <= closeMinute; m += 60) out.push(m);
    return out;
  }, [openMinute, closeMinute]);

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const nowX = isToday ? (currentMinute - openMinute) * PX_PER_MINUTE : null;

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

  if (isClosed) {
    return (
      <div className="mx-4 my-6 rounded-xl border p-8 text-center"
        style={{ borderColor: locationConfig?.border ?? "var(--z-border)" }}>
        <p className="text-sm font-semibold text-[var(--z-muted)]">Closed on this day</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── Teacher filter pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
        <button
          onClick={() => setSelectedTeacherId(null)}
          className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
          style={{
            borderColor: selectedTeacherId === null
              ? (locationConfig?.border ?? "var(--z-accent)")
              : "var(--z-border)",
            background: selectedTeacherId === null
              ? (locationConfig?.accent ?? "rgba(99,102,241,0.12)")
              : "var(--z-surface)",
            color: selectedTeacherId === null
              ? (locationConfig?.textColor ?? "var(--z-accent)")
              : "var(--z-muted)",
          }}
        >
          All
        </button>
        {teachersForBoard.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTeacherId(t.id === selectedTeacherId ? null : t.id)}
            className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
            style={{
              borderColor: selectedTeacherId === t.id
                ? (locationConfig?.border ?? "var(--z-accent)")
                : "var(--z-border)",
              background: selectedTeacherId === t.id
                ? (locationConfig?.accent ?? "rgba(99,102,241,0.12)")
                : "var(--z-surface)",
              color: selectedTeacherId === t.id
                ? (locationConfig?.textColor ?? "var(--z-accent)")
                : "var(--z-muted)",
            }}
          >
            {teacherInitials(t)}
          </button>
        ))}
      </div>

      {/* ── Horizontal timeline ── */}
      <div className="flex overflow-hidden">
        {/* Teacher name column (sticky left) */}
        <div
          className="shrink-0 border-r"
          style={{ width: TEACHER_COL_W, borderColor: "var(--z-border)" }}
        >
          {/* Header spacer (matches time label row) */}
          <div
            className="border-b"
            style={{ height: 28, borderColor: "var(--z-border)" }}
          />
          {visibleTeachers.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-center border-b px-2"
              style={{ height: ROW_HEIGHT, borderColor: "var(--z-border)" }}
            >
              <div className="text-center">
                <div
                  className="mx-auto mb-0.5 flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold"
                  style={{
                    borderColor: locationConfig?.border ?? "var(--z-border)",
                    background: locationConfig?.accent ?? "var(--z-surface-2)",
                    color: locationConfig?.textColor ?? "var(--z-accent)",
                  }}
                >
                  {teacherInitials(t)}
                </div>
                <div className="max-w-[68px] truncate text-[9px] text-[var(--z-muted)]">
                  {teacherName(t).split(" ")[0]}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable timeline */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-x-auto overflow-y-hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div style={{ width: timelineWidth + LABEL_COL_W, position: "relative" }}>
            {/* Time labels row */}
            <div
              className="relative border-b"
              style={{ height: 28, borderColor: "var(--z-border)" }}
            >
              {timeMarkers.map((m) => (
                <div
                  key={m}
                  className="absolute top-1 text-[9px] text-[var(--z-muted)]"
                  style={{ left: (m - openMinute) * PX_PER_MINUTE }}
                >
                  {minuteToLabel(m)}
                </div>
              ))}
            </div>

            {/* Teacher rows */}
            {visibleTeachers.map((teacher) => {
              const tBlocks = dayBlocks.filter((b) => b.teacher_id === teacher.id);
              return (
                <div
                  key={teacher.id}
                  className="relative border-b"
                  style={{ height: ROW_HEIGHT, borderColor: "var(--z-border)" }}
                >
                  {/* Hour grid lines */}
                  {timeMarkers.map((m) => (
                    <div
                      key={m}
                      className="absolute top-0 bottom-0 border-l border-[var(--z-border)]/20"
                      style={{ left: (m - openMinute) * PX_PER_MINUTE }}
                    />
                  ))}

                  {/* Blocks */}
                  {tBlocks.map((block) => {
                    const startM = toMinute(block.start_time);
                    const endM = toMinute(block.end_time);
                    const left = (startM - openMinute) * PX_PER_MINUTE;
                    const width = Math.max((endM - startM) * PX_PER_MINUTE - 2, 20);
                    const color = getBlockColor(block as ScheduleBlock);
                    const label = getBlockLabel(block as ScheduleBlock);
                    const student = block.student_id ? studentsById.get(block.student_id) : null;
                    const instr = student ? (student as unknown as Record<string, unknown>).instrument as string | undefined : undefined;
                    const emoji = instr ? instrumentEmoji(instr) : "";
                    const isSelected = block.id === selectedBlockId || block.source_block_id === selectedBlockId;

                    return (
                      <button
                        key={block.id}
                        onClick={() => setSelectedBlockId(isSelected ? null : (block.source_block_id || block.id))}
                        className="absolute top-1 bottom-1 overflow-hidden rounded border px-1 py-0.5 text-left transition-all"
                        style={{
                          left,
                          width,
                          backgroundColor: color.bg,
                          borderColor: isSelected ? "#fff" : color.border,
                          color: color.text,
                          outline: isSelected ? `2px solid ${color.border}` : "none",
                          zIndex: isSelected ? 10 : 2,
                        }}
                      >
                        {student ? (
                          <div className="truncate text-[10px] font-bold leading-tight">
                            {emoji && <span className="mr-0.5">{emoji}</span>}
                            {studentName(student)}
                          </div>
                        ) : label ? (
                          <div className="truncate text-[10px] font-semibold leading-tight">{label}</div>
                        ) : null}
                        {width > 50 && (
                          <div className="truncate text-[9px] opacity-80 leading-tight">
                            {minuteToLabel(startM)}
                          </div>
                        )}
                        {block.checked_in && (
                          <div className="text-[8px] font-bold">✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* ── Real-time purple line ── */}
            {nowX !== null && nowX >= 0 && nowX <= timelineWidth && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-20"
                style={{ left: nowX, width: 2, background: "#a855f7" }}
              >
                {/* Top dot */}
                <div
                  className="absolute -top-1 -left-[3px] h-2 w-2 rounded-full"
                  style={{ background: "#a855f7" }}
                />
                {/* Time label */}
                <div
                  className="absolute top-0 left-2 rounded px-1 py-0.5 text-[9px] font-bold text-white"
                  style={{ background: "#a855f7" }}
                >
                  {minuteToLabel(currentMinute)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Auto check-in suggestion banner ── */}
      {isToday && (() => {
        const autoCheckInCandidates = dayBlocks.filter((b) => {
          if (b.checked_in || !b.student_id) return false;
          const startM = toMinute(b.start_time);
          const endM = toMinute(b.end_time);
          // Suggest check-in if within 10 min of start or during the block
          return currentMinute >= startM - 10 && currentMinute < endM;
        });
        if (autoCheckInCandidates.length === 0) return null;
        return (
          <div
            className="mx-4 mt-3 rounded-xl border px-4 py-3"
            style={{ borderColor: "rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.08)" }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold text-purple-300">
                🟣 {autoCheckInCandidates.length} session{autoCheckInCandidates.length !== 1 ? "s" : ""} ready to check in
              </span>
            </div>
            <div className="space-y-1.5">
              {autoCheckInCandidates.slice(0, 4).map((b) => {
                const student = b.student_id ? studentsById.get(b.student_id) : null;
                const teacher = teachers.find((t) => t.id === b.teacher_id);
                return (
                  <div key={b.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="truncate text-xs font-semibold text-[var(--z-fg)]">
                        {student ? studentName(student) : "Student"}
                      </span>
                      {teacher && (
                        <span className="ml-1 text-[10px] text-[var(--z-muted)]">
                          w/ {teacherName(teacher).split(" ")[0]}
                        </span>
                      )}
                      <span className="ml-1 text-[10px] text-[var(--z-muted)]">
                        {minuteToLabel(toMinute(b.start_time))}
                      </span>
                    </div>
                    <button
                      onClick={() => checkIn(b)}
                      disabled={saving}
                      className="shrink-0 rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-100 disabled:opacity-50"
                    >
                      ✓ Check In
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Check-in bottom sheet ── */}
      {selectedBlock && (
        <CheckInSheet
          block={selectedBlock}
          student={selectedBlock.student_id ? (studentsById.get(selectedBlock.student_id) ?? null) : null}
          family={(() => {
            const s = selectedBlock.student_id ? studentsById.get(selectedBlock.student_id) : null;
            return s?.family_id ? (familiesById.get(s.family_id) ?? null) : null;
          })()}
          onCheckIn={() => checkIn(selectedBlock)}
          onCallOut={() => callOut(selectedBlock)}
          onClose={() => { setSelectedBlockId(null); setError(null); }}
          saving={saving}
          error={error}
        />
      )}
    </div>
  );
}
