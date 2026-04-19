import type { AttendanceKpis } from "@/lib/attendance/types";

export function AttendanceKpiCards({
  kpis,
  title,
}: {
  kpis: AttendanceKpis;
  title?: string;
}) {
  const cards = [
    {
      label: "Attendance rate",
      value: `${kpis.attendanceRate}%`,
      accent: "#00ffd0",
    },
    {
      label: "Punctuality",
      value: `${kpis.punctualityRate}%`,
      accent: "#60a5fa",
    },
    {
      label: "Present",
      value: kpis.presentCount,
      accent: "#22c55e",
    },
    {
      label: "Tardy",
      value: kpis.tardyCount,
      accent: "#facc15",
    },
    {
      label: "Absent",
      value: kpis.absentCount,
      accent: "#ef4444",
    },
    {
      label: "No-show",
      value: kpis.noShowCount,
      accent: "#f97316",
    },
    {
      label: "Excused",
      value: kpis.excusedCount,
      accent: "#a78bfa",
    },
    {
      label: "Make-up",
      value: kpis.makeupCount,
      accent: "#06b6d4",
    },
  ];

  return (
    <div className="space-y-3">
      {title ? (
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          {title}
        </div>
      ) : null}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-3"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              {c.label}
            </div>
            <div
              className="mt-1 text-lg font-semibold"
              style={{ color: c.accent }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
