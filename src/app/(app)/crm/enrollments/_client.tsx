"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string) {
  return UUID_RE.test(s.trim());
}

export function EnrollmentFilters({
  teachers,
  students,
  currentTeacherId,
  currentStudentId,
  currentStatus,
  currentSort,
  currentDir,
  statuses,
}: {
  teachers: Array<{ id: string; label: string }>;
  students: Array<{ id: string; label: string }>;
  currentTeacherId?: string;
  currentStudentId?: string;
  currentStatus?: string;
  currentSort?: string;
  currentDir?: string;
  statuses: string[];
}) {
  return (
    <form
      className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-3"
      method="get"
    >
      {currentSort ? (
        <input type="hidden" name="sort" value={currentSort} />
      ) : null}
      {currentDir ? (
        <input type="hidden" name="dir" value={currentDir} />
      ) : null}
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]">
        Status
        <select
          name="status"
          defaultValue={currentStatus ?? ""}
          className="h-9 min-w-[140px] rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-2 text-sm text-[var(--z-fg,#f0f0f0)]"
        >
          <option value="">Any</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]">
        Teacher
        <select
          name="teacherId"
          defaultValue={currentTeacherId ?? ""}
          className="h-9 min-w-[200px] rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-2 text-sm text-[var(--z-fg,#f0f0f0)]"
        >
          <option value="">Any</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]">
        Student
        <select
          name="studentId"
          defaultValue={currentStudentId ?? ""}
          className="h-9 min-w-[200px] rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-2 text-sm text-[var(--z-fg,#f0f0f0)]"
        >
          <option value="">Any</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="h-9 rounded-md bg-[var(--z-accent,#c4f036)]/10 px-3 text-sm font-semibold text-[var(--z-accent,#c4f036)] hover:bg-[var(--z-accent,#c4f036)]/20"
      >
        Apply filters
      </button>
    </form>
  );
}

export function EnrollmentRowActions({
  enrollmentId,
  status,
  teacherId,
  teachers,
  statuses,
}: {
  enrollmentId: string;
  status: string;
  teacherId: string;
  teachers: Array<{ id: string; label: string }>;
  statuses: string[];
}) {
  const router = useRouter();
  const statusOptions = statuses.includes(status)
    ? statuses
    : [...statuses, status];
  const [st, setSt] = useState(status);
  const [tid, setTid] = useState(teacherId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/crm/enrollments/${encodeURIComponent(enrollmentId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            status: st,
            teacher_id: tid,
          }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const dirty = st !== status || tid !== teacherId;
  const teacherOptions = teachers.some((t) => t.id === teacherId)
    ? teachers
    : [...teachers, { id: teacherId, label: teacherId }];

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-1">
        <select
          value={st}
          onChange={(e) => setSt(e.target.value)}
          className="max-w-[120px] rounded border border-[var(--z-border,#1c1c1e)] bg-black px-1 py-1 text-[11px] text-[var(--z-fg,#f0f0f0)]"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={tid}
          onChange={(e) => setTid(e.target.value)}
          className="max-w-[140px] rounded border border-[var(--z-border,#1c1c1e)] bg-black px-1 py-1 text-[11px] text-[var(--z-fg,#f0f0f0)]"
        >
          {teacherOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || !dirty}
          onClick={save}
          className="rounded bg-[var(--z-accent,#c4f036)]/15 px-2 py-1 text-[11px] font-semibold text-[var(--z-accent,#c4f036)] disabled:opacity-40"
        >
          {busy ? "…" : "Save"}
        </button>
      </div>
      {err ? <span className="text-[10px] text-red-400">{err}</span> : null}
    </div>
  );
}

export function EnrollmentActions() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!isUuid(studentId)) {
      setErr("Student ID must be a valid UUID.");
      return;
    }
    if (!isUuid(teacherId)) {
      setErr("Teacher ID must be a valid UUID.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/crm/enrollments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studentId: studentId.trim(),
          teacherId: teacherId.trim(),
          startDate: startDate || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErr(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setStudentId("");
      setTeacherId("");
      setStartDate("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mb-6 flex flex-wrap items-end gap-2 rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-3"
    >
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]">
        Student ID
        <input
          required
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="h-9 w-72 rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-3 text-sm text-[var(--z-fg,#f0f0f0)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]">
        Teacher ID
        <input
          required
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="h-9 w-72 rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-3 text-sm text-[var(--z-fg,#f0f0f0)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]">
        Start date
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-9 rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-3 text-sm text-[var(--z-fg,#f0f0f0)]"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="h-9 rounded-md bg-[var(--z-accent,#c4f036)]/10 px-4 text-sm font-semibold text-[var(--z-accent,#c4f036)] hover:bg-[var(--z-accent,#c4f036)]/20 disabled:opacity-50"
      >
        {busy ? "Enrolling…" : "Enroll"}
      </button>
      {err ? <div className="text-xs text-red-400">{err}</div> : null}
    </form>
  );
}
