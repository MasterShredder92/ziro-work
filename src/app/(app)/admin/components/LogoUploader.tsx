"use client";

import { useRef, useState } from "react";

export type LogoUploaderProps = {
  label?: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  disabled?: boolean;
};

export function LogoUploader({
  label = "Logo",
  value,
  onChange,
  disabled,
}: LogoUploaderProps) {
  const [url, setUrl] = useState(value ?? "");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("File too large (max 2MB)");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setUrl(result);
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </span>
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)]">
          {url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={url}
              alt="Logo preview"
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs text-[var(--z-muted)]">No logo</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <input
            type="url"
            placeholder="https://..."
            value={url}
            disabled={disabled}
            onChange={(e) => {
              setUrl(e.target.value);
              onChange(e.target.value || null);
            }}
            className="h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileRef.current?.click()}
              className="h-8 rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 text-xs text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50"
            >
              Upload file
            </button>
            {url ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setUrl("");
                  onChange(null);
                }}
                className="h-8 rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              >
                Remove
              </button>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
              disabled={disabled}
            />
          </div>
          {error ? (
            <div className="text-xs text-red-400">{error}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
