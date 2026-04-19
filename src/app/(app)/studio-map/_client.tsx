"use client";

import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";
import { StudioMapCanvas } from "@/components/studio-map/StudioMapCanvas";
import type { ScheduleWindow } from "@/lib/schedule/window";

type StudioMapClientProps = {
  companyName: string;
  locations: Array<{ id: string; name: string }>;
  initialFocusLocationId: string | null;
  initialWindow: ScheduleWindow;
  totalStudents?: number;
  totalTeachers?: number;
  monthlyRevenue?: number;
};

export function StudioMapClient({
  companyName,
  locations,
  initialFocusLocationId,
  initialWindow,
  totalStudents,
  totalTeachers,
  monthlyRevenue,
}: StudioMapClientProps) {
  const vanityLine = React.useMemo(() => {
    const parts: string[] = [];
    parts.push(`${locations.length} location${locations.length === 1 ? "" : "s"}`);
    if (totalTeachers) parts.push(`${totalTeachers} teachers`);
    if (totalStudents) parts.push(`${totalStudents} students`);
    if (monthlyRevenue) parts.push(`$${(monthlyRevenue / 1000).toFixed(0)}K/mo`);
    return parts.join(" · ");
  }, [locations.length, totalStudents, totalTeachers, monthlyRevenue]);

  const stats = [
    { label: "Locations", value: locations.length },
    totalTeachers ? { label: "Teachers", value: totalTeachers } : null,
    totalStudents ? { label: "Students", value: totalStudents } : null,
    monthlyRevenue ? { label: "Monthly", value: `$${(monthlyRevenue / 1000).toFixed(0)}K` } : null,
  ].filter(Boolean) as { label: string; value: string | number }[];

  const legendItems = [
    { color: "#f59e0b", glow: "rgba(245,158,11,0.6)", label: "Your studio" },
    { color: "#7C3AED", glow: "rgba(124,58,237,0.5)", label: "Bellevue" },
    { color: "#16A34A", glow: "rgba(22,163,74,0.5)",  label: "Gretna"   },
    { color: "#0EA5E9", glow: "rgba(14,165,233,0.5)", label: "Elkhorn"  },
    { color: "#DC2626", glow: "rgba(220,38,38,0.5)",  label: "Omaha"    },
    { color: "#34d399", glow: "rgba(52,211,153,0.4)", label: "Active student" },
  ];

  return (
    <PageShell title="Studio Map">
      <PageTransition>
        <div data-tour="studio-map" className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[var(--z-fg)]">Studio Map</h1>
              <p className="text-xs text-[var(--z-muted)] mt-0.5">
                Your organization at a glance — click any orb to explore
              </p>
            </div>
            {/* Vanity stats */}
            <div className="flex flex-wrap items-center gap-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-center"
                >
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-[var(--z-muted)]">
                    {stat.label}
                  </p>
                  <p className="text-sm font-bold text-[var(--z-fg)]">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <StudioMapCanvas
            companyName={companyName}
            vanityLine={vanityLine}
            locations={locations}
            scheduleWindow={initialWindow}
            initialFocusLocationId={initialFocusLocationId}
          />

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.65rem] text-[var(--z-muted)]">
            <span className="font-semibold uppercase tracking-[0.1em]">Legend</span>
            {legendItems.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: item.color, boxShadow: `0 0 6px ${item.glow}` }}
                />
                {item.label}
              </span>
            ))}
            <span className="ml-auto opacity-60">Scroll to zoom · drag to pan · click orbs to expand</span>
          </div>
        </div>
      </PageTransition>
    </PageShell>
  );
}
