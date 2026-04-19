"use client";

export type ColorPickerProps = {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function ColorPicker({ label, value, onChange, disabled }: ColorPickerProps) {
  const v = value ?? "#000000";
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={v}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] disabled:cursor-not-allowed"
        />
        <input
          type="text"
          value={v}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-28 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-2 font-mono text-xs"
        />
      </div>
    </label>
  );
}
