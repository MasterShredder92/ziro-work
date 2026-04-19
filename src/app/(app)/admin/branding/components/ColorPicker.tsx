"use client";

import { useEffect, useState } from "react";

export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  description?: string;
}

function isValidHex(v: string): boolean {
  return /^#?[0-9a-fA-F]{3,8}$/.test(v);
}

function normalizeHex(v: string): string {
  const s = v.trim();
  if (!s) return "#000000";
  return s.startsWith("#") ? s : `#${s}`;
}

export function ColorPicker({
  label,
  value,
  onChange,
  disabled,
  description,
}: ColorPickerProps) {
  const [text, setText] = useState<string>(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const commit = (next: string) => {
    const normalized = normalizeHex(next);
    onChange(normalized);
  };

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValidHex(text) ? normalizeHex(text) : "#000000"}
          onChange={(e) => {
            setText(e.target.value);
            commit(e.target.value);
          }}
          disabled={disabled}
          className="h-9 w-12 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface)] p-1"
          aria-label={`${label} color`}
        />
        <input
          type="text"
          value={text}
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            if (isValidHex(next)) commit(next);
          }}
          onBlur={() => {
            if (isValidHex(text)) commit(text);
            else setText(value);
          }}
          disabled={disabled}
          className="h-9 flex-1 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface)] px-2 text-sm text-[var(--z-fg)] font-mono"
          aria-label={`${label} hex`}
        />
      </div>
      {description ? (
        <span className="text-[11px] text-[var(--z-muted)]">{description}</span>
      ) : null}
    </label>
  );
}
