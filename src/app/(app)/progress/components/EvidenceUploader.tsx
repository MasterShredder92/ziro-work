"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function EvidenceUploader({
  checkpointId,
  studentId,
  tenantId,
  disabled = false,
}: {
  checkpointId: string;
  studentId?: string;
  tenantId?: string;
  disabled?: boolean;
}) {
  const [body, setBody] = useState("");
  const [kind, setKind] =
    useState<"note" | "image" | "video" | "audio" | "document" | "link">(
      "note",
    );
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = () => {
    setError(null);
    setSuccess(null);

    if (!body.trim() && !fileUrl.trim()) {
      setError("Please include a note or attach a link/file URL.");
      return;
    }

    start(async () => {
      try {
        const res = await fetch("/progress/api/evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkpointId,
            studentId,
            tenantId,
            body: body.trim() || null,
            kind,
            fileUrl: fileUrl.trim() || null,
            fileName: fileName.trim() || null,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Upload failed (${res.status})`);
        }

        setBody("");
        setFileUrl("");
        setFileName("");
        setSuccess("Evidence submitted.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  };

  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3">
      <div className="text-sm font-semibold text-[var(--z-fg)]">
        Add evidence
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-[var(--z-muted)]">
          Kind
          <select
            value={kind}
            onChange={(e) =>
              setKind(
                e.target.value as
                  | "note"
                  | "image"
                  | "video"
                  | "audio"
                  | "document"
                  | "link",
              )
            }
            className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
            disabled={disabled || pending}
          >
            <option value="note">Note</option>
            <option value="link">Link</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="document">Document</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--z-muted)]">
          File / link URL (optional)
          <input
            type="url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://…"
            className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
            disabled={disabled || pending}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--z-muted)] sm:col-span-2">
          File label (optional)
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Scales.mp3"
            className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
            disabled={disabled || pending}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-[var(--z-muted)]">
        Notes
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
          placeholder="Reflection, practice log, teacher observation…"
          disabled={disabled || pending}
        />
      </label>

      {error ? (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          {success}
        </div>
      ) : null}

      <div className="flex items-center justify-end">
        <button
          type="button"
          disabled={disabled || pending}
          onClick={submit}
          className="rounded-md bg-[#00ff88] px-3 py-1.5 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit evidence"}
        </button>
      </div>
    </div>
  );
}
