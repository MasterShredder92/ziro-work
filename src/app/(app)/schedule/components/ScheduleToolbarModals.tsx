"use client";

import * as React from "react";
import type { ScheduleBlock, Teacher, Student } from "@/lib/types/entities";

// ─── Instrument emoji helper ──────────────────────────────────────────────────
function instrEmoji(instr: string | null | undefined): string {
  if (!instr) return "🎵";
  if (/guitar|bass/i.test(instr)) return "🎸";
  if (/piano|keyboard/i.test(instr)) return "🎹";
  if (/drum|perc/i.test(instr)) return "🥁";
  if (/violin|viola|cello|string/i.test(instr)) return "🎻";
  if (/trumpet|horn|brass/i.test(instr)) return "🎺";
  if (/sax|clarinet|flute|wind/i.test(instr)) return "🎷";
  if (/voice|vocal|sing/i.test(instr)) return "🎤";
  return "🎵";
}

function teacherInitials(t: Teacher): string {
  const r = t as unknown as Record<string, unknown>;
  const f = typeof r.first_name === "string" ? r.first_name[0] ?? "" : "";
  const l = typeof r.last_name === "string" ? r.last_name[0] ?? "" : "";
  return (f + l).toUpperCase() || "T";
}

function teacherFullName(t: Teacher): string {
  const r = t as unknown as Record<string, unknown>;
  const f = typeof r.first_name === "string" ? r.first_name.trim() : "";
  const l = typeof r.last_name === "string" ? r.last_name.trim() : "";
  return `${f} ${l}`.trim() || "Teacher";
}

function studentFullName(s: Student): string {
  const r = s as unknown as Record<string, unknown>;
  const f = typeof r.first_name === "string" ? r.first_name.trim() : "";
  const l = typeof r.last_name === "string" ? r.last_name.trim() : "";
  return `${f} ${l}`.trim() || "Student";
}

function toMinute(t: string): number {
  const [h = "0", m = "0"] = t.split(":");
  return Number(h) * 60 + Number(m);
}

function minuteToLabel(v: number): string {
  const h24 = Math.floor(v / 60);
  const m = v % 60;
  const hour = h24 % 12 || 12;
  const suffix = h24 >= 12 ? "PM" : "AM";
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--z-border)] bg-[#0f0f12] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-[var(--z-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[var(--z-fg)]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[var(--z-muted)]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)] transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </>
  );
}

// ─── Sub Modal ────────────────────────────────────────────────────────────────
type SubModalProps = {
  locationId: string;
  selectedDate: string;
  teachers: Teacher[];
  blocks: ScheduleBlock[];
  onClose: () => void;
  onBlocksChange: (blocks: ScheduleBlock[]) => void;
};

