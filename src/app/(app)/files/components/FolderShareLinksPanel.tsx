"use client";

import { useEffect, useMemo, useState } from "react";
import type { FileShareLink } from "@/lib/files/types";
import { AccessLogsPanel } from "./AccessLogsPanel";
import { ShareLinkRow } from "./ShareLinkRow";
import { showFilesToast } from "./filesToast";

interface FilesDashboardResponse {
  data?: {
    shareLinks?: FileShareLink[];
    files?: Array<{
      id: string;
      folderId: string | null;
      name: string;
      metadata?: Record<string, unknown>;
    }>;
  };
}

type SharePermission = "view" | "upload" | "view-upload";
type ShareLinkOverride = {
  permissionLevel?: SharePermission;
  expiresAt?: string | null;
  disabled?: boolean;
  passwordEnabled?: boolean;
};

type AccessLogEntry = {
  timestamp?: string | null;
  at?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fileName?: string | null;
  folderName?: string | null;
  target?: string | null;
};

export interface FolderShareLinksPanelProps {
  open: boolean;
  folderId: string | null;
  folderName?: string | null;
  canShare?: boolean;
  accessLogsLinkId?: string | null;
  onAccessLogsLinkIdChange?: (id: string | null) => void;
  onClose: () => void;
}

function shareUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/files/share/${token}`;
  }
  return `/files/share/${token}`;
}

function mergeShareLinkPatch(link: FileShareLink, patch: Record<string, unknown>): FileShareLink {
  const metadataPatch =
    patch.metadata && typeof patch.metadata === "object"
      ? (patch.metadata as Record<string, unknown>)
      : null;
  return {
    ...link,
    ...(patch as Partial<FileShareLink>),
    metadata: metadataPatch ? { ...(link.metadata ?? {}), ...metadataPatch } : link.metadata,
  };
}

export function FolderShareLinksPanel({
  open,
  folderId,
  folderName,
  canShare = false,
  accessLogsLinkId = null,
  onAccessLogsLinkIdChange,
  onClose,
}: FolderShareLinksPanelProps) {
  const [links, setLinks] = useState<FileShareLink[]>([]);
  const [files, setFiles] = useState<
    Array<{
      id: string;
      folderId: string | null;
      name: string;
      metadata?: Record<string, unknown>;
    }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresDate, setExpiresDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, ShareLinkOverride>>({});
  const [creatingIds, setCreatingIds] = useState<Record<string, true>>({});

  const folderLinks = useMemo(
    () => links.filter((link) => link.folderId === folderId),
    [links, folderId],
  );

  useEffect(() => {
    if (!open || !folderId) return;
    setOverrides({});
    setCreatingIds({});
    setBusy(true);
    setError(null);
    void fetch(`/api/files?folderId=${encodeURIComponent(folderId)}`, { method: "GET" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load links (${res.status})`);
        const data = (await res.json()) as FilesDashboardResponse;
        setLinks(data.data?.shareLinks ?? []);
        setFiles(data.data?.files ?? []);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to load links";
        setError(msg);
      })
      .finally(() => setBusy(false));
  }, [open, folderId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (accessLogsLinkId) {
        onAccessLogsLinkIdChange?.(null);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, accessLogsLinkId, onAccessLogsLinkIdChange]);

  useEffect(() => {
    if (!open || !folderId || !accessLogsLinkId) return;
    const exists = folderLinks.some((link) => link.id === accessLogsLinkId);
    if (!exists) onAccessLogsLinkIdChange?.(null);
  }, [open, folderId, accessLogsLinkId, folderLinks, onAccessLogsLinkIdChange]);

  const createLink = async () => {
    if (!folderId || !canShare) return;
    setCreateBusy(true);
    setError(null);
    const optimistic: FileShareLink = {
      id: `temp-${Date.now()}`,
      tenantId: "",
      fileId: null,
      folderId,
      token: `creating-${Date.now()}`,
      status: "active",
      passwordHash: passwordEnabled && password ? "pending" : null,
      expiresAt: expiresDate ? new Date(`${expiresDate}T23:59:59.000Z`).toISOString() : null,
      maxViews: null,
      viewCount: 0,
      allowDownload: false,
      metadata: { permissionLevel: "view", linkDisabled: false, passwordEnabled },
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLinks((prev) => [optimistic, ...prev]);
    setCreatingIds((prev) => ({ ...prev, [optimistic.id]: true }));

    try {
      const res = await fetch("/api/files/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          folderId,
          password: passwordEnabled && password ? password : null,
          expiresInSeconds: expiresDate
            ? Math.max(
                1,
                Math.floor((new Date(`${expiresDate}T23:59:59.000Z`).getTime() - Date.now()) / 1000),
              )
            : null,
          allowDownload: false,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Create failed (${res.status})`);
      }

      const data = (await res.json()) as { data?: FileShareLink };
      const created = data.data ?? optimistic;
      setLinks((prev) => [created, ...prev.filter((x) => x.id !== optimistic.id)]);
      setCreatingIds((prev) => {
        const next = { ...prev };
        delete next[optimistic.id];
        if (created.id !== optimistic.id) next[created.id] = true;
        return next;
      });
      window.setTimeout(() => {
        setCreatingIds((prev) => {
          const next = { ...prev };
          delete next[created.id];
          return next;
        });
      }, 500);

      setPassword("");
      setExpiresDate("");
      setPasswordEnabled(false);
      showFilesToast("Share link created.", "success");
    } catch (err) {
      setLinks((prev) => prev.filter((x) => x.id !== optimistic.id));
      setCreatingIds((prev) => {
        const next = { ...prev };
        delete next[optimistic.id];
        return next;
      });
      const msg = err instanceof Error ? err.message : "Could not create share link";
      setError(msg);
      showFilesToast(msg, "error");
    } finally {
      setCreateBusy(false);
    }
  };

  const patchLink = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch("/api/files/share", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Update failed (${res.status})`);
    }
    const data = (await res.json()) as { data?: FileShareLink };
    if (data.data) {
      setLinks((prev) => prev.map((x) => (x.id === id ? data.data! : x)));
    }
  };

  const getLinkPermission = (link: FileShareLink): SharePermission => {
    const local = overrides[link.id]?.permissionLevel;
    if (local) return local;
    const raw = link.metadata?.permissionLevel;
    if (raw === "view" || raw === "upload" || raw === "view-upload") return raw;
    return "view";
  };

  const updateRow = async (linkId: string, patch: Record<string, unknown>) => {
    const link = links.find((row) => row.id === linkId);
    if (!link) return;

    const previousLinks = links;
    const previousOverrides = overrides;
    const metadataPatch =
      patch.metadata && typeof patch.metadata === "object"
        ? (patch.metadata as Record<string, unknown>)
        : null;

    const nextPermissionRaw = metadataPatch?.permissionLevel;
    const nextPermission =
      nextPermissionRaw === "view" ||
      nextPermissionRaw === "upload" ||
      nextPermissionRaw === "view-upload"
        ? (nextPermissionRaw as SharePermission)
        : null;
    const nextPasswordEnabledRaw = metadataPatch?.passwordEnabled;
    const nextPasswordEnabled =
      typeof nextPasswordEnabledRaw === "boolean" ? nextPasswordEnabledRaw : null;
    const nextExpiresAt = Object.prototype.hasOwnProperty.call(patch, "expiresAt")
      ? ((patch.expiresAt ?? null) as string | null)
      : undefined;
    const nextDisabledRaw = patch.linkDisabled ?? metadataPatch?.linkDisabled;
    const nextDisabled = typeof nextDisabledRaw === "boolean" ? nextDisabledRaw : undefined;

    setOverrides((prev) => ({
      ...prev,
      [linkId]: {
        ...(prev[linkId] ?? {}),
        ...(nextPermission ? { permissionLevel: nextPermission } : {}),
        ...(nextExpiresAt !== undefined ? { expiresAt: nextExpiresAt } : {}),
        ...(nextDisabled !== undefined ? { disabled: nextDisabled } : {}),
        ...(nextPasswordEnabled !== null ? { passwordEnabled: nextPasswordEnabled } : {}),
      },
    }));
    setLinks((prev) => prev.map((row) => (row.id === linkId ? mergeShareLinkPatch(row, patch) : row)));

    try {
      await patchLink(linkId, patch);
    } catch (err) {
      setLinks(previousLinks);
      setOverrides(previousOverrides);
      throw err;
    }
  };

  const selectedLogs = useMemo<AccessLogEntry[]>(() => {
    if (!accessLogsLinkId) return [];
    const link = folderLinks.find((row) => row.id === accessLogsLinkId);
    const fromLink = link?.metadata?.accessLogs;
    if (Array.isArray(fromLink)) {
      return fromLink.filter((x): x is AccessLogEntry => typeof x === "object" && x !== null);
    }
    const fallback: AccessLogEntry[] = [];
    for (const file of files) {
      if ((file.folderId ?? null) !== (folderId ?? null)) continue;
      const rawLogs = file.metadata?.accessLogs;
      if (!Array.isArray(rawLogs)) continue;
      for (const log of rawLogs) {
        if (!log || typeof log !== "object") continue;
        const record = log as Record<string, unknown>;
        if (record.linkId && typeof record.linkId === "string" && record.linkId !== accessLogsLinkId) {
          continue;
        }
        fallback.push({
          timestamp:
            typeof record.timestamp === "string"
              ? record.timestamp
              : typeof record.at === "string"
                ? record.at
                : null,
          ip: typeof record.ip === "string" ? record.ip : null,
          userAgent: typeof record.userAgent === "string" ? record.userAgent : null,
          fileName: file.name,
          target: file.name,
        });
      }
    }
    return fallback;
  }, [accessLogsLinkId, folderLinks, files, folderId]);

  const removeLink = async (id: string) => {
    const previousLinks = links;
    const previousOverrides = overrides;
    setLinks((cur) => cur.filter((x) => x.id !== id));
    setOverrides((cur) => {
      const next = { ...cur };
      delete next[id];
      return next;
    });
    try {
      const res = await fetch(`/api/files/share?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      showFilesToast("Share link removed.", "success");
    } catch (err) {
      setLinks(previousLinks);
      setOverrides(previousOverrides);
      showFilesToast(err instanceof Error ? err.message : "Could not remove link", "error");
      throw err;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex" role="presentation">
      <button
        type="button"
        aria-label="Close share links panel"
        className="flex-1 bg-black/45"
        onClick={onClose}
      />
      <aside className="h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
                Folder share links
              </div>
              <div className="text-sm font-semibold text-[var(--z-fg)]">{folderName ?? "Folder"}</div>
            </div>
            <button
              type="button"
              className="rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="space-y-3 border-b border-[var(--z-border)] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              Create link
            </div>
            <label className="flex items-center gap-2 text-xs text-[var(--z-fg)]">
              <input
                type="checkbox"
                checked={passwordEnabled}
                onChange={(e) => setPasswordEnabled(e.target.checked)}
              />
              Password protect
            </label>
            {passwordEnabled ? (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="new-password"
                className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
              />
            ) : null}
            <label className="block text-xs">
              <span className="mb-1 block text-[var(--z-muted)]">Expiration date</span>
              <input
                type="date"
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
                className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
              />
            </label>
            <button
              type="button"
              disabled={!canShare || createBusy || !folderId}
              onClick={() => void createLink()}
              className="w-full rounded bg-[var(--z-accent)] px-2 py-1.5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createBusy ? "Creating..." : "Create new link"}
            </button>
            {error ? <div className="text-xs text-red-400">{error}</div> : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {busy ? <div className="text-xs text-[var(--z-muted)]">Loading links...</div> : null}
            {!busy && folderLinks.length === 0 ? (
              <div className="rounded border border-dashed border-[var(--z-border)] px-3 py-6 text-center text-xs text-[var(--z-muted)]">
                No share links yet
              </div>
            ) : null}
            <ul className="space-y-2">
              {folderLinks.map((link) => {
                const rowOverrides = overrides[link.id] ?? {};
                const permission = rowOverrides.permissionLevel ?? getLinkPermission(link);
                const passwordEnabledValue = Boolean(
                  rowOverrides.passwordEnabled ?? link.passwordHash ?? link.metadata?.passwordEnabled,
                );
                const linkWithOverrides = {
                  ...link,
                  metadata: {
                    ...(link.metadata ?? {}),
                    permissionLevel: permission,
                    passwordEnabled: passwordEnabledValue,
                  },
                } as FileShareLink;

                return (
                  <ShareLinkRow
                    key={link.id}
                    link={linkWithOverrides}
                    permissionOverride={permission}
                    expirationOverride={rowOverrides.expiresAt}
                    disabledOverride={rowOverrides.disabled}
                    passwordEnabledOverride={rowOverrides.passwordEnabled}
                    onUpdate={updateRow}
                    onDelete={removeLink}
                    onOpenLogs={(targetId) => onAccessLogsLinkIdChange?.(targetId)}
                    isCreating={Boolean(creatingIds[link.id])}
                  />
                );
              })}
            </ul>
          </div>
        </div>
        <AccessLogsPanel
          open={accessLogsLinkId != null}
          linkLabel={
            accessLogsLinkId
              ? shareUrl(folderLinks.find((row) => row.id === accessLogsLinkId)?.token ?? "")
              : "Share link"
          }
          logs={selectedLogs}
          onClose={() => onAccessLogsLinkIdChange?.(null)}
        />
      </aside>
    </div>
  );
}
