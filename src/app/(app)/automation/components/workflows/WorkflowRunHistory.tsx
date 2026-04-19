"use client";

import { useEffect, useState } from "react";
import type { AutomationLog, AutomationRun } from "@/lib/automation/workflows/types";

type RunSurface = {
  run: AutomationRun;
  logs: AutomationLog[];
};

export type WorkflowRunHistoryProps = {
  open: boolean;
  workflowId: string | null;
  onClose: () => void;
};

export function WorkflowRunHistory({
  open,
  workflowId,
  onClose,
}: WorkflowRunHistoryProps) {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [selected, setSelected] = useState<RunSurface | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !workflowId) return;
    setBusy(true);
    void fetch(`/automation/api/runs?workflowId=${encodeURIComponent(workflowId)}&limit=25`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load runs (${res.status})`);
        const data = (await res.json()) as { data?: AutomationRun[] };
        setRuns(data.data ?? []);
      })
      .catch(() => setRuns([]))
      .finally(() => setBusy(false));
  }, [open, workflowId]);

  const openRun = async (runId: string) => {
    try {
      const res = await fetch(`/automation/api/runs/${encodeURIComponent(runId)}`);
      if (!res.ok) throw new Error(`Failed to load run (${res.status})`);
      const data = (await res.json()) as {
        data?: { run: AutomationRun; logs: AutomationLog[] };
      };
      if (data.data) setSelected({ run: data.data.run, logs: data.data.logs });
    } catch {
      setSelected(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex" role="presentation">
      <button
        type="button"
        aria-label="Close workflow run history"
        className="flex-1 bg-black/45"
        onClick={onClose}
      />
      <aside className="h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-[32rem]">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
            <div className="text-sm font-semibold text-[var(--z-fg)]">Workflow run history</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05]"
            >
              Close
            </button>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-[var(--z-border)]">
            <div className="min-h-0 overflow-y-auto p-3">
              {busy ? <div className="text-xs text-[var(--z-muted)]">Loading runs...</div> : null}
              {!busy && runs.length === 0 ? (
                <div className="text-xs text-[var(--z-muted)]">No runs yet.</div>
              ) : null}
              <ul className="space-y-1">
                {runs.map((run) => (
                  <li key={run.id}>
                    <button
                      type="button"
                      onClick={() => void openRun(run.id)}
                      className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-left text-xs text-[var(--z-fg)] hover:bg-white/[0.05]"
                    >
                      <div className="font-mono">{run.id.slice(0, 10)}</div>
                      <div className="text-[10px] text-[var(--z-muted)]">
                        {run.status} · {new Date(run.started_at).toLocaleString()}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-h-0 overflow-y-auto p-3">
              {!selected ? (
                <div className="text-xs text-[var(--z-muted)]">Select a run to inspect logs.</div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded border border-[var(--z-border)] bg-[var(--z-bg)] p-2 text-xs">
                    <div>Status: {selected.run.status}</div>
                    <div>Started: {new Date(selected.run.started_at).toLocaleString()}</div>
                    <div>
                      Finished:{" "}
                      {selected.run.finished_at
                        ? new Date(selected.run.finished_at).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {selected.logs.map((log) => (
                      <li
                        key={log.id}
                        className="rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-[11px]"
                      >
                        <div className="text-[10px] text-[var(--z-muted)]">
                          {new Date(log.created_at).toLocaleString()} · {log.level}
                        </div>
                        <div className="text-[var(--z-fg)]">{log.message}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
