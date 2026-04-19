"use client";

import type {
  BrandingColorPalette,
  BrandingHeaderFooter,
  BrandingLogo,
  BrandingTypography,
} from "@/lib/branding";
import type { BrandingPreviewDevice } from "@/components/branding/previewDevice";
import { BrandingPreviewDeviceFrame } from "@/components/branding/BrandingPreviewDeviceFrame";

export interface BrandingPreviewProps {
  logo: BrandingLogo;
  colors: BrandingColorPalette;
  typography: BrandingTypography;
  headerFooter?: BrandingHeaderFooter;
  /** Viewport frame for the mock portal surface (controlled by parent, e.g. ThemeEditor). */
  device?: BrandingPreviewDevice;
}

export function BrandingPreview({
  logo,
  colors,
  typography,
  headerFooter,
  device = "desktop",
}: BrandingPreviewProps) {
  return (
    <BrandingPreviewDeviceFrame device={device}>
      <div
        data-branding-preview
        className="rounded-[var(--brand-card-radius,1rem)] border overflow-hidden"
        style={{
          background: colors.background,
          color: "#eaeaea",
          borderColor: "rgba(255,255,255,0.08)",
          fontFamily: typography.bodyFamily,
          fontSize: "var(--brand-font-base-size, 16px)",
          lineHeight: "var(--brand-font-line-height, 1.5)",
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{
            background: colors.surface,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {logo.dark || logo.light ? (
            // eslint-disable-next-line @next/next/no-img-element -- brand logo URLs / data URLs in editor preview
            <img
              src={logo.dark ?? logo.light ?? ""}
              alt="Logo"
              className="h-6 object-contain"
            />
          ) : (
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold"
              style={{ background: colors.accent, color: colors.background }}
            >
              Z
            </span>
          )}
          <div className="text-sm font-semibold">
            {headerFooter?.headerTagline ?? "Workspace"}
          </div>
        </div>
        <div className="px-4 py-5 space-y-3">
          <h2
            className="text-xl font-semibold"
            style={{
              color: colors.primary,
              fontFamily: typography.headingFamily,
            }}
          >
            Welcome back
          </h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>
            This is how your portals will look to users.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs font-semibold px-3 py-2 rounded-[var(--brand-button-radius,0.75rem)]"
              style={{ background: colors.primary, color: colors.background }}
            >
              Primary action
            </button>
            <button
              type="button"
              className="text-xs font-semibold px-3 py-2 rounded-[var(--brand-button-radius,0.75rem)] border"
              style={{
                borderColor: "rgba(255,255,255,0.2)",
                color: colors.accent,
              }}
            >
              Secondary
            </button>
          </div>
          <div
            className="rounded-[var(--brand-card-radius,1rem)] p-3"
            style={{
              background: colors.surface,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Card
            </div>
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>
              Lorem ipsum dolor sit amet.
            </div>
          </div>
        </div>
        {headerFooter?.footerText ? (
          <div
            className="px-4 py-2 text-[11px]"
            style={{
              background: colors.surface,
              color: "rgba(255,255,255,0.55)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {headerFooter.footerText}
          </div>
        ) : null}
      </div>
    </BrandingPreviewDeviceFrame>
  );
}
