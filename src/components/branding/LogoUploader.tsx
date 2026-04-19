"use client";

type LogoUploaderProps = {
  lightUrl: string | null;
  darkUrl: string | null;
  onLightChange: (v: string | null) => void;
  onDarkChange: (v: string | null) => void;
  disabled?: boolean;
};

export function LogoUploader({
  lightUrl,
  darkUrl,
  onLightChange,
  onDarkChange,
  disabled,
}: LogoUploaderProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field
        label="Logo (light background)"
        value={lightUrl ?? ""}
        onChange={(v) => onLightChange(v || null)}
        disabled={disabled}
      />
      <Field
        label="Logo (dark background)"
        value={darkUrl ?? ""}
        onChange={(v) => onDarkChange(v || null)}
        disabled={disabled}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </span>
      <input
        type="url"
        placeholder="https://…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
      />
    </label>
  );
}
