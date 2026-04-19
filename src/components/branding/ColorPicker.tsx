"use client";

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
};

export function ColorPicker({ label, value, onChange, disabled }: ColorPickerProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith("#") ? value.slice(0, 7) : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-9 w-12 cursor-pointer rounded border border-[var(--z-border)] bg-[var(--z-surface)] p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1.5 font-mono text-sm text-[var(--z-fg)]"
        />
      </div>
    </label>
  );
}
