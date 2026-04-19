"use client";

import { useMemo, useState, useTransition } from "react";
import type { AttendanceStatus } from "@/lib/attendance/types";
import type { Student } from "@/lib/types/entities";
import type {
  AttendanceRecord,
  AttendanceSessionWithRoster,
} from "@/lib/attendance/types";

const STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "Present", color: "#22c55e" },
  { value: "tardy", label: "Tardy", color: "#facc15" },
  { value: "absent", label: "Absent", color: "#ef4444" },
  { value: "no_show", label: "No-show", color: "#f97316" },
  { value: "excused", label: "Excused", color: "#a78bfa" },
  { value: "makeup", label: "Make-up", color: "#06b6d4" },
];

type RosterProps = {
  session: AttendanceSessionWithRoster;
  markedBy?: string | null;
};

function recordFor(
  records: AttendanceRecord[],
  studentId: string,
): AttendanceRecord | null {
  const related = records.filter((r) => r.student_id === studentId);
  const active = related.find((r) => !related.some((o) => o.override_of === r.id));
  return active ?? related[0] ?? null;
}

export function SessionRosterGrid({ session, markedBy }: RosterProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(session.records);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const rosterStudents = useMemo<Student[]>(() => session.students, [session]);

  async function mark(studentId: string, status: AttendanceStatus) {
    setError(null);
    const res = await fetch(`/api/attendance/session/${session.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": session.tenant_id,
      },
      body: JSON.stringify({
        studentId,
        status,
        markedBy: markedBy ?? null,
      }),
    });
    if (!res.ok) {
      setError(`Mark failed (${res.status})`);
      return;
    }
    const json = (await res.json()) as { data: AttendanceRecord };
    setRecords((prev) => {
      const filtered = prev.filter((r) => r.student_id !== studentId);
      return [...filtered, json.data];
    });
  }

  async function bulkMark(status: AttendanceStatus) {
    setError(null);
    const entries = rosterStudents.map((s) => ({
      studentId: s.id,
      status,
      markedBy: markedBy ?? null,
    }));
    const res = await fetch(`/api/attendance/session/${session.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": session.tenant_id,
      },
      body: JSON.stringify({ entries }),
    });
    if (!res.ok) {
      setError(`Bulk mark failed (${res.status})`);
      return;
    }
    const json = (await res.json()) as { data: AttendanceRecord[] };
    setRecords(() => json.data);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[var(--z-muted)] font-semibold uppercase tracking-wider">
          Bulk:
        </span>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => startTransition(() => void bulkMark(s.value))}
            className="px-2 py-1 rounded-md border border-[var(--z-border)] hover:bg-white/5"
            style={{ color: s.color }}
          >
            Mark all {s.label.toLowerCase()}
          </button>
        ))}
        {error ? <span className="ml-2 text-red-400">{error}</span> : null}
        {isPending ? <span className="text-[var(--z-muted)]">…</span> : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_10%)]">
            <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rosterStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-[var(--z-muted)]"
                >
                  No students linked to this session yet.
                </td>
              </tr>
            ) : (
              rosterStudents.map((student) => {
                const current = recordFor(records, student.id);
                const name =
                  [student.first_name, student.last_name]
                    .filter(Boolean)
                    .join(" ") || student.id;
                return (
                  <tr
                    key={student.id}
                    className="border-t border-[var(--z-border)]"
                  >
                    <td className="px-4 py-2 text-[var(--z-fg)] font-medium">
                      {name}
                    </td>
                    <td className="px-4 py-2">
                      {current ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                          style={{
                            color:
                              STATUSES.find((x) => x.value === current.status)
                                ?.color ?? "#94a3b8",
                            backgroundColor: "rgba(255,255,255,0.05)",
                          }}
                        >
                          {current.status}
                        </span>
                      ) : (
                        <span className="text-[var(--z-muted)] text-xs">
                          unmarked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {STATUSES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() =>
                              startTransition(() => void mark(student.id, s.value))
                            }
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border border-[var(--z-border)] hover:bg-white/5"
                            style={{ color: s.color }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
