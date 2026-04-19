"use client";

import type { PortalLayoutConfig } from "@/lib/branding/types";

export function PortalLayoutPreview({ layout }: { layout: PortalLayoutConfig }) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {layout.scope} portal
      </div>
      <div className="mt-2 grid grid-cols-[auto_1fr] gap-2 text-xs">
        <div className="w-10 rounded border border-dashed border-[var(--z-border)] bg-[var(--z-surface-2)] p-1 text-center text-[10px] text-[var(--z-muted)]">
          {layout.sidebar_variant === "icons_only" ? "Ico" : "Nav"}
        </div>
        <div className="space-y-2">
          <div className="rounded border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] px-2 py-1">
            Preset: {layout.preset} · Sidebar: {layout.sidebar_variant} · Dashboard:{" "}
            {layout.dashboard_preset}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {layout.widgets.slice(0, 4).map((w) => (
              <div
                key={w.id}
                className="rounded border border-[var(--z-border)] px-2 py-3 text-[11px] text-[var(--z-muted)]"
              >
                {w.title}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
