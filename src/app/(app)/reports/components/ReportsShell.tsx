import type { ReactNode } from "react";
import type { ReportDefinitionSummary } from "@/lib/reports/types";
import { ReportsSidebar } from "./ReportsSidebar";

export type ReportsShellProps = {
  reports: ReportDefinitionSummary[];
  tenantId: string;
  children: ReactNode;
};

export function ReportsShell({ reports, tenantId, children }: ReportsShellProps) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-3 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] font-bold text-sm">
            R
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Reporting OS
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
              Unified report surface
            </div>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-3">
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
            Tenant
          </div>
          <div className="text-xs font-mono text-[var(--z-fg)] truncate max-w-[220px]">
            {tenantId}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <ReportsSidebar reports={reports} />
        <section className="flex-1 min-w-0 overflow-auto">
          <div className="px-4 sm:px-6 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
