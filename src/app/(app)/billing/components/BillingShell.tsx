import type { ReactNode } from "react";
import { BillingSidebar } from "./BillingSidebar";

export type BillingShellProps = {
  tenantName?: string;
  allowedNavIds?: string[] | null;
  header?: ReactNode;
  children: ReactNode;
};

export function BillingShell({
  tenantName,
  allowedNavIds,
  header,
  children,
}: BillingShellProps) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-3 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] font-bold text-sm">
            $
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Billing OS
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
              Revenue, invoices, and A/R
            </div>
          </div>
        </div>
        {header ? (
          <div className="sm:ml-auto flex items-center gap-3">{header}</div>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <BillingSidebar
          tenantName={tenantName}
          allowedNavIds={allowedNavIds}
        />
        <section className="flex-1 min-w-0 overflow-auto">
          <div className="px-4 sm:px-6 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
