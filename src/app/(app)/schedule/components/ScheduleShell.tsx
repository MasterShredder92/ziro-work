"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { ReactNode } from "react";

type NavItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
  requiresWrite?: boolean;
};

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/schedule", description: "Week & month views" },
  { id: "new", label: "New event", href: "/schedule/events/new", description: "Create an event", requiresWrite: true },
  { id: "availability", label: "Availability", href: "/schedule/availability", description: "Teachers", requiresWrite: true },
  { id: "rooms", label: "Rooms", href: "/schedule/rooms", description: "Manage & book", requiresWrite: true },
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
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-3 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] font-bold text-sm">
            S
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Schedule OS
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
              Events · recurring series · availability · rooms
            </div>
          </div>
        </div>
        <div className="sm:ml-auto text-xs text-[var(--z-muted)] truncate max-w-[220px]">
          {tenantLabel}
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <aside className="md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]">
          <div className="px-5 py-4 border-b border-[var(--z-border)]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              Schedule
            </div>
            <div className="mt-1 text-base font-semibold text-[var(--z-fg)] truncate">
              {tenantLabel}
            </div>
          </div>
          <nav className="flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5">
            {NAV.filter((n) => !n.requiresWrite || canWrite).map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={clsx(
                    "block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
                    active
                      ? "bg-[#00ff88]/10 text-[#00ff88]"
                      : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5",
                  )}
                >
                  <div>{item.label}</div>
                  {item.description ? (
                    <div
                      className={clsx(
                        "hidden md:block text-[11px] mt-0.5",
                        active ? "text-[#00ff88]/70" : "text-[var(--z-muted)]",
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
        <section className="flex-1 min-w-0 overflow-auto">
          <div className="z-page-transition px-4 sm:px-6 py-6 space-y-6 max-w-[var(--z-content-max)] mx-auto w-full">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
