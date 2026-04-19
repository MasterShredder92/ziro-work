import type { LocationDashboardData } from "@/lib/locations/types";

interface LocationDetailProps {
  data: LocationDashboardData;
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-[var(--z-fg)]">
          {value}
        </span>
        {suffix ? (
          <span className="text-xs text-[var(--z-muted)]">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

export function LocationDetail({ data }: LocationDetailProps) {
  const { location, kpis, scheduleSummary } = data;
  const addressLine = [
    location.address,
    location.city,
    location.state,
    location.zip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Location dashboard
        </p>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
          {location.name}
        </h1>
        <p className="text-sm text-[var(--z-muted)]">{addressLine || "—"}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Teachers" value={kpis.totalTeachers} suffix="active" />
        <Stat label="Students" value={kpis.totalStudents} suffix="in window" />
        <Stat label="Rooms" value={kpis.activeRooms} suffix={`of ${kpis.totalRooms}`} />
        <Stat
          label="Weekly load"
          value={kpis.weeklyScheduleLoadHours}
          suffix="hrs"
        />
        <Stat
          label="Avg util."
          value={`${kpis.averageRoomUtilizationPct}%`}
        />
        <Stat label="Conflicts" value={kpis.conflicts} suffix="flagged" />
      </div>

      <section className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
        <header className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">
            Schedule summary
          </h2>
          <span className="text-xs text-[var(--z-muted)]">
            {scheduleSummary.range.start} → {scheduleSummary.range.end}
          </span>
        </header>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-[var(--z-muted)]">Blocks</dt>
            <dd className="font-medium text-[var(--z-fg)]">
              {scheduleSummary.totalBlocks}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--z-muted)]">Teachers</dt>
            <dd className="font-medium text-[var(--z-fg)]">
              {scheduleSummary.uniqueTeacherCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--z-muted)]">Students</dt>
            <dd className="font-medium text-[var(--z-fg)]">
              {scheduleSummary.uniqueStudentCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--z-muted)]">Weekly hours</dt>
            <dd className="font-medium text-[var(--z-fg)]">
              {scheduleSummary.weeklyHours}
            </dd>
          </div>
        </dl>
      </section>
    </section>
  );
}
