"use client";

import type {
  DashboardPreset,
  LayoutPreset,
  PortalLayoutConfig,
  SidebarVariant,
  WidgetSlot,
} from "@/lib/branding";

export interface PortalLayoutPreviewProps {
  layout: {
    preset: LayoutPreset;
    sidebar_variant: SidebarVariant;
    dashboard_preset: DashboardPreset;
    widgets: WidgetSlot[];
  } | PortalLayoutConfig;
  scopeLabel?: string;
}

const SIDEBAR_LABEL: Record<SidebarVariant, string> = {
  icons_only: "Icons only",
  icons_labels: "Icons + labels",
  collapsible: "Collapsible",
};

const SIZE_SPAN: Record<WidgetSlot["size"], string> = {
  sm: "col-span-1",
  md: "col-span-1 md:col-span-1",
  lg: "col-span-2",
  full: "col-span-2 md:col-span-3",
};

export function PortalLayoutPreview({
  layout,
  scopeLabel,
}: PortalLayoutPreviewProps) {
  const sidebarWidth =
    layout.sidebar_variant === "icons_only"
      ? "w-10"
      : layout.sidebar_variant === "collapsible"
        ? "w-16"
        : "w-40";

  const density =
    layout.preset === "compact"
      ? "p-1.5 text-[11px]"
      : layout.preset === "minimal"
        ? "p-3 text-xs"
        : "p-2 text-xs";

  const gridCols =
    layout.dashboard_preset === "focus"
      ? "grid-cols-1"
      : layout.dashboard_preset === "feed"
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-2 md:grid-cols-3";

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <div className="flex items-center justify-between pb-2">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
          {scopeLabel ?? "Portal preview"}
        </div>
        <div className="text-[10px] text-[var(--z-muted)] font-mono">
          {layout.preset} · {SIDEBAR_LABEL[layout.sidebar_variant]} · {layout.dashboard_preset}
        </div>
      </div>
      <div className="flex gap-2 h-56 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] overflow-hidden">
        <div
          className={`${sidebarWidth} shrink-0 border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_12%)] flex flex-col gap-1 ${density}`}
        >
          {["▦", "☺", "⌚", "♪", "★", "$"].map((icon, idx) => (
            <div
              key={idx}
              className="h-6 rounded flex items-center gap-2 px-1"
              style={{
                background:
                  idx === 0
                    ? "color-mix(in oklab, var(--z-accent), transparent 80%)"
                    : "transparent",
              }}
            >
              <span className="inline-flex w-3 justify-center text-[var(--z-fg)]">
                {icon}
              </span>
              {layout.sidebar_variant !== "icons_only" &&
              layout.sidebar_variant !== "collapsible" ? (
                <span className="truncate text-[var(--z-fg)]">
                  Item {idx + 1}
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0 p-2 overflow-hidden">
          <div className="mb-2 h-5 w-32 rounded bg-[color-mix(in_oklab,var(--z-fg),transparent_80%)]" />
          <div className={`grid gap-1.5 ${gridCols}`}>
            {layout.widgets.slice(0, 6).map((w: WidgetSlot) => (
              <div
                key={w.id}
                className={`${SIZE_SPAN[w.size]} rounded border border-[var(--z-border)] bg-[var(--z-surface)] ${density}`}
              >
                <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                  {w.size}
                </div>
                <div className="truncate text-[var(--z-fg)]">{w.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
