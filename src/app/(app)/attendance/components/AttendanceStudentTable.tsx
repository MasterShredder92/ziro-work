import Link from "next/link";
import type { AttendanceStudentRow } from "@/lib/attendance/types";

const RISK_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  none: { bg: "rgba(148,163,184,0.1)", fg: "#94a3b8", label: "none" },
  low: { bg: "rgba(34,197,94,0.1)", fg: "#22c55e", label: "low" },
  moderate: { bg: "rgba(250,204,21,0.12)", fg: "#facc15", label: "moderate" },
  high: { bg: "rgba(249,115,22,0.12)", fg: "#f97316", label: "high" },
  critical: { bg: "rgba(239,68,68,0.14)", fg: "#ef4444", label: "critical" },
};

function RiskPill({ level }: { level: string }) {
  const style = RISK_STYLES[level] ?? RISK_STYLES.none;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {style.label}
    </span>
  );
}

export function AttendanceStudentTable({
  rows,
  emptyLabel,
}: {
  rows: AttendanceStudentRow[];
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        {emptyLabel ?? "No students to display."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_10%)]">
          <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
            <th className="px-4 py-2">Student</th>
            <th className="px-4 py-2">Rate</th>
            <th className="px-4 py-2">Punctual</th>
            <th className="px-4 py-2">Present</th>
            <th className="px-4 py-2">Tardy</th>
            <th className="px-4 py-2">Absent</th>
            <th className="px-4 py-2">Streak</th>
            <th className="px-4 py-2">Risk</th>
            <th className="px-4 py-2">Flags</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ student, summary }) => {
            const s = student;
            const name = [s.first_name, s.last_name].filter(Boolean).join(" ");
            return (
              <tr
                key={s.id}
                className="border-t border-[var(--z-border)] hover:bg-white/5"
              >
                <td className="px-4 py-2 text-[var(--z-fg)] font-medium">
                  {name || s.id}
                </td>
                <td className="px-4 py-2 text-[var(--z-fg)]">
                  {summary.kpis.attendanceRate}%
                </td>
                <td className="px-4 py-2 text-[var(--z-fg)]">
                  {summary.kpis.punctualityRate}%
                </td>
                <td className="px-4 py-2 text-[var(--z-muted)]">
                  {summary.kpis.presentCount}
                </td>
                <td className="px-4 py-2 text-[var(--z-muted)]">
                  {summary.kpis.tardyCount}
                </td>
                <td className="px-4 py-2 text-[var(--z-muted)]">
                  {summary.kpis.absentCount}
                </td>
                <td className="px-4 py-2 text-[var(--z-muted)]">
                  {summary.currentAbsentStreak > 0
                    ? `-${summary.currentAbsentStreak}`
                    : summary.currentPresentStreak > 0
                      ? `+${summary.currentPresentStreak}`
                      : "—"}
                </td>
                <td className="px-4 py-2">
                  <RiskPill level={summary.riskLevel} />
                </td>
                <td className="px-4 py-2 text-[11px] text-[var(--z-muted)]">
                  {summary.flags.length === 0
                    ? "—"
                    : summary.flags.slice(0, 3).join(", ")}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/attendance/${s.id}`}
                    className="text-[#00ffd0] hover:underline text-xs font-semibold"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
