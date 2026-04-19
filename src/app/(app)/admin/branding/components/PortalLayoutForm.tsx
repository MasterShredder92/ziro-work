"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  DashboardPreset,
  LayoutPreset,
  PortalLayoutConfig,
  PortalScope,
  SidebarVariant,
  WidgetSlot,
} from "@/lib/branding";
import { PortalLayoutPreview } from "./PortalLayoutPreview";

const SCOPES: PortalScope[] = ["student", "family", "teacher", "director", "admin"];
const PRESETS: LayoutPreset[] = ["classic", "compact", "minimal"];
const SIDEBARS: SidebarVariant[] = ["icons_only", "icons_labels", "collapsible"];
const DASHBOARDS: DashboardPreset[] = ["grid", "focus", "feed"];

type DraftMap = Record<PortalScope, Partial<PortalLayoutConfig>>;

function toDraftMap(
  layouts: PortalLayoutConfig[],
): DraftMap {
  const map: DraftMap = {
    student: {},
    family: {},
    teacher: {},
    director: {},
    admin: {},
  };
  for (const l of layouts) {
    map[l.scope] = l;
  }
  return map;
}

export function PortalLayoutForm({
  tenantId,
  layouts,
  canWrite,
}: {
  tenantId: string;
  layouts: PortalLayoutConfig[];
  canWrite: boolean;
}) {
  const [draftMap, setDraftMap] = useState<DraftMap>(() => toDraftMap(layouts));
  const [activeScope, setActiveScope] = useState<PortalScope>("teacher");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const active = useMemo<PortalLayoutConfig>(() => {
    const d = draftMap[activeScope];
    return {
      id: d.id ?? `preview-${activeScope}`,
      tenant_id: tenantId,
      scope: activeScope,
      preset: (d.preset ?? "classic") as LayoutPreset,
      sidebar_variant: (d.sidebar_variant ?? "icons_labels") as SidebarVariant,
      dashboard_preset: (d.dashboard_preset ?? "grid") as DashboardPreset,
      widgets: d.widgets ?? [
        { id: "a", title: "Widget A", size: "md" },
        { id: "b", title: "Widget B", size: "md" },
        { id: "c", title: "Widget C", size: "lg" },
        { id: "d", title: "Widget D", size: "sm" },
      ],
      header_extras: d.header_extras ?? [],
      footer_extras: d.footer_extras ?? [],
      created_at: d.created_at ?? new Date().toISOString(),
      updated_at: d.updated_at ?? new Date().toISOString(),
    };
  }, [draftMap, activeScope, tenantId]);

  const updateActive = (patch: Partial<PortalLayoutConfig>) => {
    setDraftMap((m) => ({
      ...m,
      [activeScope]: { ...m[activeScope], ...patch, scope: activeScope },
    }));
  };

  const save = () => {
    if (!canWrite) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/branding/layout?tenantId=${encodeURIComponent(tenantId)}`,
          {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
              "x-tenant-id": tenantId,
            },
            body: JSON.stringify({
              layout: {
                scope: activeScope,
                preset: active.preset,
                sidebar_variant: active.sidebar_variant,
                dashboard_preset: active.dashboard_preset,
                widgets: active.widgets,
                header_extras: active.header_extras,
                footer_extras: active.footer_extras,
              },
            }),
          },
        );
        const json = (await res.json().catch(() => null)) as
          | { data?: { layout?: PortalLayoutConfig }; error?: string }
          | null;
        if (!res.ok) {
          setError(json?.error ?? `HTTP ${res.status}`);
          return;
        }
        const row = json?.data?.layout;
        if (row) {
          setDraftMap((m) => ({ ...m, [activeScope]: row }));
        }
        setSavedAt(new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Portal layouts
          </div>
          <h1 className="text-xl font-semibold text-[var(--z-fg)]">
            Presets, sidebars & dashboard widgets
          </h1>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          {savedAt ? (
            <span className="text-[11px] text-[var(--z-muted)]">
              Saved {new Date(savedAt).toLocaleTimeString()}
            </span>
          ) : null}
          <button
            type="button"
            onClick={save}
            disabled={!canWrite || isPending}
            className="h-9 rounded-[var(--z-radius-sm)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save layout"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-[var(--z-radius-md)] border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 px-3 py-2 text-xs text-[#ff3b6b]">
          {error}
        </div>
      ) : null}

      <nav className="flex flex-wrap gap-2">
        {SCOPES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveScope(s)}
            className={`h-8 rounded-[var(--z-radius-sm)] border px-3 text-xs capitalize ${
              activeScope === s
                ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88] font-semibold"
                : "border-[var(--z-border)] bg-[var(--z-surface)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"
            }`}
          >
            {s}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
              Preset
            </div>
            <div className="flex gap-2 mt-1">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateActive({ preset: p })}
                  disabled={!canWrite}
                  className={`h-8 rounded-[var(--z-radius-sm)] border px-3 text-xs capitalize ${
                    active.preset === p
                      ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88] font-semibold"
                      : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
              Sidebar
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {SIDEBARS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateActive({ sidebar_variant: p })}
                  disabled={!canWrite}
                  className={`h-8 rounded-[var(--z-radius-sm)] border px-3 text-xs ${
                    active.sidebar_variant === p
                      ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88] font-semibold"
                      : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"
                  }`}
                >
                  {p.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
              Dashboard
            </div>
            <div className="flex gap-2 mt-1">
              {DASHBOARDS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateActive({ dashboard_preset: p })}
                  disabled={!canWrite}
                  className={`h-8 rounded-[var(--z-radius-sm)] border px-3 text-xs capitalize ${
                    active.dashboard_preset === p
                      ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88] font-semibold"
                      : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
              Widgets
            </div>
            <div className="flex flex-col gap-1 mt-1">
              {active.widgets.map((w: WidgetSlot, i: number) => (
                <div
                  key={`${w.id}-${i}`}
                  className="flex items-center gap-2 text-xs text-[var(--z-fg)]"
                >
                  <span className="inline-flex w-6 justify-center rounded border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1 text-[10px] uppercase">
                    {w.size}
                  </span>
                  <span className="truncate">{w.title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <PortalLayoutPreview
            layout={active}
            scopeLabel={`${activeScope} portal`}
          />
        </section>
      </div>
    </div>
  );
}
