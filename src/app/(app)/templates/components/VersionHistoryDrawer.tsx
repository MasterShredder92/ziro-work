"use client";

import { useMemo, useState } from "react";
import type { TemplateVersion } from "@/lib/templates/types";

export interface VersionHistoryDrawerProps {
  templateId: string;
  versions: TemplateVersion[];
  currentBody?: string | null;
  currentSubject?: string | null;
  onRestored?: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function diffLines(left: string, right: string): Array<{
  tag: "same" | "add" | "remove";
  value: string;
}> {
  const a = (left ?? "").split("\n");
  const b = (right ?? "").split("\n");
  const out: Array<{ tag: "same" | "add" | "remove"; value: string }> = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const la = a[i];
    const lb = b[i];
    if (la === undefined) {
      out.push({ tag: "add", value: lb ?? "" });
    } else if (lb === undefined) {
      out.push({ tag: "remove", value: la });
    } else if (la === lb) {
      out.push({ tag: "same", value: la });
    } else {
      out.push({ tag: "remove", value: la });
      out.push({ tag: "add", value: lb });
    }
  }
  return out;
}

export function VersionHistoryDrawer({
  templateId,
  versions,
  currentBody,
  currentSubject,
  onRestored,
}: VersionHistoryDrawerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    versions[0]?.id ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const selected = useMemo(
    () => versions.find((v) => v.id === selectedId) ?? null,
    [selectedId, versions],
  );

  const diff = useMemo(() => {
    if (!selected) return [];
    return diffLines(selected.body ?? "", currentBody ?? "");
  }, [selected, currentBody]);

  async function handleRestore(): Promise<void> {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/templates/${templateId}/versions/${selected.id}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            changeSummary: `Restored from v${selected.version}`,
          }),
        },
      );
      if (!res.ok) throw new Error(`Restore failed (${res.status})`);
      setStatus(`Restored v${selected.version} as new current version.`);
      onRestored?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setBusy(false);
    }
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-sm text-[var(--z-muted)]">
        No version history yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Version history
        </div>
        {selected && !selected.isCurrent ? (
          <button
            type="button"
            onClick={handleRestore}
            disabled={busy}
            className="rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] px-2 py-1 text-xs font-semibold text-[var(--z-accent)] disabled:opacity-50"
          >
            {busy ? "Restoring…" : `Restore v${selected.version}`}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_1fr]">
        <ol className="space-y-1">
          {versions.map((v) => {
            const isActive = selectedId === v.id;
            return (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={`w-full rounded-md border px-2 py-1.5 text-left text-xs ${
                    isActive
                      ? "border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] text-[var(--z-accent)]"
                      : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-fg)]/80 hover:text-[var(--z-fg)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">v{v.version}</span>
                    {v.isCurrent ? (
                      <span className="rounded-full bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--z-accent)]">
                        current
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-[10px] text-[var(--z-muted)]">
                    {formatDate(v.createdAt)}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="min-w-0 space-y-2">
          {selected ? (
            <>
              {selected.changeSummary ? (
                <div className="text-xs text-[var(--z-fg)]/80">
                  {selected.changeSummary}
                </div>
              ) : null}
              {currentSubject !== undefined && selected.subject !== currentSubject ? (
                <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] p-2 text-xs">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                    Subject
                  </div>
                  <div className="text-[var(--z-danger)] line-through">
                    {selected.subject ?? "(none)"}
                  </div>
                  <div className="text-[var(--z-accent)]">
                    {currentSubject ?? "(none)"}
                  </div>
                </div>
              ) : null}
              <div className="rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                  Diff vs current
                </div>
                <pre className="mt-1 max-h-[260px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5">
                  {diff.map((d, i) => (
                    <span
                      key={i}
                      className={
                        d.tag === "add"
                          ? "block text-[var(--z-accent)]"
                          : d.tag === "remove"
                            ? "block text-[var(--z-danger)] line-through"
                            : "block text-[var(--z-fg)]/80"
                      }
                    >
                      {d.tag === "add" ? "+ " : d.tag === "remove" ? "- " : "  "}
                      {d.value}
                    </span>
                  ))}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-sm text-[var(--z-muted)]">
              Select a version to view the diff.
            </div>
          )}
          {error ? (
            <div className="rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_55%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-2 text-xs text-[var(--z-danger)]">
              {error}
            </div>
          ) : null}
          {status ? (
            <div className="rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] p-2 text-xs text-[var(--z-accent)]">
              {status}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
