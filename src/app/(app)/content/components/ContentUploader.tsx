"use client";

import { useState } from "react";

export type ContentUploaderProps = {
  tenantId: string;
  onUploaded?: () => void;
};

export function ContentUploader({ tenantId, onUploaded }: ContentUploaderProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<"tenant" | "teachers" | "public">(
    "tenant",
  );
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setStatus("pending");
    setError(null);
    try {
      const res = await fetch("/content/api/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantId,
          file: {
            fileName: fileName || title,
            mimeType: mimeType || null,
            fileUrl: fileUrl || null,
          },
          metadata: {
            title,
            description: description || null,
            visibility,
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          },
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Upload failed (${res.status})`);
      }
      setStatus("success");
      setTitle("");
      setDescription("");
      setFileName("");
      setFileUrl("");
      setMimeType("");
      setTags("");
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
        Upload content
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="Title" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
            required
          />
        </Field>
        <Field label="File name">
          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="e.g. scales.pdf"
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
          rows={3}
        />
      </Field>
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="File URL">
          <input
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
          />
        </Field>
        <Field label="MIME type">
          <input
            value={mimeType}
            onChange={(e) => setMimeType(e.target.value)}
            placeholder="application/pdf"
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
          />
        </Field>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="Tags (comma-separated)">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="scales, violin, beginner"
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
          />
        </Field>
        <Field label="Visibility">
          <select
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as "tenant" | "teachers" | "public")
            }
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
          >
            <option value="tenant">Tenant (everyone)</option>
            <option value="teachers">Teachers only</option>
            <option value="public">Public (families, students)</option>
          </select>
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs">
          {status === "pending" ? (
            <span className="text-[var(--z-muted)]">Uploading…</span>
          ) : status === "success" ? (
            <span className="text-[#c4f036]">Uploaded</span>
          ) : error ? (
            <span className="text-[var(--z-danger)]">{error}</span>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={status === "pending"}
          className="rounded-md bg-[#c4f036]/15 border border-[#c4f036]/40 px-3 py-1.5 text-sm font-semibold text-[#c4f036] hover:bg-[#c4f036]/25 disabled:opacity-50"
        >
          Upload
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
        {required ? <span className="text-[var(--z-danger)]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
