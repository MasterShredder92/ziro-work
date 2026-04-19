"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FileFolder } from "@/lib/files/types";
import { showFilesToast } from "./filesToast";

export interface FolderManagerProps {
  folders: FileFolder[];
  canWrite: boolean;
}

export function FolderManager({ folders, canWrite }: FolderManagerProps) {
  const router = useRouter();
  const [localFolders, setLocalFolders] = useState<FileFolder[]>(folders);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalFolders(folders);
  }, [folders]);

  const createFolder = async () => {
    if (!name.trim()) {
      setError("Folder name is required");
      return;
    }
    setBusy(true);
    setError(null);
    const optimisticId = `temp-${Date.now()}`;
    const trimmed = name.trim();
    setLocalFolders((prev) => [
      ...prev,
      {
        id: optimisticId,
        tenantId: "",
        parentId: parentId || null,
        name: trimmed,
        description: null,
        path: trimmed,
        ownerId: null,
        visibility: "tenant",
        acl: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: null,
        updatedBy: null,
      },
    ]);
    setName("");
    setParentId("");
    try {
      const res = await fetch("/api/files/folders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed, parentId: parentId || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Create failed (${res.status})`);
      }
      const data = await res.json();
      const created = data?.data as FileFolder | undefined;
      if (created) {
        setLocalFolders((prev) =>
          prev
            .filter((f) => f.id !== optimisticId)
            .concat(created)
            .sort((a, b) => (a.path || a.name).localeCompare(b.path || b.name)),
        );
      }
      showFilesToast("Folder created.", "success");
      router.refresh();
    } catch (err) {
      setLocalFolders((prev) => prev.filter((f) => f.id !== optimisticId));
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteFolder = async (id: string) => {
    if (!window.confirm("Delete this folder? Files inside will be orphaned.")) return;
    const prevSnap = localFolders;
    setLocalFolders((cur) => cur.filter((f) => f.id !== id));
    setBusy(true);
    try {
      const res = await fetch(`/api/files/folders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Delete failed (${res.status})`);
      }
      showFilesToast("Folder deleted.", "success");
      router.refresh();
    } catch (err) {
      setLocalFolders(prevSnap);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const renameFolder = async (f: FileFolder) => {
    const next = window.prompt("New folder name", f.name);
    if (!next || next === f.name) return;
    const prevSnap = localFolders;
    setLocalFolders((cur) =>
      cur.map((x) => (x.id === f.id ? { ...x, name: next, path: next } : x)),
    );
    setBusy(true);
    try {
      const res = await fetch(`/api/files/folders/${f.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Rename failed (${res.status})`);
      }
      const data = await res.json();
      const updated = data?.data as FileFolder | undefined;
      if (updated) {
        setLocalFolders((cur) =>
          cur.map((x) => (x.id === f.id ? updated : x)),
        );
      }
      showFilesToast("Folder renamed.", "success");
      router.refresh();
    } catch (err) {
      setLocalFolders(prevSnap);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {canWrite ? (
        <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
          <h3 className="text-sm font-semibold text-[var(--z-fg)]">New folder</h3>
          <div className="mt-3 flex flex-col gap-2 md:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
            />
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
            >
              <option value="">(root)</option>
              {localFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.path || f.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={createFolder}
              disabled={busy}
              className="rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
            >
              Create
            </button>
          </div>
          {error ? (
            <div className="mt-2 text-xs text-red-400">{error}</div>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border border-[var(--z-border)] bg-[var(--z-surface)]">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Path</th>
              <th className="px-4 py-3 font-medium">Visibility</th>
              {canWrite ? <th className="px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--z-border)]">
            {localFolders.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 4 : 3} className="px-4 py-6 text-center text-sm text-[var(--z-muted)]">
                  No folders yet.
                </td>
              </tr>
            ) : null}
            {localFolders.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-3 font-medium text-[var(--z-fg)]">{f.name}</td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">{f.path}</td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">{f.visibility}</td>
                {canWrite ? (
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => renameFolder(f)}
                      className="mr-2 text-xs text-[var(--z-accent)] hover:underline"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFolder(f.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
