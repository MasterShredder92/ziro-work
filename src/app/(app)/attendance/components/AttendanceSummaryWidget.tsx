import Link from "next/link";
import type { AttendanceSummary } from "@/lib/attendance/types";

const RISK_COLOR: Record<string, string> = {
  none: "#94a3b8",
  low: "#22c55e",
  moderate: "#facc15",
  high: "#f97316",
  critical: "#ef4444",
};

/**
 * Compact, read-only attendance summary. Safe to embed in any surface:
 * - Student profile
 * - Progress surface
 * - Family + Student portals
 */
export function AttendanceSummaryWidget({
  summary,
  studentId,
  detailHref,
  className,
}: {
  summary: AttendanceSummary;
  studentId?: string;
  detailHref?: string;
  className?: string;
}) {
  const href = detailHref ?? (studentId ? `/attendance/${studentId}` : null);
  const riskColor = RISK_COLOR[summary.riskLevel] ?? RISK_COLOR.none;

  return (
    <div
      className={`rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Attendance
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: `${riskColor}22`,
            color: riskColor,
          }}
        >
          {summary.riskLevel}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] text-[var(--z-muted)] uppercase tracking-wider">
            Rate
          </div>
          <div className="text-xl font-semibold text-[var(--z-fg)]">
            {summary.kpis.attendanceRate}%
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--z-muted)] uppercase tracking-wider">
            Punctual
          </div>
          <div className="text-xl font-semibold text-[var(--z-fg)]">
            {summary.kpis.punctualityRate}%
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--z-muted)] uppercase tracking-wider">
            Streak
          </div>
          <div className="text-xl font-semibold text-[var(--z-fg)]">
            {summary.currentAbsentStreak > 0
              ? `-${summary.currentAbsentStreak}`
              : summary.currentPresentStreak > 0
                ? `+${summary.currentPresentStreak}`
                : "—"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {summary.flags.length === 0 ? (
          <div className="text-xs text-[var(--z-muted)]">No flags</div>
        ) : (
          summary.flags.map((f) => (
            <span
              key={f}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-[var(--z-muted)] border border-[var(--z-border)]"
            >
              {f.replaceAll("_", " ")}
            </span>
          ))
        )}
      </div>

      {href ? (
        <Link
          href={href}
          className="inline-block text-xs font-semibold text-[#00ffd0] hover:underline"
        >
          View attendance →
        </Link>
      ) : null}
    </div>
  );
}
