import type { ReactNode } from "react";
import { InventorySidebar } from "./InventorySidebar";

export type InventoryShellProps = {
  children: ReactNode;
  tenantLabel: string;
  roleLabel?: string | null;
  allowedNavIds?: string[] | null;
  generatedAt?: string | null;
};

export function InventoryShell({
  children,
  tenantLabel,
  roleLabel,
  allowedNavIds,
  generatedAt,
}: InventoryShellProps) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-3 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] font-bold text-sm">
            I
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Inventory OS
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
              Assets · stock · checkouts · maintenance · depreciation
            </div>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-3">
          {roleLabel ? (
            <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              {roleLabel}
            </span>
          ) : null}
          {generatedAt ? (
            <span className="text-xs text-[var(--z-muted)]">
              Updated {new Date(generatedAt).toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <InventorySidebar
          tenantLabel={tenantLabel}
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
