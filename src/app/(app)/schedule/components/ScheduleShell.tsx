"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { ReactNode } from "react";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  requiresWrite?: boolean;
};

const NAV: NavItem[] = [
  {
    id: "dashboard",
    label: "Schedule",
    href: "/schedule",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
        <rect x="1.5" y="2" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M1.5 5.5h13" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5 1v2M11 1v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="5.5" cy="9" r="0.9" fill="currentColor"/>
        <circle cx="8" cy="9" r="0.9" fill="currentColor"/>
        <circle cx="10.5" cy="9" r="0.9" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "new",
    label: "New Event",
    href: "/schedule/events/new",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    requiresWrite: true,
  },
  {
    id: "availability",
    label: "Availability",
    href: "/schedule/availability",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M8 4.5v3.5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    requiresWrite: true,
  },
  {
    id: "rooms",
    label: "Rooms",
    href: "/schedule/rooms",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
        <path d="M2 13V5l6-3 6 3v8" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <rect x="5.5" y="8" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
    requiresWrite: true,
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/schedule") return pathname === "/schedule";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ScheduleShell({
  children,
  tenantLabel,
  canWrite,
}: {
  children: ReactNode;
  tenantLabel: string;
  canWrite: boolean;
}) {
  const pathname = usePathname() ?? "/schedule";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Horizontal top strip: nav pills ── */}
      <div
        className="shrink-0 flex items-center gap-1 overflow-x-auto border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)] px-3 py-2 scrollbar-none"
        aria-label="Schedule navigation"
      >
        {NAV.filter((n) => !n.requiresWrite || canWrite).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx(
                "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                active
                  ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]"
                  : "border-transparent text-[var(--z-muted)] hover:border-[var(--z-border)] hover:text-[var(--z-fg)]",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
        {/* Tenant label pushed to the right */}
        <div className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] pr-1">
          {tenantLabel}
        </div>
      </div>

      {/* ── Full-width content area ── */}
      <section className="min-h-0 flex-1 overflow-auto">
        <div className="z-page-transition w-full">
          {children}
        </div>
      </section>
    </div>
  );
}
