"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// ─── Premium SVG icons ────────────────────────────────────────────────────────
function Icon({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: size, height: size }} aria-hidden>
      {children}
    </svg>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  "/dashboard": <Icon><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></Icon>,
  "/schedule": <Icon><rect x="2.5" y="3.5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 7.5h15M6.5 2v3M13.5 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="11.5" r="1" fill="currentColor"/><circle cx="10" cy="11.5" r="1" fill="currentColor"/><circle cx="13" cy="11.5" r="1" fill="currentColor"/></Icon>,
  "/agent-map": <Icon><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="2" fill="currentColor"/><circle cx="14" cy="7" r="1.5" fill="currentColor"/><circle cx="14" cy="13" r="1.5" fill="currentColor"/><circle cx="6" cy="7" r="1.5" fill="currentColor"/><circle cx="6" cy="13" r="1.5" fill="currentColor"/></Icon>,
  "/studio-map": <Icon><path d="M10 2L2 6v8l8 4 8-4V6L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M2 6l8 4m0 0l8-4m-8 4v8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></Icon>,
  "/crm": <Icon><path d="M3 15c0-2.761 3.134-5 7-5s7 2.239 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M16 11l1.5 1.5L20 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></Icon>,
  "/teachers": <Icon><path d="M3 15c0-2.761 3.134-5 7-5s7 2.239 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/></Icon>,
  "/invoices": <Icon><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></Icon>,
  "/payroll": <Icon><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v1.5m0 5V14m2.5-6.5c0-.828-.895-1.5-2.5-1.5S7.5 6.672 7.5 7.5c0 1.657 5 1.657 5 3.5 0 .828-.895 1.5-2.5 1.5S7.5 11.828 7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></Icon>,
  "/financials": <Icon><path d="M3 14l4-5 4 3 3-4 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></Icon>,
  "/lifecycle": <Icon><circle cx="4" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 10h2M12 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></Icon>,
  "/agent-reports": <Icon><path d="M10 2a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" strokeWidth="1.5"/><path d="M3 18c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 10l4 4m0 0l-2 2m2-2l-2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></Icon>,
  "/recruitment": <Icon><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 5.5v5M5.5 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></Icon>,
  "/settings": <Icon><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 2.5v1.25M10 16.25V17.5M17.5 10h-1.25M3.75 10H2.5M15.303 4.697l-.884.884M5.581 14.419l-.884.884M15.303 15.303l-.884-.884M5.581 5.581l-.884-.884" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></Icon>,
};

const LIFECYCLE_SUB = [
  { href: "/lifecycle?tab=intake",           label: "1. Inquiries"       },
  { href: "/lifecycle?tab=lead-work",        label: "2. Follow-up"       },
  { href: "/lifecycle?tab=scheduling",       label: "3. Scheduling"      },
  { href: "/lifecycle?tab=enrollment",       label: "4. Enrollment"      },
  { href: "/lifecycle?tab=service-delivery", label: "5. Ongoing Sessions"},
  { href: "/lifecycle?tab=relationship",     label: "6. Client Care"     },
  { href: "/lifecycle?tab=retention",        label: "7. Retention"       },
  { href: "/lifecycle?tab=win-back",         label: "8. Win Back"        },
];

const GROUPS = [
  {
    id: "core",
    label: "CORE",
    items: [
      { href: "/dashboard",  label: "Dashboard"  },
      { href: "/schedule",   label: "Schedule"   },
      { href: "/agent-map",  label: "Agent Map"  },
      { href: "/studio-map", label: "Studio Map" },
    ],
  },
  {
    id: "people",
    label: "PEOPLE",
    items: [
      { href: "/crm",      label: "Families & Students" },
      { href: "/teachers", label: "Teachers"             },
    ],
  },
  {
    id: "money",
    label: "MONEY",
    items: [
      { href: "/invoices",   label: "Invoices"   },
      { href: "/payroll",    label: "Payroll"    },
      { href: "/financials", label: "Financials" },
    ],
  },
  {
    id: "growth",
    label: "GROWTH",
    items: [
      { href: "/lifecycle",     label: "Student Journey", isLifecycle: true },
      { href: "/agent-reports", label: "Agent Reports"                       },
      { href: "/recruitment",   label: "Recruitment"                         },
    ],
  },
  {
    id: "admin",
    label: "ADMIN",
    items: [
      { href: "/settings", label: "Settings" },
    ],
  },
];

// All top-level hrefs for icon-only mode
const ALL_ITEMS = GROUPS.flatMap((g) =>
  g.items.map((item) => ({ ...item, groupLabel: g.label }))
);

