"use client";
import * as React from "react";
import type { Family, ScheduleBlock, Student, Teacher } from "@/lib/types/entities";
import type { ProjectedBlock } from "@/lib/schedule/windowedClient";

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

function getBlockStyle(b: ProjectedBlock) {
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

// ─── Action Sheet ─────────────────────────────────────────────────────────────
function DetailActionSheet({
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
  const isOpen = block.block_type === "open_time" || !block.student_id;
  const [tab, setTab] = React.useState<"actions" | "edit">(isOpen ? "edit" : "actions");
  const [blockType, setBlockType] = React.useState(block.block_type ?? "student_session");
  const [assignedStudentId, setAssignedStudentId] = React.useState(block.student_id ?? "");
  const [assignedTeacherId, setAssignedTeacherId] = React.useState(block.teacher_id ?? "");
  const [isVirtual, setIsVirtual] = React.useState(!!block.is_virtual);
  const [showCancel, setShowCancel] = React.useState(false);
  const [cancelScope, setCancelScope] = React.useState<"single" | "recurring">("single");
  const [cancelReason, setCancelReason] = React.useState("");
  const bs = getBlockStyle(block);
  const isOpen = block.block_type === "open_time" || !block.student_id;

  return (
    <div className="border-t mt-1 rounded-xl overflow-hidden"
      style={{ background: "var(--z-surface)", borderColor: bs.border }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "var(--z-border)" }}>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: bs.border }} />
          <span className="text-xs font-bold text-[var(--z-fg)]">
            {minToLabel(toMin(block.start_time))} – {minToLabel(toMin(block.end_time))}
          </span>
          {bs.label && (
            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
              style={{ background: bs.bg, color: bs.text, border: `1px solid ${bs.border}` }}>
              {bs.label}
            </span>
          )}
        </div>
        <button onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded text-xs text-[var(--z-muted)]"
          style={{ border: "1px solid var(--z-border)" }}>
          ✕
        </button>
      </div>

      {/* Tabs */}
      {!isOpen && (
        <div className="flex border-b" style={{ borderColor: "var(--z-border)" }}>
          {(["actions", "edit"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 text-[10px] font-semibold capitalize"
              style={{
                color: tab === t ? "#c4f036" : "var(--z-muted)",
                borderBottom: tab === t ? "2px solid #c4f036" : "2px solid transparent",
              }}>
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="px-3 py-2.5 space-y-2">
        {error && (
          <div className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[10px] text-red-400">
            {error}
          </div>
        )}

        {tab === "actions" && (
          <>
            {!isOpen && !block.checked_in && (
              <button onClick={onCheckIn} disabled={saving}
                className="w-full rounded-lg py-2.5 text-xs font-bold disabled:opacity-50"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80" }}>
                {saving ? "Saving…" : "✓ Check In"}
              </button>
            )}
            {!isOpen && (
              <button onClick={onCallOut} disabled={saving}
                className="w-full rounded-lg py-2.5 text-xs font-bold disabled:opacity-50"
                style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.35)", color: "#fb923c" }}>
                Call Out
              </button>
            )}
            {!isOpen && !showCancel && (
              <button onClick={() => setShowCancel(true)}
                className="w-full rounded-lg py-2.5 text-xs font-bold"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}>
                Cancel Session
              </button>
            )}
            {showCancel && (
              <div className="space-y-2 rounded-lg border p-2.5"
                style={{ borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.06)" }}>
                <div className="text-[10px] font-semibold text-red-400">Cancel this session?</div>
                <div className="flex gap-2">
                  {(["single", "recurring"] as const).map(s => (
                    <button key={s} onClick={() => setCancelScope(s)}
                      className="flex-1 rounded py-1.5 text-[10px] font-semibold capitalize"
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
                  className="w-full rounded border bg-[var(--z-surface)] px-2 py-1.5 text-[10px] text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none"
                  style={{ borderColor: "var(--z-border)" }} />
                <div className="flex gap-2">
                  <button onClick={() => onCancelSession(cancelScope, cancelReason)} disabled={saving}
                    className="flex-1 rounded py-1.5 text-[10px] font-bold text-red-400 disabled:opacity-50"
                    style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.4)" }}>
                    {saving ? "Cancelling…" : "Confirm Cancel"}
                  </button>
                  <button onClick={() => setShowCancel(false)}
                    className="rounded px-2 py-1.5 text-[10px] text-[var(--z-muted)]"
                    style={{ border: "1px solid var(--z-border)" }}>
                    Back
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "edit" && (
          <div className="space-y-2">
            <div>
              <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Block Type
              </label>
              <select value={blockType}
                onChange={e => setBlockType(e.target.value as ScheduleBlock["block_type"])}
                className="w-full rounded border bg-[var(--z-surface)] px-2 py-1.5 text-xs text-[var(--z-fg)] focus:outline-none"
                style={{ borderColor: "var(--z-border)" }}>
                {BLOCK_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Student
              </label>
              <select value={assignedStudentId} onChange={e => setAssignedStudentId(e.target.value)}
                className="w-full rounded border bg-[var(--z-surface)] px-2 py-1.5 text-xs text-[var(--z-fg)] focus:outline-none"
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
              <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Teacher
              </label>
              <select value={assignedTeacherId} onChange={e => setAssignedTeacherId(e.target.value)}
                className="w-full rounded border bg-[var(--z-surface)] px-2 py-1.5 text-xs text-[var(--z-fg)] focus:outline-none"
                style={{ borderColor: "var(--z-border)" }}>
                <option value="">— Select teacher —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{teacherDisplayName(t)}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => setIsVirtual(!isVirtual)}
              className="flex w-full items-center justify-between rounded border px-2.5 py-2 text-[10px] font-semibold"
              style={{
                borderColor: isVirtual ? "#0284c7" : "var(--z-border)",
                background: isVirtual ? "rgba(14,165,233,0.12)" : "var(--z-surface)",
                color: isVirtual ? "#38bdf8" : "var(--z-muted)",
              }}>
              Virtual
              <div className={`h-3.5 w-7 rounded-full transition-colors ${isVirtual ? "bg-blue-500" : "bg-[var(--z-border)]"}`} />
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
                className="flex flex-1 items-center justify-center rounded-lg py-2.5 text-xs font-bold disabled:opacity-50"
                style={{ background: "#c4f036", color: "#0a0a0c" }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={onClose}
                className="flex items-center justify-center rounded-lg border px-3 py-2.5 text-xs text-[var(--z-muted)]"
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

// ─── Props ────────────────────────────────────────────────────────────────────
type TeacherDetailViewProps = {
  teacher: Teacher;
  dayBlocks: ProjectedBlock[];
  openMinute: number;
  closeMinute: number;
  selectedDate: string;
  isToday: boolean;
  currentMinute: number;
  studentsById: Map<string, Student>;
  familiesById: Map<string, Family>;
  teachers: Teacher[];
  students: Student[];
  locationConfig?: { color: string; border: string; bg: string; textColor: string; accent: string };
  onBack: () => void;
  onPatchBlock: (block: ProjectedBlock, patch: Partial<ScheduleBlock>) => Promise<void>;
  onCheckIn: (block: ProjectedBlock) => Promise<void>;
  onCallOut: (block: ProjectedBlock) => Promise<void>;
  onCancelSession: (block: ProjectedBlock, scope: "single" | "recurring", reason: string) => Promise<void>;
  saving: boolean;
  error: string | null;
  onClearError: () => void;
};

export function TeacherDetailView({
  teacher, dayBlocks, openMinute, closeMinute, selectedDate,
  isToday, currentMinute, studentsById, familiesById, teachers, students,
  locationConfig, onBack, onPatchBlock, onCheckIn, onCallOut, onCancelSession,
  saving, error, onClearError,
}: TeacherDetailViewProps) {
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);

  const tBlocks = React.useMemo(
    () => dayBlocks
      .filter(b => b.teacher_id === teacher.id)
      .sort((a, b) => toMin(a.start_time) - toMin(b.start_time)),
    [dayBlocks, teacher.id],
  );

  const slots = React.useMemo(() => {
    const arr: number[] = [];
    for (let m = openMinute; m < closeMinute; m += 30) arr.push(m);
    return arr;
  }, [openMinute, closeMinute]);

  return (
    <div style={{ background: "var(--z-bg)" }}>
      {/* Back header */}
      <div className="flex items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: locationConfig?.border ?? "var(--z-border)", background: "var(--z-bg)" }}>
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base font-bold"
          style={{ borderColor: "var(--z-border)", color: "var(--z-muted)" }}>
          ←
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
          style={{
            borderColor: locationConfig?.border ?? "var(--z-border)",
            background: locationConfig?.accent ?? "rgba(0,255,136,0.1)",
            color: locationConfig?.textColor ?? "#c4f036",
          }}>
          {teacherInitials(teacher)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-[var(--z-fg)] truncate">{teacherDisplayName(teacher)}</div>
          <div className="text-[10px] text-[var(--z-muted)]">
            {tBlocks.filter(b => b.student_id && b.block_type !== "open_time").length} students
            {" · "}
            {tBlocks.filter(b => !b.student_id || b.block_type === "open_time").length} open
          </div>
        </div>
        <button onClick={onBack}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ border: "1px solid var(--z-border)", color: "var(--z-muted)" }}>
          All
        </button>
      </div>

      {/* Vertical slot list */}
      <div>
        {slots.map(slotMin => {
          const block = tBlocks.find(b => {
            const bStart = toMin(b.start_time);
            const bEnd = toMin(b.end_time);
            return bStart <= slotMin && bEnd > slotMin;
          });

          if (!block) {
            return (
              <div key={slotMin} className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: "var(--z-border)" }}>
                <div className="w-16 shrink-0 text-right text-xs font-medium text-[var(--z-muted)]">
                  {minToLabel(slotMin)}
                </div>
                <div className="flex-1 rounded-lg border py-3 px-3 text-center text-xs font-semibold"
                  style={{
                    borderColor: "rgba(16,185,129,0.3)",
                    borderStyle: "dashed",
                    color: "rgba(16,185,129,0.7)",
                    background: "rgba(16,185,129,0.04)",
                  }}>
                  Open
                </div>
              </div>
            );
          }

          const blockStart = toMin(block.start_time);
          if (blockStart !== slotMin) return null;

          const bs = getBlockStyle(block);
          const student = block.student_id ? studentsById.get(block.student_id) ?? null : null;
          const family = student?.family_id ? familiesById.get(student.family_id) ?? null : null;
          const instr = student ? (student as unknown as Record<string, unknown>).instrument as string | undefined : undefined;
          const blockEnd = toMin(block.end_time);
          const durationMins = blockEnd - blockStart;
          const isSelected = block.id === selectedBlockId || block.source_block_id === selectedBlockId;
          const isNow = isToday && currentMinute >= blockStart && currentMinute < blockEnd;

          return (
            <div key={block.id} className="border-b" style={{ borderColor: "var(--z-border)" }}>
              <button
                onClick={() => setSelectedBlockId(isSelected ? null : (block.source_block_id || block.id))}
                className="w-full text-left"
                style={{ background: isSelected ? bs.bg : "transparent" }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-16 shrink-0 text-right">
                    <div className="text-xs font-semibold text-[var(--z-fg)]">{minToLabel(blockStart)}</div>
                    <div className="text-[9px] text-[var(--z-muted)]">{durationMins}m</div>
                  </div>
                  <div className="flex-1 rounded-lg border px-3 py-2.5"
                    style={{ background: bs.bg, borderColor: bs.border }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        {student ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              {instr && <span className="text-sm">{instrumentEmoji(instr)}</span>}
                              <span className="text-sm font-bold truncate" style={{ color: bs.text }}>
                                {studentFirstName(student)} {String((student as unknown as Record<string, unknown>).last_name ?? "")}
                              </span>
                              {isNow && (
                                <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                                  style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc" }}>NOW</span>
                              )}
                            </div>
                            {family && (
                              <div className="text-[10px] truncate" style={{ color: bs.text, opacity: 0.7 }}>
                                {String((family as unknown as Record<string, unknown>).name ?? "")}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm font-semibold" style={{ color: bs.text }}>
                            {bs.label || "Open"}
                          </span>
                        )}
                      </div>
                      {block.checked_in && (
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>
                          ✓ In
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {isSelected && (
                <div className="px-4 pb-3">
                  <DetailActionSheet
                    block={block}
                    student={student}
                    family={family}
                    teachers={teachers}
                    students={students}
                    onSave={patch => { void onPatchBlock(block, patch); setSelectedBlockId(null); }}
                    onCheckIn={() => { void onCheckIn(block); setSelectedBlockId(null); }}
                    onCallOut={() => { void onCallOut(block); setSelectedBlockId(null); }}
                    onCancelSession={(scope, reason) => { void onCancelSession(block, scope, reason); setSelectedBlockId(null); }}
                    onClose={() => { setSelectedBlockId(null); onClearError(); }}
                    saving={saving}
                    error={error}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
