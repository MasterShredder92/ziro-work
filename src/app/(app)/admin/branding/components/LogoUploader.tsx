"use client";

import { useRef, useState } from "react";

export interface LogoUploaderProps {
  label: string;
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
  backgroundStyle?: "light" | "dark";
  accept?: string;
  description?: string;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function LogoUploader({
  label,
  value,
  onChange,
  disabled,
  backgroundStyle = "dark",
  accept = "image/png,image/jpeg,image/svg+xml,image/webp",
  description,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [urlInput, setUrlInput] = useState<string>(value ?? "");
  const [busy, setBusy] = useState(false);

  const previewBg =
    backgroundStyle === "light"
      ? "bg-white text-black"
      : "bg-[#0b0b0d] text-white";

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
      setUrlInput(dataUrl.startsWith("data:") ? "" : dataUrl);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
          {label}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
            className="h-8 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 text-xs text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Upload"}
          </button>
          {value ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange(null);
                setUrlInput("");
              }}
              className="h-8 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] disabled:opacity-50"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <div
        className={`flex items-center justify-center rounded-[var(--z-radius-sm)] h-28 ${previewBg}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className="max-h-20 max-w-[80%] object-contain"
          />
        ) : (
          <div className="text-xs text-[var(--z-muted)]">No image</div>
        )}
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
          or paste URL
        </span>
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onBlur={() => {
            if (urlInput.trim() !== (value ?? "")) {
              onChange(urlInput.trim() || null);
            }
          }}
          placeholder="https://…"
          disabled={disabled}
          className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
        />
      </label>
      {description ? (
        <div className="text-[11px] text-[var(--z-muted)]">{description}</div>
      ) : null}
    </div>
  );
}