type SidebarProps = {
  isMobileOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const isSchedulePage = pathname.startsWith("/schedule");
  const isLifecyclePage = pathname.startsWith("/lifecycle");

  const [hovered, setHovered] = React.useState(false);
  const hoverInTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOutTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lifecycleOpen, setLifecycleOpen] = React.useState(isLifecyclePage);
  React.useEffect(() => {
    if (isLifecyclePage) setLifecycleOpen(true);
  }, [isLifecyclePage]);

  // Auto-collapse on all pages, expand on hover
  const isExpanded = hovered;

  function handleMouseEnter() {
    if (hoverOutTimer.current) clearTimeout(hoverOutTimer.current);
    hoverInTimer.current = setTimeout(() => setHovered(true), 200);
  }
  function handleMouseLeave() {
    if (hoverInTimer.current) clearTimeout(hoverInTimer.current);
    hoverOutTimer.current = setTimeout(() => setHovered(false), 200);
  }

  function isActive(href: string) {
    if (href === "/lifecycle") return isLifecyclePage;
    if (href.startsWith("/lifecycle?")) return false; // handled by sub-items
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  }

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        "fixed left-0 top-0 z-40 h-full border-r border-[#1c1c1e] bg-[#0a0a0c] flex flex-col",
        "transition-[width] duration-200 ease-out",
        hovered ? "w-[260px] shadow-2xl" : "w-[64px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      {/* Logo */}
      <div className={clsx(
        "flex items-center border-b border-[#1c1c1e] overflow-hidden transition-all duration-200",
        isExpanded ? "justify-between px-6 pb-5 pt-7" : "justify-center px-0 py-5",
      )}>
        {isExpanded ? (
          <>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/zw-logo.png" alt="ZW" className="h-8 w-8 rounded-full object-cover" />
              <div className="text-2xl tracking-tighter whitespace-nowrap select-none">
                <span className="text-[#00ff88] font-extrabold">ZIRO</span>
                <span className="text-white ml-1 font-light">WORK</span>
              </div>
            </div>
            <button type="button" className="rounded-md border border-[#2b2b2f] px-2 py-1 text-xs font-semibold text-[#909098] lg:hidden" onClick={onClose}>✕</button>
          </>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src="/zw-logo.png" alt="ZW" className="h-8 w-8 rounded-full object-cover" />
        )}
      </div>

      {/* Nav */}
      <nav className={clsx(
        "flex-1 overflow-y-auto overflow-x-hidden py-4 transition-all duration-200",
        isExpanded ? "px-4 space-y-5" : "px-0 space-y-1",
      )}>
        {!isExpanded ? (
          /* Icon-only mode */
          <div className="flex flex-col items-center gap-1 px-2">
            {ALL_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  onClick={onClose}
                  className={clsx(
                    "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    active ? "bg-[#00ff88]/15 text-[#00ff88]" : "text-[#505055] hover:bg-white/5 hover:text-[#909098]",
                  )}
                >
                  {ICONS[item.href] ?? <Icon><circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5"/></Icon>}
                  <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md border border-[#2b2b2f] bg-[#0a0a0c] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Full mode */
          <>
            {GROUPS.map((group) => (
              <div key={group.id} className="space-y-0.5">
                <div className="px-2 pb-1.5 text-[10px] font-bold text-[#404048] uppercase tracking-widest whitespace-nowrap">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const isLifecycleItem = (item as { isLifecycle?: boolean }).isLifecycle;

                  if (isLifecycleItem) {
                    return (
                      <div key={item.href}>
                        <div className="flex items-center gap-1">
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={clsx(
                              "flex flex-1 items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap",
                              active ? "bg-[#00ff88]/10 text-[#00ff88]" : "text-white hover:text-white hover:bg-white/5",
                            )}
                          >
                            <span className={clsx("shrink-0", active ? "text-[#00ff88]" : "text-[#505055]")}>
                              {ICONS[item.href]}
                            </span>
                            {item.label}
                          </Link>
                          <button
                            type="button"
                            onClick={() => setLifecycleOpen((v) => !v)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#505055] hover:bg-white/5 hover:text-[#909098] transition-colors"
                            aria-label={lifecycleOpen ? "Collapse" : "Expand"}
                          >
                            <svg viewBox="0 0 16 16" fill="none" className={clsx("h-3.5 w-3.5 transition-transform duration-200", lifecycleOpen ? "rotate-180" : "")} aria-hidden>
                              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                        {lifecycleOpen && (
                          <div className="ml-4 mt-0.5 border-l border-[#1c1c1e] pl-3 space-y-0.5 pb-1">
                            {LIFECYCLE_SUB.map((sub) => {
                              const tabId = sub.href.split("tab=")[1];
                              const subActive = isLifecyclePage && pathname.includes("lifecycle") && (new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("tab") === tabId);
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={onClose}
                                  className={clsx(
                                    "flex items-center px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap",
                                    subActive ? "text-[#00ff88]" : "text-[#404048] hover:text-[#909098] hover:bg-white/3",
                                  )}
                                >
                                  {sub.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap",
                        active ? "bg-[#00ff88]/10 text-[#00ff88]" : "text-[#909098] hover:text-white hover:bg-white/5",
                      )}
                    >
                      <span className={clsx("shrink-0", active ? "text-[#00ff88]" : "text-[#505055]")}>
                        {ICONS[item.href] ?? <Icon><circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5"/></Icon>}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </nav>

      {isExpanded && (
        <div className="px-6 pb-5 text-[10px] text-[#303035] whitespace-nowrap select-none">
          Ziro Work
        </div>
      )}
    </aside>
  );
}
