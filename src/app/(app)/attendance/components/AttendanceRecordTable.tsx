import type {
  AttendanceRecord,
  AttendanceSession,
} from "@/lib/attendance/types";

const STATUS_COLOR: Record<string, string> = {
  present: "#22c55e",
  tardy: "#facc15",
  absent: "#ef4444",
  no_show: "#f97316",
  excused: "#a78bfa",
  makeup: "#06b6d4",
};

export function AttendanceRecordTable({
  records,
  sessions,
}: {
  records: AttendanceRecord[];
  sessions: AttendanceSession[];
}) {
  const sessionsById = new Map(sessions.map((s) => [s.id, s]));

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        No attendance records in this window.
      </div>
    );
  }

  const rows = [...records].sort((a, b) => {
    const da = sessionsById.get(a.session_id)?.session_date ?? a.created_at;
    const db = sessionsById.get(b.session_id)?.session_date ?? b.created_at;
    if (da !== db) return db.localeCompare(da);
    return b.created_at.localeCompare(a.created_at);
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_10%)]">
          <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Late</th>
            <th className="px-4 py-2">Reason</th>
            <th className="px-4 py-2">Override</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const session = sessionsById.get(r.session_id);
            return (
              <tr key={r.id} className="border-t border-[var(--z-border)]">
                <td className="px-4 py-2 text-[var(--z-fg)]">
                  {session?.session_date ?? r.created_at.slice(0, 10)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color: STATUS_COLOR[r.status] ?? "#94a3b8",
                      backgroundColor: "rgba(255,255,255,0.05)",
                    }}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-[var(--z-muted)]">
                  {r.minutes_late ? `${r.minutes_late}m` : "—"}
                </td>
                <td className="px-4 py-2 text-[var(--z-muted)]">
                  {r.reason_text ?? r.reason_id ?? "—"}
                </td>
                <td className="px-4 py-2 text-[var(--z-muted)] text-xs">
                  {r.override_of ? `→ ${r.override_reason ?? "overridden"}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
