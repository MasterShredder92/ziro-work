"use client";

import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";
import { StudioMapCanvas } from "@/components/studio-map/StudioMapCanvas";
import type { ScheduleWindow } from "@/lib/schedule/window";
import { shiftWindowByWeeks } from "@/lib/schedule/window";

type StudioMapClientProps = {
  companyName: string;
  locations: Array<{ id: string; name: string }>;
  initialFocusLocationId: string | null;
  initialWindow: ScheduleWindow;
};

function keyOf(window: ScheduleWindow): string {
  return `${window.start}_${window.end}`;
}

export function StudioMapClient({
  companyName,
  locations,
  initialFocusLocationId,
  initialWindow,
}: StudioMapClientProps) {
  const [window, setWindow] = React.useState<ScheduleWindow>(initialWindow);

  const vanityLine = React.useMemo(() => {
    const n = locations.length;
    return `${n} location${n === 1 ? "" : "s"} · ${window.start} → ${window.end} · 14-day window`;
  }, [locations.length, window.end, window.start]);

  const moveWeeks = React.useCallback((weeks: number) => {
    setWindow((prev) => shiftWindowByWeeks(prev.start, weeks * 2));
  }, []);

  return (
    <PageShell title="Studio Map">
      <PageTransition>
        <div data-tour="studio-map" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[var(--z-fg)]">Studio Map</h1>
              <p className="text-xs text-[var(--z-muted)]">{vanityLine}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => moveWeeks(-1)}
                className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]"
              >
                Prev 2 weeks
              </button>
              <button
                type="button"
                onClick={() => moveWeeks(1)}
                className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]"
              >
                Next 2 weeks
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--z-muted)]">
            <span className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1">
              Window {keyOf(window).replace(/_/g, " → ")}
            </span>
            <Link
              className="rounded-md border border-[var(--z-border)] px-2 py-1 text-[var(--z-accent-color)] hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]"
              href="/schedule"
            >
              Schedule
            </Link>
            <Link
              className="rounded-md border border-[var(--z-border)] px-2 py-1 text-[var(--z-accent-color)] hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]"
              href="/students"
            >
              Students
            </Link>
            <Link
              className="rounded-md border border-[var(--z-border)] px-2 py-1 text-[var(--z-accent-color)] hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]"
              href="/teachers"
            >
              Teachers
            </Link>
            <Link
              className="rounded-md border border-[var(--z-border)] px-2 py-1 text-[var(--z-accent-color)] hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]"
              href="/families"
            >
              Families
            </Link>
            <Link
              className="rounded-md border border-[var(--z-border)] px-2 py-1 text-[var(--z-accent-color)] hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]"
              href="/automation"
            >
              Agents
            </Link>
          </div>

          <StudioMapCanvas
            key={keyOf(window)}
            companyName={companyName}
            vanityLine={vanityLine}
            locations={locations}
            scheduleWindow={window}
            initialFocusLocationId={initialFocusLocationId}
          />
        </div>
      </PageTransition>
    </PageShell>
  );
}
