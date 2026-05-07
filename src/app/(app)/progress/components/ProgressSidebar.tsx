"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";

export type ProgressNavItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
};

export const PROGRESS_NAV: ProgressNavItem[] = [
  { id: "overview", label: "Overview", href: "#overview", description: "KPIs & students" },
  { id: "students", label: "Students", href: "#students", description: "Select a student" },
  { id: "goals", label: "Goals", href: "#goals", description: "Current learning goals" },
  { id: "skills", label: "Skills", href: "#skills", description: "Mastery tracking" },
  { id: "evidence", label: "Evidence", href: "#evidence", description: "Uploads & notes" },
];

export function ProgressSidebar({
  tenantLabel,
}: {
  tenantLabel: string;
}) {
  const [active, setActive] = useState("overview");

  return (
    <aside className="md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]">
      <div className="px-5 py-4 border-b border-[var(--z-border)]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Progress
        </div>
        <div className="mt-1 text-base font-semibold text-[var(--z-fg)] truncate">
          {tenantLabel}
        </div>
      </div>
      <nav className="flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5">
        {PROGRESS_NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActive(item.id)}
              className={clsx(
                "block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
                isActive
                  ? "bg-[#c4f036]/10 text-[#c4f036]"
                  : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5",
              )}
            >
              <div>{item.label}</div>
              {item.description ? (
                <div
                  className={clsx(
                    "hidden md:block text-[11px] mt-0.5",
                    isActive ? "text-[#c4f036]/70" : "text-[var(--z-muted)]",
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
