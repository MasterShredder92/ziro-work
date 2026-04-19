"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeAccessTimestamp } from "@/lib/files/formatters";
import type { FileFolder } from "@/lib/files/types";
import {
  folderDescriptionPreview,
  normalizeFolderDescription,
} from "./FolderDescriptionEditor";

export interface FolderInspectorProps {
  folder: FileFolder | null;
  canWrite: boolean;
  onSaveDescription?: (folderId: string, description: string | null) => Promise<void>;
  onOpenShareLinks?: (folder: FileFolder) => void;
}

export function FolderInspector({
  folder,
  canWrite,
  onSaveDescription,
  onOpenShareLinks,
}: FolderInspectorProps) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const previousDraftRef = useRef("");

  const metadataDescription =
    typeof folder?.metadata?.description === "string" ? folder.metadata.description : null;
  const lastAccessed = normalizeAccessTimestamp(
    (folder?.metadata ?? {}) as Record<string, unknown>,
  );

  useEffect(() => {
    const next = metadataDescription ?? "";
    setDraft(next);
    previousDraftRef.current = next;
  }, [folder?.id, metadataDescription]);

  const saveIfChanged = async () => {
    if (!folder || !canWrite || !onSaveDescription || saving) return;
    const normalized = normalizeFolderDescription(draft);
    const previous = normalizeFolderDescription(previousDraftRef.current);
    if (normalized === previous) return;
    setSaving(true);
    try {
      await onSaveDescription(folder.id, normalized);
      previousDraftRef.current = normalized ?? "";
    } catch {
      setDraft(previousDraftRef.current);
    } finally {
      setSaving(false);
    }
  };

  if (!folder) return null;

  return (
    <div className="mt-3 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <div className="mb-2 text-xs uppercase tracking-wider text-[var(--z-muted)]">
        Folder inspector
      </div>
      <div className="text-sm font-semibold text-[var(--z-fg)]">{folder.name}</div>
      <div className="mt-0.5 text-[10px] text-[var(--z-muted)]">
        {folderDescriptionPreview(metadataDescription, 120) ?? "No description"}
      </div>
      <div className="mt-0.5 text-[10px] text-[var(--z-muted)]">
        Last accessed:{" "}
        <span title={lastAccessed.iso ? new Date(lastAccessed.iso).toLocaleString() : undefined}>
          {lastAccessed.relative}
        </span>
      </div>
      {onOpenShareLinks ? (
        <button
          type="button"
          className="mt-2 rounded border border-[var(--z-border)] px-2 py-1 text-[11px] text-[var(--z-fg)] hover:bg-white/[0.05]"
          onClick={() => onOpenShareLinks(folder)}
        >
          Share links
        </button>
      ) : null}
      <label className="mt-3 block text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
        Description
      </label>
      <textarea
        value={draft}
        disabled={!canWrite || !onSaveDescription || saving}
        rows={3}
        className="mt-1 w-full resize-y rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] disabled:opacity-60"
        placeholder="Add a folder description..."
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          void saveIfChanged();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setDraft(previousDraftRef.current);
            (e.currentTarget as HTMLTextAreaElement).blur();
            return;
          }
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            void saveIfChanged();
          }
        }}
      />
    </div>
  );
}




