"use client";

import type { ThemePreset } from "@/lib/branding";

export interface ThemePreviewCardProps {
  theme: ThemePreset;
  active?: boolean;
  onSelect?: (themeKey: string) => void;
  onDelete?: (themeKey: string) => void;
  disabled?: boolean;
}

export function ThemePreviewCard({
  theme,
  active,
  onSelect,
  onDelete,
  disabled,
}: ThemePreviewCardProps) {
  const { colors, typography } = theme.tokens;

  return (
    <div
      className={`flex flex-col gap-2 rounded-[var(--z-radius-lg)] border p-3 ${
        active
          ? "border-[#c4f036] ring-1 ring-[#c4f036]/60"
          : "border-[var(--z-border)]"
      } bg-[var(--z-surface)]`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
            {theme.name}
          </div>
          <div className="text-[11px] text-[var(--z-muted)] font-mono">
            {theme.theme_key}
          </div>
        </div>
        {theme.is_system ? (
          <span className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] border border-[var(--z-border)] rounded px-1.5 py-0.5">
            System
          </span>
        ) : null}
      </div>

      <div
        className="flex h-20 items-center justify-center rounded-[var(--z-radius-md)] border border-black/20"
        style={{
          background: colors.background,
          color: colors.primary,
          fontFamily: typography.headingFamily,
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="text-lg font-semibold" style={{ color: colors.primary }}>
            Aa
          </div>
          <div className="text-[10px]" style={{ color: colors.accent }}>
            Preview
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {[
          ["P", colors.primary],
          ["S", colors.secondary],
          ["A", colors.accent],
          ["B", colors.background],
          ["U", colors.surface],
        ].map(([letter, color]) => (
          <div
            key={letter}
            className="flex h-6 items-center justify-center rounded text-[10px] font-bold border border-black/30"
            style={{ background: color, color: readableOn(color) }}
            title={`${letter} · ${color}`}
          >
            {letter}
          </div>
        ))}
      </div>

      {theme.description ? (
        <div className="text-[11px] text-[var(--z-muted)]">{theme.description}</div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {onSelect ? (
          <button
            type="button"
            disabled={disabled || active}
            onClick={() => onSelect(theme.theme_key)}
            className="h-8 flex-1 rounded-[var(--z-radius-sm)] border border-[#c4f036]/40 bg-[#c4f036]/10 px-3 text-xs font-semibold text-[#c4f036] hover:bg-[#c4f036]/20 disabled:opacity-50"
          >
            {active ? "Applied" : "Apply"}
          </button>
        ) : null}
        {onDelete && !theme.is_system ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDelete(theme.theme_key)}
            className="h-8 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] disabled:opacity-50"
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

function readableOn(bgColor: string): string {
  const hex = bgColor.startsWith("#") ? bgColor.slice(1) : bgColor;
  if (hex.length < 6) return "#000000";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}
