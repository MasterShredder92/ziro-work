import type { ReactNode } from "react";
import { AutomationSidebar } from "./AutomationSidebar";

export type AutomationShellProps = {
  tenantId: string;
  locationName?: string | null;
  children: ReactNode;
  headerExtras?: ReactNode;
};

export function AutomationShell({
  tenantId,
  locationName,
  children,
  headerExtras,
}: AutomationShellProps) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-3 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] font-bold text-sm">
            A
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Automation OS
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
              {locationName ?? "Tenant-wide triggers and actions"}
            </div>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-3">
          <div className="text-[11px] text-[var(--z-muted)] font-mono truncate max-w-[180px]">
            tenant:{tenantId.slice(0, 8)}
          </div>
          {headerExtras}
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <AutomationSidebar />
        <section className="flex-1 min-w-0 overflow-auto">
          <div className="px-4 sm:px-6 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
