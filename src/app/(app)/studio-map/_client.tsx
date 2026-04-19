"use client";

import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";
import { StudioMapZoom } from "@/components/studio-map/StudioMapZoom";
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
  const stats = [
    { label: "Locations", value: locations.length },
    totalTeachers ? { label: "Teachers", value: totalTeachers } : null,
    totalStudents ? { label: "Students", value: totalStudents } : null,
    monthlyRevenue ? { label: "Monthly", value: `$${(monthlyRevenue / 1000).toFixed(0)}K` } : null,
  ].filter(Boolean) as { label: string; value: string | number }[];

  return (
    <PageShell title="Studio Map">
      <PageTransition>
        <div data-tour="studio-map" className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[var(--z-fg)]">Studio Map</h1>
              <p className="text-xs text-[var(--z-muted)] mt-0.5">
                Your organization at a glance — click a location to explore
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

          {/* Zoom map */}
          <StudioMapZoom
            companyName={companyName}
            locations={locations}
            scheduleWindow={initialWindow}
            initialFocusLocationId={initialFocusLocationId}
          />
        </div>
      </PageTransition>
    </PageShell>
  );
}
