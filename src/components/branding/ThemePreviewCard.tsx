"use client";

import type { ThemePreset } from "@/lib/branding/types";
import { previewCssFromTheme } from "@/lib/branding/runtime";

export function ThemePreviewCard({ theme }: { theme: ThemePreset }) {
  const css = previewCssFromTheme(theme);
  return (
    <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)]">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        className="p-4 space-y-3"
        style={{
          background: theme.tokens.colors.background,
          color: theme.tokens.colors.surface,
        }}
      >
        <div
          className="text-sm font-semibold"
          style={{ color: theme.tokens.colors.primary }}
        >
          {theme.name}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-sm font-medium rounded-md"
            style={{
              background: theme.tokens.colors.primary,
              color: theme.tokens.colors.background,
              borderRadius: theme.tokens.components.buttonRadius,
            }}
          >
            Primary
          </button>
          <div
            className="flex-1 rounded-md p-3 text-xs"
            style={{
              background: theme.tokens.colors.surface,
              color: theme.tokens.colors.primary,
              borderRadius: theme.tokens.components.cardRadius,
              border: `1px solid ${theme.tokens.components.cardBorder ?? "#333"}`,
            }}
          >
            Card preview
          </div>
        </div>
      </div>
    </div>
  );
}
