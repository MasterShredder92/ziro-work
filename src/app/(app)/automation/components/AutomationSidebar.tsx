"use client";

import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

export type AutomationSidebarItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
};

export const AUTOMATION_NAV: AutomationSidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/automation",
    description: "KPIs & recent runs",
  },
  {
    id: "workflows",
    label: "Workflows",
    href: "/automation/workflows",
    description: "Build & manage workflows",
  },
  {
    id: "runs",
    label: "Runs",
    href: "/automation/runs",
    description: "Execution history",
  },
  {
    id: "triggers",
    label: "Trigger library",
    href: "/automation/triggers",
    description: "All trigger types",
  },
  {
    id: "actions",
    label: "Action library",
    href: "/automation/actions",
    description: "All action types",
  },
  {
    id: "rules",
    label: "Legacy rules",
    href: "/automation/rules",
    description: "Prior rules engine",
  },
];

export function AutomationSidebar({
  items = AUTOMATION_NAV,
}: {
  items?: AutomationSidebarItem[];
}) {
  const pathname = usePathname() ?? "";

  return (
    <aside className="md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]">
      <div className="px-5 py-4 border-b border-[var(--z-border)]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Automation OS
        </div>
        <div className="mt-1 text-base font-semibold text-[var(--z-fg)] truncate">
          Rules engine
        </div>
      </div>
      <nav className="flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5">
        {items.map((item) => {
          const isActive =
            item.href === "/automation"
              ? pathname === "/automation"
              : pathname.startsWith(item.href.split("#")[0]);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx(
                "block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
                isActive
                  ? "bg-[#00ff88]/10 text-[#00ff88]"
                  : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5",
              )}
            >
              <div>{item.label}</div>
              {item.description ? (
                <div
                  className={clsx(
                    "hidden md:block text-[11px] mt-0.5",
                    isActive ? "text-[#00ff88]/70" : "text-[var(--z-muted)]",
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
