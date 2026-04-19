import type { ReactNode } from "react";
import { CurriculumSidebar } from "./CurriculumSidebar";

export function CurriculumShell({
  children,
  tenantLabel,
  generatedAt,
}: {
  children: ReactNode;
  tenantLabel: string;
  generatedAt?: string | null;
}) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-3 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] font-bold text-sm">
            C
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Curriculum OS
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
              Programs · levels · units · lessons · materials
            </div>
          </div>
        </div>
        {generatedAt ? (
          <div className="sm:ml-auto text-xs text-[var(--z-muted)]">
            Updated {new Date(generatedAt).toLocaleTimeString()}
          </div>
        ) : null}
      </div>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <CurriculumSidebar tenantLabel={tenantLabel} />
        <section className="flex-1 min-w-0 overflow-auto">
          <div className="px-4 sm:px-6 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
