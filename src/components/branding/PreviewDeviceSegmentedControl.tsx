"use client";

import type { BrandingPreviewDevice } from "./previewDevice";
import { BRANDING_PREVIEW_DEVICES } from "./previewDevice";

const LABELS: Record<BrandingPreviewDevice, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  phone: "Phone",
};

export function PreviewDeviceSegmentedControl({
  value,
  onChange,
  id = "branding-preview-device",
}: {
  value: BrandingPreviewDevice;
  onChange: (next: BrandingPreviewDevice) => void;
  id?: string;
}) {
  return (
    <div className="space-y-1.5">
      <span
        id={`${id}-label`}
        className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted,#909098)]"
      >
        Preview device
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        className="inline-flex rounded-[8px] border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface-2,#141416)] p-0.5"
      >
        {BRANDING_PREVIEW_DEVICES.map((d) => {
          const selected = value === d;
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(d)}
              className={`min-w-[4.5rem] rounded-[6px] px-2.5 py-1.5 text-xs font-medium transition ${
                selected
                  ? "bg-[var(--z-surface,#1a1a1c)] text-[var(--z-fg,#f0f0f0)] shadow-sm"
                  : "text-[var(--z-muted,#909098)] hover:text-[var(--z-fg,#f0f0f0)]"
              }`}
            >
              {LABELS[d]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