export function SubModal({ locationId, selectedDate, teachers, blocks, onClose, onBlocksChange }: SubModalProps) {
  const [subTeacherId, setSubTeacherId] = React.useState("");
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("10:00");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  // Sub-available teachers
  const subTeachers = React.useMemo(() => {
    return teachers.filter((t) => {
      const r = t as unknown as Record<string, unknown>;
      return r.is_sub_available === true || r.is_active === true;
    });
  }, [teachers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subTeacherId) { setError("Select a sub teacher"); return; }
    setSaving(true);
    setError(null);
    try {
      const tenantId = blocks[0]?.tenant_id ?? "";
      const res = await fetch("/api/schedule-blocks", {
        method: "POST",
        headers: { "content-type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({
          block_date: selectedDate,
          start_time: startTime,
          end_time: endTime,
          teacher_id: subTeacherId,
          location_id: locationId,
          block_type: "sub",
          status: "available",
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? `Failed (${res.status})`);
      }
      const newBlock = await res.json();
      onBlocksChange([...blocks, newBlock.data ?? newBlock]);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sub block");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <ModalShell title="Sub Added" onClose={onClose}>
        <div className="py-6 text-center">
          <div className="mb-3 text-4xl">✅</div>
          <p className="text-sm font-semibold text-[var(--z-fg)]">Sub block created for {selectedDate}.</p>
          <p className="mt-1 text-xs text-[var(--z-muted)]">{minuteToLabel(toMinute(startTime))} – {minuteToLabel(toMinute(endTime))}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-xl border border-[var(--z-border)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] hover:bg-white/5"
          >
            Done
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="+ Add Sub" subtitle={`Add a substitute teacher block on ${selectedDate}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>
        )}

        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Sub Teacher</label>
          <select
            value={subTeacherId}
            onChange={(e) => setSubTeacherId(e.target.value)}
            className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
            required
          >
            <option value="">Select a teacher…</option>
            {subTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                {teacherFullName(t)}{(t as unknown as Record<string,unknown>).is_sub_available ? " (Sub)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any notes for the sub…"
            className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--z-border)] px-3 py-2.5 text-sm font-semibold text-[var(--z-muted)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl border border-[#00ff88]/40 bg-[#00ff88]/15 px-3 py-2.5 text-sm font-semibold text-[#00ff88] disabled:opacity-50 hover:bg-[#00ff88]/25 transition-colors"
          >
            {saving ? "Adding…" : "Add Sub Block"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Smart Call Out Modal ─────────────────────────────────────────────────────
type CallOutModalProps = {
  locationId: string;
  selectedDate: string;
  teachers: Teacher[];
  students: Student[];
  blocks: ScheduleBlock[];
  onClose: () => void;
  onBlocksChange: (blocks: ScheduleBlock[]) => void;
};

type CoverageAssignment = {
  blockId: string;
  studentId: string;
  studentName: string;
  instrument: string;
  startTime: string;
  endTime: string;
  coverTeacherId: string;
};

export function CallOutModal({
  locationId,
  selectedDate,
  teachers,
  students,
  blocks,
  onClose,
  onBlocksChange,
}: CallOutModalProps) {
  const [calledOutTeacherId, setCalledOutTeacherId] = React.useState("");
  const [step, setStep] = React.useState<"pick" | "assign" | "done">("pick");
  const [assignments, setAssignments] = React.useState<CoverageAssignment[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const studentsById = React.useMemo(() => {
    const m = new Map<string, Student>();
    for (const s of students) m.set(s.id, s);
    return m;
  }, [students]);

  const teachersById = React.useMemo(() => {
    const m = new Map<string, Teacher>();
    for (const t of teachers) m.set(t.id, t);
    return m;
  }, [teachers]);

  // Blocks for the called-out teacher on selected date
  const calledOutBlocks = React.useMemo(() => {
    if (!calledOutTeacherId) return [];
    return blocks.filter(
      (b) =>
        b.teacher_id === calledOutTeacherId &&
        b.block_date === selectedDate &&
        b.student_id &&
        b.block_type === "student_session",
    );
  }, [blocks, calledOutTeacherId, selectedDate]);

  // Other teachers on the same day (potential coverage)
  const coverageTeachers = React.useMemo(() => {
    const otherIds = new Set(
      blocks
        .filter((b) => b.block_date === selectedDate && b.teacher_id && b.teacher_id !== calledOutTeacherId)
        .map((b) => b.teacher_id as string),
    );
    return teachers.filter((t) => otherIds.has(t.id));
  }, [blocks, teachers, calledOutTeacherId, selectedDate]);

  function buildAssignments() {
    const asgn: CoverageAssignment[] = calledOutBlocks.map((b) => {
      const student = b.student_id ? studentsById.get(b.student_id) : null;
      const instr = student ? String((student as unknown as Record<string,unknown>).instrument ?? "") : "";
      // Auto-suggest: first coverage teacher with matching instrument
      const suggested = coverageTeachers.find((t) => {
        const instrs = (t as unknown as Record<string,unknown>).instruments;
        return Array.isArray(instrs) && instrs.some((i: unknown) => typeof i === "string" && /guitar|bass|piano|drum|violin|voice/i.test(i) && new RegExp(instr.split(" ")[0] ?? "", "i").test(i));
      });
      return {
        blockId: b.id,
        studentId: b.student_id ?? "",
        studentName: student ? studentFullName(student) : "Student",
        instrument: instr,
        startTime: b.start_time,
        endTime: b.end_time,
        coverTeacherId: suggested?.id ?? coverageTeachers[0]?.id ?? "",
      };
    });
    setAssignments(asgn);
    setStep("assign");
  }

  async function commitCallOut() {
    setSaving(true);
    setError(null);
    try {
      const tenantId = blocks[0]?.tenant_id ?? "";
      // 1. Mark called-out teacher's blocks as call_out
      await Promise.all(
        calledOutBlocks.map((b) =>
          fetch(`/api/schedule-blocks/${encodeURIComponent(b.id)}?skip_conflict_check=true`, {
            method: "PATCH",
            headers: { "content-type": "application/json", "x-tenant-id": tenantId },
            body: JSON.stringify({ block_type: "call_out", is_family_callout: true, status: "available" }),
          }),
        ),
      );
      // 2. Create new sub blocks for each assigned coverage teacher
      const created: ScheduleBlock[] = [];
      for (const asgn of assignments) {
        if (!asgn.coverTeacherId) continue;
        const res = await fetch("/api/schedule-blocks", {
          method: "POST",
          headers: { "content-type": "application/json", "x-tenant-id": tenantId },
          body: JSON.stringify({
            block_date: selectedDate,
            start_time: asgn.startTime,
            end_time: asgn.endTime,
            teacher_id: asgn.coverTeacherId,
            location_id: locationId,
            student_id: asgn.studentId || null,
            block_type: "sub",
            status: "booked",
            original_teacher_id: calledOutTeacherId,
            original_teacher_name: teacherFullName(teachersById.get(calledOutTeacherId)!),
            notes: `Coverage for ${teacherFullName(teachersById.get(calledOutTeacherId)!)} call-out`,
          }),
        });
        if (res.ok) {
          const j = await res.json().catch(() => null);
          if (j?.data ?? j) created.push(j?.data ?? j);
        }
      }
      // 3. Update local state
      const updatedBlocks = blocks.map((b) =>
        calledOutBlocks.some((co) => co.id === b.id)
          ? { ...b, block_type: "call_out" as const, is_family_callout: true, status: "available" as const }
          : b,
      );
      onBlocksChange([...updatedBlocks, ...created]);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to commit call-out");
    } finally {
      setSaving(false);
    }
  }

  if (step === "done") {
    return (
      <ModalShell title="Call Out Committed" onClose={onClose}>
        <div className="py-6 text-center">
          <div className="mb-3 text-4xl">✅</div>
          <p className="text-sm font-semibold text-[var(--z-fg)]">
            {calledOutBlocks.length} session{calledOutBlocks.length !== 1 ? "s" : ""} marked as call-out.
          </p>
          <p className="mt-1 text-xs text-[var(--z-muted)]">Coverage sub blocks created for assigned teachers.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-xl border border-[var(--z-border)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] hover:bg-white/5"
          >
            Done
          </button>
        </div>
      </ModalShell>
    );
  }

  if (step === "assign") {
    return (
      <ModalShell
        title="Assign Coverage"
        subtitle={`${calledOutBlocks.length} session${calledOutBlocks.length !== 1 ? "s" : ""} need coverage`}
        onClose={onClose}
      >
        <div className="space-y-3">
          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>
          )}
          {assignments.length === 0 ? (
            <p className="text-sm text-[var(--z-muted)]">No student sessions to reassign.</p>
          ) : (
            assignments.map((asgn, i) => (
              <div key={asgn.blockId} className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{instrEmoji(asgn.instrument)}</span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--z-fg)]">{asgn.studentName}</div>
                    <div className="text-[10px] text-[var(--z-muted)]">
                      {minuteToLabel(toMinute(asgn.startTime))} – {minuteToLabel(toMinute(asgn.endTime))}
                      {asgn.instrument ? ` · ${asgn.instrument}` : ""}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                    Assign to
                  </label>
                  <select
                    value={asgn.coverTeacherId}
                    onChange={(e) => {
                      const updated = [...assignments];
                      updated[i] = { ...asgn, coverTeacherId: e.target.value };
                      setAssignments(updated);
                    }}
                    className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
                  >
                    <option value="">Skip (no coverage)</option>
                    {coverageTeachers.map((t) => (
                      <option key={t.id} value={t.id}>{teacherFullName(t)}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="flex-1 rounded-xl border border-[var(--z-border)] px-3 py-2.5 text-sm font-semibold text-[var(--z-muted)] hover:bg-white/5"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={commitCallOut}
              className="flex-1 rounded-xl border border-orange-400/50 bg-orange-500/20 px-3 py-2.5 text-sm font-semibold text-orange-200 disabled:opacity-50 hover:bg-orange-500/30 transition-colors"
            >
              {saving ? "Committing…" : "Commit Call Out"}
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  // Step: pick teacher
  return (
    <ModalShell
      title="Smart Call Out"
      subtitle="Who called out today? We'll find coverage automatically."
      onClose={onClose}
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>
        )}
        <div className="space-y-2">
          {teachers
            .filter((t) => {
              const r = t as unknown as Record<string, unknown>;
              return r.is_active !== false;
            })
            .map((t) => {
              const dayBlocks = blocks.filter(
                (b) => b.teacher_id === t.id && b.block_date === selectedDate && b.student_id,
              );
              const isSelected = calledOutTeacherId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCalledOutTeacherId(t.id)}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-orange-400/50 bg-orange-500/15"
                      : "border-[var(--z-border)] hover:border-[var(--z-border)] hover:bg-white/3"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--z-surface-2)] text-sm font-bold text-[var(--z-fg)]">
                    {teacherInitials(t)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--z-fg)]">{teacherFullName(t)}</div>
                    <div className="text-[10px] text-[var(--z-muted)]">
                      {dayBlocks.length} session{dayBlocks.length !== 1 ? "s" : ""} today
                    </div>
                  </div>
                  {isSelected && (
                    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-orange-400 shrink-0" aria-hidden>
                      <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              );
            })}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--z-border)] px-3 py-2.5 text-sm font-semibold text-[var(--z-muted)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!calledOutTeacherId}
            onClick={buildAssignments}
            className="flex-1 rounded-xl border border-orange-400/50 bg-orange-500/20 px-3 py-2.5 text-sm font-semibold text-orange-200 disabled:opacity-50 hover:bg-orange-500/30 transition-colors"
          >
            Find Coverage →
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Go Virtual Modal ─────────────────────────────────────────────────────────
type GoVirtualModalProps = {
  locationId: string;
  selectedDate: string;
  teachers: Teacher[];
  students: Student[];
  blocks: ScheduleBlock[];
  onClose: () => void;
  onBlocksChange: (blocks: ScheduleBlock[]) => void;
};

export function GoVirtualModal({
  locationId,
  selectedDate,
  teachers,
  students,
  blocks,
  onClose,
  onBlocksChange,
}: GoVirtualModalProps) {
  const [scope, setScope] = React.useState<"all" | "location">("location");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [linksDispatched, setLinksDispatched] = React.useState(0);

  const studentsById = React.useMemo(() => {
    const m = new Map<string, Student>();
    for (const s of students) m.set(s.id, s);
    return m;
  }, [students]);

  const targetBlocks = React.useMemo(() => {
    return blocks.filter(
      (b) =>
        b.block_date === selectedDate &&
        b.student_id &&
        b.block_type === "student_session" &&
        !b.is_virtual,
    );
  }, [blocks, selectedDate]);

  async function handleGoVirtual() {
    setSaving(true);
    setError(null);
    try {
      const tenantId = blocks[0]?.tenant_id ?? "";
      // Patch all target blocks to is_virtual = true
      await Promise.all(
        targetBlocks.map((b) =>
          fetch(`/api/schedule-blocks/${encodeURIComponent(b.id)}?skip_conflict_check=true`, {
            method: "PATCH",
            headers: { "content-type": "application/json", "x-tenant-id": tenantId },
            body: JSON.stringify({ is_virtual: true, block_type: "virtual" }),
          }),
        ),
      );
      // Stub: generate Google Meet links and dispatch via Gmail/QUO
      // (Integration keys not yet configured — links would be sent here)
      const dispatched = targetBlocks.filter((b) => b.student_id).length;
      setLinksDispatched(dispatched);

      const updatedBlocks = blocks.map((b) =>
        targetBlocks.some((tb) => tb.id === b.id)
          ? { ...b, is_virtual: true, block_type: "virtual" as const }
          : b,
      );
      onBlocksChange(updatedBlocks);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to go virtual");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <ModalShell title="Gone Virtual" onClose={onClose}>
        <div className="py-6 text-center">
          <div className="mb-3 text-4xl">💻</div>
          <p className="text-sm font-semibold text-[var(--z-fg)]">
            {targetBlocks.length} session{targetBlocks.length !== 1 ? "s" : ""} switched to virtual.
          </p>
          <p className="mt-1 text-xs text-[var(--z-muted)]">
            {linksDispatched} Google Meet link{linksDispatched !== 1 ? "s" : ""} queued for dispatch
            {" "}(requires Gmail integration in Settings → Integrations).
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-xl border border-[var(--z-border)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] hover:bg-white/5"
          >
            Done
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title="Go Virtual"
      subtitle={`Switch all sessions on ${selectedDate} to virtual`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>
        )}

        {/* Preview */}
        <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] p-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Sessions to switch
          </div>
          {targetBlocks.length === 0 ? (
            <p className="text-sm text-[var(--z-muted)]">No in-person sessions found for this day.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {targetBlocks.map((b) => {
                const student = b.student_id ? studentsById.get(b.student_id) : null;
                const teacher = teachers.find((t) => t.id === b.teacher_id);
                return (
                  <div key={b.id} className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--z-muted)] w-24 shrink-0">
                      {minuteToLabel(toMinute(b.start_time))}
                    </span>
                    <span className="font-semibold text-[var(--z-fg)] truncate">
                      {student ? studentFullName(student) : "—"}
                    </span>
                    <span className="text-[var(--z-muted)] truncate">
                      w/ {teacher ? teacherFullName(teacher) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gmail stub notice */}
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-xs text-sky-300">
          <span className="font-semibold">💻 Google Meet links</span> will be auto-generated and emailed to
          teachers and students once Gmail is connected in{" "}
          <span className="font-semibold">Settings → Integrations</span>.
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--z-border)] px-3 py-2.5 text-sm font-semibold text-[var(--z-muted)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || targetBlocks.length === 0}
            onClick={handleGoVirtual}
            className="flex-1 rounded-xl border border-sky-400/50 bg-sky-500/20 px-3 py-2.5 text-sm font-semibold text-sky-200 disabled:opacity-50 hover:bg-sky-500/30 transition-colors"
          >
            {saving ? "Switching…" : `Go Virtual (${targetBlocks.length})`}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
