"use client";

import { useMemo, useState } from "react";
import type { FileObject, FileVersion } from "@/lib/files/types";

function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let v = n;
  while (v >= 1024 && idx < units.length - 1) {
    v /= 1024;
    idx += 1;
  }
  return `${v.toFixed(v >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export interface VersionHistoryPanelProps {
  file: Pick<FileObject, "id" | "status" | "metadata">;
  fileId: string;
  versions: FileVersion[];
  currentVersionId: string | null;
  canWrite: boolean;
  onVersionsChanged?: () => void;
}

export function VersionHistoryPanel({
  file,
  fileId,
  versions,
  currentVersionId,
  canWrite,
  onVersionsChanged,
}: VersionHistoryPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);

  const current = useMemo(
    () => versions.find((v) => v.id === currentVersionId) ?? versions[0],
    [versions, currentVersionId],
  );

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
      onVersionsChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  const download = (versionId: string) =>
    run(async () => {
      setBusyId(versionId);
      const res = await fetch(
        `/api/files/${fileId}/versions/${versionId}?signedUrl=true&ttl=3600`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Download failed (${res.status})`);
      }
      const data = await res.json();
      const url = data?.data?.signedUrl?.url as string | undefined;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });

  const restore = (versionId: string) =>
    run(async () => {
      if (!window.confirm("Make this revision the current version of the file?")) return;
      setBusyId(versionId);
      const res = await fetch(`/api/files/${fileId}/versions/${versionId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Restore failed (${res.status})`);
      }
    });

  const remove = (versionId: string) =>
    run(async () => {
      if (!window.confirm("Permanently delete this revision from history?")) return;
      setBusyId(versionId);
      const res = await fetch(`/api/files/${fileId}/versions/${versionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Delete failed (${res.status})`);
      }
    });

  const downloadAllZip = () =>
    run(async () => {
      setBusyId("zip");
      const res = await fetch(`/api/files/${fileId}/versions/zip`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `ZIP failed (${res.status})`);
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `versions-${fileId}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

  const compareMeta = (a: FileVersion, b: FileVersion) => {
    const keys = ["size", "mimeType", "checksum", "notes"] as const;
    const lines: string[] = [];
    for (const k of keys) {
      const av = String(a[k] ?? "—");
      const bv = String(b[k] ?? "—");
      if (av !== bv) lines.push(`${k}: ${av} → ${bv}`);
    }
    return lines.length ? lines.join("\n") : "No metadata differences detected.";
  };

  if (versions.length === 0) {
    return (
      <div className="mt-2 rounded-md border border-dashed border-[var(--z-border)] px-3 py-6 text-center text-xs text-[var(--z-muted)]">
        No version history yet.
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {error ? (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-xs text-red-400">
          {error}
        </div>
      ) : null}
      {file.status === "archived" ? (
        <p className="text-[11px] text-[var(--z-muted)]">
          File is archived — versions are read-only until status changes.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busyId === "zip"}
          onClick={() => void downloadAllZip()}
          className="rounded border border-[var(--z-border)] px-2 py-1 text-[11px] text-[var(--z-fg)] hover:bg-white/[0.06] disabled:opacity-50"
        >
          {busyId === "zip" ? "Preparing…" : "Download all as ZIP"}
        </button>
      </div>
      <ul className="max-h-[min(420px,50vh)] space-y-1 overflow-y-auto pr-1">
        {versions.map((v) => {
          const isCurrent = v.id === currentVersionId;
          const lastRestored =
            typeof file.metadata?.lastRestoredVersion === "number"
              ? file.metadata.lastRestoredVersion
              : null;
          const restored = lastRestored === v.version;
          return (
            <li
              key={v.id}
              className={`flex flex-col gap-1 rounded-md border px-2 py-2 text-xs transition-colors ${
                isCurrent
                  ? "border-[color-mix(in_oklab,var(--z-accent),transparent_60%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)]"
                  : "border-[var(--z-border)] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[var(--z-fg)]">v{v.version}</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {isCurrent ? (
                    <span className="rounded-full bg-[var(--z-accent)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--z-accent)]">
                      Current
                    </span>
                  ) : null}
                  {restored ? (
                    <span className="rounded-full border border-amber-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">
                      Restored
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="text-[var(--z-muted)]">
                {v.uploadedBy
                  ? `Uploaded by ${v.uploadedBy.slice(0, 8)}… · `
                  : ""}
                {formatBytes(v.size)} · chk {v.checksum?.slice(0, 8) ?? "—"}… ·{" "}
                {new Date(v.createdAt).toLocaleString()}
                {v.notes ? ` · ${v.notes}` : ""}
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                <button
                  type="button"
                  disabled={busyId === v.id}
                  onClick={() => void download(v.id)}
                  className="rounded border border-[var(--z-border)] px-2 py-0.5 text-[11px] text-[var(--z-fg)] hover:bg-white/[0.06] disabled:opacity-50"
                >
                  {busyId === v.id ? "…" : "Download"}
                </button>
                {current && !isCurrent ? (
                  <button
                    type="button"
                    className="rounded border border-[var(--z-border)] px-2 py-0.5 text-[11px] text-[var(--z-fg)] hover:bg-white/[0.06]"
                    onClick={() => setCompareId(v.id)}
                  >
                    Compare
                  </button>
                ) : null}
                {canWrite ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === v.id || isCurrent}
                      onClick={() => void restore(v.id)}
                      className="rounded border border-[var(--z-border)] px-2 py-0.5 text-[11px] text-[var(--z-fg)] hover:bg-white/[0.06] disabled:opacity-40"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      disabled={busyId === v.id || isCurrent}
                      onClick={() => void remove(v.id)}
                      className="rounded border border-red-500/30 px-2 py-0.5 text-[11px] text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {compareId && current ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-xs text-[var(--z-fg)] shadow-xl">
            <h4 className="text-sm font-semibold">Compare versions (metadata)</h4>
            <p className="mt-1 text-[var(--z-muted)]">
              Structural diff of stored metadata — binary content is not diffed here.
            </p>
            <pre className="mt-3 whitespace-pre-wrap rounded border border-[var(--z-border)] bg-black/20 p-3 text-[11px] text-[var(--z-muted)]">
              {compareMeta(
                versions.find((x) => x.id === compareId)!,
                current,
              )}
            </pre>
            <button
              type="button"
              className="mt-3 rounded-md border border-[var(--z-border)] px-3 py-1.5 text-[var(--z-fg)]"
              onClick={() => setCompareId(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
