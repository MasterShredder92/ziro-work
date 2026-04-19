"use client";

import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import type { ReportDefinitionSummary } from "@/lib/reports/types";

export type ReportsSidebarProps = {
  reports: ReportDefinitionSummary[];
};

export function ReportsSidebar({ reports }: ReportsSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]">
      <div className="px-5 py-4 border-b border-[var(--z-border)]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Reporting OS
        </div>
        <div className="mt-1 text-base font-semibold text-[var(--z-fg)] truncate">
          Built-in reports
        </div>
      </div>
      <nav className="flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5">
        <Link
          href="/reports"
          className={clsx(
            "block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
            pathname === "/reports"
              ? "bg-[#00ff88]/10 text-[#00ff88]"
              : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5",
          )}
        >
          <div>Dashboard</div>
          <div className="hidden md:block text-[11px] mt-0.5 opacity-70">
            KPIs & reports
          </div>
        </Link>
        <Link
          href="/reports/builder"
          className={clsx(
            "block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
            pathname?.startsWith("/reports/builder")
              ? "bg-[#00ff88]/10 text-[#00ff88]"
              : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5",
          )}
        >
          <div>Report builder</div>
          <div className="hidden md:block text-[11px] mt-0.5 opacity-70">
            Compose a custom report
          </div>
        </Link>
        <Link
          href="/reports/widgets"
          className={clsx(
            "block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
            pathname === "/reports/widgets"
              ? "bg-[#00ff88]/10 text-[#00ff88]"
              : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5",
          )}
        >
          <div>Widget library</div>
          <div className="hidden md:block text-[11px] mt-0.5 opacity-70">
            Reusable chart blocks
          </div>
        </Link>
        <Link
          href="/reports/exports"
          className={clsx(
            "block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
            pathname?.startsWith("/reports/exports")
              ? "bg-[#00ff88]/10 text-[#00ff88]"
              : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5",
          )}
        >
          <div>Export history</div>
          <div className="hidden md:block text-[11px] mt-0.5 opacity-70">
            CSV · XLSX · PDF
          </div>
        </Link>
        {reports.map((r) => {
          const href = `/reports/${r.id}`;
          const isActive = pathname === href;
          return (
            <Link
              key={r.id}
              href={href}
              className={clsx(
                "block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
                isActive
                  ? "bg-[#00ff88]/10 text-[#00ff88]"
                  : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5",
              )}
            >
              <div>{r.name}</div>
              <div
                className={clsx(
                  "hidden md:block text-[11px] mt-0.5 line-clamp-2",
                  isActive ? "text-[#00ff88]/70" : "text-[var(--z-muted)]",
                )}
              >
                {r.description}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
