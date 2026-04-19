"use client";

import { normalizeAccessTimestamp } from "@/lib/files/formatters";

type AccessLogEntry = {
  timestamp?: string | null;
  at?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fileName?: string | null;
  folderName?: string | null;
  target?: string | null;
};

export interface AccessLogsPanelProps {
  open: boolean;
  linkLabel: string;
  logs: AccessLogEntry[];
  onClose: () => void;
}

function targetLabel(entry: AccessLogEntry): string {
  return entry.fileName ?? entry.folderName ?? entry.target ?? "-";
}

export function AccessLogsPanel({ open, linkLabel, logs, onClose }: AccessLogsPanelProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex" role="presentation">
      <button
        type="button"
        aria-label="Close access logs panel"
        className="flex-1 bg-black/35"
        onClick={onClose}
      />
      <aside className="h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">Access logs</div>
              <div className="max-w-[220px] truncate text-sm font-semibold text-[var(--z-fg)]">
                {linkLabel}
              </div>
            </div>
            <button
              type="button"
              className="rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {logs.length === 0 ? (
              <div className="rounded border border-dashed border-[var(--z-border)] px-3 py-6 text-center text-xs text-[var(--z-muted)]">
                No access logs yet
              </div>
            ) : null}
            <ul className="space-y-2">
              {logs.map((entry, idx) => {
                const normalized = normalizeAccessTimestamp(entry);
                return (
                  <li
                    key={`${entry.timestamp ?? entry.at ?? "log"}-${idx}`}
                    className="rounded border border-[var(--z-border)] bg-white/[0.02] p-2 text-xs"
                  >
                    <div className="text-[var(--z-fg)]" title={normalized.iso || undefined}>
                      {normalized.relative}
                    </div>
                    <div className="mt-1 text-[10px] text-[var(--z-muted)]">IP: {entry.ip || "-"}</div>
                    <div className="text-[10px] text-[var(--z-muted)]">
                      User Agent: {entry.userAgent || "-"}
                    </div>
                    <div className="text-[10px] text-[var(--z-muted)]">
                      File/Folder: {targetLabel(entry)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}


