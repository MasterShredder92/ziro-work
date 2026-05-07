import type { ReactNode } from "react";
import { LeadsSidebar } from "./LeadsSidebar";

export interface LeadsShellProps {
  children: ReactNode;
  tenantId: string;
  roleLabel?: string;
  allowedNavIds?: string[] | null;
}

export function LeadsShell({
  children,
  tenantId,
  roleLabel,
  allowedNavIds,
}: LeadsShellProps) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-3 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-[#c4f036]/15 border border-[#c4f036]/30 flex items-center justify-center text-[#c4f036] font-bold text-sm">
            L
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Lead OS
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
              Unified lead operations
            </div>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-3 text-xs text-[var(--z-muted)]">
          {roleLabel ? (
            <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-0.5 font-medium text-[var(--z-fg)]">
              {roleLabel}
            </span>
          ) : null}
          <span className="hidden sm:inline">Tenant</span>
          <code className="rounded bg-[var(--z-surface)] border border-[var(--z-border)] px-1.5 py-0.5 text-[11px] text-[var(--z-fg)]">
            {tenantId.slice(0, 8)}
          </code>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <LeadsSidebar allowedNavIds={allowedNavIds} />
        <section className="flex-1 min-w-0 overflow-auto">
          <div className="px-4 sm:px-6 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
