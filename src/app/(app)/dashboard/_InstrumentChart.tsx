"use client";

import { useDashboardTasks } from "./_useDashboardTasks";

// Instrument accent colors — consistent brand palette
const INSTRUMENT_COLORS: Record<string, string> = {
  piano:    "#7c3aed",
  guitar:   "#00ff88",
  drums:    "#ef4444",
  vocals:   "#ec4899",
  violin:   "#2563eb",
  bass:     "#d97706",
  saxophone:"#f59e0b",
  cello:    "#06b6d4",
  flute:    "#a78bfa",
  trumpet:  "#fb923c",
  trombone: "#84cc16",
  ukulele:  "#38bdf8",
};

function instrumentColor(name: string): string {
  return INSTRUMENT_COLORS[name.toLowerCase()] ?? "#6366f1";
}

export function InstrumentChart() {
  const tasksData = useDashboardTasks();
  const instruments = tasksData ? tasksData.topInstruments : null;

  if (!instruments) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 animate-pulse rounded-xl"
            style={{ background: "#1a1a1c", border: "1px solid rgba(255,255,255,0.05)" }}
          />
        ))}
      </div>
    );
  }

  if (instruments.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--z-muted)" }}>
        No instrument data yet.
      </p>
    );
  }

  const max = instruments[0]?.studentCount ?? 1;
  const total = instruments.reduce((s, i) => s + i.studentCount, 0);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--z-muted)" }}>
        {total} active students across {instruments.length} instrument{instruments.length !== 1 ? "s" : ""}
      </p>

      {instruments.map((row) => {
        const color = instrumentColor(row.instrument);
        const barPct = Math.round((row.studentCount / max) * 100);
        const sharePct = Math.round((row.studentCount / total) * 100);

        return (
          <div key={row.instrument} className="flex items-center gap-3">
            {/* Instrument name */}
            <span
              className="w-20 shrink-0 truncate text-xs font-semibold capitalize"
              style={{ color: "var(--z-fg)" }}
            >
              {row.instrument}
            </span>

            {/* Bar track */}
            <div
              className="relative h-6 flex-1 overflow-hidden rounded-lg"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <div
                className="flex h-full items-center rounded-lg px-2 transition-all duration-700"
                style={{
                  width: `${barPct}%`,
                  background: `linear-gradient(90deg, ${color}55, ${color}99)`,
                  boxShadow: `0 0 12px ${color}44`,
                  minWidth: "2rem",
                }}
              >
                <span
                  className="text-[10px] font-extrabold whitespace-nowrap"
                  style={{ color }}
                >
                  {row.studentCount}
                </span>
              </div>
            </div>

            {/* Share % */}
            <span
              className="w-8 shrink-0 text-right text-[10px] font-bold"
              style={{ color: "var(--z-muted)" }}
            >
              {sharePct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
