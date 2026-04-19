"use client";

export type BrandingPreviewSurfaceMode = "theme" | "portal";

const MODES: readonly BrandingPreviewSurfaceMode[] = ["theme", "portal"] as const;

const LABELS: Record<BrandingPreviewSurfaceMode, string> = {
  theme: "Theme Preview",
  portal: "Portal Preview",
};

export function PreviewSurfaceModeControl({
  value,
  onChange,
  id = "branding-preview-surface",
}: {
  value: BrandingPreviewSurfaceMode;
  onChange: (next: BrandingPreviewSurfaceMode) => void;
  id?: string;
}) {
  return (
    <div className="space-y-1.5">
      <span
        id={`${id}-label`}
        className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted,#909098)]"
      >
        Preview surface
      </span>
      <div
        role="tablist"
        aria-labelledby={`${id}-label`}
        className="inline-flex rounded-[8px] border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface-2,#141416)] p-0.5"
      >
        {MODES.map((m) => {
          const selected = value === m;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(m)}
              className={`min-w-[6.5rem] rounded-[6px] px-2.5 py-1.5 text-xs font-medium transition ${
                selected
                  ? "bg-[var(--z-surface,#1a1a1c)] text-[var(--z-fg,#f0f0f0)] shadow-sm"
                  : "text-[var(--z-muted,#909098)] hover:text-[var(--z-fg,#f0f0f0)]"
              }`}
            >
              {LABELS[m]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
