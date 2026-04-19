"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";

export type AttendanceNavItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
};

export const ATTENDANCE_NAV: AttendanceNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "#overview",
    description: "KPIs & totals",
  },
  {
    id: "students",
    label: "Students",
    href: "#students",
    description: "Roster + summaries",
  },
  {
    id: "at-risk",
    label: "At risk",
    href: "#at-risk",
    description: "Flags & follow-ups",
  },
  {
    id: "sessions",
    label: "Sessions",
    href: "#sessions",
    description: "Upcoming & recent",
  },
];

export function AttendanceSidebar({ tenantLabel }: { tenantLabel: string }) {
  const [active, setActive] = useState("overview");

  return (
    <aside className="md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]">
      <div className="px-5 py-4 border-b border-[var(--z-border)]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Attendance
        </div>
        <div className="mt-1 text-base font-semibold text-[var(--z-fg)] truncate">
          {tenantLabel}
        </div>
      </div>
      <nav className="flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5">
        {ATTENDANCE_NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActive(item.id)}
              className={clsx(
                "block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
                isActive
                  ? "bg-[#00ffd0]/10 text-[#00ffd0]"
                  : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5",
              )}
            >
              <div>{item.label}</div>
              {item.description ? (
                <div
                  className={clsx(
                    "hidden md:block text-[11px] mt-0.5",
                    isActive ? "text-[#00ffd0]/70" : "text-[var(--z-muted)]",
                  )}
                >
                  {item.description}
                </div>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
