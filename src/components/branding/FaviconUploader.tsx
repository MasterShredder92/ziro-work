"use client";

type FaviconUploaderProps = {
  favicon: string | null;
  app192: string | null;
  app512: string | null;
  onChange: (patch: {
    favicon?: string | null;
    appIcon192?: string | null;
    appIcon512?: string | null;
  }) => void;
  disabled?: boolean;
};

export function FaviconUploader({
  favicon,
  app192,
  app512,
  onChange,
  disabled,
}: FaviconUploaderProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <UrlField
        label="Favicon"
        value={favicon ?? ""}
        onChange={(v) => onChange({ favicon: v || null })}
        disabled={disabled}
      />
      <UrlField
        label="App icon 192"
        value={app192 ?? ""}
        onChange={(v) => onChange({ appIcon192: v || null })}
        disabled={disabled}
      />
      <UrlField
        label="App icon 512"
        value={app512 ?? ""}
        onChange={(v) => onChange({ appIcon512: v || null })}
        disabled={disabled}
      />
    </div>
  );
}

function UrlField({
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
