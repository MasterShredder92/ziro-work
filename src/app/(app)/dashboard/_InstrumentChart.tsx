"use client";

import { useEffect, useState } from "react";
import { useDashboardTasks } from "./_useDashboardTasks";

// Instrument accent colors — consistent brand palette
const INSTRUMENT_COLORS: Record<string, string> = {
  piano:     "#7c3aed",
  guitar:    "#c4f036",
  drums:     "#ef4444",
  vocals:    "#ec4899",
  violin:    "#2563eb",
  bass:      "#d97706",
  saxophone: "#f59e0b",
  cello:     "#06b6d4",
  flute:     "#a78bfa",
  trumpet:   "#fb923c",
  trombone:  "#84cc16",
  ukulele:   "#38bdf8",
};

function instrumentColor(name: string): string {
  return INSTRUMENT_COLORS[name.toLowerCase()] ?? "#6366f1";
}

export function InstrumentChart() {
  const tasksData = useDashboardTasks();
  const instruments = tasksData ? tasksData.topInstruments : null;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (instruments && instruments.length > 0) {
      const t = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(t);
    }
  }, [instruments]);

  if (!instruments) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 rounded-xl"
            style={{
              background: "var(--z-surface)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.6s infinite",
              border: "1px solid var(--z-border)",
            }}
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
    <div className="space-y-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--z-muted)" }}>
        {total} active students · {instruments.length} instrument{instruments.length !== 1 ? "s" : ""}
      </p>

      {instruments.map((row, idx) => {
        const color = instrumentColor(row.instrument);
        const barPct = Math.round((row.studentCount / max) * 100);
        const sharePct = Math.round((row.studentCount / total) * 100);
        const delay = `${idx * 60}ms`;

        return (
          <div key={row.instrument} className="flex items-center gap-3 group">
            {/* Instrument pill */}
            <span
              className="w-20 shrink-0 truncate rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize text-center"
              style={{
                background: `${color}1e`,
                color,
              }}
            >
              {row.instrument}
            </span>

            {/* Bar track */}
            <div
              className="relative h-7 flex-1 overflow-hidden rounded-lg"
              style={{ background: "var(--z-border)" }}
            >
              <div
                className="flex h-full items-center rounded-lg px-2.5"
                style={{
                  width: animated ? `${Math.max(barPct, 8)}%` : "0%",
                  background: `linear-gradient(90deg, ${color}40, ${color}80)`,
                  boxShadow: `0 0 14px ${color}44, inset 0 1px 0 ${color}30`,
                  transition: `width 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}`,
                  minWidth: animated ? "2.5rem" : "0",
                }}
              >
                <span
                  className="text-[11px] font-extrabold whitespace-nowrap"
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
