"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FileFolder, FileSurface, FileSignedUrl } from "@/lib/files/types";
import { FilesBreadcrumbs, type FilesCrumb } from "./FilesBreadcrumbs";
import { folderColorHex } from "./FolderColorPicker";
import { FilePreview } from "./previews/FilePreview";
import { FileUploadModal } from "./FileUploadModal";
import { ShareLinkManager } from "./ShareLinkManager";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { showFilesToast } from "./filesToast";

export interface FileDetailViewProps {
  surface: FileSurface;
  signedUrl?: FileSignedUrl | null;
  /** All folders (flat) for move-to-folder control */
  folders?: FileFolder[];
}

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

export function FileDetailView({
  surface,
  signedUrl,
  folders = [],
}: FileDetailViewProps) {
  const router = useRouter();
  const { file, folder, versions, shareLinks, signatureRequests, permissions } =
    surface;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(file.name);
  const [moveFolderId, setMoveFolderId] = useState<string | "">(
    file.folderId ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<FileSignedUrl | null>(signedUrl ?? null);

  useEffect(() => {
    setRenameValue(file.name);
    setMoveFolderId(file.folderId ?? "");
  }, [file.id, file.name, file.folderId]);

  useEffect(() => {
    if (!url && file.storageKey) {
      fetch(`/api/files/${file.id}?signedUrl=true`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.data?.signedUrl) setUrl(data.data.signedUrl);
        })
        .catch(() => {});
    }
  }, [file.id, file.storageKey, url]);

  const crumbs = useMemo(() => {
    const items: FilesCrumb[] = [
      { label: "Files", href: "/files" },
      { label: "Explorer", href: "/files/explorer" },
    ];
    if (folder) {
      const fid = file.folderId ?? folder.id;
      items.push({
        label: folder.path || folder.name,
        href: fid
          ? `/files/explorer?folderId=${encodeURIComponent(fid)}`
          : "/files/explorer",
        colorHex: folderColorHex(folder),
      });
    }
    items.push({ label: file.name });
    return items;
  }, [file.folderId, file.name, folder]);

  const onDelete = async () => {
    if (!permissions.canWrite) {
      showFilesToast("You do not have permission to delete this file.", "error");
      return;
    }
    if (!window.confirm(`Delete ${file.name}? This action cannot be undone.`)) return;
    const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    if (res.ok) {
      showFilesToast("File deleted.", "success");
      router.push("/files");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      showFilesToast(data?.error || "Delete failed", "error");
    }
  };

  const submitRename = async () => {
    if (!renameValue.trim() || renameValue === file.name) {
      setRenameOpen(false);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Rename failed (${res.status})`);
      }
      showFilesToast("File renamed.", "success");
      setRenameOpen(false);
      router.refresh();
    } catch (e) {
      showFilesToast(e instanceof Error ? e.message : "Rename failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const submitMove = async () => {
    const next =
      moveFolderId === "" ? null : (moveFolderId as string);
    if (next === (file.folderId ?? null)) {
      setMoveOpen(false);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ folderId: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Move failed (${res.status})`);
      }
      showFilesToast("File moved.", "success");
      setMoveOpen(false);
      router.refresh();
    } catch (e) {
      showFilesToast(e instanceof Error ? e.message : "Move failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <FilesBreadcrumbs items={crumbs} />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
            {folder?.path ?? "Files"}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--z-fg)]">{file.name}</h1>
          {file.description ? (
            <p className="mt-1 max-w-2xl text-sm text-[var(--z-muted)]">
              {file.description}
            </p>
          ) : null}
          {permissions.hints?.read ? (
            <p className="mt-2 text-xs text-amber-200/90">{permissions.hints.read}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {url?.url ? (
            <a
              href={url.url}
              target="_blank"
              rel="noreferrer"
              download={file.name}
              className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]"
            >
              Download
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setRenameOpen(true)}
            disabled={!permissions.canWrite || file.status === "archived"}
            title={
              !permissions.canWrite
                ? (permissions.hints?.write ?? undefined)
                : file.status === "archived"
                  ? "Cannot rename an archived file"
                  : undefined
            }
            className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => setMoveOpen(true)}
            disabled={!permissions.canWrite || file.status === "archived"}
            title={
              !permissions.canWrite
                ? (permissions.hints?.write ?? undefined)
                : file.status === "archived"
                  ? "Cannot move an archived file"
                  : undefined
            }
            className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Move
          </button>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            disabled={!permissions.canWrite || file.status === "archived"}
            title={
              !permissions.canWrite
                ? (permissions.hints?.write ?? undefined)
                : file.status === "archived"
                  ? "Cannot upload versions to an archived file"
                  : undefined
            }
            className="rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            New version
          </button>
          {permissions.canSign ? (
            <Link
              href={`/files/signatures/new?fileId=${file.id}`}
              className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]"
            >
              Request signature
            </Link>
          ) : (
            <span
              className="cursor-not-allowed rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-muted)] opacity-50"
              title={permissions.hints?.sign ? permissions.hints.sign : "Signing not available"}
            >
              Request signature
            </span>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={!permissions.canWrite}
            title={!permissions.canWrite ? (permissions.hints?.write ?? undefined) : undefined}
            className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <FilePreview url={url?.url ?? null} mimeType={file.mimeType} name={file.name} />

          {signatureRequests.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Signature requests
              </h2>
              <div className="overflow-hidden rounded-md border border-[var(--z-border)] bg-[var(--z-surface)]">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Title</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Signers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--z-border)]">
                    {signatureRequests.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2">
                          <Link
                            href={`/files/signatures/${r.id}`}
                            className="font-medium text-[var(--z-accent)] hover:underline"
                          >
                            {r.title}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-xs text-[var(--z-muted)]">{r.status}</td>
                        <td className="px-3 py-2 text-xs text-[var(--z-muted)]">
                          {r.signers.length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:border-l lg:border-[var(--z-border)] lg:pl-6">
          <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              Permissions
            </h3>
            <dl className="mt-2 space-y-1 text-[11px] text-[var(--z-muted)]">
              <PermRow label="Read" ok={permissions.canRead} hint={permissions.hints?.read} />
              <PermRow label="Write" ok={permissions.canWrite} hint={permissions.hints?.write} />
              <PermRow label="Share" ok={permissions.canShare} hint={permissions.hints?.share} />
              <PermRow label="Sign" ok={permissions.canSign} hint={permissions.hints?.sign} />
            </dl>
          </div>

          <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              Details
            </h3>
            <dl className="mt-2 space-y-1 text-sm">
              <Row label="Type" value={file.mimeType} />
              <Row label="Size" value={formatBytes(file.size)} />
              <Row label="Visibility" value={file.visibility} />
              <Row label="Status" value={file.status} />
              <Row label="Scan" value={file.virusScanStatus} />
              <Row label="Signature" value={file.signatureStatus ?? "—"} />
              <Row label="Created" value={new Date(file.createdAt).toLocaleString()} />
              <Row label="Updated" value={new Date(file.updatedAt).toLocaleString()} />
            </dl>
          </div>

          <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              Version history
            </h3>
            <VersionHistoryPanel
              file={file}
              fileId={file.id}
              versions={versions}
              currentVersionId={file.currentVersionId}
              canWrite={permissions.canWrite && file.status !== "archived"}
              onVersionsChanged={() => {
                showFilesToast("Version updated.", "success");
                router.refresh();
              }}
            />
          </div>

          <ShareLinkManager
            fileId={file.id}
            shareLinks={shareLinks}
            canShare={permissions.canShare}
          />
        </aside>
      </div>

      <FileUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        targetFileId={file.id}
      />

      {renameOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-md rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-title"
          >
            <h2 id="rename-title" className="text-base font-semibold text-[var(--z-fg)]">
              Rename file
            </h2>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="mt-3 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="rounded-md border border-[var(--z-border)] px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRename}
                disabled={busy}
                className="rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {moveOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-md rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-base font-semibold text-[var(--z-fg)]">Move to folder</h2>
            <select
              value={moveFolderId}
              onChange={(e) => setMoveFolderId(e.target.value)}
              className="mt-3 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
            >
              <option value="">(root — no folder)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id} disabled={f.id === file.folderId}>
                  {f.path || f.name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMoveOpen(false)}
                className="rounded-md border border-[var(--z-border)] px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMove}
                disabled={busy}
                className="rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-xs text-[var(--z-muted)]">{label}</dt>
      <dd className="truncate text-right text-xs text-[var(--z-fg)]">{value}</dd>
    </div>
  );
}

function PermRow({
  label,
  ok,
  hint,
}: {
  label: string;
  ok: boolean;
  hint?: string | null;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between gap-2">
        <dt>{label}</dt>
        <dd className={ok ? "text-emerald-300/90" : "text-amber-200/90"}>
          {ok ? "Allowed" : "Blocked"}
        </dd>
      </div>
      {!ok && hint ? (
        <dd className="text-[10px] leading-snug text-[var(--z-muted)]">{hint}</dd>
      ) : null}
    </div>
  );
}
