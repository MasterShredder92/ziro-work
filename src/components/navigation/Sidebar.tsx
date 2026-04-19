"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ROUTE_GROUPS } from "@/lib/routes";

// ─── Premium SVG icons per route ─────────────────────────────────────────────
const ROUTE_ICONS: Record<string, React.ReactNode> = {
  "/dashboard": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  "/studio-map": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M10 2L2 6v8l8 4 8-4V6L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 6l8 4m0 0l8-4m-8 4v8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  "/schedule": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <rect x="2.5" y="3.5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.5 7.5h15" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6.5 2v3M13.5 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="11.5" r="1" fill="currentColor"/>
      <circle cx="10" cy="11.5" r="1" fill="currentColor"/>
      <circle cx="13" cy="11.5" r="1" fill="currentColor"/>
      <circle cx="7" cy="14.5" r="1" fill="currentColor"/>
      <circle cx="10" cy="14.5" r="1" fill="currentColor"/>
    </svg>
  ),
  "/agent-reports": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M10 2a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 18c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 10l4 4m0 0l-2 2m2-2l-2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  "/lifecycle/intake": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M10 3v10m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  "/lifecycle/lead-work": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/lifecycle/scheduling": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/lifecycle/enrollment": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/lifecycle/service-delivery": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M3 10h2l2-6 4 12 2-6h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/lifecycle/relationship": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M10 16.5S3 12.5 3 7.5a4 4 0 017-2.6A4 4 0 0117 7.5c0 5-7 9-7 9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  "/lifecycle/retention": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M17 10A7 7 0 113 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17 10l-2-2m2 2l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/lifecycle/win-back": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M3 10A7 7 0 1017 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 10l2-2M3 10l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/roster": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  "/attendance": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <rect x="2.5" y="3.5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.5 7.5h15" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/teachers": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M3 15c0-2.761 3.134-5 7-5s7 2.239 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  "/invoices": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  "/payroll": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 6v1.5m0 5V14m2.5-6.5c0-.828-.895-1.5-2.5-1.5S7.5 6.672 7.5 7.5c0 1.657 5 1.657 5 3.5 0 .828-.895 1.5-2.5 1.5S7.5 11.828 7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  "/recruitment": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 5.5v5M5.5 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  "/reports": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M4 15V9l4-4 4 4 4-4v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "/settings": (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 2.5v1.25M10 16.25V17.5M17.5 10h-1.25M3.75 10H2.5M15.303 4.697l-.884.884M5.581 14.419l-.884.884M15.303 15.303l-.884-.884M5.581 5.581l-.884-.884" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

function getIcon(href: string): React.ReactNode {
  return ROUTE_ICONS[href] ?? (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

type SidebarProps = {
  isMobileOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isSchedulePage = pathname?.startsWith("/schedule") ?? false;
  // Hover-expand state (only relevant on schedule pages)
  const [hovered, setHovered] = React.useState(false);

  // When not on schedule page, always show full sidebar
  // When on schedule page: 64px collapsed, expands to 260px on hover (floats over content)
  const isExpanded = !isSchedulePage || hovered;

  return (
    <aside
      onMouseEnter={() => isSchedulePage && setHovered(true)}
      onMouseLeave={() => isSchedulePage && setHovered(false)}
      className={clsx(
        "fixed left-0 top-0 z-40 h-full border-r border-[#1c1c1e] bg-[#0a0a0c]",
        "flex flex-col",
        "transition-[width] duration-200 ease-out",
        // On schedule pages: always 64px in layout, expands to 260px floating on hover
        isSchedulePage ? (hovered ? "w-[260px] shadow-2xl" : "w-[64px]") : "w-[260px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
      aria-label="Primary navigation"
    >
      {/* Logo / brand */}
      <div className={clsx(
        "flex items-center border-b border-[#1c1c1e] transition-all duration-200 overflow-hidden",
        isExpanded ? "justify-between px-6 pb-5 pt-7" : "justify-center px-0 py-5",
      )}>
        {isExpanded ? (
          <>
            <div className="text-2xl tracking-tighter whitespace-nowrap">
              <span className="text-[#00ff88] font-extrabold">ZIRO</span>
              <span className="text-white ml-1 font-light">WORK</span>
            </div>
            <button
              type="button"
              className="rounded-md border border-[#2b2b2f] px-2 py-1 text-xs font-semibold text-[#909098] lg:hidden"
              onClick={onClose}
              aria-label="Close navigation"
            >
              Close
            </button>
          </>
        ) : (
          <div className="text-[#00ff88] font-extrabold text-xl tracking-tighter select-none">Z</div>
        )}
      </div>

      {/* Nav */}
      <nav className={clsx(
        "flex-1 overflow-y-auto overflow-x-hidden py-4 transition-all duration-200",
        isExpanded ? "px-4 space-y-6" : "px-0 space-y-1",
      )}>
        {!isExpanded ? (
          // Icon-only mode: flat list of icons with tooltips
          <div className="flex flex-col items-center gap-1 px-2">
            {ROUTE_GROUPS.flatMap((g) => g.items).map((item) => {
              const isActive = pathname === item.href || (item.href !== "/schedule" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={item.label}
                  onClick={onClose}
                  className={clsx(
                    "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    isActive
                      ? "bg-[#00ff88]/15 text-[#00ff88]"
                      : "text-[#505055] hover:bg-white/5 hover:text-[#909098]",
                  )}
                >
                  {getIcon(item.href)}
                  {/* Tooltip — shown only in icon-only mode */}
                  <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md border border-[#2b2b2f] bg-[#0a0a0c] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          // Full mode: groups with labels
          ROUTE_GROUPS.map((group) => (
            <div
              key={group.id}
              className="space-y-1"
              data-tour={group.id === "lifecycle" ? "lifecycle-stages" : undefined}
            >
              <div className="px-2 pb-2">
                <div className="text-xs font-semibold text-[#505055] uppercase tracking-wider whitespace-nowrap">
                  {group.label}
                </div>
              </div>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-[#00ff88]/10 text-[#00ff88]"
                        : "text-[#909098] hover:text-white hover:bg-white/5",
                    )}
                    onClick={onClose}
                  >
                    <span className={clsx("shrink-0", isActive ? "text-[#00ff88]" : "text-[#505055]")}>
                      {getIcon(item.href)}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))
        )}
      </nav>

      {isExpanded && (
        <div className="px-6 pb-6 text-xs text-[#505055] whitespace-nowrap">Ziro Work</div>
      )}
    </aside>
  );
}
